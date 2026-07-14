import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { api } from "@rosser/shared";
import type { components } from "@rosser/shared/api";

export type SiteUpdate = components["schemas"]["SiteUpdate"];
export type SiteOut = components["schemas"]["SiteOut"];

export const useSiteStore = defineStore("site", () => {
  const sites = ref<SiteOut[]>([]);
  const loading = ref(false);

  async function fetchAll() {
    loading.value = true;
    try {
      const { data } = await api.GET("/api/sites");
      sites.value = data || [];
    } finally {
      loading.value = false;
    }
  }

  const byId = computed(() => {
    const map: Record<string, SiteOut> = {};
    for (const site of sites.value) {
      map[site.id] = site;
    }
    return map;
  });

  async function fetch(id: string) {
    const { data } = await api.GET("/api/sites/{site_id}", {
      params: { path: { site_id: id } },
    });
    if (data) {
      const idx = sites.value.findIndex((s) => s.id === id);
      if (idx >= 0) {
        sites.value[idx] = data;
      } else {
        sites.value.push(data);
      }
    }
    return data;
  }

  async function refreshFavicon(id: string) {
    const { data } = await api.POST("/api/sites/{site_id}/fetch", {
      params: { path: { site_id: id } },
    });
    if (data) {
      const idx = sites.value.findIndex((s) => s.id === id);
      if (idx >= 0) {
        sites.value[idx] = data;
      } else {
        sites.value.push(data);
      }
    }
    return data;
  }

  async function update(id: string, values: SiteUpdate) {
    const { data } = await api.PUT("/api/sites/{site_id}", {
      params: { path: { site_id: id } },
      body: {
        title: values.title ?? null,
        concurrency_limit: values.concurrency_limit,
      },
    });
    if (data) {
      const idx = sites.value.findIndex((s) => s.id === id);
      if (idx >= 0) {
        sites.value[idx] = data;
      } else {
        sites.value.push(data);
      }
    }
    return data;
  }

  function reset() {
    sites.value = [];
    loading.value = false;
  }

  return {
    sites,
    loading,
    fetchAll,
    fetch,
    refreshFavicon,
    update,
    byId,
    reset,
  };
});
