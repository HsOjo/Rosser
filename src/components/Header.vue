<script lang="ts" setup>
import store from "@/plugins/store";
import {computed} from "vue";
import ControlArea from "@/components/header/ControlArea.vue";
import LeftSide from "@/components/header/LeftSide.vue";
import Title from "@/components/header/Title.vue";
import RightSide from "@/components/header/RightSide.vue";

const isMac = computed(() => store.getters.isMac)
</script>

<template>
  <div class="header">
    <ControlArea v-if="isMac"></ControlArea>
    <div class="plugin-area">
      <LeftSide></LeftSide>
    </div>
    <Title></Title>
    <div class="plugin-area" style="min-width: 200px">
      <RightSide></RightSide>
    </div>
  </div>
</template>

<style scoped>
.header {
  width: 100%;
  height: 40px;
  display: flex;
  background: #27282D;
  align-items: center;
  justify-content: space-between;
}

.plugin-area {
  margin: 0;
}

.mac-top-right-radius {
  border-top-right-radius: 10px !important;
}

</style>
