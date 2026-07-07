import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { api, setBaseURL, setAuthToken, wsClient } from "@rosser/shared";
import { getPlatformConfig, savePlatformConfig, isTauri } from "@/platform";

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

  async function remove(id: string) {
    await api.DELETE("/api/subscriptions/{subscription_id}", { params: { path: { subscription_id: id } } });
    subscriptions.value = subscriptions.value.filter((s) => s.id !== id);
  }

  return { subscriptions, loading, fetchAll, create, remove };
});

export const useArticleStore = defineStore("article", () => {
  const articles = ref<any[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const page = ref(1);
  const size = ref(20);

  async function fetchList(params: Record<string, any> = {}) {
    loading.value = true;
    try {
      const { data } = await api.GET("/api/articles", { query: { page: page.value, size: size.value, ...params } });
      if (data) {
        articles.value = data.items;
        total.value = data.total;
      }
    } finally {
      loading.value = false;
    }
  }

  async function markRead(ids: string[]) {
    await api.POST("/api/articles/read", { body: { ids } });
    for (const art of articles.value) {
      if (ids.includes(art.id)) art.is_read = true;
    }
  }

  async function markStar(ids: string[]) {
    await api.POST("/api/articles/star", { body: { ids } });
    for (const art of articles.value) {
      if (ids.includes(art.id)) art.is_star = true;
    }
  }

  return { articles, total, loading, page, size, fetchList, markRead, markStar };
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

  async function remove(id: string) {
    await api.DELETE("/api/categories/{category_id}", { params: { path: { category_id: id } } });
    categories.value = categories.value.filter((c) => c.id !== id);
  }

  return { categories, fetchAll, create, remove };
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
