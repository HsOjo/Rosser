<script lang="ts" setup>
import {useStore} from "vuex";
import {computed} from "vue";
import ControlArea from "@/components/header/ControlArea.vue";
import LeftSide from "@/components/header/LeftSide.vue";
import Title from "@/components/header/Title.vue";
import RightSide from "@/components/header/RightSide.vue";
import ProgressBar from "@/components/header/ProgressBar.vue";

const store = useStore()
const isMac = computed(() => store.getters.isMac)
</script>

<template>
  <div class="header">
    <ControlArea v-if="isMac"></ControlArea>
    <div class="plugin-area" style="min-width: 120px">
      <LeftSide></LeftSide>
    </div>
    <Title></Title>
    <div class="plugin-area" style="min-width: 240px">
      <RightSide></RightSide>
    </div>
  </div>
  <ProgressBar></ProgressBar>
</template>

<style scoped>
.header {
  width: 100%;
  height: 40px;
  display: flex;
  background: var(--bg-secondary);
  align-items: center;
  justify-content: space-between;
}

.plugin-area {
  margin: 0;
}

</style>
