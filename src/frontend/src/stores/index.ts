import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { api, setBaseURL, setAuthToken, wsClient } from "@rosser/shared";
import { getPlatformConfig, savePlatformConfig, isTauri } from "@/platform";

let wsHandlersRegistered = false;

function registerWebSocketHandlers() {
  if (wsHandlersRegistered) return;
  wsHandlersRegistered = true;
  wsClient.on("articles.new", () => {
    const notifStore = useNotificationStore();
    notifStore.fetchUnreadCount();
  });
  wsClient.on("notification.new", () => {
    const notifStore = useNotificationStore();
    notifStore.fetchUnreadCount();
  });
  wsClient.on("task.progress", (data) => {
    console.log("task.progress", data);
  });
}

interface BuiltinBackendConfig {
  port: number;
  token: string;
}

// Fallback token used in dev mode where the backend is not bundled.
export const BUILTIN_TOKEN = "dev-token-change-me";

export const useConnectionStore = defineStore("connection", () => {
  const baseURL = ref("");
  const token = ref("");
  const isReady = ref(false);
  const isBuiltIn = ref(false);

  async function init() {
    try {
      const cfg = await getPlatformConfig();
      if (cfg.isBuiltIn && isTauri()) {
        if (import.meta.env.PROD) {
          // Desktop release builds bundle the backend; start it on demand.
          const builtin = await invoke<BuiltinBackendConfig>("start_builtin_backend");
          await connect(`http://127.0.0.1:${builtin.port}`, builtin.token, true);
        } else if (cfg.baseURL && cfg.token) {
          // Dev mode uses a fixed backend URL, restore the previous connection.
          await connect(cfg.baseURL, cfg.token, true);
        }
        return;
      }
      if (!cfg.baseURL && isTauri() && import.meta.env.PROD) {
        // Desktop release builds bundle the backend; start it on demand.
        const builtin = await invoke<BuiltinBackendConfig>("start_builtin_backend");
        await connect(`http://127.0.0.1:${builtin.port}`, builtin.token, true);
        return;
      }
      if (cfg.baseURL && cfg.token) {
        await connect(cfg.baseURL, cfg.token, cfg.isBuiltIn ?? false);
      }
    } catch (e) {
      console.error("Failed to initialize connection:", e);
    }
  }

  async function connect(url: string, t: string, builtIn = false) {
    // Clear stale data from any previous connection.
    resetAllStores();

    // Remote connections must be reachable before we switch to the main page.
    if (!builtIn) {
      setBaseURL(url);
      setAuthToken(t);
      let healthError: any = null;
      try {
        const { error } = await api.GET("/api/health");
        healthError = error;
      } catch (e) {
        healthError = e;
      }
      if (healthError) {
        setBaseURL("");
        setAuthToken("");
        throw new Error(`无法连接到服务器: ${url}`);
      }
    }

    baseURL.value = url;
    token.value = t;
    isBuiltIn.value = builtIn;
    setBaseURL(url);
    setAuthToken(t);
    savePlatformConfig({ baseURL: url, token: t, isBuiltIn: builtIn });
    isReady.value = true;
    wsClient.connect(`${url.replace(/^http/, "ws")}/ws`, t);
    registerWebSocketHandlers();
  }

  async function disconnect() {
    wsClient.disconnect();
    setBaseURL("");
    setAuthToken("");
    resetAllStores();
    baseURL.value = "";
    token.value = "";
    isReady.value = false;
    isBuiltIn.value = false;
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

  async function fetch(id: string) {
    const { data } = await api.GET("/api/subscriptions/{subscription_id}", { params: { path: { subscription_id: id } } });
    if (data) {
      const idx = subscriptions.value.findIndex((s) => s.id === id);
      if (idx >= 0) {
        subscriptions.value[idx] = data;
      } else {
        subscriptions.value.push(data);
      }
    }
    return data;
  }

  function reset() {
    subscriptions.value = [];
    loading.value = false;
  }

  return { subscriptions, loading, fetchAll, fetch, create, update, remove, reset };
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

  async function fetchOne(id: string) {
    const { data } = await api.GET("/api/articles/{article_id}", { params: { path: { article_id: id } } });
    return data;
  }

  function reset() {
    articles.value = [];
    total.value = 0;
    loading.value = false;
    page.value = 1;
    size.value = 20;
    lastParams.value = {};
  }

  return { articles, total, loading, page, size, lastParams, fetchList, fetchOne, refresh, markRead, markUnread, markHide, markUnhide, markStar, reset };
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

  function reset() {
    categories.value = [];
  }

  return { categories, fetchAll, create, update, remove, reset };
});

export const useSiteStore = defineStore("site", () => {
  const sites = ref<any[]>([]);
  const loading = ref(false);

  async function fetchAll() {
    loading.value = true;
    try {
      const { data } = await api.GET("/api/sites");
      sites.value = data || [];
    } finally {
      loading.value = false;
    }
  }

  const byId = computed(() => {
    const map: Record<string, any> = {};
    for (const site of sites.value) {
      map[site.id] = site;
    }
    return map;
  });

  async function fetch(id: string) {
    const { data } = await api.GET("/api/sites/{site_id}", { params: { path: { site_id: id } } });
    if (data) {
      const idx = sites.value.findIndex((s) => s.id === id);
      if (idx >= 0) {
        sites.value[idx] = data;
      } else {
        sites.value.push(data);
      }
    }
    return data;
  }

  async function refreshFavicon(id: string) {
    const { data } = await api.POST("/api/sites/{site_id}/fetch", { params: { path: { site_id: id } } });
    if (data) {
      const idx = sites.value.findIndex((s) => s.id === id);
      if (idx >= 0) {
        sites.value[idx] = data;
      } else {
        sites.value.push(data);
      }
    }
    return data;
  }

  async function update(id: string, values: { title?: string | null; concurrency_limit?: number | null }) {
    const { data } = await api.PUT("/api/sites/{site_id}", {
      params: { path: { site_id: id } },
      body: { title: values.title ?? null, concurrency_limit: values.concurrency_limit },
    });
    if (data) {
      const idx = sites.value.findIndex((s) => s.id === id);
      if (idx >= 0) {
        sites.value[idx] = data;
      } else {
        sites.value.push(data);
      }
    }
    return data;
  }

  function reset() {
    sites.value = [];
    loading.value = false;
  }

  return { sites, loading, fetchAll, fetch, refreshFavicon, update, byId, reset };
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

  function reset() {
    settings.value = null;
  }

  return { settings, fetch, update, reset };
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

  function reset() {
    notifications.value = [];
    unreadCount.value = 0;
    loading.value = false;
  }

  return { notifications, unreadCount, loading, fetchAll, fetchUnreadCount, markRead, markAllRead, reset };
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

  function reset() {
    tags.value = [];
    loading.value = false;
  }

  return { tags, loading, fetchAll, create, update, remove, tagArticle, untagArticle, reset };
});

function resetAllStores() {
  useSubscriptionStore().reset();
  useArticleStore().reset();
  useCategoryStore().reset();
  useSiteStore().reset();
  useSettingsStore().reset();
  useNotificationStore().reset();
  useTagStore().reset();
}
