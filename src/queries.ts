import { Octokit } from "octokit";
import { RepoQuery, Repo, Fork, PageInfo, Diff, ExtendedForkInfo } from './types';
import { listDiff } from "./utils";

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
query Forks($name: String!, $owner: String!, $cursor: String, $count: Int!) {
  rateLimit {
    cost
    limit
    nodeCount
    remaining
    resetAt
    used
  }
  repository(name: $name, owner: $owner) {
    forks(first: $count, after: $cursor, privacy: PUBLIC, orderBy: { direction: DESC, field: PUSHED_AT }) {
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
        refs(
          refPrefix: "refs/heads/"
          orderBy: { field: TAG_COMMIT_DATE, direction: DESC }
          first: 100
        ) {
          totalCount
          nodes {
            name
          }
        }
        defaultBranchRef {
          name
        }
      }
    }
  }
}`,
  diff: {
    head: `
fragment DiffInfo on Comparison {
  aheadBy
  behindBy
  commits(last: 10) {
    nodes {
      oid
      messageHeadline
      committedDate
      additions
      deletions
    }
  }
}
query Diff($owner: String!, $name: String!, $baseBranch: String!) {
  rateLimit {
    cost
    limit
    nodeCount
    remaining
    resetAt
    used
  }
  repository(owner: $owner, name: $name) {
    ref(qualifiedName: $baseBranch) {`,
    forkHead: `: compare(headRef: "`,
    forkTail: `") {
        ...DiffInfo
      }
      `,
    tail: `
    }
  }
}`,
  },
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
    stars: r.stargazers.totalCount,
    watchers: r.watchers.totalCount,

    defaultBranch: r.defaultBranchRef.name,

    branches: r.refs.nodes.map((o: any) => o.name),
  }
}

function flattenDiff(f: any): Diff {
  return {
    aheadBy: f.aheadBy,
    behindBy: f.behindBy,
    commits: f.commits.nodes.map((o: any) => {
      return {
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
    return Array.from(this.#forks.values());
  }

  canLoadMore(): boolean {
    return !this.#forksCursor || this.#forksCursor.hasNextPage
  }

  async getRepo(): Promise<Repo> {
    if (this.repo) {
      return this.repo;
    }
    const r = await this.#octokit.graphql.paginate(queries.repo, { ...this.#query });
    this.repo = flattenRepo(r.repository);
    return this.repo;
  }

  async getForks(count: Number = 100): Promise<Repo[]> {
    if (!this.canLoadMore()) {
      return [];
    }
    const repo = await this.getRepo();
    if (!repo || repo.forkCount === 0) {
      return [];
    }
    const rawForks: any = await this.#octokit.graphql(queries.forks, {
      ...this.#query,
      cursor: this.#forksCursor?.endCursor ?? null,
      count: count
    });
    this.#forksCursor = rawForks.repository.forks.pageInfo;
    const forkRepos: Repo[] = rawForks.repository.forks.nodes.map(flattenRepo);

    for (const fork of forkRepos) {
      this.#forks.set(fork.id, fork);
    }

    return forkRepos;
  }

  async getDiffs(forks: Repo[]): Promise<Fork[]> {
    if (forks.length === 0) {
      return [];
    }
    const repo = await this.getRepo();
    const query = this.#buildDiffQuery(forks);
    const rawDiffs: any = await this.#octokit.graphql(query, { ...this.#query, baseBranch: repo.defaultBranch })
    const extendedForks = forks.map((fork, i) => {
      return {
        ...fork,
        diff: flattenDiff(rawDiffs.repository.ref[`fork${i}`]),
        extendedInfo: extendedForkInfo(fork, repo),
      }
    })

    for (const fork of extendedForks) {
      this.#forks.set(fork.id, fork);
    }

    return extendedForks;
  }

  #buildDiffQuery(forks: Repo[]): string {
    const forkQueries = [];
    for (let i = 0; i < forks.length; i++) {
      const fork = forks[i];
      const headRef = `${fork.owner}:${fork.name}:${fork.defaultBranch}`;
      forkQueries.push(`fork${i}` + queries.diff.forkHead + headRef + queries.diff.forkTail);
    };
    const query = queries.diff.head + forkQueries.join() + queries.diff.tail;
    return query;
  }
}