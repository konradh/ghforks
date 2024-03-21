<template>
    <div>
        <a :href="repo.url" target="_blank" class="repo">{{ repo.owner }}/{{ repo.name }}</a>
        <span class="space"></span>
        <div class="stats">
            <a :href="repo.url + '/stargazers'" target="_blank" class="no-highlight">
                <span title="stars"><i class="fa-solid fa-star"></i> {{ repo.stars }}</span>
            </a>
            <a :href="repo.url + '/watchers'" target="_blank" class="no-highlight">
                <span title="watchers"><i class="fa-solid fa-eye"></i> {{ repo.watchers }}</span>
            </a>
            <a :href="repo.url + '/issues'" target="_blank" class="no-highlight">
                <span title="open issues"><i class="fa-regular fa-circle-dot"></i> {{ repo.issues.open }}</span>
            </a>
            <a :href="repo.url + '/pulls'" target="_blank" class="no-highlight">
                <span title="open pull requests"><i class="fa-solid fa-code-pull-request"></i> {{ repo.pullRequests.open
                    }}</span>
            </a>
            <a :href="repo.url + '/forks'" target="_blank" class="no-highlight">
                <span title="direct forks"><i class="fa-solid fa-code-fork"></i> {{ repo.forks.direct }}</span>
            </a>
        </div>
    </div>
    <div>
        <span><i class="fa-solid fa-heart-pulse"></i> <template v-if="repo.updatedAt > repo.createdAt">updated
                {{ timeDiffApprox(repo.updatedAt) }}</template>
            <template v-else>never updated</template></span>
    </div>
</template>

<script setup lang="ts">
import { Repo } from "../../types";
import { timeDiffApprox } from "../../utils";
defineProps<{ repo: Repo }>();
</script>
