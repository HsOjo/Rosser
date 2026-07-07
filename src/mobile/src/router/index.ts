import { createRouter, createWebHistory } from "vue-router";
import { useConnectionStore } from "@/stores";

const routes = [
  { path: "/", component: () => import("@/views/Home.vue"), meta: { requiresAuth: true } },
  { path: "/onboarding", component: () => import("@/views/Onboarding.vue") },
  { path: "/article/:id", component: () => import("@/views/Article.vue"), meta: { requiresAuth: true } },
  { path: "/settings", component: () => import("@/views/Settings.vue"), meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const conn = useConnectionStore();
  if (!conn.isReady && to.path !== "/onboarding") {
    next("/onboarding");
  } else {
    next();
  }
});

export default router;
