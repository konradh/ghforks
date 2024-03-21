import { RepoQuery } from "./types";

export function timeDiffApprox(date: Date): string {
    var diff = (new Date()).valueOf() - date.valueOf();
    const seconds = diff / 1000;
    const minutes = seconds / 60;
    if (minutes < 5) { return "just now"; }
    if (minutes < 60) { return `${Math.floor(minutes)} minutes ago`; }
    const hours = minutes / 60;
    if (hours < 24) { return `${Math.floor(hours)} hours ago`; }
    const days = hours / 24;
    if (days < 7) { return `${Math.floor(days)} days ago`; }
    const weeks = days / 7;
    const months = days / 30;
    if (months < 1) { return `${Math.floor(weeks)} weeks ago`; }
    if (months <= 12) { return `${Math.floor(months)} months ago`; }
    const years = days / 365;
    return `${Math.floor(years)} years ago`;
}

export function interpolate(a: number, b: number, f: number): number {
    return a + ((b - a) * f);
}

const repoRegex = new RegExp(
    "/?(?<owner>[A-Za-z0-9_.-]+)/(?<name>[A-Za-z0-9_.-]+)$"
);

export function parseRepo(input: string): RepoQuery | null {
    const match = repoRegex.exec(input);
    const owner = match?.groups?.owner;
    const name = match?.groups?.name;
    if (!owner || !name) {
        return null;
    }
    return { owner, name };
}
