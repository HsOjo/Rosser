<script lang="ts">
import {AppstoreFilled, DatabaseFilled, EnvironmentFilled, GiftFilled, SettingFilled} from "@ant-design/icons-vue";
import {ref} from "vue";
import About from "@/components/content/settings/About.vue";
import Subscriptions from "@/components/content/settings/Subscriptions.vue";
import {mapGetters, useStore} from "vuex";
import Categories from "@/components/content/settings/Categories.vue";
import Sites from "@/components/content/settings/Sites.vue";
import SubscribeModal from "@/components/modal/SubscribeModal.vue";
import CategoryModal from "@/components/modal/CategoryModal.vue";
import General from "@/components/content/settings/General.vue";


export default {
  components: {
    SubscribeModal,
    CategoryModal,
    Subscriptions,
    Categories,
    Sites,
    About,
    General,
    DatabaseFilled,
    GiftFilled,
    EnvironmentFilled,
    AppstoreFilled,
    SettingFilled,
  },
  computed: {
    ...mapGetters(['state'])
  },
  setup(props) {
    const store = useStore()

    const tab_key = ref('general')

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
    :title="$t('settings.title')"
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
      <a-tab-pane key="general">
        <template #tab>
          <setting-filled/>
          {{ $t('settings.tabs.general') }}
        </template>
        <General></General>
      </a-tab-pane>
      <a-tab-pane key="subscriptions">
        <template #tab>
          <database-filled/>
          {{ $t('settings.tabs.subscriptions') }}
        </template>
        <Subscriptions></Subscriptions>
      </a-tab-pane>
      <a-tab-pane key="categories">
        <template #tab>
          <appstore-filled/>
          {{ $t('settings.tabs.categories') }}
        </template>
        <Categories></Categories>
      </a-tab-pane>
      <a-tab-pane key="sites">
        <template #tab>
          <environment-filled/>
          {{ $t('settings.tabs.sites') }}
        </template>
        <Sites></Sites>
      </a-tab-pane>
      <a-tab-pane key="about">
        <template #tab>
          <gift-filled/>
          {{ $t('settings.tabs.about') }}
        </template>
        <About></About>
      </a-tab-pane>
    </a-tabs>
  </a-drawer>
  <SubscribeModal></SubscribeModal>
  <CategoryModal></CategoryModal>
</template>

<style scoped>

</style>
