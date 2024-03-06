import { Octokit } from "octokit";
import { RepoQuery, Repo, Fork, PageInfo, Diff, ExtendedForkInfo } from './types';
import { listDiff } from "./utils";
import { score } from "./score";


const queries = {
  repo: `
query Repo($owner: String!, $name: String!, $cursor: String) {
  rateLimit {
    cost
    limit
    nodeCount
    remaining
    resetAt
    used
  }
  repository(name: $name, owner: $owner) {
    owner {
      login
    }
    url
    name
    description
    watchers {
      totalCount
    }
    stargazers {
      totalCount
    }
    pushedAt
    forkCount
    forks(privacy: PUBLIC) {
      totalCount
    }
    defaultBranchRef {
      name
    }
    refs(
      refPrefix: "refs/heads/"
      orderBy: { field: TAG_COMMIT_DATE, direction: DESC }
      first: 100,
      after: $cursor
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
      nodes {
        name
      }
    }
  }
}`,
  forks: `
query Forks($name: String!, $owner: String!, $count: Int!, $baseRef: String!, $cursor: String) {
  rateLimit {
    cost
    limit
    nodeCount
    remaining
    resetAt
    used
  }
  repository(name: $name, owner: $owner) {
    forks(
      first: $count
      after: $cursor
      privacy: PUBLIC
      orderBy: {direction: DESC, field: PUSHED_AT}
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
      nodes {
        id
        owner {
          login
        }
        url
        name
        description
        watchers {
          totalCount
        }
        stargazers {
          totalCount
        }
        pushedAt
        forkCount
        forks(privacy: PUBLIC) {
          totalCount
        }
        refs(
          refPrefix: "refs/heads/"
          orderBy: {field: TAG_COMMIT_DATE, direction: DESC}
          first: 100
        ) {
          totalCount
          nodes {
            name
          }
        }
        defaultBranchRef {
          compare(headRef: $baseRef) {
            behindBy: aheadBy
            aheadBy: behindBy
          }
          target {
            ... on Commit {
              history(first: 20) {
                nodes {
                  url
                  oid
                  messageHeadline
                  committedDate
                  additions
                  deletions
                }
              }
            }
          }
        }
      }
    }
  }
}`,
}

function flattenRepo(r: any): Repo {
  return {
    id: r.id,
    name: r.name,
    owner: r.owner.login,
    description: r.description,
    url: r.url,
    pushedAt: new Date(r.pushedAt),

    forkCount: r.forkCount,
    publicForkCount: r.forks.totalCount,
    privateForkCount: r.forkCount - r.forks.totalCount,
    stars: r.stargazers.totalCount,
    watchers: r.watchers.totalCount,

    defaultBranch: r.defaultBranchRef.name,

    branches: r.refs.nodes.map((o: any) => o.name),
  }
}

function flattenDiff(ref: any): Diff {
  if (ref.target.history.nodes.length > ref.compare.aheadBy) {
    ref.target.history.nodes = ref.target.history.nodes.slice(0, ref.compare.aheadBy)
  }
  return {
    aheadBy: ref.compare.aheadBy,
    behindBy: ref.compare.behindBy,
    commits: ref.target.history.nodes.map((o: any) => {
      return {
        url: o.url,
        commitId: o.oid,
        message: o.messageHeadline,
        additions: o.additions,
        deletions: o.deletions,
        committedDate: o.committedDate,
      }
    })
  }
}

function extendedForkInfo(f: Fork, r: Repo): ExtendedForkInfo {
  return {
    descriptionChanged: f.description !== r.description,
    newBranches: listDiff(f.branches, r.branches),
  }
}
export class API {
  #query: RepoQuery;
  #forksCursor: PageInfo | null = null;
  #octokit: Octokit
  repo: Repo | null = null;
  #forks: Map<string, Fork>;

  constructor(octokit: Octokit, query: RepoQuery) {
    this.#query = query;
    this.#octokit = octokit;
    this.#forks = new Map<string, Fork>()
  }

  forks(): Fork[] {
    return Array.from(this.#forks.values()).sort((a, b) => (b.forkScore ?? 0) - (a.forkScore ?? 0));
  }

  canLoadMore(): boolean {
    if (this.repo?.publicForkCount === 0) {
      return false;
    }
    return !this.#forksCursor || this.#forksCursor.hasNextPage;
  }

  async getRepo(): Promise<Repo> {
    if (this.repo) {
      return this.repo;
    }
    const r = await this.#octokit.graphql.paginate(queries.repo, { ...this.#query });
    this.repo = flattenRepo(r.repository);
    return this.repo;
  }

  async getForks(count: Number): Promise<Repo[]> {
    if (!this.canLoadMore()) {
      return [];
    }
    const repo = await this.getRepo();
    if (!repo || repo.publicForkCount === 0) {
      return [];
    }
    const rawForks: any = await this.#octokit.graphql(queries.forks, {
      ...this.#query,
      baseRef: `${repo.owner}:${repo.name}:${repo.defaultBranch}`,
      cursor: this.#forksCursor?.endCursor ?? null,
      count: count
    });
    this.#forksCursor = rawForks.repository.forks.pageInfo;
    var forkRepos: Fork[] = rawForks.repository.forks.nodes.map((fork: any) => {
      return {
        ...flattenRepo(fork),
        diff: flattenDiff(fork.defaultBranchRef),
      }
    });
    forkRepos = forkRepos.map((f: Fork) => {
      return {
        ...f,
        extendedInfo: extendedForkInfo(f, repo)
      }
    })

    this.#mergeForks(forkRepos);

    return forkRepos;
  }

  #mergeForks(forks: Fork[]) {
    if (!this.repo) {
      console.assert(this.repo);
      return;
    }
    for (const fork of forks) {
      fork.forkScore = score(fork, this.repo);
      this.#forks.set(fork.id, fork);
    }
  }
}