<template>
    <template v-for="fork in forks" :key="fork.id">
        <div class="card">
            <div>
                <a :href="fork.url" target="_blank" class="repo">{{ fork.owner }}/{{  fork.name }}</a>
                <span class="space"></span>
                <div class="stats">
                    <span><i class="fa-solid fa-star"></i> {{ fork.stars }} stars</span>
                    <span><i class="fa-solid fa-eye"></i> {{ fork.watchers }} watchers</span>
                    <span><i class="fa-solid fa-code-fork"></i> {{ fork.forkCount }} forks</span>
                </div>
            </div>

            <div>
                <span><i class="fa-solid fa-heart-pulse"></i> last updated {{ timeDiffApprox(fork.updatedAt, new Date()) }}</span>
            </div>

            <p v-if="fork.descriptionChanged" class="description">{{ fork.description }}</p>

            <div v-if="fork?.newBranches?.length > 0">
                <div class="new-branches">
                    <span>branches not present in parent:</span>
                    <div>
                        <template v-for="(branch, idx) in fork.newBranches" :key="branch">
                            <a :href="`${fork.url}/tree/${branch}`" target="_blank">
                            {{ branch }}
                            </a><template v-if="idx != fork.newBranches.length - 1">, </template>
                        </template>
                    </div>
                </div>
            </div>

            <!-- fix spacing here -->

            <div v-if="fork.diff.aheadBy > 0">
                <details>
                    <summary>
                        <span>{{ fork.diff.aheadBy }} ahead</span>, <span>{{ fork.diff.behindBy }} behind</span>.
                        View latest commits.
                    </summary> 
                    <ul class="commits">
                        <li v-for="commit in fork.diff.commits" :key="commit.commitId">
                            <i class="fa-solid fa-code-commit"></i> <span class="additions">{{ commit.additions }}</span><span class="deletions">{{ commit.deletions }}</span> <a :href="`${fork.url}/commit/${commit.commitId}`" target="_blank">{{ commit.message }}</a>
                        </li>
                        <li v-if="fork.diff.aheadBy > fork.diff.commits.length" class="i"><i v-for="i in 3" :key="i" class="fa-solid fa-code-commit"></i> {{ fork.diff.aheadBy - fork.diff.commits.length}} more commits</li>
                    </ul>
                </details>
            </div>
            <div v-else>
                <span>{{ fork.diff.aheadBy }} ahead</span>, <span>{{ fork.diff.behindBy }} behind</span>.
            </div>
        </div>
    </template>
</template>

<script setup>
import { timeDiffApprox } from '../utils';

const props = defineProps(["forks"])
</script>