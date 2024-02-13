<template>
    <input type="text" v-model="input" @keydown.enter="update()" placeholder="owner/repo">
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RepoQuery } from '../types';

const emit = defineEmits<{input: [repo: RepoQuery]}>();

const repoRegex = new RegExp("/?(?<owner>[A-Za-z0-9_.-]+)/(?<name>[A-Za-z0-9_.-]+)$");
const input = ref("");

function getRepo(): RepoQuery | null {
  const match = repoRegex.exec(input.value);
  const owner = match?.groups?.owner;
  const name = match?.groups?.name;
  if (!owner || !name) { return null; }
  return { owner, name };
}

function update() {
    const repo = getRepo();
    if (!repo) {
        return;
    }
    emit("input", repo);
}
</script>