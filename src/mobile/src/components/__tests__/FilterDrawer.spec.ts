import { describe, it, expect } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import FilterDrawer from "@/components/FilterDrawer.vue";
import zhCN from "@/locales/zh-CN.json";
import en from "@/locales/en.json";

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: "zh-CN",
    fallbackLocale: "en",
    messages: { "zh-CN": zhCN, en },
  });
}

describe("FilterDrawer", () => {
  it("renders sort field, direction and page size options", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(FilterDrawer, {
      props: {
        field: "publish_time",
        direction: "desc",
        pageSize: 20,
      },
      global: { plugins: [i18n] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("排序字段");
    expect(wrapper.text()).toContain("排序方向");
    expect(wrapper.text()).toContain("每页数量");
    expect(wrapper.text()).toContain("发布时间");
    expect(wrapper.text()).toContain("标题");
    expect(wrapper.text()).toContain("阅读时间");
    expect(wrapper.text()).toContain("升序");
    expect(wrapper.text()).toContain("降序");
  });

  it("emits update:field when a field button is clicked", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(FilterDrawer, {
      props: {
        field: "publish_time",
        direction: "desc",
        pageSize: 20,
      },
      global: { plugins: [i18n] },
    });
    await flushPromises();

    const titleBtn = wrapper.findAll("button").find((b) => b.text().includes("标题"));
    expect(titleBtn).toBeDefined();
    await titleBtn!.trigger("click");
    await flushPromises();

    expect(wrapper.emitted("update:field")?.[0]).toEqual(["title"]);
  });

  it("emits update:direction when a direction button is clicked", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(FilterDrawer, {
      props: {
        field: "publish_time",
        direction: "desc",
        pageSize: 20,
      },
      global: { plugins: [i18n] },
    });
    await flushPromises();

    const ascBtn = wrapper.findAll("button").find((b) => b.text().includes("升序"));
    expect(ascBtn).toBeDefined();
    await ascBtn!.trigger("click");
    await flushPromises();

    expect(wrapper.emitted("update:direction")?.[0]).toEqual(["asc"]);
  });

  it("emits update:pageSize when a page size button is clicked", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(FilterDrawer, {
      props: {
        field: "publish_time",
        direction: "desc",
        pageSize: 20,
      },
      global: { plugins: [i18n] },
    });
    await flushPromises();

    const sizeBtn = wrapper.findAll("button").find((b) => b.text() === "50");
    expect(sizeBtn).toBeDefined();
    await sizeBtn!.trigger("click");
    await flushPromises();

    expect(wrapper.emitted("update:pageSize")?.[0]).toEqual([50]);
  });

  it("disables sort controls when disabled is true", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(FilterDrawer, {
      props: {
        field: "publish_time",
        direction: "desc",
        pageSize: 20,
        disabled: true,
      },
      global: { plugins: [i18n] },
    });
    await flushPromises();

    const sortButtons = wrapper.findAll("button").filter((b) => {
      const text = b.text();
      return ["发布时间", "标题", "阅读时间", "升序", "降序"].includes(text);
    });
    expect(sortButtons.length).toBeGreaterThan(0);
    for (const btn of sortButtons) {
      expect(btn.attributes("disabled")).toBeDefined();
    }
  });
});
