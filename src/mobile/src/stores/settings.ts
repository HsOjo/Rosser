import { ref } from "vue";
import { defineStore } from "pinia";
import { api } from "@rosser/shared";
import type { components } from "@rosser/shared/api";

export type SettingsOut = components["schemas"]["SettingsOut"];
export type SettingsUpdate = components["schemas"]["SettingsUpdate"];

export const useSettingsStore = defineStore("settings", () => {
  const settings = ref<SettingsOut | null>(null);

  async function fetch() {
    const { data } = await api.GET("/api/settings");
    settings.value = data || null;
  }

  async function update(vals: SettingsUpdate) {
    const { data } = await api.PUT("/api/settings", { body: vals });
    settings.value = data || null;
  }

  function reset() {
    settings.value = null;
  }

  return { settings, fetch, update, reset };
});
