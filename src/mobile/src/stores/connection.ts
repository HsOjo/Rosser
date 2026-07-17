import { ref } from "vue";
import { defineStore } from "pinia";
import { api, normalizeBaseURL, setBaseURL, setAuthToken, wsClient } from "@rosser/shared";
import { getPlatformConfig, savePlatformConfig } from "@/platform";
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
      const cfg = getPlatformConfig();
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
      const { response } = await api.GET("/api/auth/validate", { parseAs: "text" } as any);
      const status = (response as Response | undefined)?.status;
      if (status !== 200) {
        setBaseURL("");
        setAuthToken("");
        if (status === 401) {
          throw new Error("访问令牌无效");
        }
        throw new Error(
          status ? `服务器返回错误: ${status}` : `无法连接到服务器: ${url}`
        );
      }
    } catch (e: any) {
      setBaseURL("");
      setAuthToken("");
      throw new Error(e.message || `无法连接到服务器: ${url}`);
    }

    baseURL.value = normalized;
    token.value = t;
    savePlatformConfig({ baseURL: normalized, token: t });
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
