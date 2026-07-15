import { createRouter, createWebHistory } from "vue-router";
import { useConnectionStore } from "@/stores";
import { hasUISettings } from "@/settings/local";

const routes = [
  { path: "/", component: () => import("@/views/Home.vue"), meta: { requiresAuth: true, depth: 0 } },
  { path: "/onboarding", component: () => import("@/views/Onboarding.vue"), meta: { depth: -1 } },
  { path: "/article/:id", component: () => import("@/views/Article.vue"), meta: { requiresAuth: true, depth: 1 } },
  { path: "/settings", component: () => import("@/views/Settings.vue"), meta: { requiresAuth: true, depth: 1 } },
  { path: "/notifications", component: () => import("@/views/Notifications.vue"), meta: { requiresAuth: true, depth: 1 } },
  { path: "/manage", component: () => import("@/views/Manage.vue"), meta: { requiresAuth: true, depth: 1 } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

let initGuarded = false;

router.beforeEach(async (to, _from, next) => {
  const conn = useConnectionStore();

  if (!initGuarded) {
    initGuarded = true;
    await conn.init();
  }

  if (!hasUISettings()) {
    if (to.path !== "/onboarding") {
      return next("/onboarding");
    }
    return next();
  }

  if (to.meta?.requiresAuth && !conn.isReady) {
    const redirect = to.path;
    return next(`/onboarding?redirect=${encodeURIComponent(redirect)}`);
  }

  if (to.path === "/onboarding" && conn.isReady) {
    return next("/");
  }

  next();
});

export default router;
