<template>
    <Repo v-if="repo" :repo="repo"></Repo>
    <div v-else-if="loading" class="align-center">
        <i class="fa-solid fa-spinner fa-spin"></i> Loading...
    </div>
    <div v-if="repo">
        <h2>
            Forks<template v-if="repo">
                ({{ forks.length }} of {{ repo.forks.public }})</template>
        </h2>
        <div class="align-center">
            <LoadMoreButton v-if="canLoadMore" @click="loadMore" v-model="keepLoading" :loading="loading"
                :loadingText="loadingText">
            </LoadMoreButton>
        </div>
        <div v-if="!loading && repo && repo.forks.public === 0">
            This repository has no public forks.
        </div>
        <div v-else>
            <TransitionGroup name="list">
                <template v-for="fork in usefulForks" :key="fork.id">
                    <Fork :fork="fork" @requestCommits="loadCommits"></Fork>
                </template>
            </TransitionGroup>
            <details v-if="uselessForks.length > 0" id="useless">
                <summary>{{ uselessForks.length }} useless forks</summary>
                <TransitionGroup name="list">
                    <template v-for="fork in uselessForks" :key="fork.id">
                        <Fork :fork="fork" @requestCommits="loadCommits"></Fork>
                    </template>
                </TransitionGroup>
            </details>
        </div>
        <div class="align-center">
            <LoadMoreButton v-if="canLoadMore && forks.length > 0" @click="loadMore" v-model="keepLoading"
                :loading="loading" :loadingText="loadingText">
            </LoadMoreButton>
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

details#useless {
    margin: 0.5em;

    >summary {
        width: fit-content;
        margin: auto;
        padding: 0.5em;
        border: 1px solid black;
        border-radius: 0.5em;
        background-color: #e9e9ed;
    }

    >summary::before {
        content: "show "
    }

    &[open]>summary::before {
        content: "hide "
    }
}
</style>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";

import Repo from "./repo/Repo.vue";
import Fork from "./repo/Fork.vue";
import LoadMoreButton from "./LoadMoreButton.vue";

import { ForksAPI } from "../forks-api";
import { RepoQuery, Fork as ForkType, Repo as RepoType } from "../types";
import { GithubAPI } from "../github-api";

const props = defineProps<{
    githubAPI: GithubAPI | null;
    query: RepoQuery | null;
}>();
var api: ForksAPI | null = null;

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
    if (props.query && props.githubAPI) {
        keepLoading.value = false;
        api = new ForksAPI(props.githubAPI, props.query);
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
        loadingText.value = "Loading forks...";
        await api.getNextForks();
        forks.value = api.forks();
    } while (keepLoading.value && api.canLoadMore());

    loading.value = false;
    loadingText.value = "Load more";
    canLoadMore.value = api.canLoadMore();
}

async function loadCommits(id: string) {
    if (api) {
        await api.getDiffCommits(id);
        forks.value = api.forks();
    }
}
</script>
