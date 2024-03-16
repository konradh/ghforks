const clientId = import.meta.env.VITE_CLIENT_ID;
const oauthProxyUrl = import.meta.env.VITE_OAUTH_APP_PROXY;

interface TokenData {
    token: string,
    type: string,
    user: string,
}

interface TokenValidity {
    valid: boolean,
    user?: string
}

const storageKeyTokenVerified = "token-verified";
const storageKeyToken = "token";
const storageKeyOAuthState = "oauth-state";
const storageKeyUrl = "oauth-stored-url";

// Get the stored token, if one exists.
export async function getToken(): Promise<string | null> {
    // Get token from local storage.
    const data = localStorage.getItem(storageKeyToken);
    if (!data) {
        return null;
    }
    const token = JSON.parse(data) as TokenData;

    // Check if we already verified the token in this session.
    const verified = sessionStorage.getItem(storageKeyTokenVerified);
    if (verified && JSON.parse(verified) === true) {
        return token.token;
    }

    // If the token was not verified yet, do that.
    const validity = await isTokenValid(token.token);
    if (!validity.valid) {
        localStorage.removeItem(storageKeyToken);
        return null;
    }
    sessionStorage.setItem(storageKeyTokenVerified, JSON.stringify(true));
    return token.token;
}

// Set the stored token. Checks for validity first. Returns true if the token was stored successfully.
export async function setToken(token: string, type: string = "manual"): Promise<boolean> {
    const validity = await isTokenValid(token);
    if (!validity.valid) {
        return false;
    }
    await logout();
    const data = {
        token: token,
        type: type,
        user: validity.user
    };
    localStorage.setItem(storageKeyToken, JSON.stringify(data));
    sessionStorage.setItem(storageKeyTokenVerified, JSON.stringify(true));
    return true;
}

// Checks if a token is valid.
async function isTokenValid(token: string): Promise<TokenValidity> {
    const res = await fetch("https://api.github.com/user", {
        headers: [["Authorization", "Bearer " + token]]
    })
    if (res.status !== 200) {
        return { valid: false };
    }
    const data = await res.json();
    return { valid: true, user: data.login };
}

// Initiate OAuth login.
export function oauthLogin() {
    const state = window.crypto.getRandomValues(new Uint8Array(8))
        .reduce((a, b) => a + b.toString(16).padStart(2, "0"), "");
    sessionStorage.setItem(storageKeyOAuthState, state);
    sessionStorage.setItem(storageKeyUrl, document.location.toString());

    const url = new URL(oauthProxyUrl + "/api/github/oauth/login");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("scopes", "repo");
    url.searchParams.set("state", state);
    window.location.replace(url);
}

// Handle OAuth callback. Returns true if a callback was handled successfully.
export async function oauthCallback(): Promise<boolean> {
    // Parse the url. Search for code and state.
    const callbackUrl = new URL(window.location.toString());
    const code = callbackUrl.searchParams.get("code");
    const state = callbackUrl.searchParams.get("state");
    const error = callbackUrl.searchParams.get("error");
    if (!state || !(code || error)) {
        return false;
    }
    if (error) {
        console.error("oauth error", error);
    }

    // Check if the state in the URL matches the stored state.
    if (state !== sessionStorage.getItem(storageKeyOAuthState)) {
        console.warn("oauth state mismatch")
        sessionStorage.removeItem(storageKeyOAuthState);
        return false;
    }
    sessionStorage.removeItem(storageKeyOAuthState);

    // Remove state and code from URL.
    callbackUrl.searchParams.delete("code");
    callbackUrl.searchParams.delete("state");
    window.history.replaceState({}, "", callbackUrl);

    // Restore previous URL.
    const storedUrl = sessionStorage.getItem(storageKeyUrl);
    sessionStorage.removeItem(storageKeyUrl)
    if (storedUrl) {
        window.history.replaceState({}, "", storedUrl);
    }

    // Fetch the token.
    const res = await fetch(oauthProxyUrl + "/api/github/oauth/token", {
        method: "POST",
        body: JSON.stringify({
            client_id: clientId,
            code: code,
        })
    })
    const data = await res.json();
    return await setToken(data.authentication.token, "oauth");
}

// Logout. This revokes OAuth tokens and deletes access tokens.
export async function logout() {
    // Revoke OAuth tokens.
    const data = localStorage.getItem(storageKeyToken);
    if (data) {
        const token = JSON.parse(data) as TokenData;
        if (token.type === "oauth") {
            await fetch(oauthProxyUrl + "/api/github/oauth/token", {
                method: "DELETE",
                headers: [["Authorization", "token " + token]],
            })
        }
    }
    localStorage.removeItem(storageKeyToken);
    sessionStorage.removeItem(storageKeyTokenVerified);
}
