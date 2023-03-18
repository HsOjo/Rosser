<script setup lang="ts">
import {computed, inject, ref} from 'vue';
import {BarsOutlined, HomeOutlined, NotificationOutlined} from '@ant-design/icons-vue';
import lodash from 'lodash'
import store from "@/plugins/store";
import {AxiosInstanceKey} from "@/plugins/axios";

const props = defineProps({
  collapsed: Boolean
})

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

getAllCategories()
getAllSubscriptions()
</script>

<template>
  <a-menu
      :style="{
        'min-width': props.collapsed ? '80px' : '256px',
        'width': props.collapsed ? '80px' : 'max-content',
      }"
      class="menu" mode="inline"
      @click="handleClick"
      :inline-collapsed="props.collapsed"
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
        <a-menu-item
            :key="subscription.id"
            v-for="subscription in category.subscriptions"
        >
          <template #icon>
            <img :src="`${backendURL}/api/basic/file/download/${subscription.site.favicon_id}`"
                 v-if="subscription.site && subscription.site.favicon_id"
                 class="menu-icon" alt="icon"/>
            <bars-outlined v-else/>
          </template>
          <span class="menu-title">{{ subscription.title }}</span>
        </a-menu-item>
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

.menu-icon {
  width: 1rem;
  height: 1rem;
}

.menu-title {
  text-indent: 8px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/deep/ .ant-menu-sub.ant-menu-inline > .ant-menu-item, /deep/ .ant-menu-sub.ant-menu-inline > .ant-menu-submenu > .ant-menu-submenu-title {
  height: 32px;
  margin: 0;
}
</style>