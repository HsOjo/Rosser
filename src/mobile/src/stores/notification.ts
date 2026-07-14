import { ref } from "vue";
import { defineStore } from "pinia";
import { api } from "@rosser/shared";
import type { paths, components } from "@rosser/shared/api";

export type NotificationListQuery = NonNullable<
  paths["/api/notifications"]["get"]["parameters"]["query"]
>;
export type NotificationOut = components["schemas"]["NotificationOut"];

export const useNotificationStore = defineStore("notification", () => {
  const notifications = ref<NotificationOut[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);

  async function fetchAll(params: NotificationListQuery = {}) {
    loading.value = true;
    try {
      const { data } = await api.GET("/api/notifications", {
        params: { query: params },
      });
      notifications.value = data || [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchUnreadCount() {
    const { data } = await api.GET("/api/notifications/unread-count");
    unreadCount.value = typeof data === "number" ? data : 0;
  }

  async function markRead(ids: string[]) {
    await api.POST("/api/notifications/mark-read", { body: ids });
    for (const n of notifications.value) {
      if (ids.includes(n.id)) n.is_read = true;
    }
    await fetchUnreadCount();
  }

  async function markAllRead() {
    await api.POST("/api/notifications/mark-all-read");
    for (const n of notifications.value) {
      n.is_read = true;
    }
    unreadCount.value = 0;
  }

  function reset() {
    notifications.value = [];
    unreadCount.value = 0;
    loading.value = false;
  }

  return {
    notifications,
    unreadCount,
    loading,
    fetchAll,
    fetchUnreadCount,
    markRead,
    markAllRead,
    reset,
  };
});
