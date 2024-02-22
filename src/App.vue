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
      <div id="repo-input" class="align-center">
        <RepoInput v-on:change="update"></RepoInput>
      </div>
    </div>
    <Forks :octokit="octokit" :query="repoQuery"></Forks>
  </template>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import RepoInput from './components/RepoInput.vue'
import Authorization from './components/Authorization.vue';
import Faq from './components/Faq.vue';
import Forks from './components/Forks.vue';


import { Octokit } from 'octokit';
import { RepoQuery } from './types';

const authorized = ref(false);
const octokit = ref<Octokit | null>(null);
const repoQuery = ref<RepoQuery | null>(null)

function signIn(ok: Octokit) {
  authorized.value = true;
  octokit.value = ok;
}

function signOut() {
  authorized.value = false;
  octokit.value = null;
}

function update(query: RepoQuery) {
  repoQuery.value = query;
}
</script>
