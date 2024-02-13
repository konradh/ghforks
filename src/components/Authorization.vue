<template>
    <button id="github-signin"
            class="signin"
            hidden
            v-on:click="signIn()">
        <i class="fa-brands fa-github fa-2xl"></i> Sign in with GitHub
    </button>
    <button id="github-signout"
            class="signin"
            hidden
            v-on:click="signOut()">
        <i class="fa-solid fa-right-from-bracket fa-2xl"></i> Sign out
    </button>
</template>

<style scoped>
button.signin {
    padding: 0.5em;
}
</style>

<script setup lang="ts">
import { Octokit } from "octokit";
import { createOAuthUserClientAuth } from "octokit-auth-oauth-user-client";

const emit = defineEmits(["signin", "signout"]);

const octokit = new Octokit({
    authStrategy: createOAuthUserClientAuth,
    auth: {
        clientType: "oauth-app",
        clientId: import.meta.env.VITE_CLIENT_ID,
        serviceOrigin: import.meta.env.VITE_OAUTH_APP_PROXY,
    }
});

async function updateSignInOutButtons() {
    const signedIn = await checkAuthorization();
    document.getElementById("github-signin")!.hidden = signedIn;
    document.getElementById("github-signout")!.hidden = !signedIn;
    if (signedIn) {
        emit("signin", octokit);
    } else {
        emit("signout");
    }
}

async function checkAuthorization() : Promise<boolean> {
    try {
        await octokit.auth({type: "getToken"});
        await octokit.auth({type: "checkToken"});
        return true;
    } catch (err) { };
    return false;
}

async function signIn(retry: boolean = true) {
    const auth = await octokit.auth();
    if (!auth) {
        await octokit.auth({type: "signIn", scopes: ["repo"]});
    }
    if (!(await checkAuthorization())) {
        await octokit.auth({type: "deleteToken", offline: true});
        if (retry) {
            await signIn(false);
        }
    }
    await updateSignInOutButtons()
}

async function signOut() {
    await octokit.auth({ type: "deleteToken", offline: false });
    await updateSignInOutButtons()
}

updateSignInOutButtons();
</script>
