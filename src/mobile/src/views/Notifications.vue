<template>
  <div>
    <var-app-bar :title="$t('notifications')" title-position="center">
      <template #left>
        <var-button text type="primary" @click="$router.back()">{{ $t('back') }}</var-button>
      </template>
      <template #right>
        <var-button text type="primary" size="small" @click="markAllRead">{{ $t('markAllRead') }}</var-button>
      </template>
    </var-app-bar>

    <var-list :loading="notifStore.loading" loading-text="">
      <var-cell
        v-for="n in notifStore.notifications"
        :key="n.id"
        :title="notificationTitle(n)"
        @click="readNotification(n)"
      >
        <template #description>
          <span style="font-size: 12px; color: #999;">{{ relativeTime(n.create_time) }}</span>
          <var-chip v-if="!n.is_read" type="primary" size="mini">{{ $t('new') }}</var-chip>
        </template>
      </var-cell>
    </var-list>

    <div v-if="!notifStore.loading && notifStore.notifications.length === 0" style="text-align: center; padding: 32px; color: #999;">
      {{ $t('noData') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { Snackbar } from "@varlet/ui";
import { useNotificationStore } from "@/stores";
import { relativeTime, renderNotification } from "@rosser/shared";

const notifStore = useNotificationStore();

function notificationTitle(n: any): string {
  return renderNotification(n.type, n.params, localStorage.getItem("rosser_locale") || "zh-CN");
}

async function readNotification(n: any) {
  if (!n.is_read) {
    try {
      await notifStore.markRead([n.id]);
    } catch {
      Snackbar.error("操作失败");
    }
  }
}

async function markAllRead() {
  try {
    await notifStore.markAllRead();
    Snackbar.success("已全部标记为已读");
  } catch {
    Snackbar.error("操作失败");
  }
}

onMounted(() => {
  notifStore.fetchAll();
});
</script>
