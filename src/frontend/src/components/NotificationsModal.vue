<template>
  <n-modal v-model:show="show" preset="card" style="width: 500px; max-height: 70vh" :title="t('notifications')" :content-style="{ maxHeight: 'calc(70vh - 120px)', overflow: 'auto' }">
    <n-spin :show="notificationStore.loading">
      <n-empty v-if="!notificationStore.loading && notificationStore.notifications.length === 0" :description="$t('noData')" />
      <n-list>
        <n-list-item
          v-for="n in notificationStore.notifications"
          :key="n.id"
          :class="{ unread: !n.is_read, read: n.is_read }"
          style="padding: 10px 16px; cursor: pointer;"
          @click="handleClick(n)"
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
import { relativeTime, renderNotification } from "@rosser/shared";

const props = defineProps<{ onNavigate?: (payload: { subscriptionId?: string }) => void }>();

const { t, locale } = useI18n();

const show = defineModel<boolean>("show", { default: false });
const notificationStore = useNotificationStore();

function renderTitle(n: any) {
  const params = { ...n.params };
  if (n.subscription_title && !params.subscription_title) {
    params.subscription_title = n.subscription_title;
  }
  return renderNotification(n.type, params, locale.value);
}

async function handleClick(n: any) {
  if (!n.is_read) {
    await notificationStore.markRead([n.id]);
  }
  const subscriptionId = n.subscription_id || n.params?.subscription_id;
  if (subscriptionId && props.onNavigate) {
    props.onNavigate({ subscriptionId });
  }
}

watch(show, (val) => {
  if (val) notificationStore.fetchAll();
});
</script>

<style scoped>
.unread {
  background-color: rgba(24, 160, 88, 0.08);
}

.read .n-thing :deep(.n-thing-header__title) {
  color: #999;
}

.read span {
  color: #bbb !important;
}
</style>
