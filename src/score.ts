import { Fork, Repo, Branch } from "./types";

function f(x: number, half: number = 1, offset: number = 0): number {
    x = Math.max(x - offset, 0);
    x = x / half;
    return x / (x + 1);
}

export function score(fork: Fork, _: Repo): number {
    if (fork.diff.aheadBy == 0 && fork.diff.newBranches.length == 0) {
        return -Infinity;
    }

    var branchesScore = fork.diff.newBranches.map((b: Branch) => f(b.aheadBy)).reduce((a, b) => a + b, 0);
    branchesScore /= fork.diff.newBranches.length;

    return 3 * f(fork.diff.aheadBy)
        + branchesScore
        + f(fork.stars, 10, 1)
        + f(fork.watchers, 5, 1)
        - 2 * f((new Date).valueOf() - fork.pushedAt.valueOf(), 60 * 60 * 24 * 365);
}
