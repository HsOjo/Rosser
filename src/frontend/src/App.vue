<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
      <n-dialog-provider>
        <div v-if="loading" class="backend-loading">
          <n-spin size="large" />
          <p>{{ t("loadingBackend") }}</p>
        </div>
        <router-view v-else />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { darkTheme, lightTheme } from "naive-ui";
import { useConnectionStore } from "@/stores";
import { getUISettings, saveUISettings, detectTauri, setupAppMenu, getEffectiveTheme } from "@/platform";
import { invoke } from "@tauri-apps/api/core";

const { t } = useI18n();
const conn = useConnectionStore();
const loading = computed(() => conn.isInitializing);

const ui = getUISettings();

const theme = computed(() => {
  return getEffectiveTheme(ui.value.theme) === "dark" ? darkTheme : lightTheme;
});

function applyThemeClass(t: string) {
  document.body.classList.remove("rosser-theme-light", "rosser-theme-dark");
  const resolved = getEffectiveTheme(t);
  document.body.classList.add(`rosser-theme-${resolved}`);
}

applyThemeClass(ui.value.theme);

watch(() => ui.value.theme, (t, oldT) => {
  applyThemeClass(t);
  if (oldT !== undefined) {
    saveUISettings({ theme: t });
  }
});

watch(() => ui.value.locale, (locale) => {
  detectTauri().then((isTauri) => {
    if (isTauri) {
      invoke("set_locale", { locale }).catch(console.error);
    }
  });
}, { immediate: true });

const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
mediaQuery.addEventListener("change", () => {
  if (ui.value.theme === "auto") {
    applyThemeClass("auto");
  }
});

onMounted(async () => {
  if (await detectTauri()) {
    await setupAppMenu(t("reload"), t("preferences"), t("developerTools"));
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

.backend-loading {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
</style>
