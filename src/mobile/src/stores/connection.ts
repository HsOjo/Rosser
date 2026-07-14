import { ref } from "vue";
import { defineStore } from "pinia";
import { api, normalizeBaseURL, setBaseURL, setAuthToken, wsClient } from "@rosser/shared";
import { registerWebSocketHandlers } from "./ws";
import { resetAllStores } from "./reset";

export const useConnectionStore = defineStore("connection", () => {
  const baseURL = ref("");
  const token = ref("");
  const isReady = ref(false);
  const isInitializing = ref(false);
  const initError = ref("");

  async function init() {
    isInitializing.value = true;
    initError.value = "";
    try {
      const raw = localStorage.getItem("rosser_config");
      if (!raw) return;
      const cfg = JSON.parse(raw);
      if (cfg.baseURL && cfg.token) {
        await connect(cfg.baseURL, cfg.token);
      }
    } catch (e: any) {
      console.error("Failed to initialize connection:", e);
      initError.value = e.message || "初始化连接失败";
    } finally {
      isInitializing.value = false;
    }
  }

  async function connect(url: string, t: string) {
    resetAllStores();
    const normalized = normalizeBaseURL(url);
    setBaseURL(normalized);
    setAuthToken(t);

    try {
      const { error } = await api.GET("/api/health");
      if (error) throw error;
    } catch (e: any) {
      setBaseURL("");
      setAuthToken("");
      throw new Error(`无法连接到服务器: ${url}`);
    }

    baseURL.value = normalized;
    token.value = t;
    localStorage.setItem("rosser_config", JSON.stringify({ baseURL: normalized, token: t }));
    isReady.value = true;
    wsClient.connect(`${normalized.replace(/^http/, "ws")}/ws`, t);
    registerWebSocketHandlers();
  }

  function disconnect() {
    wsClient.disconnect();
    setBaseURL("");
    setAuthToken("");
    resetAllStores();
    baseURL.value = "";
    token.value = "";
    isReady.value = false;
  }

  return {
    baseURL,
    token,
    isReady,
    isInitializing,
    initError,
    init,
    connect,
    disconnect,
  };
});
