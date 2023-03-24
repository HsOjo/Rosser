<script lang="ts">
import {DatabaseFilled, RobotFilled} from "@ant-design/icons-vue";
import {ref} from "vue";
import * as pywebview from "@/utils/pywebview.js";
import About from "@/components/content/settings/About.vue";
import Subscriptions from "@/components/content/settings/Subscriptions.vue";
import {mapGetters, useStore} from "vuex";
import api from "@/utils/api";


export default {
  components: {
    Subscriptions,
    About,
    DatabaseFilled,
    RobotFilled,
  },
  computed: {
    ...mapGetters(['state'])
  },
  setup(props) {
const store = useStore()

    const tab_key = ref('subscriptions')

    function onClose() {
      store.commit('updateState', {settings_visible: false})
    }

    function importOPML() {
      pywebview.api.create_file_dialog(
          0, '', false,
          null, ['OPML Files (*.opml)']).then(
          (paths) => {
            api.basic.importOPML(paths.pop())
          }
      )
    }

    return {
      pywebview,
      tab_key,
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
      :visible="state.settings_visible"
      :get-container="false"
      :mask="false"
      size="large"
      style="position: absolute;"
      @close="onClose"
  >
    <a-tabs v-model:activeKey="tab_key" tab-position="right">
      <a-tab-pane key="subscriptions">
        <template #tab>
          <database-filled/>
          订阅源
        </template>
        <Subscriptions></Subscriptions>
      </a-tab-pane>
      <a-tab-pane key="categories">
        <template #tab>
          <database-filled/>
          分类
        </template>
      </a-tab-pane>
      <a-tab-pane key="sites">
        <template #tab>
          <database-filled/>
          站点规则
        </template>
      </a-tab-pane>
      <a-tab-pane key="about">
        <template #tab>
          <robot-filled/>
          关于
        </template>
        <About></About>
      </a-tab-pane>
    </a-tabs>
  </a-drawer>
</template>

<style scoped>

</style>