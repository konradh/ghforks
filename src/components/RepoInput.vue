<template>
    <div class="input-set">
        <input type="text" v-model="input" @keydown.enter="updateFromInput()" @input="validate()"
            placeholder="owner/repo or https://github.com/owner/repo" :class="[isValid ? '' : 'invalid']" />
        <button type="button" @click="updateFromInput()" :disabled="!isValid || !input">Go</button>
    </div>
</template>

<style scoped lang="scss">
.invalid {
    box-shadow: 0 0 0.5em 0.1em red;

    &:focus {
        box-shadow: 0 0 0.5em 0.3em red;
    }
}

div.input-set {
    height: 3em;
    margin: 1em;

    >* {
        padding-left: 1em;
        padding-right: 1em;
    }
}

input {
    width: 30em;
}
</style>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RepoQuery } from "../types";

const emit = defineEmits<{ (e: "change", value: RepoQuery): void }>();

const repoRegex = new RegExp(
    "/?(?<owner>[A-Za-z0-9_.-]+)/(?<name>[A-Za-z0-9_.-]+)$"
);
const input = ref("");
const isValid = ref(false);

function parseRepo(input: string): RepoQuery | null {
    const match = repoRegex.exec(input);
    const owner = match?.groups?.owner;
    const name = match?.groups?.name;
    if (!owner || !name) {
        return null;
    }
    return { owner, name };
}

function validate() {
    if (input.value === "") {
        isValid.value = true;
    } else {
        const repo = parseRepo(input.value);
        isValid.value = repo !== null;
    }
}

function updateFromInput() {
    const repo = parseRepo(input.value);
    if (repo) {
        update(repo);
    }
}

function updateURL() {
    const url = new URL(window.location.toString());
    const owner = url.searchParams.get("owner");
    const name = url.searchParams.get("repo");
    if (name && owner) {
        const repo = parseRepo(owner + "/" + name);
        if (repo) {
            update(repo);
        }
    }
}

function update(repo: RepoQuery) {
    validate();
    input.value = repo.owner + "/" + repo.name;
    const currentURL = new URL(window.location.toString());
    currentURL.searchParams.set("owner", repo.owner);
    currentURL.searchParams.set("repo", repo.name);
    window.history.pushState({}, "", currentURL.toString());
    emit("change", repo);
}

onMounted(async () => {
    validate();
    updateURL();
});
</script>
