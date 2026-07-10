import { createRouter, createWebHistory } from "vue-router";
import { useConnectionStore } from "@/stores";
import { hasUISettings } from "@/platform";

const routes = [
  {
    path: "/",
    component: () => import("@/views/Main.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/onboarding",
    component: () => import("@/views/Onboarding.vue"),
  },
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

  // The welcome flow is only required on first launch, when the user has not
  // yet configured the UI settings (language / theme).
  if (!hasUISettings()) {
    if (to.path !== "/onboarding") {
      return next("/onboarding");
    }
    return next();
  }

  // If the saved server is unreachable, stay on onboarding so the user can
  // reconnect instead of landing on a broken home page.
  if (!conn.isReady) {
    if (to.path !== "/onboarding") {
      return next("/onboarding");
    }
    return next();
  }

  if (conn.isReady && to.path === "/onboarding") {
    return next("/");
  }

  next();
});

export default router;
