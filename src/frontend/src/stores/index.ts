import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api, setBaseURL, setAuthToken, wsClient } from "@rosser/shared";
import { getPlatformConfig, savePlatformConfig, isTauri } from "@/platform";

let wsHandlersRegistered = false;

function registerWebSocketHandlers() {
  if (wsHandlersRegistered) return;
  wsHandlersRegistered = true;
  wsClient.on("articles.new", () => {
    const artStore = useArticleStore();
    artStore.refresh();
  });
  wsClient.on("notification.new", () => {
    const notifStore = useNotificationStore();
    notifStore.fetchUnreadCount();
  });
  wsClient.on("task.progress", (data) => {
    console.log("task.progress", data);
  });
}

export const useConnectionStore = defineStore("connection", () => {
  const baseURL = ref("");
  const token = ref("");
  const isReady = ref(false);
  const isBuiltIn = ref(false);

  async function init() {
    const cfg = await getPlatformConfig();
    if (cfg.baseURL && cfg.token) {
      baseURL.value = cfg.baseURL;
      token.value = cfg.token;
      setBaseURL(cfg.baseURL);
      setAuthToken(cfg.token);
      isReady.value = true;
      wsClient.connect(`${cfg.baseURL.replace(/^http/, "ws")}/ws`, cfg.token);
      registerWebSocketHandlers();
    }
  }

  async function connect(url: string, t: string) {
    baseURL.value = url;
    token.value = t;
    setBaseURL(url);
    setAuthToken(t);
    savePlatformConfig({ baseURL: url, token: t });
    isReady.value = true;
    wsClient.connect(`${url.replace(/^http/, "ws")}/ws`, t);
    registerWebSocketHandlers();
  }

  async function disconnect() {
    baseURL.value = "";
    token.value = "";
    isReady.value = false;
    wsClient.disconnect();
  }

  return { baseURL, token, isReady, isBuiltIn, init, connect, disconnect };
});

export const useSubscriptionStore = defineStore("subscription", () => {
  const subscriptions = ref<any[]>([]);
  const loading = ref(false);

  async function fetchAll() {
    loading.value = true;
    try {
      const { data } = await api.GET("/api/subscriptions");
      subscriptions.value = data || [];
    } finally {
      loading.value = false;
    }
  }

  async function create(sub: any) {
    const { data } = await api.POST("/api/subscriptions", { body: sub });
    if (data) subscriptions.value.push(data);
    return data;
  }

  async function update(id: string, sub: any) {
    const { data } = await api.PUT("/api/subscriptions/{subscription_id}", { params: { path: { subscription_id: id } }, body: sub });
    if (data) {
      const idx = subscriptions.value.findIndex((s) => s.id === id);
      if (idx >= 0) subscriptions.value[idx] = data;
    }
    return data;
  }

  async function remove(id: string) {
    await api.DELETE("/api/subscriptions/{subscription_id}", { params: { path: { subscription_id: id } } });
    subscriptions.value = subscriptions.value.filter((s) => s.id !== id);
  }

  return { subscriptions, loading, fetchAll, create, update, remove };
});

export const useArticleStore = defineStore("article", () => {
  const articles = ref<any[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const page = ref(1);
  const size = ref(20);
  const lastParams = ref<Record<string, any>>({});

  async function fetchList(params: Record<string, any> = {}) {
    loading.value = true;
    lastParams.value = params;
    try {
      const { data } = await api.GET("/api/articles", { params: { query: { page: page.value, size: size.value, ...params } } });
      if (data) {
        articles.value = data.items;
        total.value = data.total;
      }
    } finally {
      loading.value = false;
    }
  }

  async function refresh() {
    await fetchList(lastParams.value);
  }

  async function markRead(ids: string[]) {
    await api.POST("/api/articles/read", { body: { ids } });
    for (const art of articles.value) {
      if (ids.includes(art.id)) art.is_read = true;
    }
  }

  async function markUnread(ids: string[]) {
    await api.POST("/api/articles/unread", { body: { ids } });
    for (const art of articles.value) {
      if (ids.includes(art.id)) art.is_read = false;
    }
  }

  async function markHide(ids: string[]) {
    await api.POST("/api/articles/hide", { body: { ids } });
    for (const art of articles.value) {
      if (ids.includes(art.id)) art.is_hide = true;
    }
  }

  async function markUnhide(ids: string[]) {
    await api.POST("/api/articles/unhide", { body: { ids } });
    for (const art of articles.value) {
      if (ids.includes(art.id)) art.is_hide = false;
    }
  }

  async function markStar(ids: string[]) {
    const toStar = ids.filter((id) => !articles.value.find((a) => a.id === id)?.is_star);
    const toUnstar = ids.filter((id) => articles.value.find((a) => a.id === id)?.is_star);
    if (toStar.length > 0) {
      await api.POST("/api/articles/star", { body: { ids: toStar } });
      for (const art of articles.value) {
        if (toStar.includes(art.id)) art.is_star = true;
      }
    }
    if (toUnstar.length > 0) {
      await api.POST("/api/articles/unstar", { body: { ids: toUnstar } });
      for (const art of articles.value) {
        if (toUnstar.includes(art.id)) art.is_star = false;
      }
    }
  }

  return { articles, total, loading, page, size, lastParams, fetchList, refresh, markRead, markUnread, markHide, markUnhide, markStar };
});

export const useCategoryStore = defineStore("category", () => {
  const categories = ref<any[]>([]);

  async function fetchAll() {
    const { data } = await api.GET("/api/categories");
    categories.value = data || [];
  }

  async function create(cat: any) {
    const { data } = await api.POST("/api/categories", { body: cat });
    if (data) categories.value.push(data);
    return data;
  }

  async function update(id: string, cat: any) {
    const { data } = await api.PUT("/api/categories/{category_id}", { params: { path: { category_id: id } }, body: cat });
    if (data) {
      const idx = categories.value.findIndex((c) => c.id === id);
      if (idx >= 0) categories.value[idx] = data;
    }
    return data;
  }

  async function remove(id: string) {
    await api.DELETE("/api/categories/{category_id}", { params: { path: { category_id: id } } });
    categories.value = categories.value.filter((c) => c.id !== id);
  }

  return { categories, fetchAll, create, update, remove };
});

export const useSettingsStore = defineStore("settings", () => {
  const settings = ref<any>(null);

  async function fetch() {
    const { data } = await api.GET("/api/settings");
    settings.value = data;
  }

  async function update(vals: any) {
    const { data } = await api.PUT("/api/settings", { body: vals });
    settings.value = data;
  }

  return { settings, fetch, update };
});

export const useNotificationStore = defineStore("notification", () => {
  const notifications = ref<any[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);

  async function fetchAll(params: Record<string, any> = {}) {
    loading.value = true;
    try {
      const { data } = await api.GET("/api/notifications", { params: { query: params } });
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

  return { notifications, unreadCount, loading, fetchAll, fetchUnreadCount, markRead, markAllRead };
});

export const useTagStore = defineStore("tag", () => {
  const tags = ref<any[]>([]);
  const loading = ref(false);

  async function fetchAll() {
    loading.value = true;
    try {
      const { data } = await api.GET("/api/tags");
      tags.value = data || [];
    } finally {
      loading.value = false;
    }
  }

  async function create(tag: any) {
    const { data } = await api.POST("/api/tags", { body: tag });
    if (data) tags.value.push(data);
    return data;
  }

  async function update(id: string, tag: any) {
    const { data } = await api.PUT("/api/tags/{tag_id}", { params: { path: { tag_id: id } }, body: tag });
    if (data) {
      const idx = tags.value.findIndex((t) => t.id === id);
      if (idx >= 0) tags.value[idx] = data;
    }
    return data;
  }

  async function remove(id: string) {
    await api.DELETE("/api/tags/{tag_id}", { params: { path: { tag_id: id } } });
    tags.value = tags.value.filter((t) => t.id !== id);
  }

  async function tagArticle(articleId: string, tagIds: string[]) {
    await api.POST("/api/articles/{article_id}/tags", { params: { path: { article_id: articleId } }, body: tagIds });
  }

  async function untagArticle(articleId: string, tagId: string) {
    await api.DELETE("/api/articles/{article_id}/tags/{tag_id}", { params: { path: { article_id: articleId, tag_id: tagId } } });
  }

  async function tagSubscription(subscriptionId: string, tagIds: string[]) {
    await api.POST("/api/subscriptions/{subscription_id}/tags", { params: { path: { subscription_id: subscriptionId } }, body: tagIds });
  }

  async function untagSubscription(subscriptionId: string, tagId: string) {
    await api.DELETE("/api/subscriptions/{subscription_id}/tags/{tag_id}", { params: { path: { subscription_id: subscriptionId, tag_id: tagId } } });
  }

  return { tags, loading, fetchAll, create, update, remove, tagArticle, untagArticle, tagSubscription, untagSubscription };
});
