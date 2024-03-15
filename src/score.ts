import { Fork, Branch } from "./types";

function f(x: number, half: number = 1, offset: number = 0): number {
    x = Math.max(x - offset, 0);
    x = x / half;
    return x / (x + 1);
}

export function score(fork: Fork): number {
    if (fork.diff.aheadBy == 0 && fork.diff.newBranches.length == 0) {
        return -Infinity;
    }

    var branchesScore = fork.diff.newBranches.map((b: Branch) => f(b.aheadBy)).reduce((a, b) => a + b, 0);
    branchesScore /= fork.diff.newBranches.length;

    return 3 * f(fork.diff.aheadBy) // new content is good
        + branchesScore // new branches are good
        + f(fork.stars, 10, 1) // stars are good
        + f(fork.watchers, 5, 1) // watchers are good
        - 2 * f((new Date).valueOf() - fork.pushedAt.valueOf(), 60 * 60 * 24 * 365) // no changes for a long time are bad
        + f(fork.issues.open + fork.issues.closed) // issues are good, as they show activity
        + f(fork.pullRequests.open + fork.pullRequests.closed) // pull requests are good, as they show activity
}
