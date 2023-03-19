<template>
  <a-menu
      :style="{
        'min-width': sider_collapsed ? '80px' : '256px',
        'width': sider_collapsed ? '80px' : 'max-content',
      }"
      class="menu" mode="inline"
      @click="handleClick"
      :inline-collapsed="sider_collapsed"
  >
    <a-menu-item>
      <template #icon>
        <home-outlined/>
      </template>
      <span class="menu-title">所有订阅</span>
    </a-menu-item>
    <template v-for="category in subscriptionsTree">
      <a-sub-menu
          :key="`category-${category.id}`"
          v-if="category && category.subscriptions.length">
        <template #icon>
          <NotificationOutlined/>
        </template>
        <template #title>{{ category.title }}</template>
        <Subscription :subscription="subscription" v-for="subscription in category.subscriptions"></Subscription>
      </a-sub-menu>
    </template>
  </a-menu>
</template>

<script lang="ts">
import Subscription from "@/components/sider/Subscription.vue";
import {BarsOutlined, HomeOutlined, NotificationOutlined} from "@ant-design/icons-vue";
import {computed} from "vue";
import lodash from "lodash";
import store from "@/plugins/store";

export default {
  name: "Menu",
  components: {
    Subscription,
    HomeOutlined,
    NotificationOutlined,
    BarsOutlined,
  },
  props: {
    categories: {type: Array<Object>},
    subscriptions: {type: Array<Object>},
  },
  setup(props) {
    const sider_collapsed = computed(() => store.getters.state.sider_collapsed)
    const subscriptionsTree = computed(() => {
      let category_default = {id: null, title: '（未分类）'}
      let _categories = lodash.cloneDeep(props.categories)
      _categories.push(category_default)
      let _categories_mapping = {}
      let _subscriptions = lodash.cloneDeep(props.subscriptions)

      _categories.map(category => {
        _categories_mapping[category.id] = category
        category.subscriptions = []
      })

      _subscriptions.map(subscription => {
        let category = _categories_mapping[subscription.category_id]
        category.subscriptions.push(subscription)
      })

      return _categories
    })
    const subscriptionsMapping = computed(() => {
      let mapping = {}
      props.subscriptions.map(subscription => mapping[subscription.id] = subscription)
      return mapping
    })

    function handleClick({key}) {
      store.commit('updateState', {subscription: subscriptionsMapping.value[key]})
    }

    return {
      sider_collapsed,
      handleClick,
      subscriptionsTree,
      subscriptionsMapping,
    }
  },
}
</script>

<style scoped>
.menu {
  background: #F7F8FA;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

.menu-title {
  text-indent: 8px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

:deep() .ant-menu.ant-menu-inline > .ant-menu-item {
  height: 32px;
  margin: 0;
}
</style>