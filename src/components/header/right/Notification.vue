<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useStore} from 'vuex'
import {BellFilled, CheckOutlined} from '@ant-design/icons-vue'
import api from '@/utils/api'
import IconButton from "@/components/header/IconButton.vue";

const store = useStore()
const loading = ref(false)

const notifications = computed(() => store.getters.state.notifications)
const unreadCount = computed(() => store.getters.state.unread_notification_count)

onMounted(async () => {
  await loadNotifications()
  await loadUnreadCount()
})

async function loadNotifications() {
  loading.value = true
  try {
    const resp = await api.basic.notification.all(null, [{field: 'create_time', operate: 'desc'}])
    store.commit('updateState', {notifications: resp.data.slice(0, 20)})
  } finally {
    loading.value = false
  }
}

async function loadUnreadCount() {
  const resp = await api.basic.notification.unreadCount()
  store.commit('updateState', {unread_notification_count: resp.data.count})
}

async function markRead(id: number) {
  await api.basic.notification.markRead([id])
  const updated = notifications.value.map(n =>
    n.id === id ? {...n, is_read: true} : n
  )
  store.commit('updateState', {
    notifications: updated,
    unread_notification_count: Math.max(0, unreadCount.value - 1)
  })
}

async function markAllRead() {
  await api.basic.notification.markAllRead()
  const updated = notifications.value.map(n => ({...n, is_read: true}))
  store.commit('updateState', {
    notifications: updated,
    unread_notification_count: 0
  })
}

function handleClick(notification: any) {
  if (!notification.is_read) {
    markRead(notification.id)
  }

  if (notification.subscription_id) {
    const subscription = store.getters.state.subscriptions.find(
      s => s.id === notification.subscription_id
    )
    if (subscription) {
      store.commit('updateQuery', {subscription})
    }
  }
}

function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`
  return date.toLocaleDateString()
}

defineExpose({loadNotifications, loadUnreadCount})
</script>

<template>
  <a-dropdown :trigger="['click']" placement="bottomRight">
    <a-badge :count="unreadCount" :offset="[-5, 5]" :overflow-count="99">
      <IconButton class="hover-rotate-y">
        <bell-filled/>
      </IconButton>
    </a-badge>
    <template #overlay>
      <div class="notification-panel">
        <div class="notification-header">
          <span>通知</span>
          <a-button type="link" size="small" @click="markAllRead" v-if="unreadCount > 0">
            <check-outlined/>
            全部已读
          </a-button>
        </div>
        <a-spin :spinning="loading">
          <div v-if="notifications.length" class="notification-list">
            <div
              v-for="item in notifications"
              :key="item.id"
              class="notification-item"
              :class="{'unread': !item.is_read}"
              @click="handleClick(item)"
            >
              <div class="notification-title">{{ item.title }}</div>
              <div class="notification-message">{{ item.message }}</div>
              <div class="notification-time">{{ formatTime(item.create_time) }}</div>
            </div>
          </div>
          <a-empty v-else description="暂无通知" style="padding: 24px"/>
        </a-spin>
      </div>
    </template>
  </a-dropdown>
</template>

<style scoped>
.notification-panel {
  width: 320px;
  max-height: 400px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 3px 6px -4px rgba(0, 0, 0, .12), 0 6px 16px 0 rgba(0, 0, 0, .08);
  overflow: hidden;
  color: rgba(0, 0, 0, 0.85);
}

.notification-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.notification-list {
  max-height: 340px;
  overflow-y: auto;
}

.notification-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.notification-item.unread {
  background-color: rgba(24, 144, 255, 0.1);
}

.notification-title {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(0, 0, 0, 0.85);
}

.notification-message {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-time {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.35);
  margin-top: 4px;
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
</style>
