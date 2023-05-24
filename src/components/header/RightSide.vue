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
  <a-dropdown :trigger="['click']">
    <IconButton class="hover-rotate-y">
      <bell-filled/>
    </IconButton>
    <template #overlay>
      <a-empty style="text-align: center; padding: 16px"/>
    </template>
  </a-dropdown>
  <a-dropdown :trigger="['click']">
    <IconButton class="hover-rotate-x">
      <eye-filled/>
    </IconButton>
    <template #overlay>
      <CheckMenu :items="view_menu_items" @click="viewClick"></CheckMenu>
    </template>
  </a-dropdown>
  <IconButton class="hover-rotate"
              @click="toggleSettingsVisible"
              :class="{'mac-top-right-radius': isMac}">
    <setting-filled/>
  </IconButton>
</template>

<script>
import {
  BellFilled,
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
} from "@ant-design/icons-vue";
import {useStore} from "vuex";
import IconButton from "@/components/header/IconButton.vue";
import CheckMenu from "@/components/common/CheckMenu.vue";
import api from "@/utils/api";


export default {
  name: "RightSide",
  components: {
    CheckMenu,
    IconButton,
    BellFilled,
    EyeFilled,
    RedoOutlined,
    ScheduleFilled,
    SettingFilled,
    CheckOutlined,
    SyncOutlined,
  },
  setup() {
    const store = useStore()
    const isMac = store.getters.isMac
    const view_menu_items = [
      {key: 'filters', title: '筛选', items: [], select: true, icon: FilterOutlined},
      {group: 'filters', key: 'all', title: '查看所有', icon: ContainerOutlined, checked: true},
      {group: 'filters', key: 'read-only', title: '仅已读', icon: CarryOutOutlined},
      {group: 'filters', key: 'star-only', title: '仅收藏', icon: StarOutlined},
      {group: 'filters'},
      {group: 'filters', key: 'show-hide', title: '显示隐藏', select: null, icon: EyeOutlined},
      {key: 'orders', title: '排序', items: [], icon: OrderedListOutlined},
      {
        group: 'orders',
        select: 'time-order',
        key: 'time-desc',
        value: 'desc',
        title: '时间降序',
        icon: SortDescendingOutlined,
        checked: true,
      },
      {
        group: 'orders',
        select: 'time-order',
        key: 'time-asc',
        value: 'asc',
        title: '时间升序',
        icon: SortAscendingOutlined,
      },
      {group: 'orders'},
      {group: 'orders', key: 'star-first', title: '收藏优先', icon: StarFilled},
    ]
    const read_menu_items = [
      {key: 'read', title: '标记已读', items: [], trigger: true, icon: CarryOutOutlined},
      {group: 'read', key: '1-days-before', title: '1⃣️ 天前发布', days: 1},
      {group: 'read', key: '3-days-before', title: '3⃣️ 天前发布', days: 3},
      {group: 'read', key: '7-days-before', title: '7⃣️ 天前发布', days: 7},
      {group: 'read', key: 'all', title: '💾 全部文章', days: 0},
    ]
    const fetch_menu_items = [
      {key: 'refresh', title: '重新加载', checkable: false, icon: RedoOutlined},
      {},
      {key: 'fetch', title: '抓取订阅', items: [], trigger: true, icon: CarryOutOutlined},
      {group: 'fetch', key: 'current', title: '当前订阅', icon: FileSearchOutlined},
      {group: 'fetch', key: 'expires', title: '过期订阅', icon: ExceptionOutlined},
      {group: 'fetch', key: 'all', title: '所有订阅', icon: FileDoneOutlined},
    ]

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
    }
  }
}
</script>

<style scoped>

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