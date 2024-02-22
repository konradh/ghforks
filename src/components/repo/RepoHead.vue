<template>
    <div>
        <a :href="repo.url" target="_blank" class="repo">{{ repo.owner }}/{{ repo.name }}</a>
        <span class="space"></span>
        <div class="stats">
            <span><i class="fa-solid fa-star"></i> {{ repo.stars }} stars</span>
            <span><i class="fa-solid fa-eye"></i> {{ repo.watchers }} watchers</span>
            <span><i class="fa-solid fa-code-fork"></i> {{ repo.forkCount }} forks</span>
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