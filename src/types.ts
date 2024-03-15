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
    pushedAt: Date,
    forkCount: number,
    stars: number,
    watchers: number,
    defaultBranch: string,
    branches: string[],
    issues: { open: number, closed: number },
    pullRequests: { open: number, closed: number },
    forks: { public: number, private: number }
};

export interface Commit {
    url: string,
    commitId: string,
    message: string,
    additions: number,
    deletions: number,
    committedDate: string,
};

export interface Branch {
    name: string,
    aheadBy: number,
    behindBy: number,
}

export interface Diff {
    base: string,
    head: string,

    aheadBy: number,
    behindBy: number,
    commits?: Commit[],

    descriptionChanged: boolean,
    newBranches: Branch[],
};

export interface Fork extends Repo {
    diff: Diff,
    score: number,
}
