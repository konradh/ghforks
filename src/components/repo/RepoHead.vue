<template>
    <div>
        <a :href="repo.url" target="_blank" class="repo">{{ repo.owner }}/{{ repo.name }}</a>
        <span class="space"></span>
        <div class="stats">
            <a :href="repo.url + '/stargazers'" target="_blank">
                <span title="stars"><i class="fa-solid fa-star"></i> {{ repo.stars }}</span>
            </a>
            <a :href="repo.url + '/watchers'" target="_blank">
                <span title="watchers"><i class="fa-solid fa-eye"></i> {{ repo.watchers }}</span>
            </a>
            <a :href="repo.url + '/issues'" target="_blank">
                <span title="open issues"><i class="fa-regular fa-circle-dot"></i> {{ repo.issues.open }}</span>
            </a>
            <a :href="repo.url + '/pulls'" target="_blank">
                <span title="open pull requests"><i class="fa-solid fa-code-pull-request"></i> {{ repo.pullRequests.open }}</span>
            </a>
            <a :href="repo.url + '/forks'" target="_blank">
                <span title="public forks (private forks)"><i class="fa-solid fa-code-fork"></i> {{ repo.forks.public }} <template v-if="repo.forks.private > 0">({{ repo.forks.private }})</template></span>
            </a>
        </div>
    </div>
    <div>
        <span><i class="fa-solid fa-heart-pulse"></i> pushed to {{ timeDiffApprox(repo.pushedAt) }}</span>
    </div>
</template>

<script setup lang="ts">
import { Repo } from "../../types";
import { timeDiffApprox } from "../../utils";
defineProps<{ repo: Repo }>();
</script>
