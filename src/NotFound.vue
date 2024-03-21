<template>
    <template v-if="notFound">
        <h1>Not found.</h1>
    </template>
</template>

<script setup>
import { ref } from 'vue';
import { parseRepo } from './utils';

const notFound = ref(false);

var base = '/';
if (import.meta.env.VITE_BASE) {
    base = new URL(import.meta.env.VITE_BASE)?.pathname;
}
const current = new URL(window.location.toString());
const target = new URL(window.location.protocol + '//' + window.location.host + base)

var start = 0;
if (current.pathname.startsWith(base)) {
    start = base.length;
}

const repo = parseRepo(current.pathname.slice(start))
if (repo) {
    target.searchParams.set('owner', repo.owner);
    target.searchParams.set('repo', repo.name);
    window.location.replace(target);
} else {
    notFound.value = true;
}
</script>
