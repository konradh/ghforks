<template>
    <div id="repo">
        <a :href="repo.url" target="_blank">{{ repo.owner }}/{{ repo.name }}</a>
        <br>
        <i class="fa-solid fa-star"></i> {{ repo.stars }} stars
        <br>
        <i class="fa-solid fa-eye"></i> {{ repo.watchers }} watchers
        <br>
        <i class="fa-solid fa-code-fork"></i> {{ repo.forkCount }} forks
    </div>
</template>

<script setup>
const props = defineProps(["repo"])
</script>