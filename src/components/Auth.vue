<template>
    <template v-if="!authorized">
        <button class="padded margin" @click="login()">
            <i class="fa-brands fa-github fa-2xl"></i> Sign in with GitHub
        </button>
        <br>
        <button class="padded margin" @click="showModal()">
            <i class="fa-solid fa-key fa-2xl"></i> Use Access Token
        </button>
        <dialog id="pat-modal">
            <div>
                <a href="https://github.com/settings/personal-access-tokens/new" target="_blank">Create</a> a fine-grained personal access token.
            </div>
            <br>
            <div>
                <input v-model="tokenInput" placeholder="ghp_ | github_pat_" @keydown.enter="saveToken()">
            </div>
            <div v-if="error" class="error padded">{{ error }}</div>
            <br>
            <div>
                <button class="margin" @click="saveToken()">Save token</button>
                <button class="margin" @click="closeModal()">Cancel</button>
            </div>
        </dialog>
    </template>
    <button v-else class="padded" @click="logout()">
        <i class="fa-solid fa-right-from-bracket fa-2xl"></i> Sign out
    </button>
</template>

<style scoped>
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

const emit = defineEmits<{ (e: "login", value: string): void, (e:"logout"): void}>();

const authorized = ref(false);
const tokenInput = ref("");
const error = ref<string|null>(null);

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
