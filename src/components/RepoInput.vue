<template>
    <input type="text" v-model="input" @keydown.enter="updateFromInput()" @input="validate()" placeholder="owner/repo"
        :class="[isValid ? '' : 'invalid']">
</template>

<style scoped lang="scss">
.invalid {
    box-shadow: 0 0 0.5em 0.1em red;

    &:focus {
        box-shadow: 0 0 0.5em 0.3em red;
    }
}
</style>

<style scoped>
input {
    width: 100%;
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RepoQuery } from '../types';

const emit = defineEmits<{ (e: "change", value: RepoQuery): void }>();

const repoRegex = new RegExp("/?(?<owner>[A-Za-z0-9_.-]+)/(?<name>[A-Za-z0-9_.-]+)$");
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
    update(repo);
}

function updateFromHash() {
    const repo = parseRepo(window.location.hash.substring(1));
    update(repo);
}

function update(repo: RepoQuery | null) {
    if (!repo) {
        return;
    }
    validate();
    const asString = `${repo.owner}/${repo.name}`;
    input.value = asString;
    window.location.hash = asString;
    emit("change", repo);
}

window.onhashchange = updateFromHash;

onMounted(async () => {
    validate();
    updateFromHash();
})
</script>
