<template>
  <a-dropdown :trigger="['click']">
    <IconButton class="hover-rotate">
      <sync-outlined style="font-weight: bolder"/>
    </IconButton>
    <template #overlay>
      <CheckMenu :items="fetch_menu_items" @click="fetchClick"></CheckMenu>
    </template>
  </a-dropdown>
  <a-dropdown :trigger="['click']">
    <IconButton class="hover-rotate-y">
      <schedule-filled/>
    </IconButton>
    <template #overlay>
      <CheckMenu :items="read_menu_items" @click="readClick"></CheckMenu>
    </template>
  </a-dropdown>
  <Notification ref="notificationRef"/>
  <a-dropdown :trigger="['click']">
    <IconButton class="hover-rotate-x">
      <eye-filled/>
    </IconButton>
    <template #overlay>
      <CheckMenu :items="view_menu_items" @click="viewClick"></CheckMenu>
    </template>
  </a-dropdown>
  <a-tooltip :title="viewMode === 'card' ? $t('article.viewList') : $t('article.viewCard')">
    <IconButton @click="toggleViewMode">
      <appstore-outlined v-if="viewMode === 'card'"/>
      <unordered-list-outlined v-else/>
    </IconButton>
  </a-tooltip>
  <IconButton class="hover-rotate"
              @click="toggleSettingsVisible"
              :class="{'mac-top-right-radius': isMac}">
    <setting-filled/>
  </IconButton>
</template>

<script>
import {
  AppstoreOutlined,
  CarryOutOutlined,
  CheckOutlined,
  ContainerOutlined,
  ExceptionOutlined,
  EyeFilled,
  EyeOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  FilterOutlined,
  OrderedListOutlined,
  RedoOutlined,
  ScheduleFilled,
  SettingFilled,
  SortAscendingOutlined,
  SortDescendingOutlined,
  StarFilled,
  StarOutlined,
  SyncOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons-vue";
import {useStore} from "vuex";
import {computed} from "vue";
import IconButton from "@/components/header/IconButton.vue";
import CheckMenu from "@/components/common/CheckMenu.vue";
import Notification from "@/components/header/right/Notification.vue";
import api from "@/utils/api";
import {useI18n} from "vue-i18n";


export default {
  name: "RightSide",
  components: {
    CheckMenu,
    IconButton,
    Notification,
    AppstoreOutlined,
    EyeFilled,
    RedoOutlined,
    ScheduleFilled,
    SettingFilled,
    CheckOutlined,
    SyncOutlined,
    UnorderedListOutlined,
  },
  setup() {
    const store = useStore()
    const {t} = useI18n()
    const isMac = store.getters.isMac

    const view_menu_items = computed(() => [
      {key: 'filters', title: t('header.filter'), items: [], select: true, icon: FilterOutlined},
      {group: 'filters', key: 'all', title: t('header.viewAll'), icon: ContainerOutlined, checked: true},
      {group: 'filters', key: 'read-only', title: t('header.readOnly'), icon: CarryOutOutlined},
      {group: 'filters', key: 'star-only', title: t('header.starOnly'), icon: StarOutlined},
      {group: 'filters'},
      {group: 'filters', key: 'show-hide', title: t('header.showHidden'), select: null, icon: EyeOutlined},
      {key: 'orders', title: t('header.sort'), items: [], icon: OrderedListOutlined},
      {
        group: 'orders',
        select: 'time-order',
        key: 'time-desc',
        value: 'desc',
        title: t('header.timeDesc'),
        icon: SortDescendingOutlined,
        checked: true,
      },
      {
        group: 'orders',
        select: 'time-order',
        key: 'time-asc',
        value: 'asc',
        title: t('header.timeAsc'),
        icon: SortAscendingOutlined,
      },
      {group: 'orders'},
      {group: 'orders', key: 'star-first', title: t('header.starFirst'), icon: StarFilled},
    ])

    const read_menu_items = computed(() => [
      {key: 'read', title: t('header.markRead'), items: [], trigger: true, icon: CarryOutOutlined},
      {group: 'read', key: '1-days-before', title: t('header.daysAgo', {days: 1}), days: 1},
      {group: 'read', key: '3-days-before', title: t('header.daysAgo', {days: 3}), days: 3},
      {group: 'read', key: '7-days-before', title: t('header.daysAgo', {days: 7}), days: 7},
      {group: 'read', key: 'all', title: t('header.allArticles'), days: 0},
    ])

    const fetch_menu_items = computed(() => [
      {key: 'refresh', title: t('header.reload'), checkable: false, icon: RedoOutlined},
      {},
      {key: 'fetch', title: t('header.fetchSubscription'), items: [], trigger: true, icon: CarryOutOutlined},
      {group: 'fetch', key: 'current', title: t('header.currentSubscription'), icon: FileSearchOutlined},
      {group: 'fetch', key: 'expires', title: t('header.expiredSubscription'), icon: ExceptionOutlined},
      {group: 'fetch', key: 'all', title: t('header.allSubscription'), icon: FileDoneOutlined},
    ])

    function fetchClick({key}) {
      if (key === 'current') {
        let subscription = store.getters.query.subscription
        let subscription_id = subscription && subscription.id
        if (subscription_id)
          api.subscription.fetch([subscription_id])
      } else if (key === 'expires') {
        api.subscription.fetchExpires()
      } else if (key === 'all') {
        api.subscription.fetchAll()
      } else if (key === 'refresh') {
        store.commit('updateQuery', {refresh: true})
      }
    }

    function toggleSettingsVisible() {
      store.commit('updateState', {settings_visible: !store.getters.state.settings_visible})
    }

    function viewClick({key, select, value, checked}) {
      let diff = {}
      if (select === 'time-order')
        diff.time_order = value
      else if (select === 'filters')
        diff.mode = value
      else {
        if (key === 'show-hide')
          diff.show_hide = checked
        else if (key === 'star-first')
          diff.star_first = checked
      }

      store.commit('updateQuery', diff)
    }

    function readClick({days}) {
      let subscription = store.getters.query.subscription
      let subscription_id = subscription && subscription.id
      api.article.readBeforeDays(subscription_id, days)
      store.commit('updateQuery', {refresh: true})
    }

    const viewMode = computed(() => store.getters.state.article_view_mode || 'card')

    function toggleViewMode() {
      const newMode = viewMode.value === 'card' ? 'list' : 'card'
      localStorage.setItem('article_view_mode', newMode)
      store.commit('updateState', {article_view_mode: newMode})
    }

    return {
      isMac,
      view_menu_items,
      read_menu_items,
      fetch_menu_items,
      toggleSettingsVisible,
      viewClick,
      fetchClick,
      readClick,
      viewMode,
      toggleViewMode,
    }
  }
}
</script>

<style scoped>
.mac-top-right-radius {
  border-top-right-radius: 10px !important;
}

.hover-rotate:hover > span {
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.hover-rotate-y:hover > span {
  animation: rotate-y 0.5s linear;
}

@keyframes rotate-y {
  from {
    transform: rotateY(0deg);
  }
  to {
    transform: rotateY(360deg);
  }
}

.hover-rotate-x:hover > span {
  animation: rotate-x 0.5s linear;
}

@keyframes rotate-x {
  from {
    transform: rotateX(0deg);
  }
  to {
    transform: rotateX(360deg);
  }
}
</style>
