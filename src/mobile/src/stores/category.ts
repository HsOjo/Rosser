import { ref } from "vue";
import { defineStore } from "pinia";
import { api } from "@rosser/shared";
import type { components } from "@rosser/shared/api";

export type CategoryCreate = components["schemas"]["CategoryCreate"];
export type CategoryUpdate = components["schemas"]["CategoryUpdate"];
export type CategoryOut = components["schemas"]["CategoryOut"];

export const useCategoryStore = defineStore("category", () => {
  const categories = ref<CategoryOut[]>([]);
  const loading = ref(false);

  async function fetchAll() {
    loading.value = true;
    try {
      const { data } = await api.GET("/api/categories");
      categories.value = data || [];
    } finally {
      loading.value = false;
    }
  }

  async function create(cat: CategoryCreate) {
    const { data } = await api.POST("/api/categories", { body: cat });
    if (data) categories.value.push(data);
    return data;
  }

  async function update(id: string, cat: CategoryUpdate) {
    const { data } = await api.PUT("/api/categories/{category_id}", {
      params: { path: { category_id: id } },
      body: cat,
    });
    if (data) {
      const idx = categories.value.findIndex((c) => c.id === id);
      if (idx >= 0) categories.value[idx] = data;
    }
    return data;
  }

  async function remove(id: string) {
    await api.DELETE("/api/categories/{category_id}", {
      params: { path: { category_id: id } },
    });
    categories.value = categories.value.filter((c) => c.id !== id);
  }

  function reset() {
    categories.value = [];
    loading.value = false;
  }

  return { categories, loading, fetchAll, create, update, remove, reset };
});
