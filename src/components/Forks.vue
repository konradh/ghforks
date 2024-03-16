<template>
    <Repo v-if="repo" :repo="repo"></Repo>
    <div v-else-if="loading" class="align-center">
        <i class="fa-solid fa-spinner fa-spin"></i> loading
    </div>
    <div v-if="repo">
        <h2>
            Forks<template v-if="repo">
                ({{ forks.length }} of {{ repo.forks.public }})</template>
        </h2>
        <LoadMoreButton v-if="canLoadMore" @click="loadMore" v-model="keepLoading" :loading="loading"
            :loadingText="loadingText" class="align-center">
        </LoadMoreButton>
        <div v-if="!loading && repo && repo.forks.public === 0">
            This repository has no public forks.
        </div>
        <div v-else>
            <TransitionGroup name="list">
                <template v-for="fork in usefulForks" :key="fork.id">
                    <Fork :fork="fork" @requestCommits="loadCommits"></Fork>
                </template>
            </TransitionGroup>
            <details v-if="uselessForks.length > 0">
                <summary>{{ uselessForks.length }} useless forks</summary>
                <TransitionGroup name="list">
                    <template v-for="fork in uselessForks" :key="fork.id">
                        <Fork :fork="fork" @requestCommits="loadCommits"></Fork>
                    </template>
                </TransitionGroup>
            </details>
        </div>
        <LoadMoreButton v-if="canLoadMore && forks.length > 0" @click="loadMore" v-model="keepLoading"
            :loading="loading" :loadingText="loadingText" class="align-center">
        </LoadMoreButton>
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
import { ref, watch, computed, onMounted } from "vue";

import Repo from "./repo/Repo.vue";
import Fork from "./repo/Fork.vue";
import LoadMoreButton from "./LoadMoreButton.vue";

import { API } from "../queries";
import { Octokit } from "octokit";
import { RepoQuery, Fork as ForkType, Repo as RepoType } from "../types";

const props = defineProps<{
    octokit: Octokit | null;
    query: RepoQuery | null;
}>();
var api: API | null = null;

watch(() => props.query, loadInitial);
onMounted(loadInitial);

const loading = ref(false);
const loadingText = ref("");
const canLoadMore = ref(false);
const keepLoading = ref(false);

const repo = ref<RepoType | null>(null);
const forks = ref<ForkType[]>([]);
const usefulForks = computed(() =>
    forks.value.filter((f: ForkType) => f.score !== -Infinity)
);
const uselessForks = computed(() =>
    forks.value.filter((f: ForkType) => !f.score || f.score === -Infinity)
);

async function loadInitial() {
    repo.value = null;
    forks.value = [];
    loading.value = false;
    if (props.query && props.octokit) {
        keepLoading.value = false;
        api = new API(props.octokit, props.query);
        loadMore();
    }
}

async function loadMore() {
    if (!api) {
        return;
    }

    canLoadMore.value = api.canLoadMore();
    loading.value = true;
    repo.value = await api.getRepo();

    if (!repo.value) {
        loading.value = false;
        canLoadMore.value = false;
        forks.value = api.forks() ?? [];
        return;
    }
    do {
        loadingText.value = "loading forks...";
        await api.getNextForks();
        forks.value = api.forks();
    } while (keepLoading.value && api.canLoadMore());

    loading.value = false;
    loadingText.value = "load more";
    canLoadMore.value = api.canLoadMore();
}

async function loadCommits(id: string) {
    if (api) {
        await api.getDiffCommits(id);
        forks.value = api.forks();
    }
}
</script>
