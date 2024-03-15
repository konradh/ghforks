import { Octokit } from "octokit";
import { RepoQuery, Repo, Fork, PageInfo, Diff, Commit } from './types';
import { score } from "./score";


const queries = {
  repo: `query Repo($owner: String!, $name: String!, $cursor: String) {
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
  forks: `query Forks($name: String!, $owner: String!, $count: Int!, $baseRef: String!, $cursor: String) {
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
            compare(headRef: $baseRef) {
              behindBy: aheadBy
              aheadBy: behindBy
            }
          }
        }
        defaultBranchRef {
          name
          compare(headRef: $baseRef) {
            behindBy: aheadBy
            aheadBy: behindBy
          }
        }
      }
    }
  }
}`,
  commits: {
    head: `fragment Commits on Comparison {
  headTarget {
    repository {
      id
    }
  }
  commits(first: 50) {
    nodes {
      url
      oid
      messageHeadline
      additions
      deletions
      committedDate
    }
  }
}
query DiffCommits($name: String!, $owner: String!) {
  repository(name: $name, owner: $owner) {
    defaultBranchRef {
`,
    segment1: `: compare(headRef: "`,
    segment2: `") {
        ...Commits
      }
      `,
    tail: `
    }
  }
}
`,
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
    publicForkCount: r.forks.totalCount,
    privateForkCount: r.forkCount - r.forks.totalCount,
    stars: r.stargazers.totalCount,
    watchers: r.watchers.totalCount,

    defaultBranch: r.defaultBranchRef.name,

    branches: r.refs.nodes.map((o: any) => o.name),
  }
}

function flattenDiffWithoutCommits(fork: any, parent: Repo): Diff {
  const f = flattenRepo(fork);
  const branches: any = fork.refs.nodes;
  const parentBranchSet = new Set(parent.branches);
  return {
    base: `${parent.owner}:${parent.name}:${parent.defaultBranch}`,
    head: `${f.owner}:${f.name}:${f.defaultBranch}`,
    aheadBy: fork.defaultBranchRef.compare.aheadBy,
    behindBy: fork.defaultBranchRef.compare.behindBy,
    descriptionChanged: f.description !== parent.description,
    newBranches: branches
      .filter((b: any) => (b.compare.aheadBy > 0 && !parentBranchSet.has(b.name)))
      .map((b: any) => ({
        name: b.name,
        aheadBy: b.compare.aheadBy,
        behindBy: b.compare.behindBy,
      })),
  }
}

interface Commits {
  repoId: string,
  commits: Commit[],
}

function flattenCommits(response: any): Commits[] {
  const repos = Object.values(response.repository.defaultBranchRef);
  return repos.map((commits: any) => {
    return {
      repoId: commits.headTarget.repository.id,
      commits: commits.commits.nodes.map((commit: any) => ({
        url: commit.url,
        commitId: commit.oid,
        message: commit.messageHeadline,
        additions: commit.additions,
        deletions: commit.deletions,
        committedDate: commit.committedDate,
      }))
    }
  })
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
    return Array.from(this.#forks.values()).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
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

  async getNextForks(count: Number): Promise<Repo[]> {
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
        diff: flattenDiffWithoutCommits(fork, repo),
      }
    });

    this.#mergeForks(forkRepos);

    return forkRepos;
  }


  async getDiffCommits(id?: string) {
    const repos: Repo[] = [];
    if (id) {
      const idRepo = this.#forks.get(id);
      if (idRepo && idRepo.diff.commits === undefined) {
        repos.push(idRepo);
      }
    }
    const additionalRepos = Array.from(this.#forks.values())
      .filter(f => f.id != id && f.diff.commits === undefined && f.diff.aheadBy > 0);
    repos.push(...additionalRepos.slice(0, 10));
    const query = this.#buildDiffCommitsQuery(repos);

    const response = await this.#octokit.graphql(query, { ...this.#query });
    const commits = flattenCommits(response);

    for (let c of commits) {
      const repo = this.#forks.get(c.repoId);
      if (!repo) { continue };
      repo.diff.commits = c.commits;
    }
  }

  #mergeForks(forks: Fork[]) {
    if (!this.repo) {
      console.assert(this.repo);
      return;
    }
    for (const fork of forks) {
      fork.score = score(fork, this.repo);
      this.#forks.set(fork.id, fork);
    }
  }

  #buildDiffCommitsQuery(forks: Repo[]): string {
    const forkQueries = [];
    for (let i = 0; i < forks.length; i++) {
      const fork = forks[i];
      const headRef = `${fork.owner}:${fork.name}:${fork.defaultBranch}`;
      forkQueries.push(`fork${i}` + queries.commits.segment1 + headRef + queries.commits.segment2);
    }
    return queries.commits.head + forkQueries.join() + queries.commits.tail;
  }
}
