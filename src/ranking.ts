import { Fork } from "./types";

export function rank(forks: Fork[]): Fork[] {
    forks.sort((a, b) => (b.diff?.aheadBy ?? 0) - (a.diff?.aheadBy ?? 0));
    return forks;
}