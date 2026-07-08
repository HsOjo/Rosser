import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useArticleStore } from "../index";

vi.mock("@rosser/shared", () => ({
  api: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
  setBaseURL: vi.fn(),
  setAuthToken: vi.fn(),
  wsClient: { connect: vi.fn(), disconnect: vi.fn(), on: vi.fn() },
}));

import { api } from "@rosser/shared";

describe("useArticleStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should fetch articles", async () => {
    (api.GET as any).mockResolvedValue({
      data: { items: [{ id: "1", title: "T", is_read: false, is_star: false, is_hide: false }], total: 1 },
    });
    const store = useArticleStore();
    await store.fetchList();
    expect(store.articles.length).toBe(1);
    expect(store.total).toBe(1);
    expect(store.loading).toBe(false);
  });

  it("should mark read", async () => {
    (api.GET as any).mockResolvedValue({
      data: { items: [{ id: "1", title: "T", is_read: false, is_star: false, is_hide: false }], total: 1 },
    });
    (api.POST as any).mockResolvedValue({});
    const store = useArticleStore();
    await store.fetchList();
    await store.markRead(["1"]);
    expect(store.articles[0].is_read).toBe(true);
  });

  it("should toggle star", async () => {
    (api.GET as any).mockResolvedValue({
      data: { items: [{ id: "1", title: "T", is_read: false, is_star: false, is_hide: false }], total: 1 },
    });
    (api.POST as any).mockResolvedValue({});
    const store = useArticleStore();
    await store.fetchList();
    await store.markStar(["1"]);
    expect(store.articles[0].is_star).toBe(true);
    await store.markStar(["1"]);
    expect(store.articles[0].is_star).toBe(false);
  });
});
