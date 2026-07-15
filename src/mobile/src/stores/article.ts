import { ref } from "vue";
import { defineStore } from "pinia";
import { api } from "@rosser/shared";
import type { paths, components } from "@rosser/shared/api";

export type ArticleListQuery = NonNullable<
  paths["/api/articles"]["get"]["parameters"]["query"]
>;

export const useArticleStore = defineStore("article", () => {
  const articles = ref<components["schemas"]["ArticleListItem"][]>([]);
  const total = ref(0);
  const loading = ref(false);
  const page = ref(1);
  const size = ref(20);
  const lastParams = ref<ArticleListQuery>({});
  const loadMoreError = ref(false);

  async function fetchList(params: ArticleListQuery = {}, append = false) {
    if (!append) page.value = 1;
    loading.value = true;
    lastParams.value = params;
    try {
      const { data } = await api.GET("/api/articles", {
        params: {
          query: { page: page.value, size: size.value, ...params },
        },
      });
      if (data) {
        if (append) {
          articles.value.push(...data.items);
        } else {
          articles.value = data.items;
        }
        total.value = data.total;
      }
    } finally {
      loading.value = false;
    }
  }

  async function refresh() {
    await fetchList(lastParams.value);
  }

  async function loadMore() {
    if (loadMoreError.value) loadMoreError.value = false;
    page.value += 1;
    try {
      await fetchList(lastParams.value, true);
    } catch {
      loadMoreError.value = true;
      page.value -= 1;
    }
  }

  async function retryLoadMore() {
    if (!loadMoreError.value) return;
    await loadMore();
  }

  async function markRead(ids: string[]) {
    await api.POST("/api/articles/read", { body: { ids } });
    for (const art of articles.value) {
      if (ids.includes(art.id)) art.is_read = true;
    }
  }

  async function markUnread(ids: string[]) {
    await api.POST("/api/articles/unread", { body: { ids } });
    for (const art of articles.value) {
      if (ids.includes(art.id)) art.is_read = false;
    }
  }

  async function markHide(ids: string[]) {
    await api.POST("/api/articles/hide", { body: { ids } });
    for (const art of articles.value) {
      if (ids.includes(art.id)) art.is_hide = true;
    }
  }

  async function markUnhide(ids: string[]) {
    await api.POST("/api/articles/unhide", { body: { ids } });
    for (const art of articles.value) {
      if (ids.includes(art.id)) art.is_hide = false;
    }
  }

  async function markStar(ids: string[]) {
    const toStar = ids.filter(
      (id) => !articles.value.find((a) => a.id === id)?.is_star
    );
    const toUnstar = ids.filter(
      (id) => articles.value.find((a) => a.id === id)?.is_star
    );
    if (toStar.length > 0) {
      await api.POST("/api/articles/star", { body: { ids: toStar } });
      for (const art of articles.value) {
        if (toStar.includes(art.id)) art.is_star = true;
      }
    }
    if (toUnstar.length > 0) {
      await api.POST("/api/articles/unstar", { body: { ids: toUnstar } });
      for (const art of articles.value) {
        if (toUnstar.includes(art.id)) art.is_star = false;
      }
    }
  }

  async function fetchOne(id: string) {
    const { data } = await api.GET("/api/articles/{article_id}", {
      params: { path: { article_id: id } },
    });
    return data;
  }

  function reset() {
    articles.value = [];
    total.value = 0;
    loading.value = false;
    loadMoreError.value = false;
    page.value = 1;
    size.value = 20;
    lastParams.value = {};
  }

  return {
    articles,
    total,
    loading,
    loadMoreError,
    page,
    size,
    lastParams,
    fetchList,
    refresh,
    loadMore,
    retryLoadMore,
    markRead,
    markUnread,
    markHide,
    markUnhide,
    markStar,
    fetchOne,
    reset,
  };
});
