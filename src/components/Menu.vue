<script lang="ts">
import {computed, inject, onMounted, ref} from 'vue';
import lodash from 'lodash'
import store from "@/plugins/store";
import {AxiosInstanceKey} from "@/plugins/axios";
import {BarsOutlined, HomeOutlined, NotificationOutlined} from '@ant-design/icons-vue';
import Subscription from "@/components/menu/Subscription.vue";

export default {
  components: {
    Subscription,
    HomeOutlined,
    NotificationOutlined,
    BarsOutlined,
  },
  setup(props) {
    const axios = inject(AxiosInstanceKey)
    const backendURL = store.getters.backendURL
    const categories = ref<object[]>([]);
    const subscriptions = ref<object[]>([]);
    const subscriptionsTree = computed(() => {
      let category_default = {id: null, title: '（未分类）'}
      let _categories = lodash.cloneDeep(categories.value)
      _categories.push(category_default)
      let _categories_mapping = {}
      let _subscriptions = lodash.cloneDeep(subscriptions.value)

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
      subscriptions.value.map(subscription => mapping[subscription.id] = subscription)
      return mapping
    })

    const collapsed = ref(false)

    function getAllCategories() {
      axios.get('/api/category/all').then(
          resp => {
            categories.value = resp.data
          }
      )
    }

    function getAllSubscriptions() {
      axios.get('/api/subscription/all').then(
          resp => {
            subscriptions.value = resp.data
          }
      )
    }

    function handleClick({key}) {
      store.commit('openSubscription', subscriptionsMapping.value[key])
    }

    function toggleCollapse() {
      collapsed.value = !collapsed.value
    }

    onMounted(() => {
      getAllCategories()
      getAllSubscriptions()
    })

    return {
      collapsed,
      toggleCollapse,
      backendURL,
      subscriptionsTree,
      handleClick,
    }
  }
}
</script>

<template>
  <a-menu
      :style="{
        'min-width': collapsed ? '80px' : '256px',
        'width': collapsed ? '80px' : 'max-content',
      }"
      class="menu" mode="inline"
      @click="handleClick"
      :inline-collapsed="collapsed"
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

/deep/ .ant-menu.ant-menu-inline > .ant-menu-item {
  height: 32px;
  margin: 0;
}
</style>