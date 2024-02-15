<template>
  <template v-if="!authorized">
    <div class="text">
      <h1>GitHub Sporks</h1>
      <p>Find <b>sp</b>ecial <b>forks</b> of GitHub projects.</p>
    </div>
    <div class=align-center>
      <Authorization @signin="signIn"></Authorization>
    </div>
    <Faq></Faq>
  </template>
  <template v-else>
    <div class="align-right">
      <Authorization @signout="signOut"></Authorization>
    </div>
    <div id="repo-input" class="align-center">
      <RepoInput v-on:change="update"></RepoInput>
    </div>
    <template v-if="loading">
      <Repo v-if="repo" :repo="repo"></Repo>
      <div v-else class="align-center">
        <i class="fa-solid fa-spinner fa-spin"></i> loading
      </div>
      <h2>Forks</h2>
      <Forks v-if="forks" :forks="forks"></Forks>
      <div v-else class="align-center">
        <i class="fa-solid fa-spinner fa-spin"></i> loading
      </div>
    </template>
  </template>
</template>

<style scoped>
#repo-input {
  width: 20em;
}
</style>

<script setup lang="ts">
import { ref } from 'vue';

import RepoInput from './components/RepoInput.vue'
import Authorization from './components/Authorization.vue';
import Forks from './components/repo/Forks.vue';
import Repo from './components/repo/Repo.vue';
import Faq from './components/Faq.vue';


import { API } from './queries';
import { rank } from './ranking';
import { Octokit } from 'octokit';
import { RepoQuery } from './types';

const repo = ref();
const forks = ref();
const loading = ref(false);
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
  loading.value = true;
  const api = new API(octokit, repoQuery);
  repo.value = await api.getRepo();
  forks.value = rank(await api.loadMoreForks());
}
</script>
