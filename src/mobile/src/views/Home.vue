<template>
  <div>
    <var-app-bar :title="$t('appName')">
      <template #left>
        <var-button text type="primary" @click="showDrawer = true">
          <var-icon name="menu" />
        </var-button>
      </template>
      <template #right>
        <var-badge type="danger" :value="notifStore.unreadCount" :hidden="notifStore.unreadCount === 0" dot>
          <var-button text type="primary" @click="$router.push('/notifications')">
            <var-icon name="bell-outline" />
          </var-button>
        </var-badge>
        <var-button text type="primary" @click="$router.push('/settings')">
          <var-icon name="cog-outline" />
        </var-button>
      </template>
    </var-app-bar>

    <div style="padding: 8px 16px;">
      <var-input v-model="searchInput" :placeholder="$t('search')" clearable size="small" variant="outlined">
        <template #prepend-icon>
          <var-icon name="magnify" />
        </template>
      </var-input>
    </div>

    <var-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <var-list
        :loading="artStore.loading"
        loading-text=""
        :finished="finished"
        :finished-text="$t('noData')"
        @load="loadMore"
      >
        <var-cell
          v-for="art in artStore.articles"
          :key="art.id"
          :title="art.title"
          @click="openArticle(art)"
        >
          <template #description>
            <span style="font-size: 12px; color: #999;">{{ relativeTime(art.publish_time) }}</span>
            <var-chip v-if="!art.is_read" type="primary" size="mini">{{ $t('new') }}</var-chip>
            <var-chip v-if="art.is_star" type="warning" size="mini">{{ $t('star') }}</var-chip>
          </template>
          <template #extra>
            <var-icon v-if="!art.is_read" name="circle-medium" style="color: var(--color-primary);" />
          </template>
        </var-cell>
      </var-list>
    </var-pull-refresh>

    <div v-if="filterLabel" style="padding: 8px 16px; display: flex; align-items: center; gap: 8px;">
      <var-chip size="small" type="primary">{{ filterLabel }}</var-chip>
      <var-button text type="primary" size="mini" @click="clearFilter">{{ $t('clearFilter') }}</var-button>
    </div>

    <var-popup position="left" v-model:show="showDrawer" style="width: 280px; height: 100%;">
      <div style="padding: 16px;">
        <div style="font-weight: bold; font-size: 18px; margin-bottom: 16px;">{{ $t('appName') }}</div>

        <var-space direction="column" size="small">
          <var-button text block :type="activeFilter === 'all' ? 'primary' : 'default'" @click="setFilter('all')">
            {{ $t('all') }}
          </var-button>
          <var-button text block :type="activeFilter === 'unread' ? 'primary' : 'default'" @click="setFilter('unread')">
            {{ $t('unread') }}
          </var-button>
          <var-button text block :type="activeFilter === 'starred' ? 'primary' : 'default'" @click="setFilter('starred')">
            {{ $t('starred') }}
          </var-button>
          <var-button text block :type="activeFilter === 'hidden' ? 'primary' : 'default'" @click="setFilter('hidden')">
            {{ $t('hidden') }}
          </var-button>
        </var-space>

        <div style="margin-top: 16px; font-weight: bold;">{{ $t('tags') }}</div>
        <var-space style="margin-top: 8px;" wrap :size="[4, 4]">
          <var-chip
            v-for="tag in tagStore.tags"
            :key="tag.id"
            size="mini"
            :type="activeTag === tag.id ? 'primary' : 'default'"
            @click="setTagFilter(tag.id)"
          >
            {{ tag.title }}
          </var-chip>
        </var-space>

        <div style="margin-top: 16px; font-weight: bold;">{{ $t('categories') }}</div>
        <div v-for="cat in catStore.categories" :key="cat.id" style="margin-top: 8px;">
          <div style="font-size: 14px; color: #666; margin-bottom: 4px;">{{ cat.title }}</div>
          <var-space direction="column" size="small">
            <var-button
              v-for="sub in subsByCat(cat.id)"
              :key="sub.id"
              text
              block
              size="mini"
              :type="activeSub === sub.id ? 'primary' : 'default'"
              @click="setSubFilter(sub.id)"
            >
              {{ sub.title }}
            </var-button>
          </var-space>
        </div>
        <div v-if="uncategorizedSubs.length > 0" style="margin-top: 8px;">
          <div style="font-size: 14px; color: #666; margin-bottom: 4px;">{{ $t('uncategorized') }}</div>
          <var-space direction="column" size="small">
            <var-button
              v-for="sub in uncategorizedSubs"
              :key="sub.id"
              text
              block
              size="mini"
              :type="activeSub === sub.id ? 'primary' : 'default'"
              @click="setSubFilter(sub.id)"
            >
              {{ sub.title }}
            </var-button>
          </var-space>
        </div>
      </div>
    </var-popup>

    <div style="position: fixed; bottom: 16px; right: 16px; z-index: 10;">
      <var-fab type="primary" @click="showFabMenu = true">
        <var-icon name="plus" />
      </var-fab>
    </div>

    <var-action-sheet
      :actions="fabActions"
      v-model:show="showFabMenu"
      @select="onFabSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { Snackbar } from "@varlet/ui";
import { useArticleStore, useSubscriptionStore, useCategoryStore, useTagStore, useNotificationStore } from "@/stores";
import { relativeTime } from "@rosser/shared";

const router = useRouter();
const artStore = useArticleStore();
const subStore = useSubscriptionStore();
const catStore = useCategoryStore();
const tagStore = useTagStore();
const notifStore = useNotificationStore();

const showDrawer = ref(false);
const showFabMenu = ref(false);
const refreshing = ref(false);
const finished = ref(false);
const searchInput = ref("");
const activeFilter = ref("all");
const activeSub = ref<string | null>(null);
const activeTag = ref<string | null>(null);
const activeCat = ref<string | null>(null);

const fabActions = [
  { name: "markAllRead", icon: "check-all" },
  { name: "fetchAll", icon: "refresh" },
  { name: "manage", icon: "cog-outline" },
];

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const filterLabel = computed(() => {
  if (activeSub.value) {
    const sub = subStore.subscriptions.find((s) => s.id === activeSub.value);
    return sub?.title;
  }
  if (activeTag.value) {
    const tag = tagStore.tags.find((t) => t.id === activeTag.value);
    return tag?.title;
  }
  if (activeCat.value) {
    const cat = catStore.categories.find((c) => c.id === activeCat.value);
    return cat?.title;
  }
  if (activeFilter.value === "unread") return "未读";
  if (activeFilter.value === "starred") return "星标";
  if (activeFilter.value === "hidden") return "隐藏";
  return null;
});

function subsByCat(catId: string) {
  return subStore.subscriptions.filter((s) => s.category_id === catId);
}

const uncategorizedSubs = computed(() =>
  subStore.subscriptions.filter((s) => !s.category_id)
);

function buildParams(): Record<string, any> {
  const params: Record<string, any> = {};
  if (activeSub.value) params.subscription_id = activeSub.value;
  if (activeCat.value) params.category_id = activeCat.value;
  if (activeTag.value) params.tag = filterLabel.value;
  if (activeFilter.value === "unread") params.is_read = false;
  if (activeFilter.value === "starred") params.is_star = true;
  if (activeFilter.value === "hidden") params.is_hide = true;
  if (searchInput.value.trim()) params.search = searchInput.value.trim();
  return params;
}

async function load(reset = false) {
  if (reset) {
    artStore.page = 1;
    finished.value = false;
  }
  await artStore.fetchList(buildParams(), !reset);
  finished.value = artStore.articles.length >= artStore.total;
}

function loadMore() {
  artStore.page += 1;
  load();
}

async function onRefresh() {
  await load(true);
  refreshing.value = false;
}

function openArticle(art: any) {
  router.push(`/article/${art.id}`);
}

function setFilter(key: string) {
  activeFilter.value = key;
  activeSub.value = null;
  activeTag.value = null;
  activeCat.value = null;
  showDrawer.value = false;
  load(true);
}

function setSubFilter(subId: string) {
  activeSub.value = subId;
  activeFilter.value = "all";
  activeTag.value = null;
  activeCat.value = null;
  showDrawer.value = false;
  load(true);
}

function setTagFilter(tagId: string) {
  activeTag.value = tagId;
  activeFilter.value = "all";
  activeSub.value = null;
  activeCat.value = null;
  showDrawer.value = false;
  load(true);
}

function clearFilter() {
  activeFilter.value = "all";
  activeSub.value = null;
  activeTag.value = null;
  activeCat.value = null;
  searchInput.value = "";
  load(true);
}

function onFabSelect(action: any) {
  if (action.name === "markAllRead") {
    markAllRead();
  } else if (action.name === "fetchAll") {
    fetchAllSubs();
  } else if (action.name === "manage") {
    router.push("/manage");
  }
}

async function markAllRead() {
  try {
    await artStore.markRead(artStore.articles.map((a) => a.id));
    Snackbar.success("已全部标记为已读");
    load(true);
  } catch {
    Snackbar.error("操作失败");
  }
}

async function fetchAllSubs() {
  try {
    Snackbar.loading("正在抓取...");
    await artStore.refresh();
    Snackbar.success("抓取完成");
  } catch {
    Snackbar.error("抓取失败");
  }
}

watch(searchInput, (val) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    load(true);
  }, 300);
});

onMounted(() => {
  load(true);
  subStore.fetchAll();
  catStore.fetchAll();
  tagStore.fetchAll();
  notifStore.fetchUnreadCount();
});
</script>
