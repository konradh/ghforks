<template>
  <div id="list">
    <TransitionGroup name="list">
      <Fork v-for="fork in forks" :key="fork.id" :fork="fork"></Fork>
    </TransitionGroup>
  </div>
</template>

<style scoped lang="scss">
.list-move,
.list-enter-active,
.list-leave-active {
  transition-property: transform;
  transition-duration: 1s;
  transition-timing-function: ease-out;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
  position: absolute;
  z-index: 10;
}
</style>

<script setup>
import Fork from "./Fork.vue";
const props = defineProps(["forks"]);
</script>