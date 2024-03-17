<template>
  <header>
    <a @click="repoQuery = null" href="/" class="no-highlight">
      <h1>ghforks</h1>
    </a>
    <Auth v-if="authenticated" @logout="logout"></Auth>
  </header>
  <div v-if="authenticated" class="align-center">
    <RepoInput @change="update"></RepoInput>
  </div>
  <Forks v-if="repoQuery && authenticated" :githubAPI="githubAPI" :query="repoQuery"></Forks>
  <template v-else>
    <div class="text">
      <div v-if="!authenticated" class="align-center">
        <Auth @login="login"></Auth>
      </div>
      <About></About>
    </div>
  </template>
</template>

<style scoped lang="scss">
body {
  box-sizing: border-box;
}

header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  column-gap: 0.5em;

  >* {
    margin: auto;
  }

  :nth-child(1) {
    grid-column-start: 2;
  }

  :nth-child(2) {
    margin-left: auto;
    margin-right: 0;
  }
}
</style>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import RepoInput from "./components/RepoInput.vue";
import Auth from "./components/Auth.vue";
import About from "./components/About.vue";
import Forks from "./components/Forks.vue";

import { RepoQuery } from "./types";
import * as auth from "./auth";
import { GithubAPI } from "./github-api";

const authenticated = ref(false);
const githubAPI = ref<GithubAPI | null>(null);
const repoQuery = ref<RepoQuery | null>(null);

function login(token: string) {
  authenticated.value = true;
  githubAPI.value = new GithubAPI(token);
}

function logout() {
  authenticated.value = false;
  githubAPI.value = null;
}

function update(query: RepoQuery) {
  repoQuery.value = query;
}

onMounted(async () => {
  const token = await auth.getToken();
  if (token) {
    githubAPI.value = new GithubAPI(token);
    console.log(typeof (githubAPI))
  }
});
</script>
