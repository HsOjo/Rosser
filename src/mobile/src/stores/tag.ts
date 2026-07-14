import { ref } from "vue";
import { defineStore } from "pinia";
import { api } from "@rosser/shared";
import type { components } from "@rosser/shared/api";

export type TagCreate = components["schemas"]["TagCreate"];
export type TagUpdate = components["schemas"]["TagUpdate"];
export type TagOut = components["schemas"]["TagOut"];

export const useTagStore = defineStore("tag", () => {
  const tags = ref<TagOut[]>([]);
  const loading = ref(false);

  async function fetchAll() {
    loading.value = true;
    try {
      const { data } = await api.GET("/api/tags");
      tags.value = data || [];
    } finally {
      loading.value = false;
    }
  }

  async function create(tag: TagCreate) {
    const { data } = await api.POST("/api/tags", { body: tag });
    if (data) tags.value.push(data);
    return data;
  }

  async function update(id: string, tag: TagUpdate) {
    const { data } = await api.PUT("/api/tags/{tag_id}", {
      params: { path: { tag_id: id } },
      body: tag,
    });
    if (data) {
      const idx = tags.value.findIndex((t) => t.id === id);
      if (idx >= 0) tags.value[idx] = data;
    }
    return data;
  }

  async function remove(id: string) {
    await api.DELETE("/api/tags/{tag_id}", {
      params: { path: { tag_id: id } },
    });
    tags.value = tags.value.filter((t) => t.id !== id);
  }

  async function tagArticle(articleId: string, tagIds: string[]) {
    await api.POST("/api/articles/{article_id}/tags", {
      params: { path: { article_id: articleId } },
      body: tagIds,
    });
  }

  async function untagArticle(articleId: string, tagId: string) {
    await api.DELETE("/api/articles/{article_id}/tags/{tag_id}", {
      params: { path: { article_id: articleId, tag_id: tagId } },
    });
  }

  function reset() {
    tags.value = [];
    loading.value = false;
  }

  return {
    tags,
    loading,
    fetchAll,
    create,
    update,
    remove,
    tagArticle,
    untagArticle,
    reset,
  };
});
