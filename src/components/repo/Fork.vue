<template>
    <div class="card">
        <RepoHead :repo="fork"></RepoHead>
        <p v-if="fork.extendedInfo?.descriptionChanged" class="description">{{ fork.description }}</p>
        <div v-if="fork.extendedInfo && fork.extendedInfo?.newBranches.length > 0">
            <div class="new-branches">
                <span>branches not present in parent:</span>
                <div>
                    <template v-for="(branch, idx) in fork.extendedInfo?.newBranches" :key="branch">
                        <a :href="`${fork.url}/tree/${branch}`" target="_blank">
                            {{ branch }}
                        </a><template v-if="idx != fork.extendedInfo?.newBranches.length - 1">, </template>
                    </template>
                </div>
            </div>
        </div>
        <div v-if="fork.diff && fork.diff?.aheadBy > 0">
            <details class="commits">
                <summary>
                    {{ fork.diff.aheadBy }} ahead, {{ fork.diff.behindBy }} behind.
                </summary>
                <ul>
                    <li v-for="commit in fork.diff.commits" :key="commit.commitId">
                        <i class="fa-solid fa-code-commit"></i> <span class="additions">{{ commit.additions
                        }}</span><span class="deletions">{{ commit.deletions }}</span> <a
                            :href="`${fork.url}/commit/${commit.commitId}`" target="_blank">{{ commit.message }}</a>
                    </li>
                    <li v-if="fork.diff.aheadBy > fork.diff.commits.length" class="i"><i v-for="i in 3" :key="i"
                            class="fa-solid fa-code-commit"></i> {{ fork.diff.aheadBy - fork.diff.commits.length }} more
                        commits</li>
                </ul>
            </details>
        </div>
        <div v-else-if="fork.diff">
            {{ fork.diff.aheadBy }} ahead, {{ fork.diff.behindBy }} behind.
        </div>
    </div>
</template>

<script setup lang="ts">
import RepoHead from './RepoHead.vue';
import { Fork } from '../../types';
defineProps<{ fork: Fork }>();
</script>