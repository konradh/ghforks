import { Octokit } from "octokit";
import { RepoQuery, Repo, Fork, PageInfo } from './types';

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
    updatedAt
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
query Forks($name: String!, $owner: String!, $cursor: String) {
  rateLimit {
    cost
    limit
    nodeCount
    remaining
    resetAt
    used
  }
  repository(name: $name, owner: $owner) {
    forks(first: 100, after: $cursor, privacy: PUBLIC, orderBy: { direction: DESC, field: UPDATED_AT }) {
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
        updatedAt
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
  commits(last: 20) {
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

// returns all elements of a that are not in b
function branchDiff(a: string[], b: string[]) : string[] {
    const bSet = new Set(b);
    return a.filter(e => !bSet.has(e));
}

export async function repository(octokit: Octokit, repo: RepoQuery) : Promise<Repo>  {
 const r = await octokit.graphql.paginate(queries.repo, { ...repo });
  return flattenRepo(r.repository);
}

async function getForks(octokit: Octokit, repo: RepoQuery, cursor? : string) : Promise<any> {
  return await octokit.graphql(queries.forks, { ...repo, cursor });
}

async function getForksWithDiff(octokit: Octokit, repo: RepoQuery, baseBranch: string, forks: [any]) : Promise<Fork[]> {
  const forkQueries = [];
  for (let i = 0; i < forks.length; i++) {
    const f = forks[i];
    const headRef = `${f.owner.login}:${f.name}:${f.defaultBranchRef.name}`;
    forkQueries.push(`fork${i}` + queries.diff.forkHead + headRef + queries.diff.forkTail);
  };
  const query = queries.diff.head + forkQueries.join() + queries.diff.tail;
  const diffs : any = await octokit.graphql(query, {...repo, baseBranch })

  for (let i = 0; i < forks.length; i++) {
    forks[i].defaultBranchRef.compare = diffs.repository.ref[`fork${i}`];
  }
  return forks.map(flattenFork);
};

function flattenRepo(r: any): Repo {
  return {
    id: r.id,
    name: r.name,
    owner: r.owner.login,
    description: r.description,
    url: r.url,
    updatedAt: new Date(r.updatedAt),

    forkCount: r.forkCount,
    stars: r.stargazers.totalCount,
    watchers: r.watchers.totalCount,

    defaultBranch: r.defaultBranchRef.name,

    branches: r.refs.nodes.map((o : any) => o.name),
  }
}

function flattenFork(f: any) : Fork {
  return {
    ...flattenRepo(f),
    diff: {
      headRef: f.defaultBranchRef.name,
      aheadBy: f.defaultBranchRef.compare.aheadBy,
      behindBy: f.defaultBranchRef.compare.behindBy,
      commits: f.defaultBranchRef.compare.commits.nodes.map((o: any) => {
        return {
          commitId: o.oid,
          message: o.messageHeadline,
          additions: o.additions,
          deletions: o.deletions,
          committedDate: o.committedDate,
      }})
    },
  };
}

export function addAdditionalForkInfo(f: Fork, r: Repo): Fork {
  return {
    ...f,
    descriptionChanged: f.description !== r.description,
    newBranches: branchDiff(f.branches, r.branches),
  }
}


export async function forks(octokit: Octokit, repo: RepoQuery, baseBranch: string, cursor?: string): Promise<{pageInfo: PageInfo, forks: Promise<Fork[]>}> {
  const forks = await getForks(octokit, repo, cursor);
  const pageInfo = forks.repository.forks.pageInfo as PageInfo;

  const diffs = getForksWithDiff(octokit, repo, baseBranch, forks.repository.forks.nodes);

  // Merge the result of both queries.


  return {
    forks: diffs,
    pageInfo,
  };
}