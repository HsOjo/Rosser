<script setup lang="ts">
import {computed, inject, onMounted, onUnmounted, ref, watch} from "vue";
import {AxiosInstanceKey} from "@/plugins/axios";
import Header from "@/components/header/Header.vue";
import Content from "@/components/content/Content.vue";
import Menu from "@/components/menu/Menu.vue";
import api from "@/utils/api";
import {useStore} from "vuex";
import {useBrowser} from "@/utils/browser";

api.axios = inject(AxiosInstanceKey)
const store = useStore()
const backend_loaded = ref(false)
const isMac = computed(() => store.getters.isMac);
useBrowser()

let notificationPollTimer: number | null = null
let autoRefreshTimer: number | null = null

api.axios.defaults.baseURL = store.getters.backendURL
function waitBackend(callback) {
  api.test().then(null, err => {
    if (err && err.response && err.response.status)
      callback()
    else
      setTimeout(() => waitBackend(callback), 1000)
  })
}

waitBackend(() => {
  backend_loaded.value = true
})

// 轮询通知未读数
function startNotificationPolling() {
  if (notificationPollTimer) clearInterval(notificationPollTimer)
  notificationPollTimer = setInterval(async () => {
    try {
      const resp = await api.basic.notification.unreadCount()
      store.commit('updateState', {unread_notification_count: resp.data.count})
    } catch (e) {
      // 忽略错误
    }
  }, 30000) // 每30秒轮询
}

// 定时自动刷新订阅
function startAutoRefresh() {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer)
  const interval = store.getters.state.settings.auto_refresh_interval
  if (interval > 0) {
    autoRefreshTimer = setInterval(async () => {
      try {
        await api.subscription.fetchExpires()
      } catch (e) {
        // 忽略错误
      }
    }, interval * 60 * 1000) // 转换为毫秒
  }
}

// 加载设置并启动定时器
async function initTimers() {
  try {
    const resp = await api.basic.settings.get()
    store.commit('updateState', {settings: resp.data})
  } catch (e) {
    // 使用默认设置
  }
  startNotificationPolling()
  startAutoRefresh()
}

// 监听设置变化，重新启动自动刷新
watch(() => store.getters.state.settings.auto_refresh_interval, () => {
  startAutoRefresh()
})

watch(backend_loaded, (nv) => {
  if (nv) {
    store.commit('refreshState')
    initTimers()
  }
})

onUnmounted(() => {
  if (notificationPollTimer) clearInterval(notificationPollTimer)
  if (autoRefreshTimer) clearInterval(autoRefreshTimer)
})

</script>
<template>
  <template v-if="backend_loaded">
    <transition enter-active-class="animate__animated animate__fadeInDown" appear>
      <Header></Header>
    </transition>
    <div class="parent-size body" :class="{'body-border': isMac}">
      <transition enter-active-class="animate__animated animate__fadeInLeft" appear>
        <Menu></Menu>
      </transition>
      <transition enter-active-class="animate__animated animate__zoomIn" appear>
        <Content ref="content"></Content>
      </transition>
    </div>
  </template>
  <template v-else>
    <div class="parent-size center">
      <a-spin tip="Loading..."/>
    </div>
  </template>
</template>

<style scoped>
.parent-size {
  width: 100%;
  height: 100%;
}

.body {
  height: calc(100% - 40px);
  display: flex;
}

.body-border {
  border: #DEDEDE solid 1px;
  box-sizing: border-box;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.body-border > .ant-menu {
  border-bottom-left-radius: 10px;
}

.center {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
