import { describe, it, expect } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
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

describe("ConfirmDialog", () => {
  it("renders title, message and icon slot when visible", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        title: "删除",
        message: "确定要删除吗？",
      },
      slots: {
        icon: "<div data-testid='icon-slot'>Icon</div>",
      },
      global: { plugins: [i18n] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("删除");
    expect(wrapper.text()).toContain("确定要删除吗？");
    expect(wrapper.find('[data-testid="icon-slot"]').exists()).toBe(true);
  });

  it("emits confirm and closes when confirm button is clicked", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        title: "删除",
        message: "确定要删除吗？",
      },
      global: { plugins: [i18n] },
    });
    await flushPromises();

    const confirmBtn = wrapper.findAll("button").find((b) => b.text().includes("确认"));
    expect(confirmBtn).toBeDefined();
    await confirmBtn!.trigger("click");
    await flushPromises();

    expect(wrapper.emitted("confirm")).toHaveLength(1);
    expect(wrapper.emitted("update:visible")?.[0]).toEqual([false]);
  });

  it("emits cancel and closes when cancel button is clicked", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: true,
        title: "删除",
        message: "确定要删除吗？",
      },
      global: { plugins: [i18n] },
    });
    await flushPromises();

    const cancelBtn = wrapper.findAll("button").find((b) => b.text().includes("取消"));
    expect(cancelBtn).toBeDefined();
    await cancelBtn!.trigger("click");
    await flushPromises();

    expect(wrapper.emitted("cancel")).toHaveLength(1);
    expect(wrapper.emitted("update:visible")?.[0]).toEqual([false]);
  });

  it("does not render when visible is false", () => {
    const i18n = createTestI18n();
    const wrapper = mount(ConfirmDialog, {
      props: {
        visible: false,
        title: "删除",
        message: "确定要删除吗？",
      },
      global: { plugins: [i18n] },
    });

    expect(wrapper.find(".fixed").exists()).toBe(false);
  });
});
