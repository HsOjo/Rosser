<template>
  <n-layout class="app-shell">
    <!-- Unified fixed top bar -->
    <n-layout-header class="top-bar" bordered data-tauri-drag-region>
      <div class="top-bar-left" :class="{ 'mac-layout': isMacClient && !isFullscreen }" :style="leftStyle" data-tauri-drag-region="no-drag">
        <span class="app-name">{{ $t('appName') }}</span>
        <div class="toolbar-group">
          <n-tooltip>
            <template #trigger>
              <n-button text size="small" @click="showAddSub = true">
                <template #icon><n-icon><AddOutline /></n-icon></template>
              </n-button>
            </template>
            {{ $t('addSubscription') }}
          </n-tooltip>
        </div>
      </div>

      <div class="top-bar-drag" data-tauri-drag-region @mousedown="startDraggingWindow"></div>

      <div class="top-bar-right" data-tauri-drag-region="no-drag">
        <div class="toolbar-group">
          <n-popover trigger="click" placement="bottom-end" v-model:show="searchVisible">
            <template #trigger>
              <n-tooltip>
                <template #trigger>
                  <n-button text size="small">
                    <template #icon><n-icon><SearchOutline /></n-icon></template>
                  </n-button>
                </template>
                {{ $t('search') }}
              </n-tooltip>
            </template>
            <n-input v-model:value="searchInput" :placeholder="$t('search')" clearable style="width: 220px">
              <template #prefix>
                <n-icon><SearchOutline /></n-icon>
              </template>
            </n-input>
          </n-popover>

          <n-tooltip>
            <template #trigger>
              <n-button text size="small" @click="refreshAll">
                <template #icon><n-icon><RefreshOutline /></n-icon></template>
              </n-button>
            </template>
            {{ $t('fetchAll') }}
          </n-tooltip>

          <n-tooltip>
            <template #trigger>
              <n-button text size="small" @click="showNotifications = true">
                <template #icon>
                  <n-badge :value="notificationStore.unreadCount" :max="99" :show="notificationStore.unreadCount > 0">
                    <n-icon><NotificationsOutline /></n-icon>
                  </n-badge>
                </template>
              </n-button>
            </template>
            {{ $t('notifications') }}
          </n-tooltip>

          <n-tooltip>
            <template #trigger>
              <n-button text size="small" @click="showSettings = true">
                <template #icon>
                  <n-icon><SettingsOutline /></n-icon>
                </template>
              </n-button>
            </template>
            {{ $t('settings') }}
          </n-tooltip>
        </div>
      </div>
    </n-layout-header>

    <!-- Body -->
    <n-layout has-sider class="app-body">
      <n-layout-sider
        bordered
        width="260"
        style="display: flex; flex-direction: column; height: 100%"
        @contextmenu="(e: MouseEvent) => onContextMenu(e, 'blank', null)"
      >
        <n-scrollbar style="flex: 1">
          <n-menu
            v-model:value="selectedKey"
            :options="menuOptions"
            :node-props="getMenuNodeProps"
            @update:value="onMenuSelect"
          />
        </n-scrollbar>
      </n-layout-sider>

      <n-layout-content style="position: relative;">
        <div
          ref="contentRef"
          style="position: absolute; inset: 0; display: flex; flex-direction: column; overflow: hidden;"
        >
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 16px 16px 12px;">
            <div>
              <div style="font-size: 16px; font-weight: 600; line-height: 1.4;">{{ selectedTitle }}</div>
              <div v-if="selectedSubscription" style="font-size: 12px; color: #999; margin-top: 2px;">
                {{ $t('lastFetch') }}: {{ selectedFetchTime ? relativeTime(selectedFetchTime) : $t('neverFetched') }}
              </div>
            </div>
            <n-space>
              <n-select v-model:value="order" :options="orderOptions" style="width: 140px" size="small" />
              <n-button size="small" @click="markAllRead">{{ $t('markAllRead') }}</n-button>
            </n-space>
          </div>
          <div style="flex: 1; overflow: auto; min-height: 0;">
            <article-list
              :drawer-target="contentRef"
              :subscription-id="selectedSubscription"
              :category-id="selectedCategory"
              :site-id="selectedSite"
              :tag="selectedTagTitle"
              :search="debouncedSearch"
              :is-read="selectedIsRead"
              :is-star="selectedIsStar"
              :is-hide="selectedIsHide"
              :order="order"
              :opened-article-id="openedArticleId"
              @refresh="onArticleRefresh"
              @update:opened-article-id="openedArticleId = $event"
            />
          </div>
        </div>
      </n-layout-content>
    </n-layout>
  </n-layout>

  <!-- Add Category Modal -->
  <n-modal v-model:show="showAddCat" :title="t('addCategory')" preset="card" style="width: 400px">
    <n-space vertical>
      <n-input v-model:value="newCatTitle" :placeholder="t('title')" />
      <n-input v-model:value="newCatDesc" :placeholder="t('description')" type="textarea" />
      <n-button type="primary" :loading="addingCat" @click="addCategory">{{ t('add') }}</n-button>
    </n-space>
  </n-modal>

  <!-- Edit Category Modal -->
  <n-modal v-model:show="showEditCat" :title="t('editCategory')" preset="card" style="width: 400px">
    <n-space vertical>
      <n-input v-model:value="editCatTitle" :placeholder="t('title')" />
      <n-input v-model:value="editCatDesc" :placeholder="t('description')" type="textarea" />
      <n-button type="primary" @click="saveEditCategory">{{ t('save') }}</n-button>
    </n-space>
  </n-modal>

  <!-- Add Subscription Modal -->
  <n-modal v-model:show="showAddSub" :title="$t('addSubscription')" preset="card" style="width: 500px">
    <n-space vertical>
      <n-input v-model:value="newSubUrl" :placeholder="t('rssURL')" />
      <n-button :loading="previewLoading" @click="preview">{{ $t('preview') }}</n-button>
      <template v-if="previewResult">
        <n-input v-model:value="newSubTitle" :placeholder="previewResult.title || t('title')" />
        <n-input v-model:value="newSubDesc" :placeholder="t('description')" type="textarea" />
        <n-select v-model:value="newSubCategory" :options="categoryOptions" :placeholder="t('category')" clearable />
        <n-button type="primary" :loading="adding" @click="addSubscription">{{ $t('addSubscription') }}</n-button>
      </template>
    </n-space>
  </n-modal>

  <!-- Edit Subscription Modal -->
  <n-modal v-model:show="showEditSub" :title="t('editSubscription')" preset="card" style="width: 500px">
    <n-space vertical>
      <n-input v-model:value="editSubTitle" :placeholder="t('title')" />
      <n-input v-model:value="editSubDesc" :placeholder="t('description')" type="textarea" />
      <n-select v-model:value="editSubCategory" :options="categoryOptions" :placeholder="t('category')" clearable />
      <n-form-item :label="t('refreshInterval')" label-placement="left" label-width="120">
        <n-input-number v-model:value="editSubRefreshInterval" :min="1" :placeholder="t('refreshIntervalPlaceholder')" />
      </n-form-item>
      <n-button type="primary" @click="saveEditSubscription">{{ t('save') }}</n-button>
    </n-space>
  </n-modal>

  <!-- Edit Tag Modal -->
  <n-modal v-model:show="showEditTag" preset="card" :title="t('editTag')" style="width: 360px">
    <n-space vertical>
      <n-input v-model:value="editTagTitle" :placeholder="t('tagTitle')" style="width: 100%" />
      <div class="tag-color-picker" style="width: 34px">
        <n-color-picker v-model:value="editTagColor" :modes="['hex']" />
      </div>
      <n-space>
        <n-button type="primary" :loading="savingTag" @click="saveEditTag">{{ t('save') }}</n-button>
        <n-button @click="showEditTag = false">{{ t('close') }}</n-button>
      </n-space>
    </n-space>
  </n-modal>

  <!-- Edit Site Modal -->
  <n-modal v-model:show="showEditSite" :title="t('editSite')" preset="card" style="width: 400px">
    <n-space vertical>
      <n-input v-model:value="editSiteTitle" :placeholder="t('title')" />
      <n-form-item :label="t('concurrencyLimit')" label-placement="left" label-width="120">
        <n-input-number v-model:value="editSiteConcurrency" :min="1" />
      </n-form-item>
      <n-button type="primary" :loading="savingSite" @click="saveEditSite">{{ t('save') }}</n-button>
    </n-space>
  </n-modal>

  <!-- Notifications Modal -->
  <notifications-modal v-model:show="showNotifications" :on-navigate="handleNotificationNavigate" />

  <!-- Settings Modal -->
  <settings-modal v-model:show="showSettings" />

  <!-- Context Menu -->
  <n-dropdown
    trigger="manual"
    placement="bottom-start"
    :show="showContextMenu"
    :x="contextMenuX"
    :y="contextMenuY"
    :options="contextMenuOptions"
    @select="onContextMenuSelect"
    @clickoutside="showContextMenu = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDialog, useMessage, NIcon } from "naive-ui";
import {
  RefreshOutline,
  SearchOutline,
  SettingsOutline,
  AddOutline,
  NotificationsOutline,
  AppsOutline,
  MailUnreadOutline,
  StarOutline,
  EyeOffOutline,
  PricetagsOutline,
  PricetagOutline,
  GlobeOutline,
  FolderOutline,
  FolderOpenOutline,
  NewspaperOutline,
} from "@vicons/ionicons5";
import { h } from "vue";
import { useI18n } from "vue-i18n";
import {
  useSubscriptionStore,
  useCategoryStore,
  useArticleStore,
  useNotificationStore,
  useTagStore,
  useSiteStore,
  useConnectionStore,
} from "@/stores";
import { api, buildFileUrl, relativeTime } from "@rosser/shared";
import { needsMacTitleInset, startDraggingWindow, detectTauri, isMac } from "@/platform";
import ArticleList from "@/components/ArticleList.vue";
import NotificationsModal from "@/components/NotificationsModal.vue";
import SettingsModal from "@/views/Settings.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const subStore = useSubscriptionStore();
const catStore = useCategoryStore();
const contentRef = ref<HTMLElement | null>(null);
const artStore = useArticleStore();
const notificationStore = useNotificationStore();
const tagStore = useTagStore();
const siteStore = useSiteStore();
const connStore = useConnectionStore();
const dialog = useDialog();
const message = useMessage();

const selectedKey = ref("all");
const selectedSubscription = ref<string | undefined>(undefined);
const selectedCategory = ref<string | undefined>(undefined);
const selectedSite = ref<string | undefined>(undefined);
const selectedTag = ref<string | undefined>(undefined);
const selectedTagTitle = ref<string | undefined>(undefined);
const selectedIsRead = ref<boolean | undefined>(undefined);
const selectedIsStar = ref<boolean | undefined>(undefined);
const selectedIsHide = ref<boolean | undefined>(undefined);
const searchInput = ref("");
const debouncedSearch = ref("");
const searchVisible = ref(false);
const order = ref("publish_time desc");
const openedArticleId = ref<string | undefined>(undefined);

const orderOptions = [
  { label: t('sortPublishTimeDesc'), value: "publish_time desc" },
  { label: t('sortPublishTimeAsc'), value: "publish_time asc" },
  { label: t('sortTitleAsc'), value: "title asc" },
  { label: t('sortTitleDesc'), value: "title desc" },
];

const selectedFetchTime = computed(() => {
  if (!selectedSubscription.value) return null;
  const sub = subStore.subscriptions.find((s: any) => s.id === selectedSubscription.value);
  return sub?.fetch_time || null;
});

const selectedTitle = computed(() => {
  if (selectedSubscription.value) {
    const sub = subStore.subscriptions.find((s: any) => s.id === selectedSubscription.value);
    return sub?.title || t('articles');
  }
  if (selectedCategory.value) {
    const cat = catStore.categories.find((c: any) => c.id === selectedCategory.value);
    return cat?.title || t('articles');
  }
  if (selectedSite.value) {
    const site = siteStore.sites.find((s: any) => s.id === selectedSite.value);
    return site?.title || t('articles');
  }
  if (selectedTagTitle.value) return selectedTagTitle.value;
  if (selectedIsRead.value === false) return `${t('unread')} ${t('articles')}`;
  if (selectedIsStar.value === true) return `${t('starred')} ${t('articles')}`;
  if (selectedIsHide.value === true) return `${t('hidden')} ${t('articles')}`;
  return `${t('all')} ${t('articles')}`;
});

const leftStyle = computed(() => ({
  width: "260px",
  padding: "0 12px",
}));

const isMacClient = ref(false);
const isFullscreen = ref(false);
let unlistenResize: (() => void) | null = null;

const showAddCat = ref(false);
const newCatTitle = ref("");
const newCatDesc = ref("");
const addingCat = ref(false);

const showEditCat = ref(false);
const editingCat = ref<any>(null);
const editCatTitle = ref("");
const editCatDesc = ref("");

const showAddSub = ref(false);
const newSubUrl = ref("");
const newSubTitle = ref("");
const newSubDesc = ref("");
const newSubCategory = ref<string | null>(null);
const previewLoading = ref(false);
const previewResult = ref<any>(null);
const adding = ref(false);

const showEditSub = ref(false);
const editingSub = ref<any>(null);
const editSubTitle = ref("");
const editSubDesc = ref("");
const editSubCategory = ref<string | null>(null);
const editSubRefreshInterval = ref(60);
const fetchingSub = ref(false);

const showNotifications = ref(false);
const showSettings = ref(false);

const showContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextTarget = ref<{ type: "cat" | "sub" | "tag" | "site" | "blank"; data: any } | null>(null);

const showEditSite = ref(false);
const editingSite = ref<any>(null);
const editSiteTitle = ref("");
const editSiteConcurrency = ref(4);
const savingSite = ref(false);

const showEditTag = ref(false);
const editingTag = ref<any>(null);
const editTagTitle = ref("");
const editTagColor = ref("");
const savingTag = ref(false);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

function applyQuery() {
  const q = route.query;
  let key = "all";

  if (typeof q.sub === "string") {
    key = `sub-${q.sub}`;
  } else if (typeof q.cat === "string") {
    key = `cat-${q.cat}`;
  } else if (typeof q.site === "string") {
    key = `site-${q.site}`;
  } else if (typeof q.tag === "string") {
    const tag = tagStore.tags.find((t: any) => t.title === q.tag);
    if (tag) key = `tag-${tag.id}`;
  } else if (typeof q.filter === "string" && ["unread", "starred", "hidden"].includes(q.filter)) {
    key = q.filter;
  }

  selectedKey.value = key;
  applyMenuKey(key);

  const search = typeof q.search === "string" ? q.search : "";
  searchInput.value = search;
  debouncedSearch.value = search;

  order.value = typeof q.order === "string" ? q.order : "publish_time desc";
  openedArticleId.value = typeof q.article === "string" ? q.article : undefined;
}

function syncQuery() {
  const query: Record<string, string> = {};

  if (selectedSubscription.value) query.sub = selectedSubscription.value;
  else if (selectedCategory.value) query.cat = selectedCategory.value;
  else if (selectedSite.value) query.site = selectedSite.value;
  else if (selectedTagTitle.value) query.tag = selectedTagTitle.value;
  else if (selectedIsRead.value === false) query.filter = "unread";
  else if (selectedIsStar.value === true) query.filter = "starred";
  else if (selectedIsHide.value === true) query.filter = "hidden";

  if (searchInput.value.trim()) query.search = searchInput.value.trim();
  if (order.value !== "publish_time desc") query.order = order.value;
  if (openedArticleId.value) query.article = openedArticleId.value;

  const current = route.query;
  const same =
    Object.keys(query).length === Object.keys(current).length &&
    Object.entries(query).every(([k, v]) => current[k] === v);
  if (!same) {
    router.replace({ query });
  }
}

watch(() => route.query, applyQuery);
watch(
  () => [
    selectedSubscription.value,
    selectedCategory.value,
    selectedSite.value,
    selectedTagTitle.value,
    selectedIsRead.value,
    selectedIsStar.value,
    selectedIsHide.value,
    searchInput.value,
    order.value,
    openedArticleId.value,
  ],
  syncQuery
);

const categoryOptions = computed(() =>
  catStore.categories.map((c: any) => ({ label: c.title, value: c.id }))
);

const faviconUrls = ref<Record<string, string>>({});

async function resolveFaviconUrls() {
  const result: Record<string, string> = {};
  if (!connStore.baseURL || !connStore.token) {
    faviconUrls.value = result;
    return;
  }
  const sitesWithFavicon = siteStore.sites.filter((s: any) => s.favicon_id);
  await Promise.all(
    sitesWithFavicon.map(async (site: any) => {
      try {
        result[site.id] = await buildFileUrl(site.favicon_id, connStore.baseURL, connStore.token);
      } catch {
        // ignore single favicon resolution failures
      }
    })
  );
  faviconUrls.value = result;
}

watch(
  () => [siteStore.sites.length, connStore.baseURL, connStore.token],
  () => {
    resolveFaviconUrls();
  },
  { immediate: true }
);

function renderIcon(icon: any) {
  return () => h(NIcon, { size: 16 }, { default: () => h(icon) });
}

function faviconImgRender(url: string) {
  return () =>
    h("img", {
      src: url,
      style: {
        width: "16px",
        height: "16px",
        borderRadius: "2px",
        objectFit: "cover",
        verticalAlign: "middle",
        marginRight: "8px",
      },
      onError: (e: Event) => {
        (e.target as HTMLImageElement).style.display = "none";
      },
    });
}

function siteIconRender(site: any) {
  if (!site) return undefined;
  const url = faviconUrls.value[site.id];
  if (url) return faviconImgRender(url);
  return renderIcon(GlobeOutline);
}

function subFaviconRender(sub: any) {
  if (!sub) return undefined;
  const url = sub.site_id ? faviconUrls.value[sub.site_id] : undefined;
  if (url) return faviconImgRender(url);
  return renderIcon(NewspaperOutline);
}

const menuOptions = computed(() => {
  const items: any[] = [
    { key: "all", label: t('all'), icon: renderIcon(AppsOutline) },
    { key: "unread", label: t('unread'), icon: renderIcon(MailUnreadOutline) },
    { key: "starred", label: t('starred'), icon: renderIcon(StarOutline) },
    { key: "hidden", label: t('hidden'), icon: renderIcon(EyeOffOutline) },
  ];

  if (tagStore.tags.length > 0) {
    items.push({
      key: "tags",
      label: t('tags'),
      icon: renderIcon(PricetagsOutline),
      children: tagStore.tags.map((tag: any) => ({
        key: `tag-${tag.id}`,
        label: tag.title,
        icon: renderIcon(PricetagOutline),
        contextMenu: { type: "tag", data: tag },
      })),
    });
  }

  const sitesById = siteStore.byId;
  const groupedBySite: Record<string, any[]> = {};
  for (const sub of subStore.subscriptions) {
    if (!sub.site_id) continue;
    if (!groupedBySite[sub.site_id]) groupedBySite[sub.site_id] = [];
    groupedBySite[sub.site_id].push(sub);
  }
  const siteIds = Object.keys(groupedBySite).sort((a, b) => {
    const sa = sitesById[a];
    const sb = sitesById[b];
    const ta = (sa?.title || sa?.url || "").toLowerCase();
    const tb = (sb?.title || sb?.url || "").toLowerCase();
    return ta.localeCompare(tb);
  });
  if (siteIds.length > 0) {
    items.push({
      key: "sites",
      label: t('sites'),
      icon: renderIcon(GlobeOutline),
      children: siteIds.map((siteId) => {
        const site = sitesById[siteId];
        const subs = groupedBySite[siteId];
        return {
          key: `site-${siteId}`,
          label: site?.title || site?.url || t('unknownSite'),
          icon: siteIconRender(site),
          contextMenu: { type: "site", data: site },
          children: subs.map((s: any) => ({
            key: `sub-${s.id}`,
            label: s.title,
            contextMenu: { type: "sub", data: s },
          })),
        };
      }),
    });
  }

  for (const cat of catStore.categories) {
    const subs = subStore.subscriptions
      .filter((s: any) => s.category_id === cat.id)
      .map((s: any) => ({
        key: `sub-${s.id}`,
        label: s.title,
        icon: subFaviconRender(s),
        contextMenu: { type: "sub", data: s },
      }));
    items.push({
      key: `cat-${cat.id}`,
      label: cat.title,
      icon: renderIcon(FolderOutline),
      children: subs.length > 0 ? subs : undefined,
      contextMenu: { type: "cat", data: cat },
    });
  }
  const uncategorized = subStore.subscriptions
    .filter((s: any) => !s.category_id)
    .map((s: any) => ({
      key: `sub-${s.id}`,
      label: s.title,
      icon: subFaviconRender(s),
      contextMenu: { type: "sub", data: s },
    }));
  if (uncategorized.length > 0) {
    items.push({
      key: "uncategorized",
      label: t('uncategorized'),
      icon: renderIcon(FolderOpenOutline),
      children: uncategorized,
    });
  }
  return items;
});

function openEditCategory(cat: any) {
  editingCat.value = cat;
  editCatTitle.value = cat.title;
  editCatDesc.value = cat.description || "";
  showEditCat.value = true;
}

async function openEditSubscription(sub: any) {
  editingSub.value = sub;
  editSubTitle.value = sub.title;
  editSubDesc.value = sub.description || "";
  editSubCategory.value = sub.category_id || null;
  editSubRefreshInterval.value = sub.refresh_interval ?? 60;
  showEditSub.value = true;
}

function openEditSite(site: any) {
  editingSite.value = site;
  editSiteTitle.value = site.title || "";
  editSiteConcurrency.value = site.concurrency_limit ?? 4;
  showEditSite.value = true;
}

async function saveEditSite() {
  if (!editingSite.value || !editSiteTitle.value.trim()) return;
  savingSite.value = true;
  try {
    await siteStore.update(editingSite.value.id, {
      title: editSiteTitle.value.trim(),
      concurrency_limit: editSiteConcurrency.value,
    });
    showEditSite.value = false;
    editingSite.value = null;
    editSiteTitle.value = "";
    editSiteConcurrency.value = 4;
    message.success(t("saved"));
  } finally {
    savingSite.value = false;
  }
}

function openEditTag(tag: any) {
  editingTag.value = tag;
  editTagTitle.value = tag.title;
  editTagColor.value = tag.color;
  showEditTag.value = true;
}

async function saveEditTag() {
  if (!editingTag.value || !editTagTitle.value.trim()) return;
  savingTag.value = true;
  try {
    await tagStore.update(editingTag.value.id, {
      title: editTagTitle.value.trim(),
      color: editTagColor.value,
    });
    showEditTag.value = false;
    editingTag.value = null;
    message.success(t("saved"));
  } finally {
    savingTag.value = false;
  }
}

async function deleteTag(tag: any) {
  if (!tag) return;
  await tagStore.remove(tag.id);
  message.success(t("deleted"));
}

const contextMenuOptions = computed(() => {
  if (contextTarget.value?.type === "blank") {
    return [
      { label: t("addCategory"), key: "addCategory" },
      { label: t("addSubscription"), key: "addSubscription" },
    ];
  }
  const options = [{ label: t("edit"), key: "edit" }];
  if (contextTarget.value?.type === "sub") {
    options.push({ label: t("fetch"), key: "fetch" });
  }
  if (contextTarget.value?.type === "site") {
    options.push({ label: t("refreshFavicon"), key: "refreshFavicon" });
  }
  if (contextTarget.value?.type !== "site") {
    options.push({ label: t("delete"), key: "delete" });
  }
  return options;
});

function getMenuNodeProps(option: any) {
  if (option.contextMenu) {
    return {
      onContextmenu: (e: MouseEvent) =>
        onContextMenu(e, option.contextMenu.type, option.contextMenu.data),
    };
  }
  return {};
}

function onContextMenu(e: MouseEvent, type: "cat" | "sub" | "tag" | "site" | "blank", data: any) {
  e.preventDefault();
  e.stopPropagation();
  contextTarget.value = { type, data };
  contextMenuX.value = e.clientX;
  contextMenuY.value = e.clientY;
  showContextMenu.value = false;
  nextTick(() => {
    showContextMenu.value = true;
  });
}

function onContextMenuSelect(key: string) {
  showContextMenu.value = false;
  const target = contextTarget.value;
  if (!target) return;

  if (key === "edit") {
    if (target.type === "cat") {
      openEditCategory(target.data);
    } else if (target.type === "tag") {
      openEditTag(target.data);
    } else if (target.type === "site") {
      openEditSite(target.data);
    } else {
      openEditSubscription(target.data);
    }
  } else if (key === "fetch") {
    if (target.type === "sub") {
      fetchSubscription(target.data);
    }
  } else if (key === "refreshFavicon") {
    if (target.type === "site") {
      siteStore.refreshFavicon(target.data.id).then(() => {
        message.success(t("saved"));
      });
    }
  } else if (key === "addCategory") {
    if (target.type === "blank") {
      showAddCat.value = true;
    }
  } else if (key === "addSubscription") {
    if (target.type === "blank") {
      showAddSub.value = true;
    }
  } else if (key === "delete") {
    dialog.warning({
      title: t("delete"),
      content:
        target.type === "cat"
          ? t("confirmDeleteCategory", { title: target.data.title })
          : target.type === "tag"
          ? t("confirmDeleteTag", { title: target.data.title })
          : t("confirmDeleteSubscription", { title: target.data.title }),
      positiveText: t("delete"),
      negativeText: t("close"),
      onPositiveClick: () => {
        if (target.type === "cat") {
          deleteCategory(target.data);
        } else if (target.type === "tag") {
          deleteTag(target.data);
        } else {
          deleteSubscription(target.data);
        }
      },
    });
  }
}

function onMenuSelect(key: string) {
  selectedSubscription.value = undefined;
  selectedCategory.value = undefined;
  selectedSite.value = undefined;
  selectedTag.value = undefined;
  selectedTagTitle.value = undefined;
  selectedIsRead.value = undefined;
  selectedIsStar.value = undefined;
  selectedIsHide.value = undefined;
  applyMenuKey(key);
}

function applyMenuKey(key: string) {
  if (key === "unread") {
    selectedIsRead.value = false;
  } else if (key === "starred") {
    selectedIsStar.value = true;
  } else if (key === "hidden") {
    selectedIsHide.value = true;
  } else if (key.startsWith("sub-")) {
    selectedSubscription.value = key.replace("sub-", "");
  } else if (key.startsWith("cat-")) {
    selectedCategory.value = key.replace("cat-", "");
  } else if (key.startsWith("site-")) {
    selectedSite.value = key.replace("site-", "");
  } else if (key.startsWith("tag-")) {
    const tagId = key.replace("tag-", "");
    selectedTag.value = tagId;
    const tag = tagStore.tags.find((t: any) => t.id === tagId);
    selectedTagTitle.value = tag?.title;
  }
}

function handleNotificationNavigate(payload: { subscriptionId?: string }) {
  if (payload.subscriptionId) {
    selectedKey.value = `sub-${payload.subscriptionId}`;
    applyMenuKey(selectedKey.value);
    showNotifications.value = false;
  }
}

function onArticleRefresh() {
  artStore.refresh();
  notificationStore.fetchUnreadCount();
}

watch(searchInput, (val) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    debouncedSearch.value = val;
  }, 300);
});

async function refreshAll() {
  await api.POST("/api/subscriptions/fetch-all");
  await artStore.refresh();
  await notificationStore.fetchUnreadCount();
}

async function markAllRead() {
  await api.POST("/api/articles/read-before-days", { params: { query: { days: 0 } } });
  await artStore.fetchList();
  await notificationStore.fetchUnreadCount();
}

async function addCategory() {
  addingCat.value = true;
  try {
    await catStore.create({ title: newCatTitle.value, description: newCatDesc.value });
    showAddCat.value = false;
    newCatTitle.value = "";
    newCatDesc.value = "";
  } finally {
    addingCat.value = false;
  }
}

async function saveEditCategory() {
  if (!editingCat.value) return;
  await catStore.update(editingCat.value.id, {
    title: editCatTitle.value,
    description: editCatDesc.value,
  });
  showEditCat.value = false;
  editingCat.value = null;
}

async function deleteCategory(cat: any) {
  if (!cat) return;
  await catStore.remove(cat.id);
  showEditCat.value = false;
  editingCat.value = null;
  message.success(t("deleted"));
}

async function preview() {
  previewLoading.value = true;
  try {
    const { data } = await api.POST("/api/subscriptions/preview", { body: { url: newSubUrl.value } });
    previewResult.value = data;
    if (data?.title) newSubTitle.value = data.title;
    if (data?.description) newSubDesc.value = data.description;
  } finally {
    previewLoading.value = false;
  }
}

async function addSubscription() {
  adding.value = true;
  try {
    const sub = await subStore.create({
      url: newSubUrl.value,
      title: newSubTitle.value || previewResult.value?.title || newSubUrl.value,
      description: newSubDesc.value,
      category_id: newSubCategory.value,
    });
    showAddSub.value = false;
    newSubUrl.value = "";
    newSubTitle.value = "";
    newSubDesc.value = "";
    newSubCategory.value = null;
    previewResult.value = null;
    if (sub?.id) {
      await api.POST("/api/subscriptions/fetch", { body: { ids: [sub.id] } });
    }
  } finally {
    adding.value = false;
  }
}

async function saveEditSubscription() {
  if (!editingSub.value) return;
  await subStore.update(editingSub.value.id, {
    title: editSubTitle.value,
    description: editSubDesc.value,
    category_id: editSubCategory.value,
    refresh_interval: editSubRefreshInterval.value,
  });
  await subStore.fetchAll();
  showEditSub.value = false;
  editingSub.value = null;
  editSubRefreshInterval.value = 60;
}

async function fetchSubscription(sub: any) {
  if (!sub || fetchingSub.value) return;
  fetchingSub.value = true;
  try {
    await api.POST("/api/subscriptions/fetch", { body: { ids: [sub.id] } });
  } finally {
    fetchingSub.value = false;
  }
}

async function deleteSubscription(sub: any) {
  if (!sub) return;
  await subStore.remove(sub.id);
  showEditSub.value = false;
  editingSub.value = null;
  message.success(t("deleted"));
}

onMounted(async () => {
  applyQuery();
  subStore.fetchAll();
  catStore.fetchAll();
  tagStore.fetchAll().then(() => {
    if (typeof route.query.tag === "string") {
      applyQuery();
    }
  });
  siteStore.fetchAll();
  notificationStore.fetchUnreadCount();
  if (await detectTauri()) {
    isMacClient.value = isMac();
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    isFullscreen.value = await win.isFullscreen();
    unlistenResize = await win.onResized(async () => {
      isFullscreen.value = await win.isFullscreen();
    });
  }
});

onUnmounted(() => {
  unlistenResize?.();
});
</script>

<style scoped>
.tag-color-picker :deep(.n-color-picker) {
  width: 100%;
}
.tag-color-picker :deep(.n-color-picker__value) {
  display: none;
}

.app-shell {
  height: 100vh;
  overflow: hidden;
}

.app-body {
  height: calc(100vh - 40px);
  overflow: hidden;
}

.top-bar {
  height: 40px;
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  padding: 0;
}

:deep(.n-layout-header__border) {
  bottom: 0;
}

.top-bar-left,
.top-bar-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  box-sizing: border-box;
}

.top-bar-left {
  position: relative;
  padding: 0 12px;
}

.top-bar-left.mac-layout .app-name {
  left: 50%;
  transform: translateY(-50%) translateX(-50%);
}

.top-bar-left .toolbar-group {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.top-bar-right {
  justify-content: flex-end;
  padding: 0 12px;
}

.app-name {
  position: absolute;
  left: 8px;
  top: 50%;
  font-weight: bold;
  font-size: 18px;
  line-height: 1;
  white-space: nowrap;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  cursor: default;
  transform: translateY(-50%) translateX(0);
  transition: left 0.3s ease, transform 0.3s ease;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-bar-drag {
  flex: 1;
  min-width: 40px;
}

:deep(.n-menu) {
  --n-item-height: 32px !important;
}

:deep(.n-menu-item),
:deep(.n-submenu) {
  margin-top: 3px !important;
}

:deep(.n-menu .n-submenu-children .n-menu-item-content) {
  padding-left: 32px !important;
}

:deep(.n-menu .n-submenu-children .n-submenu-children .n-menu-item-content) {
  padding-left: 64px !important;
}
</style>
