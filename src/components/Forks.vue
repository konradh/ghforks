<template>
    <Repo v-if="repo" :repo="repo"></Repo>
    <div v-else class="align-center">
        <i class="fa-solid fa-spinner fa-spin"></i> loading
    </div>
    <div>
        <h2>Forks<template v-if="repo"> ({{ usefulForks.length + uselessForks.length }} of {{ repo.publicForkCount
        }})</template></h2>
        <div v-if="canLoadMore" class="align-center">
            <button @click="loadMore" :disabled="loading">
                <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
                {{ loadingText }}
            </button>
            <label>
                <input type="checkbox" v-model="keepLoading">
                keep loading more
            </label>
        </div>
        <div v-if="!loading && repo && repo.publicForkCount === 0" class="align-center">
            This repository has no public forks.
        </div>
        <div v-else>
            <TransitionGroup name="list">
                <template v-for="fork in usefulForks" :key="fork.id">
                    <Fork :fork="fork"></Fork>
                </template>
            </TransitionGroup>
            <details v-if="uselessForks.length > 0">
                <summary>{{ uselessForks.length }} useless forks</summary>
                <TransitionGroup name="list">
                    <template v-for="fork in uselessForks" :key="fork.id">
                        <Fork :fork="fork"></Fork>
                    </template>
                </TransitionGroup>
            </details>
        </div>
    </div>
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
import { Octokit } from 'octokit';
import { RepoQuery, Fork as ForkType, Repo as RepoType } from '../types';

const props = defineProps<{ octokit: Octokit | null, query: RepoQuery | null }>();
var api: API | null = null;

watch(() => props.query, async () => {
    repo.value = null;
    setForks([]);
    loading.value = false;
    if (props.query && props.octokit) {
        keepLoading.value = false;
        canLoadMore.value = true;
        api = new API(props.octokit, props.query);
        loadMore();
    }
});


const loading = ref(false);
const loadingText = ref("");
const canLoadMore = ref(false);
const keepLoading = ref(false);

const repo = ref<RepoType | null>(null);
const usefulForks = ref<ForkType[]>([]);
const uselessForks = ref<ForkType[]>([]);

const batchSize = 100;

function setForks(forks: ForkType[]) {
    usefulForks.value = forks.filter(f => f.forkScore && f.forkScore > 0);
    uselessForks.value = forks.filter(f => !f.forkScore || f.forkScore <= 0);
}

async function loadMore() {
    if (!api) {
        return;
    }

    loading.value = true;
    repo.value = await api.getRepo();

    if (!repo.value) {
        loading.value = false;
        canLoadMore.value = false;
        setForks([]);
        return;
    }
    const promises = [];
    do {
        loadingText.value = "loading forks...";
        const fs = await api.getForks(batchSize);
        promises.push(api.getDiffs(fs).then(_ => setForks(api?.forks() ?? [])));
    }
    while (keepLoading.value && api.canLoadMore());
    loadingText.value = "almost done...";
    await Promise.all(promises);

    loading.value = false;
    loadingText.value = "load more";
    canLoadMore.value = api.canLoadMore();
}
</script>