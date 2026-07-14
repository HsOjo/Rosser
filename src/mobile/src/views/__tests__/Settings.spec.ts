import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createI18n } from "vue-i18n";
import { createRouter, createMemoryHistory } from "vue-router";
import Settings from "@/views/Settings.vue";
import { useTagStore } from "@/stores";
import zhCN from "@/locales/zh-CN.json";
import en from "@/locales/en.json";
import { setBaseURL, setAuthToken } from "@rosser/shared";

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: "zh-CN",
    fallbackLocale: "en",
    messages: { "zh-CN": zhCN, en },
  });
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/settings", component: Settings }],
  });
}

describe("Settings tag deletion", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("opens ConfirmDialog and removes tag on confirm", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any, init?: any) => {
      const url = typeof input === "string" ? input : input.url;
      const method = init?.method || "GET";
      if (method === "DELETE" && url.includes("/api/tags/tag-1")) {
        return new Response(null, { status: 204 });
      }
      if (url.includes("/api/tags")) {
        return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
    });

    const i18n = createTestI18n();
    const router = createTestRouter();
    const pinia = createPinia();
    setActivePinia(pinia);

    setBaseURL("http://localhost:8000");
    setAuthToken("test-token");

    const tagStore = useTagStore();
    vi.spyOn(tagStore, "fetchAll").mockResolvedValue();
    tagStore.tags = [
      { id: "tag-1", title: "T1", color: "#ff0000" },
      { id: "tag-2", title: "T2", color: "#00ff00" },
    ];

    const wrapper = mount(Settings, {
      global: { plugins: [i18n, router, pinia] },
    });

    await flushPromises();

    // Switch to tags tab
    const tabs = wrapper.findAll("button");
    const tagsTab = tabs.find((b) => b.text() === "标签");
    expect(tagsTab).toBeDefined();
    await tagsTab!.trigger("click");
    await flushPromises();

    // Click delete button for the first tag
    const deleteBtn = wrapper.findAll("button").find((b) => {
      const icon = b.findComponent({ name: "TrashOutline" });
      return icon.exists();
    });
    expect(deleteBtn).toBeDefined();
    await deleteBtn!.trigger("click");
    await flushPromises();

    // Confirm dialog should be visible
    expect(wrapper.text()).toContain("确定要删除吗？");

    // Click confirm
    const confirmBtn = wrapper.findAll("button").find((b) => b.text().includes("确认"));
    expect(confirmBtn).toBeDefined();
    await confirmBtn!.trigger("click");
    await flushPromises();

    expect(tagStore.tags).toHaveLength(1);
    expect(tagStore.tags[0].id).toBe("tag-2");
  });
});
