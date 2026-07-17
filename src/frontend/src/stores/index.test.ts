import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useConnectionStore, useArticleStore, useSubscriptionStore } from "./index.js";

vi.mock("@/platform", () => ({
  getPlatformConfig: vi.fn(),
  savePlatformConfig: vi.fn(),
  isTauri: () => false,
  detectTauri: vi.fn().mockResolvedValue(false),
  openExternal: vi.fn(),
  sendNotification: vi.fn(),
}));

vi.mock("@rosser/shared", () => ({
  api: {
    GET: vi.fn().mockResolvedValue({ error: undefined, response: { status: 200 }, data: '{"status":"ok"}' }),
    POST: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
  },
  setBaseURL: vi.fn(),
  setAuthToken: vi.fn(),
  normalizeBaseURL: (url: string) => url.replace(/\/+$/, ""),
  wsClient: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
  },
}));

describe("stores", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe("useConnectionStore", () => {
    it("connect sets state and calls shared client", async () => {
      const { savePlatformConfig } = await import("@/platform");
      const { api, setBaseURL, setAuthToken, wsClient } = await import("@rosser/shared");
      const store = useConnectionStore();
      await store.connect("http://localhost:8000", "token-123");
      expect(store.baseURL).toBe("http://localhost:8000");
      expect(store.token).toBe("token-123");
      expect(store.isBuiltIn).toBe(false);
      expect(store.isReady).toBe(true);
      expect(setBaseURL).toHaveBeenCalledWith("http://localhost:8000");
      expect(setAuthToken).toHaveBeenCalledWith("token-123");
      expect(api.GET).toHaveBeenCalledWith("/api/health", expect.anything());
      expect(api.GET).toHaveBeenCalledWith("/api/auth/validate", expect.anything());
      expect(savePlatformConfig).toHaveBeenCalledWith({
        baseURL: "http://localhost:8000",
        token: "token-123",
        isBuiltIn: false,
      });
      expect(wsClient.connect).toHaveBeenCalledWith("ws://localhost:8000/ws", "token-123");
    });

    it("stops and reports server error when health returns non-200 status", async () => {
      const { api } = await import("@rosser/shared");
      vi.mocked(api.GET).mockResolvedValueOnce({ error: undefined, response: { status: 304 } } as any);
      const store = useConnectionStore();
      await expect(store.connect("http://localhost:1420", "token-123")).rejects.toThrow("服务器返回错误: 304");
    });

    it("stops and reports server error when health returns 200 HTML", async () => {
      const { api } = await import("@rosser/shared");
      vi.mocked(api.GET).mockResolvedValueOnce({ error: undefined, response: { status: 200 }, data: "<!DOCTYPE html>" } as any);
      const store = useConnectionStore();
      await expect(store.connect("http://localhost:1420", "token-123")).rejects.toThrow("服务器返回错误: 200");
    });

    it("reports invalid token when validate returns 401", async () => {
      const { api } = await import("@rosser/shared");
      vi.mocked(api.GET)
        .mockResolvedValueOnce({ error: undefined, response: { status: 200 }, data: '{"status":"ok"}' } as any)
        .mockResolvedValueOnce({ error: undefined, response: { status: 401 }, data: '{"detail":"Invalid token"}' } as any);
      const store = useConnectionStore();
      await expect(store.connect("http://localhost:8000", "token-123")).rejects.toThrow("访问令牌无效");
    });

    it("connect with built-in also saves platform config", async () => {
      const { savePlatformConfig } = await import("@/platform");
      const store = useConnectionStore();
      await store.connect("http://127.0.0.1:8000", "dev-token-change-me", true);
      expect(store.isBuiltIn).toBe(true);
      expect(savePlatformConfig).toHaveBeenCalledWith({
        baseURL: "http://127.0.0.1:8000",
        token: "dev-token-change-me",
        isBuiltIn: true,
      });
    });

    it("disconnect clears state", async () => {
      const { wsClient } = await import("@rosser/shared");
      const store = useConnectionStore();
      await store.connect("http://x", "t", true);
      store.disconnect();
      expect(store.isReady).toBe(false);
      expect(store.isBuiltIn).toBe(false);
      expect(store.baseURL).toBe("");
      expect(wsClient.disconnect).toHaveBeenCalled();
    });
  });

  describe("useArticleStore", () => {
    it("markRead updates local state", async () => {
      const { api } = await import("@rosser/shared");
      vi.mocked(api.POST).mockResolvedValue({} as any);
      const store = useArticleStore();
      store.articles = [
        { id: "a1", title: "A", is_read: false },
        { id: "a2", title: "B", is_read: false },
      ];
      await store.markRead(["a1"]);
      expect(api.POST).toHaveBeenCalledWith("/api/articles/read", { body: { ids: ["a1"] } });
      expect(store.articles[0].is_read).toBe(true);
      expect(store.articles[1].is_read).toBe(false);
    });

    it("markStar updates local state", async () => {
      const { api } = await import("@rosser/shared");
      vi.mocked(api.POST).mockResolvedValue({} as any);
      const store = useArticleStore();
      store.articles = [{ id: "a1", is_star: false }];
      await store.markStar(["a1"]);
      expect(store.articles[0].is_star).toBe(true);
    });
  });

  describe("useSubscriptionStore", () => {
    it("fetchAll populates subscriptions", async () => {
      const { api } = await import("@rosser/shared");
      vi.mocked(api.GET).mockResolvedValue({ data: [{ id: "s1", title: "Feed" }] } as any);
      const store = useSubscriptionStore();
      await store.fetchAll();
      expect(store.subscriptions).toHaveLength(1);
      expect(store.subscriptions[0].title).toBe("Feed");
    });

    it("remove filters out subscription", async () => {
      const { api } = await import("@rosser/shared");
      vi.mocked(api.DELETE).mockResolvedValue({} as any);
      const store = useSubscriptionStore();
      store.subscriptions = [{ id: "s1" }, { id: "s2" }];
      await store.remove("s1");
      expect(store.subscriptions).toHaveLength(1);
      expect(store.subscriptions[0].id).toBe("s2");
    });
  });
});
