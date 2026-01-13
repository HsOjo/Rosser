<template>
  <a-menu
      :style="{
        'min-width': state.sider_collapsed ? '80px' : '256px',
        'width': state.sider_collapsed ? '80px' : 'max-content',
      }"
      class="menu" mode="inline"
      @click="handleClick"
      :inline-collapsed="state.sider_collapsed"
  >
    <a-menu-item>
      <template #icon>
        <home-outlined/>
      </template>
      <span class="menu-title">{{ $t('menu.allSubscriptions') }}</span>
    </a-menu-item>
    <template v-for="category in subscriptionsTree">
      <a-sub-menu
          :key="`category-${category.id}`"
          v-if="category && category.subscriptions && category.subscriptions.length">
        <template #icon>
          <NotificationOutlined/>
        </template>
        <template #title>{{ category.title }}</template>
        <Subscription v-bind="subscription" v-for="subscription in category.subscriptions"></Subscription>
      </a-sub-menu>
    </template>
  </a-menu>
</template>

<script lang="ts">
import Subscription from "@/components/menu/Item.vue";
import {BarsOutlined, HomeOutlined, NotificationOutlined} from "@ant-design/icons-vue";
import lodash from "lodash";
import {mapGetters, useStore} from "vuex";
import {useMappings} from "@/utils/data";
import {useI18n} from "vue-i18n";

export default {
  name: "Menu",
  components: {
    Subscription,
    HomeOutlined,
    NotificationOutlined,
    BarsOutlined,
  },
  computed: {
    ...mapGetters(['state']),
    subscriptionsTree() {
      let category_default = {id: null, title: this.$t('menu.uncategorized'), subscriptions: []}
      let _categories = lodash.cloneDeep(this.state.categories)
      _categories.push(category_default)
      let _categories_mapping = {}
      let _subscriptions = lodash.cloneDeep(this.state.subscriptions)

      _categories.map(category => {
        _categories_mapping[category.id] = category
        category.subscriptions = []
      })

      _subscriptions.map(subscription => {
        subscription.site = this.sitesMapping[subscription.site_id]
        let category = _categories_mapping[subscription.category_id] || category_default
        category.subscriptions.push(subscription)
      })

      return _categories
    },
  },
  methods: {
    handleClick({key}) {
      this.store.commit('updateQuery', {subscription: this.subscriptionsMapping[key]})
    }
  },
  setup() {
    const store = useStore()
    const {t} = useI18n()
    return {store, t, ...useMappings(store)}
  }
}
</script>

<style scoped>
.menu {
  background: var(--bg-menu);
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

.menu-title {
  text-indent: 8px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

>>> .ant-menu.ant-menu-inline > .ant-menu-item {
  height: 32px;
  margin: 0;
}
</style>