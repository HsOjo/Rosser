<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
      <n-dialog-provider>
        <div v-if="loadingBackend" class="backend-loading">
          <n-spin size="large" />
          <p>{{ t("loadingBackend") }}</p>
        </div>
        <router-view v-else />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { darkTheme, lightTheme } from "naive-ui";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useConnectionStore } from "@/stores";
import { getUISettings, saveUISettings, detectTauri, setupAppMenu } from "@/platform";

const { t } = useI18n();
const loadingBackend = ref(false);
const conn = useConnectionStore();

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

  if (conn.isBuiltIn) {
    loadingBackend.value = true;
    try {
      if (await invoke("is_backend_ready")) {
        loadingBackend.value = false;
        return;
      }
      const unlisten = await listen("backend:ready", () => {
        loadingBackend.value = false;
        unlisten();
      });
    } catch (e) {
      console.error("Failed to wait for built-in backend:", e);
      loadingBackend.value = false;
    }
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
