import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import naive from "naive-ui";

import App from "./App.vue";
import router from "./router";
import { useConnectionStore } from "@/stores";
import zhCN from "./locales/zh-CN.json";
import en from "./locales/en.json";

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem("rosser_locale") || "zh-CN",
  fallbackLocale: "en",
  messages: {
    "zh-CN": zhCN,
    en,
  },
});

const app = createApp(App);
app.use(createPinia());

const conn = useConnectionStore();
conn.init().then(() => {
  app.use(router);
  app.use(i18n);
  app.use(naive);
  app.mount("#app");
});
