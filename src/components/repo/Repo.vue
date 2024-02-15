<template>
    <div class="card">
        <RepoHead :repo="repo"></RepoHead>
        <p class="description">{{ repo.description }}</p>
    </div>
</template>

<script setup lang="ts">
import { Repo } from '../../types';
import RepoHead from './RepoHead.vue';
defineProps<{ repo: Repo }>();
</script>