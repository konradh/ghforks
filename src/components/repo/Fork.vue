<template>
    <div class="card">
        <RepoHead :repo="fork"></RepoHead>
        <p v-if="fork.diff?.descriptionChanged" class="description">{{ fork.description }}</p>
        <div v-if="fork.diff && fork.diff?.newBranches.length > 0">
            <div class="new-branches">
                <span>branches not present in parent:</span>
                <div>
                    <template v-for="(branch, idx) in fork.diff?.newBranches" :key="branch">
                        <a :href="`${fork.url}/tree/${branch.name}`" target="_blank" class="branch">
                            {{ branch.name }}
                        </a><template v-if="idx != fork.diff?.newBranches.length - 1">, </template>
                    </template>
                </div>
            </div>
        </div>
        <div v-if="fork.diff && fork.diff?.aheadBy > 0">
            <details class="commits" @toggle="toggleCommits">
                <summary>
                    <template v-if="fork.diff.aheadBy > 0">{{ fork.diff.aheadBy }} ahead</template>
                    <template v-if="fork.diff.aheadBy > 0 && fork.diff.behindBy > 0">, </template>
                    <template v-if="fork.diff.behindBy > 0">{{ fork.diff.behindBy }} behind</template>
                    <template v-if="fork.diff.aheadBy === 0 && fork.diff.behindBy === 0">Default branch is up to
                        date</template>.
                </summary>
                <ul v-if="fork.diff.commits">
                    <li v-for="commit in fork.diff.commits" :key="commit.commitId">
                        <i class="fa-solid fa-code-commit"></i> <span class="additions">{{ commit.additions
                            }}</span><span class="deletions">{{ commit.deletions }}</span> <a :href="commit.url"
                            target="_blank">{{ commit.message }}</a>
                    </li>
                    <li v-if="fork.diff.aheadBy > fork.diff.commits.length" class="i"><i v-for="i in 3" :key="i"
                            class="fa-solid fa-code-commit"></i> {{ fork.diff.aheadBy - fork.diff.commits.length }} more
                        commits</li>
                </ul>
                <span v-else><i class="fa-solid fa-spinner fa-spin"></i> loading...</span>
            </details>
        </div>
        <div v-else-if="fork.diff">
            <template v-if="fork.diff.aheadBy > 0">{{ fork.diff.aheadBy }} ahead</template>
            <template v-if="fork.diff.aheadBy > 0 && fork.diff.behindBy > 0">, </template>
            <template v-if="fork.diff.behindBy > 0">{{ fork.diff.behindBy }} behind</template>
            <template v-if="fork.diff.aheadBy === 0 && fork.diff.behindBy === 0">Default branch is up to
                date</template>.
        </div>
    </div>
</template>

<style scoped>
.branch {
    white-space: nowrap;
}
</style>

<script setup lang="ts">
import RepoHead from './RepoHead.vue';
import { Fork } from '../../types';
const props = defineProps<{ fork: Fork }>();
const emit = defineEmits<{ (e: "requestCommits", value: string): void }>();

interface ToggleEvent extends Event {
    newState: string
}

function toggleCommits(event: ToggleEvent) {
    if (event.newState === "open" && !props.fork.diff.commits) {
        emit("requestCommits", props.fork.id);
    }
}
</script>
