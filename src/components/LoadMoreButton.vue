<template>
    <div class="input-set">
        <button id="load-more" type="button" @click="emit('click')" :disabled="loading">
            <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i> <template v-if="loadingText">{{ loadingText
                }}</template><template v-else>loading...</template>
        </button>
        <button id="load-all" type="button" @click="emit('click')" :disabled="loading">
            <label class="padded">
                <input type="checkbox" v-model="keepLoading">
                Load all
            </label>
        </button>
    </div>
</template>

<style scoped lang="scss">
button#load-more {
    min-width: 15em;
}

button#load-all {
    padding: 0;
}

button#load-all>* {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 0.5em 1em;
    display: block;
}
</style>

<script setup lang="ts">
defineProps<{ loadingText: string, loading: boolean }>();
const emit = defineEmits<{ (e: "click"): void }>();
const keepLoading = defineModel<boolean>();
</script>
