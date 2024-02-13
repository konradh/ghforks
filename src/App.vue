<template>
  <template v-if="!authorized">
    <Authorization @signin="signIn"></Authorization>
    <br>
    Bla bla bla
  </template>
  <template v-else>
    <Authorization @signout="signOut"></Authorization>
    <br>
    <RepoInput @input="update"></RepoInput>
    <Repository v-if="repo" :repo="repo"></Repository>
    <Forks v-if="forks" :forks="forks"></Forks>
  </template>
</template>

<style scoped>
</style>

<script setup lang="ts">
import { ref } from 'vue';

import RepoInput from './components/RepoInput.vue'
import Authorization from './components/Authorization.vue';
import Forks from './components/Forks.vue';
import Repository from './components/Repository.vue';

import { RepoQuery } from './types';
import { repository as getRepos , forks as getForks, addAdditionalForkInfo} from './queries';
import { rank } from './ranking';
import { Octokit } from 'octokit';

const repo = ref();
const forks = ref();
var octokit : Octokit|null = null;

const authorized = ref(false);

function signIn(ok: Octokit) {
  authorized.value = true;
  octokit = ok;
}

function signOut() {
  authorized.value = false;
  octokit = null;
}

async function update(repoInput: RepoQuery) {
  if (!octokit) {
    return;
  }
  repo.value = await getRepos(octokit, repoInput);
  const res =  await getForks(octokit, repoInput, repo.value.defaultBranch);
  let f = await res.forks;
  f = f.map(e => addAdditionalForkInfo(e, repo.value));
  forks.value = rank(f);
}
</script>
