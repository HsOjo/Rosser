<template>
  <n-modal v-model:show="show" preset="card" style="width: 500px; max-height: 70vh" :title="t('notifications')">
    <n-spin :show="notificationStore.loading">
      <n-empty v-if="!notificationStore.loading && notificationStore.notifications.length === 0" :description="$t('noData')" />
      <n-list>
        <n-list-item v-for="n in notificationStore.notifications" :key="n.id"
          :class="{ unread: !n.is_read }"
          style="padding: 10px 16px; cursor: pointer;"
          @click="markNotificationRead(n)"
        >
          <n-thing :title="renderTitle(n)" />
          <span style="font-size: 12px; color: #999">{{ relativeTime(n.create_time) }}</span>
        </n-list-item>
      </n-list>
    </n-spin>
    <template #footer>
      <n-space>
        <n-button size="small" @click="notificationStore.markAllRead">{{ t('markAllRead') }}</n-button>
        <n-button size="small" @click="show = false">{{ t('close') }}</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { watch } from "vue";
import { useI18n } from "vue-i18n";
import { useNotificationStore } from "@/stores";
import { relativeTime } from "@rosser/shared";

const { t } = useI18n();

const show = defineModel<boolean>("show", { default: false });
const notificationStore = useNotificationStore();

function renderTitle(n: any) {
  if (n.type === "articles.new") {
    return t('notificationNewArticles');
  }
  if (n.type === "task.progress") {
    return t('notificationTaskProgress', { name: n.params?.name || "" });
  }
  return n.type;
}

async function markNotificationRead(n: any) {
  if (!n.is_read) {
    await notificationStore.markRead([n.id]);
  }
}

watch(show, (val) => {
  if (val) notificationStore.fetchAll({ is_read: false });
});
</script>

<style scoped>
.unread {
  background-color: rgba(24, 160, 88, 0.08);
}
</style>
