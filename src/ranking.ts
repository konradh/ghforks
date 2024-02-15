import { Fork } from "./types";

export function rank(forks: Fork[]): Fork[] {
    forks.sort((a, b) => b.diff.aheadBy - a.diff.aheadBy);
    return forks;
}