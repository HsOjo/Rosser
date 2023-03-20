<template>
  <a-dropdown :trigger="['click']">
    <IconButton class="hover-rotate">
      <redo-outlined style="font-weight: bolder"/>
    </IconButton>
    <template #overlay>
      <a-menu>
        <a-menu-item-group>
          <template #title>抓取内容</template>
          <a-menu-item>当前订阅</a-menu-item>
          <a-menu-item>过期订阅</a-menu-item>
          <a-menu-item>所有订阅</a-menu-item>
        </a-menu-item-group>
      </a-menu>
    </template>
  </a-dropdown>
  <a-dropdown :trigger="['click']">
    <IconButton class="hover-rotate-y">
      <schedule-filled/>
    </IconButton>
    <template #overlay>
      <a-menu>
        <a-menu-item-group>
          <template #title>标记已读</template>
          <a-menu-item>全部</a-menu-item>
          <a-menu-item>1 天前</a-menu-item>
          <a-menu-item>3 天前</a-menu-item>
          <a-menu-item>7 天前</a-menu-item>
        </a-menu-item-group>
      </a-menu>
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
      <a-menu @click="viewClick">
        <a-menu-item-group>
          <template #title>筛选</template>
          <a-menu-item :key="mode.key" v-for="mode in query_modes">
            {{ mode.text }}
          </a-menu-item>
        </a-menu-item-group>
        <a-menu-item key="show-hide">显示隐藏</a-menu-item>
        <a-menu-item-group>
          <template #title>排序</template>
          <a-menu-item key="time-desc">时间降序</a-menu-item>
          <a-menu-item key="time-asc">时间升序</a-menu-item>
          <a-menu-item key="favourite-first">收藏优先</a-menu-item>
        </a-menu-item-group>
      </a-menu>
    </template>
  </a-dropdown>
  <IconButton class="hover-rotate"
              @click="toggleSettingsVisible"
              :class="{'mac-top-right-radius': isMac}">
    <setting-filled/>
  </IconButton>
</template>

<script>
import {BellFilled, EyeFilled, RedoOutlined, ScheduleFilled, SettingFilled} from "@ant-design/icons-vue";
import store from "@/plugins/store";
import {inject} from "vue";
import {AxiosInstanceKey} from "@/plugins/axios";
import IconButton from "@/components/header/IconButton.vue";

export default {
  name: "RightSide",
  components: {IconButton, BellFilled, EyeFilled, RedoOutlined, ScheduleFilled, SettingFilled},
  setup() {
    const isMac = store.getters.isMac
    const axios = inject(AxiosInstanceKey)
    const query_modes = [
      {key: 'all', text: '查看所有'},
      {key: 'read-only', text: '仅已读'},
      {key: 'favourite-only', text: '仅收藏'},
    ]

    function fetchSubscriptions() {
      let subscription = store.getters.query.subscription
      let subscription_id = subscription && subscription.id
      if (subscription_id)
        axios.post('/api/subscription/fetch', {ids: [subscription_id]})
      else
        axios.post('/api/subscription/fetch-all')
    }

    function toggleSettingsVisible() {
      store.commit('updateState', {settings_visible: !store.getters.state.settings_visible})
    }

    function viewClick({key}) {
      let query = store.getters.query

      let diff = {}
      if (query_modes.map(x => x.key).indexOf(key) !== -1)
        diff.mode = key
      else if (key === 'show-hide')
        diff.show_hide = !query.show_hide

      store.commit('updateQuery', diff)
    }

    return {
      isMac,
      query_modes,
      fetchSubscriptions,
      toggleSettingsVisible,
      viewClick,
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