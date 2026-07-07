<template>
  <n-config-provider :theme="theme">
    <router-view />
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { darkTheme, lightTheme } from "naive-ui";
import { useSettingsStore } from "@/stores";

const settings = useSettingsStore();

const theme = computed(() => {
  const t = settings.settings?.theme || "auto";
  if (t === "dark") return darkTheme;
  if (t === "light") return lightTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? darkTheme : lightTheme;
});
</script>
