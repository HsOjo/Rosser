import { createRouter, createWebHistory } from "vue-router";
import { useConnectionStore } from "@/stores";

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
  if (!conn.isReady && to.path !== "/onboarding") {
    next("/onboarding");
  } else if (conn.isReady && to.path === "/onboarding") {
    next("/");
  } else {
    next();
  }
});

export default router;
