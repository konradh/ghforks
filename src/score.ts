import { Fork, Repo } from "./types";

export function score(fork: Fork, _: Repo): number {
    return fork.diff?.aheadBy ?? 0;
}