<template>
  <div class="h-full flex flex-col bg-white dark:bg-zinc-900">
    <!-- Header -->
    <header
      class="px-3.5 py-2 flex justify-between items-center bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800/40 shrink-0 z-20 select-none"
    >
      <div class="flex items-center gap-1.5 min-w-0 flex-1">
        <button
          class="w-8 h-8 rounded-lg bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-colors shrink-0"
          data-testid="menu-btn"
          @click="showDrawer = true"
        >
          <component :is="Menu" class="w-4 h-4" />
        </button>
        <button
          class="flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800/40 px-1.5 py-1 rounded-lg transition-colors text-left min-w-0"
          @click="showDrawer = true"
        >
          <img
            v-if="streamIconUrl"
            :src="streamIconUrl"
            alt=""
            class="w-4 h-4 rounded object-contain shrink-0"
            referrerpolicy="no-referrer"
            @error="streamIconUrl = ''"
          />
          <span
            v-else-if="streamTagColor"
            class="w-3 h-3 rounded-full shrink-0"
            :style="{ backgroundColor: streamTagColor }"
          />
          <component
            v-else-if="streamIcon"
            :is="streamIcon"
            class="w-3.5 h-3.5 shrink-0"
            :class="streamIconClass"
          />
          <span
            class="text-xs font-black text-slate-800 dark:text-zinc-100 truncate max-w-[100px]"
          >
            {{ streamTitle }}
          </span>
        </button>
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <button
          v-if="hasUnread"
          class="p-1.5 text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:text-brand hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1 transition-colors"
          @click="showMarkAllConfirm = true"
        >
          <component :is="Checkbox" class="w-3.5 h-3.5" />
        </button>

        <button
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          :class="
            showFilters
              ? 'bg-brand-light text-brand dark:bg-brand/10'
              : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800'
          "
          @click="showFilters = !showFilters"
        >
          <component :is="Options" class="w-4 h-4" />
        </button>

        <button
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          data-testid="search-btn"
          :class="
            showSearch
              ? 'bg-brand text-white hover:bg-brand-hover'
              : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800'
          "
          @click="showSearch = !showSearch"
        >
          <component :is="Search" class="w-4 h-4" />
        </button>

        <button
          class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-all"
          :class="{ 'animate-spin text-brand': artStore.loading && !loadingMore }"
          @click="refreshAll"
        >
          <component :is="Refresh" class="w-4 h-4" />
        </button>

        <button
          class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 relative"
          data-testid="notifications-btn"
          @click="$router.push('/notifications')"
        >
          <component :is="Notifications" class="w-4 h-4" />
          <span
            v-if="notifStore.unreadCount > 0"
            class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500 border border-white dark:border-zinc-900"
          />
        </button>

        <button
          class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400"
          data-testid="manage-btn"
          @click="$router.push('/manage')"
        >
          <component :is="Layers" class="w-4 h-4" />
        </button>

        <button
          class="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400"
          data-testid="settings-btn"
          @click="$router.push('/settings')"
        >
          <component :is="Settings" class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Search -->
    <div
      v-if="showSearch"
      class="px-4 py-2 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 overflow-hidden shrink-0 animate-slideDown"
    >
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="t('search')"
        class="w-full text-xs py-2 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 focus:border-brand outline-none"
      />
    </div>

    <!-- Filters -->
    <FilterDrawer
      v-if="showFilters"
      v-model="order"
      v-model:page-size="pageSize"
      class="shrink-0"
    />

    <!-- Article list -->
    <div ref="listRef" class="flex-1 overflow-y-auto px-4 relative">
      <div v-if="artStore.loading && artStore.articles.length === 0" class="py-12 text-center">
        <div
          class="w-8 h-8 border-2 border-slate-200 dark:border-zinc-700 border-t-brand rounded-full animate-spin mx-auto"
        />
      </div>

      <div v-else-if="artStore.articles.length === 0" class="py-12 text-center text-slate-400 dark:text-zinc-500">
        <component :is="Book" class="w-10 h-10 mx-auto text-slate-300 dark:text-zinc-700 mb-2" />
        <p class="text-xs max-w-[200px] mx-auto leading-relaxed">{{ t("noData") }}</p>
      </div>

      <div v-else class="divide-y divide-slate-100 dark:divide-zinc-800/40">
        <SwipeCell
          v-for="art in artStore.articles"
          :key="art.id"
          :actions="swipeActions(art)"
          @action="(key) => handleSwipeAction(art.id, key)"
        >
          <ArticleCell
            :art="art"
            @open="openArticle"
            @star="toggleStar"
            @hide="toggleHide"
          />
        </SwipeCell>

        <div ref="sentinelRef" class="py-4 flex items-center justify-center">
          <div
            v-if="loadingMore"
            class="w-5 h-5 border-2 border-slate-200 dark:border-zinc-700 border-t-brand rounded-full animate-spin"
          />
        </div>
      </div>
    </div>

    <!-- Nav drawer -->
    <NavDrawer
      v-if="showDrawer"
      :active-filter="filter.type"
      :active-filter-id="filter.id"
      @close="showDrawer = false"
      @add-feed="$router.push('/manage')"
      @select="onSelectFilter"
    />

    <!-- Mark all read confirm -->
    <div
      v-if="showMarkAllConfirm"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      @click.self="showMarkAllConfirm = false"
    >
      <div class="w-full max-w-[320px] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <div class="flex items-center gap-2 text-brand">
          <component :is="Checkbox" class="w-5 h-5 shrink-0" />
          <h4 class="text-sm font-bold text-slate-800 dark:text-zinc-100">
            {{ t("markAllRead") }}
          </h4>
        </div>
        <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
          {{ t("markAllReadConfirm") }}
        </p>
        <div class="flex gap-2 justify-end pt-1">
          <button
            class="px-4 py-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700/50 text-xs font-semibold text-slate-600 dark:text-zinc-300 rounded-xl transition-colors"
            @click="showMarkAllConfirm = false"
          >
            {{ t("cancel") }}
          </button>
          <button
            class="px-4 py-2 bg-brand hover:bg-brand-hover text-xs font-bold text-white rounded-xl flex items-center gap-1.5 shadow-md shadow-brand/10 active:scale-[0.98] transition-all"
            @click="markAllRead"
          >
            <component :is="Checkmark" class="w-3.5 h-3.5" />
            {{ t("confirm") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
} from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  Menu,
  Search,
  Refresh,
  Notifications,
  Settings,
  Layers,
  Star,
  EyeOff,
  MailOpen,
  Book,
  Options,
  Checkbox,
  Checkmark,
  Folder,
  Globe,
  Newspaper,
} from "@vicons/ionicons5";
import {
  useArticleStore,
  useSubscriptionStore,
  useCategoryStore,
  useSiteStore,
  useTagStore,
  useNotificationStore,
  useConnectionStore,
} from "@/stores";
import type { ArticleListQuery } from "@/stores/article";
import ArticleCell from "@/components/ArticleCell.vue";
import SwipeCell from "@/components/SwipeCell.vue";
import FilterDrawer from "@/components/FilterDrawer.vue";
import NavDrawer, { type FilterType } from "@/components/NavDrawer.vue";
import { api, buildFileUrl } from "@rosser/shared";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const artStore = useArticleStore();
const subStore = useSubscriptionStore();
const catStore = useCategoryStore();
const siteStore = useSiteStore();
const tagStore = useTagStore();
const notifStore = useNotificationStore();
const conn = useConnectionStore();

const showDrawer = ref(false);
const showSearch = ref(false);
const showFilters = ref(false);
const showMarkAllConfirm = ref(false);
const searchQuery = ref("");
const sentinelRef = ref<HTMLDivElement | null>(null);
const listRef = ref<HTMLDivElement | null>(null);
const loadMoreObserver = ref<IntersectionObserver | null>(null);
type SortOrder = NonNullable<ArticleListQuery["order"]>;

const order = ref<SortOrder>("publish_time desc");
const pageSize = ref(20);
const loadingMore = ref(false);

const filter = ref<{ type: FilterType; id: string | null }>({ type: "unread", id: null });

const streamTitle = computed(() => {
  switch (filter.value.type) {
    case "unread":
      return t("unread");
    case "starred":
      return t("starred");
    case "hidden":
      return t("hidden");
    case "subscription": {
      const sub = subStore.subscriptions.find((s) => s.id === filter.value.id);
      return sub?.title || t("subscriptions");
    }
    case "category": {
      const cat = catStore.categories.find((c) => c.id === filter.value.id);
      return cat?.title || t("categories");
    }
    case "site": {
      const site = siteStore.sites.find((s) => s.id === filter.value.id);
      return site?.title || site?.url || t("sites");
    }
    case "tag": {
      const tag = tagStore.tags.find((t) => t.id === filter.value.id);
      return tag?.title || t("tags");
    }
    default:
      return t("all");
  }
});

const streamIcon = computed(() => {
  switch (filter.value.type) {
    case "unread":
      return MailOpen;
    case "starred":
      return Star;
    case "hidden":
      return EyeOff;
    case "category":
      return Folder;
    case "site":
      return streamIconUrl.value ? null : Globe;
    case "subscription":
      return streamIconUrl.value ? null : Newspaper;
    case "tag":
      return null;
    default:
      return Book;
  }
});

const streamIconClass = computed(() => {
  switch (filter.value.type) {
    case "starred":
      return "text-amber-500";
    case "unread":
      return "text-blue-500 dark:text-blue-400";
    default:
      return "text-slate-500 dark:text-zinc-400";
  }
});

const streamTagColor = computed(() => {
  if (filter.value.type !== "tag") return null;
  const tag = tagStore.tags.find((t) => t.id === filter.value.id);
  return tag?.color || "#9ca3af";
});

const streamIconUrl = ref("");

async function resolveStreamIcon() {
  streamIconUrl.value = "";
  if (!conn.baseURL || !conn.token) return;
  if (filter.value.type === "site") {
    const site = siteStore.sites.find((s) => s.id === filter.value.id);
    if (site?.favicon_id) {
      try {
        streamIconUrl.value = await buildFileUrl(site.favicon_id, conn.baseURL, conn.token);
      } catch {
        // ignore favicon resolution failure
      }
    }
  } else if (filter.value.type === "subscription") {
    const sub = subStore.subscriptions.find((s) => s.id === filter.value.id);
    const site = sub?.site_id ? siteStore.sites.find((s) => s.id === sub.site_id) : undefined;
    if (site?.favicon_id) {
      try {
        streamIconUrl.value = await buildFileUrl(site.favicon_id, conn.baseURL, conn.token);
      } catch {
        // ignore favicon resolution failure
      }
    }
  }
}

watch(
  () => [filter.value.type, filter.value.id, siteStore.sites.length, conn.baseURL, conn.token],
  () => resolveStreamIcon(),
  { immediate: true }
);

const queryParams = computed<ArticleListQuery>(() => {
  const params: ArticleListQuery = {
    order: order.value,
    search: searchQuery.value || undefined,
  };
  switch (filter.value.type) {
    case "unread":
      params.is_read = false;
      params.is_hide = false;
      break;
    case "starred":
      params.is_star = true;
      params.is_hide = false;
      break;
    case "hidden":
      params.is_hide = true;
      break;
    case "subscription":
      if (filter.value.id) params.subscription_id = filter.value.id;
      break;
    case "category":
      if (filter.value.id) params.category_id = filter.value.id;
      break;
    case "site":
      if (filter.value.id) params.site_id = filter.value.id;
      break;
    case "tag":
      if (filter.value.id) params.tag = filter.value.id;
      break;
    default:
      params.is_hide = false;
  }
  return params;
});

const hasUnread = computed(() =>
  artStore.articles.some((a) => !a.is_read)
);

const hasMore = computed(() => {
  if (artStore.loading) return false;
  return artStore.articles.length < artStore.total;
});

async function loadArticles() {
  artStore.size = pageSize.value;
  await artStore.fetchList(queryParams.value);
}

async function loadMore() {
  loadingMore.value = true;
  try {
    await artStore.loadMore();
  } finally {
    loadingMore.value = false;
  }
}

async function refreshAll() {
  await subStore.fetchAllNow();
  await loadArticles();
  await notifStore.fetchUnreadCount();
}

async function markAllRead() {
  await api.POST("/api/articles/read-before-days", {
    params: { query: { days: 0 } },
  });
  await loadArticles();
  showMarkAllConfirm.value = false;
}

function openArticle(id: string) {
  router.push(`/article/${id}`);
}

async function toggleStar(id: string) {
  await artStore.markStar([id]);
}

async function toggleHide(id: string) {
  const art = artStore.articles.find((a) => a.id === id);
  if (!art) return;
  if (art.is_hide) {
    await artStore.markUnhide([id]);
  } else {
    await artStore.markHide([id]);
  }
  await loadArticles();
}

async function handleSwipeAction(id: string, key: string) {
  if (key === "read") {
    const art = artStore.articles.find((a) => a.id === id);
    if (art?.is_read) {
      await artStore.markUnread([id]);
    } else {
      await artStore.markRead([id]);
    }
  } else if (key === "star") {
    await toggleStar(id);
  } else if (key === "hide") {
    await toggleHide(id);
  }
}

function swipeActions(art: (typeof artStore.articles)[0]) {
  return [
    {
      key: "read",
      icon: art.is_read ? MailOpen : Checkbox,
      class: art.is_read
        ? "bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300"
        : "bg-brand text-white",
    },
    {
      key: "star",
      icon: Star,
      class: art.is_star
        ? "bg-amber-500 text-white"
        : "bg-amber-100 dark:bg-amber-900/30 text-amber-500",
    },
    {
      key: "hide",
      icon: EyeOff,
      class: "bg-red-100 dark:bg-red-900/30 text-red-500",
    },
  ];
}

function onSelectFilter(type: FilterType, id: string | null) {
  filter.value = { type, id };
}

// Sync filter from URL query
function applyQuery() {
  const q = route.query;
  if (q.filter) {
    filter.value.type = q.filter as FilterType;
  }
  if (q.id) {
    filter.value.id = q.id as string;
  }
  if (q.order) {
    order.value = (q.order as SortOrder) || "publish_time desc";
  }
  if (q.search) {
    searchQuery.value = q.search as string;
    showSearch.value = true;
  }
  if (q.size) {
    pageSize.value = Number(q.size);
  }
}

function syncQuery() {
  const q: Record<string, string> = {};
  if (filter.value.type !== "unread") q.filter = filter.value.type;
  if (filter.value.id) q.id = filter.value.id;
  if (order.value) q.order = order.value;
  if (searchQuery.value) q.search = searchQuery.value;
  if (pageSize.value !== 20) q.size = String(pageSize.value);
  router.replace({ query: Object.keys(q).length ? q : {} });
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    syncQuery();
    loadArticles();
  }, 300);
});

watch([() => filter.value.type, () => filter.value.id, order, pageSize], () => {
  syncQuery();
  loadArticles();
});

onMounted(async () => {
  applyQuery();
  await Promise.all([
    subStore.fetchAll(),
    catStore.fetchAll(),
    siteStore.fetchAll(),
    tagStore.fetchAll(),
    notifStore.fetchUnreadCount(),
  ]);
  await loadArticles();

  if (sentinelRef.value && listRef.value) {
    loadMoreObserver.value = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          hasMore.value &&
          !loadingMore.value &&
          listRef.value!.scrollHeight > listRef.value!.clientHeight
        ) {
          loadMore();
        }
      },
      { root: listRef.value, threshold: 0 }
    );
    loadMoreObserver.value.observe(sentinelRef.value);
  }
});

onUnmounted(() => {
  loadMoreObserver.value?.disconnect();
});
</script>
