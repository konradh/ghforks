<template>
    <template v-for="fork in forks" :key="fork.id">
        <Fork :fork="fork"></Fork>
    </template>
</template>

<script setup>
import Fork from './Fork.vue';
const props = defineProps(["forks"])
</script>