<template>
    <template v-if="!authorized">
        <button type="button" class="padded margin" @click="login()">
            <i class="fa-brands fa-github fa-2xl"></i> Sign in with GitHub
        </button>
        <br>
        <button type="button" class="padded margin" @click="showModal()">
            <i class="fa-solid fa-key fa-2xl"></i> Use Access Token
        </button>
        <dialog id="pat-modal">
            <h3>Use GitHub Access Token</h3>
            <p>
                <a href="https://github.com/settings/personal-access-tokens/new" target="_blank">Create</a> a
                fine-grained personal access token. You do not need to give any special permissions. "Public
                Repositories (read-only)" is sufficient.
            </p>
            <div>
                <input v-model="tokenInput" id="pat-input" placeholder="github_pat_" @keydown.enter="saveToken()">
            </div>
            <div v-if="error" class="error padded">{{ error }}</div>
            <p>
                The token will be stored in you browser's local storage.
            </p>
            <div>
                <button type="button" class="margin" @click="saveToken()">Save token</button>
                <button type="button" class="margin" @click="closeModal()">Cancel</button>
            </div>
        </dialog>
    </template>
    <button type="button" v-else class="padded" @click="logout()">
        <i class="fa-solid fa-right-from-bracket fa-2xl"></i> Sign out
    </button>
</template>

<style scoped>
dialog {
    max-width: 30em;
}

#pat-input {
    width: 100%;
}

.padded {
    padding: 0.5em;
}

.margin {
    margin: 0.5em;
}

.error {
    color: red;
}
</style>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import * as auth from "../auth";

const emit = defineEmits<{ (e: "login", value: string): void, (e: "logout"): void }>();

const authorized = ref(false);
const tokenInput = ref("");
const error = ref<string | null>(null);

async function login() {
    await auth.oauthLogin();
}

async function logout() {
    await auth.logout();
    await update();
}

function showModal() {
    error.value = null;
    tokenInput.value = "";
    const patModal = document.getElementById("pat-modal") as HTMLDialogElement;
    patModal?.showModal();
}

function closeModal() {
    const patModal = document.getElementById("pat-modal") as HTMLDialogElement;
    patModal?.close();
}

async function saveToken() {
    error.value = null;
    if (await auth.setToken(tokenInput.value)) {
        await update();
        return;
    }
    error.value = "Invalid token.";
}

async function update() {
    const token = await auth.getToken();
    if (!token) {
        authorized.value = false;
        emit("logout");
        return;
    }
    authorized.value = true;
    emit("login", token);
}

onMounted(async () => {
    await auth.oauthCallback();
    await update();
});
</script>
