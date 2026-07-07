import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";

import App from "./App.vue";
import router from "./router";

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem("rosser_locale") || "zh-CN",
  fallbackLocale: "en",
  messages: {
    "zh-CN": {
      appName: "Rosser",
      connect: "连接",
      baseURL: "服务器地址",
      token: "访问令牌",
      articles: "文章",
      subscriptions: "订阅",
      settings: "设置",
      noData: "暂无数据",
      loading: "加载中...",
      markRead: "标记已读",
      starred: "星标",
    },
    en: {
      appName: "Rosser",
      connect: "Connect",
      baseURL: "Server URL",
      token: "Access Token",
      articles: "Articles",
      subscriptions: "Subscriptions",
      settings: "Settings",
      noData: "No data",
      loading: "Loading...",
      markRead: "Mark Read",
      starred: "Starred",
    },
  },
});

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n);
app.mount("#app");
