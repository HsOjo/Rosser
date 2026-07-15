<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 transition-colors duration-300">
    <router-view v-slot="{ Component }">
      <transition
        :name="transitionName"
        mode="out-in"
      >
        <keep-alive include="Home">
          <component :is="Component" />
        </keep-alive>
      </transition>
    </router-view>

    <!-- Global backend initializing overlay -->
    <div
      v-if="conn.isInitializing"
      class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 dark:bg-zinc-900/95 p-6"
    >
      <div
        class="w-8 h-8 border-2 border-slate-200 dark:border-zinc-700 border-t-brand rounded-full animate-spin"
      />
      <p class="mt-4 text-sm font-medium text-slate-500 dark:text-zinc-400">
        {{ t("loading") }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useConnectionStore } from "@/stores";
import { uiSettings, applyUISettings, getEffectiveTheme, type Theme } from "@/settings/local";
import { useMotionSafe } from "@/composables/useMotionSafe";

const { locale, t } = useI18n();
const conn = useConnectionStore();
const router = useRouter();

// Initialize animation accessibility state
useMotionSafe();

const transitionName = ref("page-slide-forward");

router.beforeEach((to, from) => {
  const toDepth = typeof to.meta.depth === "number" ? to.meta.depth : 0;
  const fromDepth = typeof from.meta.depth === "number" ? from.meta.depth : 0;
  // 移动端回退（特别是 iOS 右滑返回）系统已经自带手势转场，
  // 自定义转场会让“上一页”再播放一次，并在 keep-alive 缓存后容易暂停在半路上，
  // 因此回退时禁用应用内转场，前进时保留。
  transitionName.value = toDepth < fromDepth ? "page-none" : "page-slide-forward";
});

onMounted(() => {
  locale.value = uiSettings.value.locale;
  applyUISettings();

  // Listen to system theme changes when theme is auto
  if (uiSettings.value.theme === "auto") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyUISettings();
    mediaQuery.addEventListener("change", handleChange);
    onUnmounted(() => mediaQuery.removeEventListener("change", handleChange));
  }
});

watch(
  () => uiSettings.value.locale,
  (val) => {
    locale.value = val;
  }
);

watch(
  () => uiSettings.value.theme as Theme,
  () => {
    applyUISettings();
  }
);
</script>
