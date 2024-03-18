const githubApiUrl = "https://api.github.com"

export class TimeoutError extends Error {
    time: number; // Actual duration of the request in seconds.
    constructor(time: number) {
        super("[GraphQL] Timeout");
        this.time = time;
    }
}
export class GraphqlError extends Error {
    error: any;
    constructor(error: any) {
        super("[GraphQL] " + JSON.stringify(error, null, 2));
        this.error = error;
    }
}

export interface RateLimitInfo {
    limit: number,
    remaining: number,
    used: number,
    reset: Date,
}

function parseRateLimit(headers: Headers): RateLimitInfo | null {
    const limit = headers.get("x-ratelimit-limit");
    const remaining = headers.get("x-ratelimit-remaining");
    const reset = headers.get("x-ratelimit-reset");
    const used = headers.get("x-ratelimit-used");
    if ([limit, remaining, reset, used].some((e) => e === null || isNaN(Number(e)))) {
        return null;
    }
    return {
        limit: Number(limit),
        remaining: Number(remaining),
        // @ts-ignore: 'reset' is possibly 'null'. This is not true. Above, we return null if reset is null.
        reset: new Date(reset * 1000),
        used: Number(used),
    }
}

export class GithubAPI {
    token: string;
    rateLimit: RateLimitInfo | null = null;

    constructor(token: string) {
        this.token = token;
    }

    async graphql(query: string, vars?: any) {
        const start = performance.now();
        const response = await fetch(githubApiUrl + "/graphql", {
            method: "POST",
            headers: [
                ["Authorization", "token " + this.token],
                ["Accept", "application/vnd.github.v3+json"]],
            body: JSON.stringify({
                query: query,
                variables: vars
            }),
        });
        const requestDuration = performance.now() - start;

        this.rateLimit = parseRateLimit(response.headers);

        const json = await response.json();
        switch (response.status) {
            case 200:
                if (json.errors) {
                    throw new GraphqlError(json);
                }
                if (json.data) {
                    return json.data;
                }
                break;
            case 502:
                if (requestDuration >= 10000) {
                    throw new TimeoutError(requestDuration / 1000);
                }
                break;
            default:
        }
        throw new Error("[GithubAPI] unexpected response");
    }
}
