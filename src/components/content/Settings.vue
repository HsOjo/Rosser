<script lang="ts">
import {DatabaseFilled, RobotFilled} from "@ant-design/icons-vue";
import {computed, inject, ref} from "vue";
import * as pywebview from "@/utils/pywebview.js";
import About from "@/components/content/settings/About.vue";
import Subscriptions from "@/components/content/settings/Subscriptions.vue";
import {AxiosInstanceKey} from "@/plugins/axios";
import store from "@/plugins/store";

export default {
  components: {
    Subscriptions,
    About,
    DatabaseFilled,
    RobotFilled,
  },
  setup(props) {
    const axios = inject(AxiosInstanceKey)
    const settings_visible = computed(() => store.getters.state.settings_visible)
    const tab_key = ref('subscriptions')

    function onClose() {
      store.commit('updateState', {settings_visible: false})
    }

    function importOPML() {
      pywebview.api.create_file_dialog(
          0, '', false,
          null, ['OPML Files (*.opml)']).then(
          (paths) => {
            axios.post('/api/basic/import-opml', {path: paths.pop()})
          }
      )
    }

    return {
      pywebview,
      tab_key,
      settings_visible,
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
      :visible="settings_visible"
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