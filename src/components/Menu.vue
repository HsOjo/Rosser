<script setup lang="ts">
import {computed, ref} from 'vue';
import {NotificationOutlined} from '@ant-design/icons-vue';
import axios from "@/plugins/axios";
import lodash from 'lodash'
import store from "@/plugins/store";

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
  axios().get('/api/category/all').then(
      resp => {
        categories.value = resp.data
      }
  )
}

function getAllSubscriptions() {
  axios().get('/api/subscription/all').then(
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
      style="min-height: 100%; background: #F7F8FA"
      mode="inline"
      @click="handleClick"
  >
    <a-menu-item>
      所有订阅
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
          <div class="menu-item">
            <img :src="subscription.icon_url" class="menu-icon" alt="icon"/>
            <span class="menu-title">{{ subscription.title }}</span>
          </div>
        </a-menu-item>
      </a-sub-menu>
    </template>
  </a-menu>
</template>

<style scoped>
.menu-icon {
  width: 1rem;
  height: 1rem;
}

.menu-title {
  text-indent: 8px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.menu-item {
  display: flex;
  align-items: center;
  font-size: small;
}
</style>