<template>
    <template v-if="loading">
        <Repo v-if="repo" :repo="repo"></Repo>
        <div v-else class="align-center">
            <i class="fa-solid fa-spinner fa-spin"></i> loading
        </div>
        <div>
            <h2>Forks</h2>
            <div v-if="!forks" class="align-center">
                <i class="fa-solid fa-spinner fa-spin"></i> loading
            </div>
            <div v-else-if="forks.length === 0" class="align-center">
                This repository has no forks.
            </div>
            <div id="list">
                <TransitionGroup name="list">
                    <Fork v-for="fork in forks" :key="fork.id" :fork="fork"></Fork>
                </TransitionGroup>
            </div>
        </div>
    </template>
</template>

<style scoped lang="scss">
.list-move,
.list-enter-active,
.list-leave-active {
    transition-property: transform;
    transition-duration: 1s;
    transition-timing-function: ease-out;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
}

.list-leave-active {
    position: absolute;
}
</style>

<script setup lang="ts">
import { ref, watch } from 'vue';

import Repo from './repo/Repo.vue';
import Fork from './repo/Fork.vue';


import { API } from '../queries';
import { rank } from '../ranking';
import { Octokit } from 'octokit';
import { RepoQuery, Repo as RepoType } from '../types';

const props = defineProps<{ octokit: Octokit | null, query: RepoQuery | null }>();

watch(() => props.query, async (q: RepoQuery | null) => {
    if (q) {
        update(q);
    }
});

const repo = ref();
const forks = ref();
const loading = ref(false);

const batchSize = 100;

async function update(repoQuery: RepoQuery) {
    if (!props.octokit) {
        return;
    }
    forks.value = null;
    repo.value = null;
    loading.value = true;

    const api = new API(props.octokit, repoQuery);
    repo.value = await api.getRepo();
    if (!repo) {
        loading.value = false;
        forks.value = [];
        return;
    }

    function setForks() {
        forks.value = rank(api.forks());
    }

    // while (api.canLoadMore()) {
    await api.getForks(batchSize)
        .then(async (fs: RepoType[]) => {
            setForks();
            api.getDiffs(fs).then(setForks);
        });
    // }
}
</script>