import { ref } from "vue";
import { defineStore } from "pinia";
import { api } from "@rosser/shared";
import type { components } from "@rosser/shared/api";

export type SubscriptionCreate = components["schemas"]["SubscriptionCreate"];
export type SubscriptionUpdate = components["schemas"]["SubscriptionUpdate"];
export type SubscriptionOut = components["schemas"]["SubscriptionOut"];

export const useSubscriptionStore = defineStore("subscription", () => {
  const subscriptions = ref<SubscriptionOut[]>([]);
  const loading = ref(false);

  async function fetchAll() {
    loading.value = true;
    try {
      const { data } = await api.GET("/api/subscriptions");
      subscriptions.value = data || [];
    } finally {
      loading.value = false;
    }
  }

  async function fetch(id: string) {
    const { data } = await api.GET("/api/subscriptions/{subscription_id}", {
      params: { path: { subscription_id: id } },
    });
    if (data) {
      const idx = subscriptions.value.findIndex((s) => s.id === id);
      if (idx >= 0) {
        subscriptions.value[idx] = data;
      } else {
        subscriptions.value.push(data);
      }
    }
    return data;
  }

  async function create(sub: SubscriptionCreate) {
    const { data } = await api.POST("/api/subscriptions", { body: sub });
    if (data) subscriptions.value.push(data);
    return data;
  }

  async function update(id: string, sub: SubscriptionUpdate) {
    const { data } = await api.PUT("/api/subscriptions/{subscription_id}", {
      params: { path: { subscription_id: id } },
      body: sub,
    });
    if (data) {
      const idx = subscriptions.value.findIndex((s) => s.id === id);
      if (idx >= 0) subscriptions.value[idx] = data;
    }
    return data;
  }

  async function remove(id: string) {
    await api.DELETE("/api/subscriptions/{subscription_id}", {
      params: { path: { subscription_id: id } },
    });
    subscriptions.value = subscriptions.value.filter((s) => s.id !== id);
  }

  async function preview(url: string) {
    const { data } = await api.POST("/api/subscriptions/preview", {
      body: { url },
    });
    return data;
  }

  async function fetchNow(ids: string[]) {
    const { data } = await api.POST("/api/subscriptions/fetch", {
      body: { ids },
    });
    return data;
  }

  async function fetchAllNow() {
    await api.POST("/api/subscriptions/fetch-all");
  }

  function reset() {
    subscriptions.value = [];
    loading.value = false;
  }

  return {
    subscriptions,
    loading,
    fetchAll,
    fetch,
    create,
    update,
    remove,
    preview,
    fetchNow,
    fetchAllNow,
    reset,
  };
});
