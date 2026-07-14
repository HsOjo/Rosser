import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";

import "./style.css";

import App from "./App.vue";
import router from "./router";
import { useConnectionStore } from "./stores";
import { uiSettings, applyUISettings } from "./settings/local";

import zhCN from "./locales/zh-CN.json";
import en from "./locales/en.json";

const i18n = createI18n({
  legacy: false,
  locale: uiSettings.value.locale,
  fallbackLocale: "en",
  messages: {
    "zh-CN": zhCN,
    en,
  },
});

applyUISettings();

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n);
app.mount("#app");
