<template>
  <template v-if="!authorized">
    <Authorization @signin="signIn"></Authorization>
    <br>
    Bla bla bla
  </template>
  <template v-else>
    <Authorization @signout="signOut"></Authorization>
    <br>
    <RepoInput v-on:change="update"></RepoInput>
    <Repo v-if="repo" :repo="repo"></Repo>
    <Forks v-if="forks" :forks="forks"></Forks>
  </template>
</template>

<style scoped></style>

<script setup lang="ts">
import { ref } from 'vue';

import RepoInput from './components/RepoInput.vue'
import Authorization from './components/Authorization.vue';
import Forks from './components/repo/Forks.vue';
import Repo from './components/repo/Repo.vue';

import { API } from './queries';
import { rank } from './ranking';
import { Octokit } from 'octokit';
import { RepoQuery } from './types';

const repo = ref();
const forks = ref();
var octokit: Octokit | null = null;

const authorized = ref(false);

function signIn(ok: Octokit) {
  authorized.value = true;
  octokit = ok;
}

function signOut() {
  authorized.value = false;
  octokit = null;
}

async function update(repoQuery: RepoQuery) {
  forks.value = null;
  repo.value = null;
  if (!octokit) {
    return;
  }
  const api = new API(octokit, repoQuery);
  repo.value = await api.getRepo();
  forks.value = rank(await api.loadMoreForks());
}
</script>
