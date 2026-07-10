<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { darkTheme, lightTheme } from "naive-ui";
import { getUISettings, saveUISettings, detectTauri, setupAppMenu } from "@/platform";

const { t } = useI18n();

const ui = getUISettings();

const theme = computed(() => {
  const t = ui.value.theme;
  if (t === "dark") return darkTheme;
  if (t === "light") return lightTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? darkTheme : lightTheme;
});

function applyThemeClass(t: string) {
  document.body.classList.remove("rosser-theme-light", "rosser-theme-dark");
  let resolved = t;
  if (resolved === "auto") {
    resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.body.classList.add(`rosser-theme-${resolved}`);
}

watch(() => ui.value.theme, (t) => {
  applyThemeClass(t);
  saveUISettings({ theme: t });
}, { immediate: true });

const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
mediaQuery.addEventListener("change", () => {
  if (ui.value.theme === "auto") {
    applyThemeClass("auto");
  }
});

onMounted(async () => {
  if (await detectTauri()) {
    await setupAppMenu(t("reload"));
  }
});
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  overscroll-behavior: none;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>
