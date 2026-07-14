<template>
  <div class="h-full w-full flex flex-col bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 transition-colors duration-300">
    <router-view />

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
import { watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { useConnectionStore } from "@/stores";
import { uiSettings, applyUISettings, getEffectiveTheme, type Theme } from "@/settings/local";

const { locale, t } = useI18n();
const conn = useConnectionStore();

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
