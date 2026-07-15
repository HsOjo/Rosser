import { describe, it, expect } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import InputDialog from "@/components/InputDialog.vue";
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

describe("InputDialog", () => {
  it("renders title and input when visible", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(InputDialog, {
      props: {
        visible: true,
        title: "编辑分类",
        modelValue: "默认分类",
      },
      global: { plugins: [i18n] },
    });
    await flushPromises();

    expect(wrapper.text()).toContain("编辑分类");
    const input = wrapper.find("input");
    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).value).toBe("默认分类");
  });

  it("emits confirm with current value and closes", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(InputDialog, {
      props: {
        visible: true,
        title: "编辑分类",
        modelValue: "默认分类",
      },
      global: { plugins: [i18n] },
    });
    await flushPromises();

    const input = wrapper.find("input");
    await input.setValue("新分类");
    await wrapper.setProps({ modelValue: "新分类" });

    const confirmBtn = wrapper.findAll("button").find((b) => b.text().includes("确认"));
    expect(confirmBtn).toBeDefined();
    await confirmBtn!.trigger("click");
    await flushPromises();

    expect(wrapper.emitted("confirm")?.[0]).toEqual(["新分类"]);
    expect(wrapper.emitted("update:visible")?.[0]).toEqual([false]);
  });

  it("emits cancel and closes", async () => {
    const i18n = createTestI18n();
    const wrapper = mount(InputDialog, {
      props: {
        visible: true,
        title: "编辑分类",
        modelValue: "默认分类",
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
    const wrapper = mount(InputDialog, {
      props: {
        visible: false,
        title: "编辑分类",
        modelValue: "默认分类",
      },
      global: { plugins: [i18n] },
    });

    expect(wrapper.find(".fixed").exists()).toBe(false);
  });
});
