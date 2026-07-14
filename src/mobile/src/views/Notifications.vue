<template>
  <div class="h-full flex flex-col bg-white dark:bg-zinc-900">
    <!-- Header -->
    <header
      class="px-3.5 py-2 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/40 shrink-0"
    >
      <div class="flex items-center gap-2">
        <button
          class="p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"
          data-testid="notifications-back"
          @click="$router.back()"
        >
          <component :is="ArrowBackOutline" class="w-5 h-5" />
          <span class="sr-only">{{ t("back") }}</span>
        </button>
        <span class="text-sm font-black text-slate-800 dark:text-zinc-100">
          {{ t("notifications") }}
        </span>
      </div>

      <button
        v-if="notifStore.notifications.some((n) => !n.is_read)"
        class="text-[10px] font-bold text-brand px-2 py-1 rounded-lg hover:bg-brand-light dark:hover:bg-brand/10 transition-colors"
        @click="markAllRead"
      >
        {{ t("markAllRead") }}
      </button>
    </header>

    <!-- List -->
    <div class="flex-1 overflow-y-auto px-4">
      <div
        v-if="notifStore.loading && notifStore.notifications.length === 0"
        class="py-12 text-center"
      >
        <div
          class="w-8 h-8 border-2 border-slate-200 dark:border-zinc-700 border-t-brand rounded-full animate-spin mx-auto"
        />
      </div>

      <div
        v-else-if="notifStore.notifications.length === 0"
        class="py-12 text-center text-slate-400 dark:text-zinc-500"
      >
        <component :is="NotificationsOutline" class="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
        <p class="text-xs">{{ t("noData") }}</p>
      </div>

      <div v-else class="divide-y divide-slate-100 dark:divide-zinc-800/40">
        <button
          v-for="notif in notifStore.notifications"
          :key="notif.id"
          class="w-full text-left py-3.5 flex gap-3 transition-colors"
          @click="handleClick(notif)"
        >
          <div
            class="w-2 h-2 mt-1.5 rounded-full shrink-0"
            :class="notif.is_read ? 'bg-slate-200 dark:bg-zinc-700' : 'bg-brand'"
          />
          <div class="flex-1 min-w-0 space-y-1">
            <h3
              class="text-xs font-bold"
              :class="notif.is_read ? 'text-slate-500 dark:text-zinc-400' : 'text-slate-800 dark:text-zinc-100'"
            >
              {{ renderText(notif) }}
            </h3>
            <div class="text-[9px] text-slate-400 dark:text-zinc-500 font-mono">
              {{ displayTime(notif.create_time) }}
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ArrowBackOutline, NotificationsOutline } from "@vicons/ionicons5";
import { renderNotification, relativeTime } from "@rosser/shared";
import { useNotificationStore } from "@/stores";
import type { NotificationOut } from "@/stores/notification";

const router = useRouter();
const { t, locale } = useI18n();
const notifStore = useNotificationStore();

onMounted(() => {
  notifStore.fetchAll({});
});

function renderText(notif: NotificationOut) {
  const params: Record<string, unknown> = { ...notif.params };
  if (notif.subscription_title) {
    params.subscription_title = notif.subscription_title;
  }
  return renderNotification(notif.type, params, locale.value);
}

function displayTime(iso: string | null) {
  return relativeTime(iso, locale.value);
}

async function handleClick(notif: NotificationOut) {
  if (!notif.is_read) {
    await notifStore.markRead([notif.id]);
  }
  if (notif.subscription_id) {
    router.push({ path: "/", query: { filter: "subscription", id: notif.subscription_id } });
  }
}

async function markAllRead() {
  await notifStore.markAllRead();
}
</script>
