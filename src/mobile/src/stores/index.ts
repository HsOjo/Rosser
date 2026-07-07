import { defineStore } from "pinia";
import { ref } from "vue";
import { api, setBaseURL, setAuthToken, wsClient } from "@rosser/shared";

export const useConnectionStore = defineStore("connection", () => {
  const baseURL = ref("");
  const token = ref("");
  const isReady = ref(false);

  async function init() {
    const raw = localStorage.getItem("rosser_config");
    if (raw) {
      try {
        const cfg = JSON.parse(raw);
        if (cfg.baseURL && cfg.token) {
          baseURL.value = cfg.baseURL;
          token.value = cfg.token;
          setBaseURL(cfg.baseURL);
          setAuthToken(cfg.token);
          isReady.value = true;
          wsClient.connect(`${cfg.baseURL.replace(/^http/, "ws")}/ws`, cfg.token);
        }
      } catch {
        // ignore
      }
    }
  }

  async function connect(url: string, t: string) {
    baseURL.value = url;
    token.value = t;
    setBaseURL(url);
    setAuthToken(t);
    localStorage.setItem("rosser_config", JSON.stringify({ baseURL: url, token: t }));
    isReady.value = true;
    wsClient.connect(`${url.replace(/^http/, "ws")}/ws`, t);
  }

  function disconnect() {
    baseURL.value = "";
    token.value = "";
    isReady.value = false;
    wsClient.disconnect();
  }

  return { baseURL, token, isReady, init, connect, disconnect };
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

export const useSubscriptionStore = defineStore("subscription", () => {
  const subscriptions = ref<any[]>([]);

  async function fetchAll() {
    const { data } = await api.GET("/api/subscriptions");
    subscriptions.value = data || [];
  }

  return { subscriptions, fetchAll };
});
