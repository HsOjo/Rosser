import { createApp } from "vue";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import naive from "naive-ui";

import App from "./App.vue";
import router from "./router";
import { useConnectionStore } from "@/stores";

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem("rosser_locale") || "zh-CN",
  fallbackLocale: "en",
  messages: {
    "zh-CN": {
      appName: "Rosser",
      all: "全部",
      unread: "未读",
      starred: "星标",
      hidden: "隐藏",
      categories: "分类",
      subscriptions: "订阅",
      articles: "文章",
      settings: "设置",
      addSubscription: "添加订阅",
      preview: "预览",
      fetch: "抓取",
      markRead: "标记已读",
      markAllRead: "全部已读",
      readBeforeDays: "N天前已读",
      search: "搜索",
      tags: "标签",
      notifications: "通知",
      noData: "暂无数据",
      loading: "加载中...",
      connect: "连接",
      baseURL: "服务器地址",
      token: "访问令牌",
      builtIn: "内建后端",
      remote: "远程连接",
      onboardingTitle: "欢迎使用 Rosser",
      onboardingDesc: "选择连接方式开始使用",
    },
    en: {
      appName: "Rosser",
      all: "All",
      unread: "Unread",
      starred: "Starred",
      hidden: "Hidden",
      categories: "Categories",
      subscriptions: "Subscriptions",
      articles: "Articles",
      settings: "Settings",
      addSubscription: "Add Subscription",
      preview: "Preview",
      fetch: "Fetch",
      markRead: "Mark Read",
      markAllRead: "Mark All Read",
      readBeforeDays: "Read before N days",
      search: "Search",
      tags: "Tags",
      notifications: "Notifications",
      noData: "No data",
      loading: "Loading...",
      connect: "Connect",
      baseURL: "Server URL",
      token: "Access Token",
      builtIn: "Built-in Backend",
      remote: "Remote Connection",
      onboardingTitle: "Welcome to Rosser",
      onboardingDesc: "Choose a connection method to get started",
    },
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
