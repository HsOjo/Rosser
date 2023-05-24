<script lang="ts">
import {AppstoreFilled, DatabaseFilled, EnvironmentFilled, GiftFilled} from "@ant-design/icons-vue";
import {ref} from "vue";
import About from "@/components/content/settings/About.vue";
import Subscriptions from "@/components/content/settings/Subscriptions.vue";
import {mapGetters, useStore} from "vuex";
import Categories from "@/components/content/settings/Categories.vue";
import Sites from "@/components/content/settings/Sites.vue";


export default {
  components: {
    Subscriptions,
    Categories,
    Sites,
    About,
    DatabaseFilled,
    GiftFilled,
    EnvironmentFilled,
    AppstoreFilled,
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

    return {
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
          <appstore-filled/>
          分类
        </template>
        <Categories></Categories>
      </a-tab-pane>
      <a-tab-pane key="sites">
        <template #tab>
          <environment-filled/>
          站点
        </template>
        <Sites></Sites>
      </a-tab-pane>
      <a-tab-pane key="about">
        <template #tab>
          <gift-filled/>
          关于
        </template>
        <About></About>
      </a-tab-pane>
    </a-tabs>
  </a-drawer>
</template>

<style scoped>

</style>