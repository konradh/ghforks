import { GithubAPI, GraphqlError, TimeoutError } from './github-api';
import { RepoQuery, Repo, Fork, PageInfo, Diff, Commit } from './types';
import { score } from "./score";
import { interpolate } from './utils';

const fragmentRepoInfo = `fragment RepoInfo on Repository {
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
  createdAt
  updatedAt
  forkCount
  directForks: forks(privacy: PUBLIC) {
    totalCount
  }
  defaultBranchRef {
    name
  }
  openIssues: issues(states:OPEN) {
    totalCount
  }
  closedIssues: issues(states:CLOSED) {
    totalCount
  }
  openPRs: pullRequests(states: OPEN) {
    totalCount
  }
  closedPRs: pullRequests(states: [CLOSED, MERGED]) {
    totalCount
  } 
}
  `;
const queryRepo = `${fragmentRepoInfo}
query Repo($owner: String!, $name: String!, $cursor: String) {
  repository(name: $name, owner: $owner) {
    ...RepoInfo
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
}`;
const queryForks = `${fragmentRepoInfo}
query Forks($name: String!, $owner: String!, $count: Int!, $baseRef: String!, $branchCount: Int!, $cursor: String) {
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
        ...RepoInfo,
        refs(
          refPrefix: "refs/heads/"
          orderBy: {field: TAG_COMMIT_DATE, direction: DESC}
          first: $branchCount
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
}`;

const queryForkDetails = `query ForkDetails($name: String!, $owner: String!, $headRef: String!) {
  repository(name: $name, owner: $owner) {
    defaultBranchRef {
      compare(headRef: $headRef) {
        headTarget {
          repository {
            id
            url
          }
        }
        commits(first: 20) {
          nodes {
            oid
            messageHeadline
            additions
            deletions
            committedDate
          }
        }
      }
    }
  }
}`;

function flattenRepo(r: any): Repo {
  return {
    id: r.id,
    name: r.name,
    owner: r.owner.login,
    description: r.description,
    url: r.url,
    pushedAt: new Date(r.pushedAt),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),

    forks: { total: r.forkCount, direct: r.directForks.totalCount },
    stars: r.stargazers.totalCount,
    watchers: r.watchers.totalCount,
    issues: {
      open: r.openIssues.totalCount,
      closed: r.closedIssues.totalCount,
    },
    pullRequests: {
      open: r.openPRs.totalCount,
      closed: r.closedPRs.totalCount,
    },

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

function flattenDetails(response: any): Commit[] {
  const compare = response.repository.defaultBranchRef.compare;
  return compare.commits.nodes.map((commit: any) => ({
    url: `${compare.headTarget.repository.url}/commit/${commit.oid}`,
    commitId: commit.oid,
    message: commit.messageHeadline,
    additions: commit.additions,
    deletions: commit.deletions,
    committedDate: commit.committedDate,
  }))
}

export class ForksAPI {
  #query: RepoQuery;

  #forksCursor: PageInfo | null = null;

  #api: GithubAPI

  #repo: Repo | null = null;
  #forks: Map<string, Fork>;

  batchSize = 20;
  branchCount = 10;

  maxBatchSize = 100; // fixed for the GitHub GraphQL API
  batchSizeScalingFactor = 0.3;
  requestDurationTarget = 6; // seconds (maximum is 10 seconds)


  constructor(api: GithubAPI, query: RepoQuery) {
    this.#query = query;
    this.#api = api;
    this.#forks = new Map<string, Fork>()
  }

  forks(): Fork[] {
    return Array.from(this.#forks.values()).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  canLoadMore(): boolean {
    if (this.#repo?.forks.direct === 0) {
      return false;
    }
    return !this.#forksCursor || this.#forksCursor.hasNextPage;
  }

  async getRepo(): Promise<Repo> {
    if (this.#repo) {
      return this.#repo;
    }
    var r;
    try {
      // TODO: paginate branches
      r = await this.#api.graphql(queryRepo, { ...this.#query });
    } catch (error) {
      if (error instanceof GraphqlError) {
        throw Error(JSON.stringify(error.error));
      }
      throw error;
    }
    this.#repo = flattenRepo(r.repository);
    return this.#repo;
  }

  async getNextForks(): Promise<Repo[]> {
    const repo = this.#repo;
    if (!repo) {
      throw new Error("You must await the result of getRepo once before calling other methods.");
    }

    if (!this.canLoadMore()) {
      return [];
    }

    var rawForks;
    while (this.batchSize > 0) {
      // TODO: max retries
      try {
        const start = performance.now();
        rawForks = await this.#api.graphql(queryForks, {
          ...this.#query,
          baseRef: `${repo.owner}:${repo.name}:${repo.defaultBranch}`,
          cursor: this.#forksCursor?.endCursor ?? null,
          branchCount: this.branchCount,
          count: this.batchSize
        });
        const duration = (performance.now() - start) / 1000;
        this.#optimizeBatchSize(duration);
        break;
      } catch (error) {
        if (error instanceof TimeoutError) {
          // TODO: try fewer branches
          this.batchSize = 1;
          console.debug(`Request timeout. Set batch size to ${this.batchSize}.`);
          continue;
        }
        throw error;
      }
    }
    if (this.batchSize === 0) {
      throw new Error("Batch size too small: can not complete request without timeout")
    }

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

  async getForkDetails(id: string) {
    const repo = this.#forks.get(id);
    if (!repo || repo.diff.commits !== undefined) {
      return;
    }

    const response = await this.#api.graphql(queryForkDetails, {
      ...this.#query,
      headRef: `${repo.owner}:${repo.name}:${repo.defaultBranch}`
    });

    const commits = flattenDetails(response);
    repo.diff.commits = commits;
  }

  #mergeForks(forks: Fork[]) {
    if (!this.#repo) {
      console.assert(this.#repo);
      return;
    }
    for (const fork of forks) {
      fork.score = score(fork);
      this.#forks.set(fork.id, fork);
    }
  }

  #optimizeBatchSize(requestDuration: number) {
    const fractionOfTimeUsed = requestDuration / this.requestDurationTarget;
    var newBatchSize = this.batchSize / fractionOfTimeUsed;
    newBatchSize = interpolate(this.batchSize, newBatchSize, this.batchSizeScalingFactor);
    newBatchSize = Math.min(Math.max(Math.floor(newBatchSize), 1), this.maxBatchSize);
    if (newBatchSize !== this.batchSize) {
      console.debug(`Changed batch size to ${this.batchSize}.`);
    }
    this.batchSize = newBatchSize;
  }
}
