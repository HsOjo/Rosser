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
import { computed, watch } from "vue";
import { darkTheme, lightTheme } from "naive-ui";
import { useSettingsStore } from "@/stores";

const settings = useSettingsStore();

const theme = computed(() => {
  const t = settings.settings?.theme || "auto";
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

function applyFontSize(size: string) {
  const map: Record<string, string> = {
    small: "14px",
    medium: "16px",
    large: "18px",
  };
  document.body.style.fontSize = map[size] || "16px";
}

watch(() => settings.settings?.theme, (t) => {
  if (t) applyThemeClass(t);
}, { immediate: true });

watch(() => settings.settings?.font_size, (s) => {
  if (s) applyFontSize(s);
}, { immediate: true });

const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
mediaQuery.addEventListener("change", () => {
  if (settings.settings?.theme === "auto") {
    applyThemeClass("auto");
  }
});
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
</style>
