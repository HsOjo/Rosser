<script lang="ts">
import {DatabaseFilled, RobotFilled} from "@ant-design/icons-vue";
import {ref} from "vue";
import * as pywebview from "@/utils/pywebview.js";
import About from "@/components/settings/About.vue";
import Subscriptions from "@/components/settings/Subscriptions.vue";

export default {
  components: {
    Subscriptions,
    About,
    DatabaseFilled,
    RobotFilled,
  },
  setup(props) {
    const visible = ref(false)
    const tab_key = ref('subscriptions')

    function toggleVisible() {
      visible.value = !visible.value
    }

    function onClose() {
      visible.value = false
    }

    return {
      pywebview,
      tab_key,
      visible,
      toggleVisible,
      onClose,
    }
  }
}
</script>

<template>
  <a-drawer
      title="设定"
      placement="right"
      :closable="true"
      :visible="visible"
      :get-container="false"
      :mask="false"
      size="large"
      style="position: absolute"
      @close="onClose"
  >
    <a-tabs v-model:activeKey="tab_key" tab-position="right">
      <a-tab-pane key="subscriptions">
        <template #tab>
        <span>
          <database-filled/> 订阅源
        </span>
        </template>
        <Subscriptions></Subscriptions>
      </a-tab-pane>
      <a-tab-pane key="about">
        <template #tab>
        <span>
          <robot-filled/> 关于
        </span>
        </template>
        <About></About>
      </a-tab-pane>
    </a-tabs>
  </a-drawer>
</template>

<style scoped>

</style>