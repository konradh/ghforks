export interface RepoQuery {
    owner: string,
    name: string,
};

export interface PageInfo {
    hasNextPage: boolean,
    endCursor: string,
};

export interface Repo {
    id: string,
    name: string,
    owner: string,
    description: string,
    url: string,
    updatedAt: Date,
    forkCount: number,
    stars: number,
    watchers: number,
    defaultBranch: string,
    branches: string[],
};

export interface Commit {
    commitId: string,
    message: string,
    additions: number,
    deletions: number,
    committedDate: string,
};

export interface Diff {
    aheadBy: number,
    behindBy: number,
    commits: Commit[],
};

export interface ExtendedForkInfo {
    descriptionChanged: boolean,
    newBranches: string[],
}

export interface SimpleFork extends Repo {
    diff: Diff,
}

export interface Fork extends SimpleFork, ExtendedForkInfo {
    diff: Diff,
}

export interface RateLimit {
    remaining: Number
    limit: Number
}