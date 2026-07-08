import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createI18n } from "vue-i18n";
import { createRouter, createWebHistory } from "vue-router";
import Onboarding from "../../views/Onboarding.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: "/", component: { template: "<div></div>" } }],
});

const i18n = createI18n({
  legacy: false,
  locale: "zh-CN",
  messages: {
    "zh-CN": {
      connect: "连接",
      baseURL: "地址",
      token: "令牌",
      connectFailed: "失败",
      appName: "Rosser",
    },
  },
});

const DummyAppBar = { name: "VarAppBar", template: "<div><slot /></div>" };
const DummySpace = { name: "VarSpace", template: "<div><slot /></div>" };
const DummyInput = { name: "VarInput", template: '<input class="var-input" />' };
const DummyButton = { name: "VarButton", template: "<button><slot /></button>" };

describe("Onboarding.vue", () => {
  it("renders form elements", async () => {
    setActivePinia(createPinia());
    await router.push("/");
    await router.isReady();
    const wrapper = mount(Onboarding, {
      global: {
        plugins: [i18n, router],
        components: {
          VarAppBar: DummyAppBar,
          VarSpace: DummySpace,
          VarInput: DummyInput,
          VarButton: DummyButton,
        },
      },
    });
    expect(wrapper.findAll(".var-input").length).toBeGreaterThanOrEqual(2);
    expect(wrapper.text()).toContain("连接");
  });
});
