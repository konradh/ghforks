<template>
    <div>
        <button @click="emit('click')" :disabled="loading">
            <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
            {{ loadingText }}
            <label>
                <input type="checkbox" v-model="keepLoading">
                keep loading more
            </label>
        </button>
    </div>
</template>

<script setup lang="ts">
defineProps<{ loadingText: string, loading: boolean }>();
const emit = defineEmits<{ (e: "click"): void }>();
const keepLoading = defineModel<boolean>();
</script>