<template>
  <div class="app-shell">
    <!-- Unified fixed top bar -->
    <div class="top-bar" data-tauri-drag-region>
      <div class="top-bar-left" :class="{ 'mac-layout': isMacClient }" :style="leftStyle" data-tauri-drag-region="no-drag">
        <span class="app-name">{{ $t('appName') }}</span>
        <div class="toolbar-group">
          <n-button text size="small" @click="showAddCat = true">
            <template #icon><n-icon><AddOutline /></n-icon></template>
          </n-button>
          <n-button text size="small" @click="refreshAll">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
          </n-button>
        </div>
      </div>

      <div class="top-bar-drag" data-tauri-drag-region @mousedown="startDraggingWindow"></div>

      <div class="top-bar-right" data-tauri-drag-region="no-drag">
        <div class="toolbar-group">
          <n-popover trigger="click" placement="bottom-end" v-model:show="searchVisible">
            <template #trigger>
              <n-button text size="small">
                <template #icon><n-icon><SearchOutline /></n-icon></template>
              </n-button>
            </template>
            <n-input v-model:value="searchInput" :placeholder="$t('search')" clearable style="width: 220px">
              <template #prefix>
                <n-icon><SearchOutline /></n-icon>
              </template>
            </n-input>
          </n-popover>

          <n-select v-model:value="order" :options="orderOptions" style="width: 140px" size="small" />
          <n-button size="small" @click="markAllRead">{{ $t('markAllRead') }}</n-button>
          <n-button size="small" @click="showAddSub = true">{{ $t('addSubscription') }}</n-button>
          <n-button text size="small" @click="showNotifications = true">
            <template #icon>
              <n-badge :value="notificationStore.unreadCount" :max="99" :show="notificationStore.unreadCount > 0">
                <n-icon><NotificationsOutline /></n-icon>
              </n-badge>
            </template>
          </n-button>
          <n-button text size="small" @click="showSettings = true">
            <template #icon>
              <n-icon><SettingsOutline /></n-icon>
            </template>
          </n-button>
        </div>
      </div>
    </div>

    <!-- Body -->
    <n-layout has-sider class="app-body">
      <n-layout-sider bordered width="260" style="display: flex; flex-direction: column; height: 100%">
        <n-scrollbar style="flex: 1">
          <n-menu
            v-model:value="selectedKey"
            :options="menuOptions"
            :node-props="getMenuNodeProps"
            @update:value="onMenuSelect"
          />
        </n-scrollbar>
      </n-layout-sider>

      <n-layout-content style="padding: 16px">
        <article-list
          :subscription-id="selectedSubscription"
          :category-id="selectedCategory"
          :tag="selectedTagTitle"
          :search="debouncedSearch"
          :is-read="selectedIsRead"
          :is-star="selectedIsStar"
          :is-hide="selectedIsHide"
          :order="order"
          @refresh="onArticleRefresh"
        />
      </n-layout-content>
    </n-layout>
  </div>

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
      <n-select v-model:value="editSubTags" :options="tagOptions" :placeholder="t('tags')" multiple clearable />
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

  <!-- Notifications Modal -->
  <notifications-modal v-model:show="showNotifications" />

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
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useDialog, useMessage } from "naive-ui";
import {
  RefreshOutline,
  SearchOutline,
  SettingsOutline,
  AddOutline,
  NotificationsOutline,
} from "@vicons/ionicons5";
import { useI18n } from "vue-i18n";
import {
  useSubscriptionStore,
  useCategoryStore,
  useArticleStore,
  useNotificationStore,
  useTagStore,
} from "@/stores";
import { api } from "@rosser/shared";
import { needsMacTitleInset, startDraggingWindow, detectTauri, isMac } from "@/platform";
import ArticleList from "@/components/ArticleList.vue";
import NotificationsModal from "@/components/NotificationsModal.vue";
import SettingsModal from "@/views/Settings.vue";

const { t } = useI18n();
const subStore = useSubscriptionStore();
const catStore = useCategoryStore();
const artStore = useArticleStore();
const notificationStore = useNotificationStore();
const tagStore = useTagStore();
const dialog = useDialog();
const message = useMessage();

const selectedKey = ref("all");
const selectedSubscription = ref<string | undefined>(undefined);
const selectedCategory = ref<string | undefined>(undefined);
const selectedTag = ref<string | undefined>(undefined);
const selectedTagTitle = ref<string | undefined>(undefined);
const selectedIsRead = ref<boolean | undefined>(undefined);
const selectedIsStar = ref<boolean | undefined>(undefined);
const selectedIsHide = ref<boolean | undefined>(undefined);
const searchInput = ref("");
const debouncedSearch = ref("");
const searchVisible = ref(false);
const order = ref("publish_time desc");

const orderOptions = [
  { label: t('sortPublishTimeDesc'), value: "publish_time desc" },
  { label: t('sortPublishTimeAsc'), value: "publish_time asc" },
  { label: t('sortTitleAsc'), value: "title asc" },
  { label: t('sortTitleDesc'), value: "title desc" },
];

const leftStyle = computed(() => ({
  width: "260px",
  padding: "0 12px",
}));

const isMacClient = ref(false);

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
const editSubTags = ref<string[]>([]);
const fetchingSub = ref(false);

const showNotifications = ref(false);
const showSettings = ref(false);

const showContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextTarget = ref<{ type: "cat" | "sub" | "tag"; data: any } | null>(null);

const showEditTag = ref(false);
const editingTag = ref<any>(null);
const editTagTitle = ref("");
const editTagColor = ref("");
const savingTag = ref(false);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

const categoryOptions = computed(() =>
  catStore.categories.map((c: any) => ({ label: c.title, value: c.id }))
);

const tagOptions = computed(() =>
  tagStore.tags.map((tag: any) => ({ label: tag.title, value: tag.id }))
);

const menuOptions = computed(() => {
  const items: any[] = [
    { key: "all", label: t('all') },
    { key: "unread", label: t('unread') },
    { key: "starred", label: t('starred') },
    { key: "hidden", label: t('hidden') },
  ];

  if (tagStore.tags.length > 0) {
    items.push({
      key: "tags",
      label: t('tags'),
      children: tagStore.tags.map((tag: any) => ({
        key: `tag-${tag.id}`,
        label: tag.title,
        contextMenu: { type: "tag", data: tag },
      })),
    });
  }

  for (const cat of catStore.categories) {
    const subs = subStore.subscriptions
      .filter((s: any) => s.category_id === cat.id)
      .map((s: any) => ({
        key: `sub-${s.id}`,
        label: s.title,
        contextMenu: { type: "sub", data: s },
      }));
    items.push({
      key: `cat-${cat.id}`,
      label: cat.title,
      children: subs.length > 0 ? subs : undefined,
      contextMenu: { type: "cat", data: cat },
    });
  }
  const uncategorized = subStore.subscriptions
    .filter((s: any) => !s.category_id)
    .map((s: any) => ({
      key: `sub-${s.id}`,
      label: s.title,
      contextMenu: { type: "sub", data: s },
    }));
  if (uncategorized.length > 0) {
    items.push({ key: "uncategorized", label: t('uncategorized'), children: uncategorized });
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
  editSubTags.value = sub.tags?.map((t: any) => t.id) || [];
  showEditSub.value = true;
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
  const options = [{ label: t("edit"), key: "edit" }];
  if (contextTarget.value?.type === "sub") {
    options.push({ label: t("fetch"), key: "fetch" });
  }
  options.push({ label: t("delete"), key: "delete" });
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

function onContextMenu(e: MouseEvent, type: "cat" | "sub" | "tag", data: any) {
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
    } else {
      openEditSubscription(target.data);
    }
  } else if (key === "fetch") {
    if (target.type === "sub") {
      fetchSubscription(target.data);
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
  selectedTag.value = undefined;
  selectedTagTitle.value = undefined;
  selectedIsRead.value = undefined;
  selectedIsStar.value = undefined;
  selectedIsHide.value = undefined;
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
  } else if (key.startsWith("tag-")) {
    const tagId = key.replace("tag-", "");
    selectedTag.value = tagId;
    const tag = tagStore.tags.find((t: any) => t.id === tagId);
    selectedTagTitle.value = tag?.title;
  }
}

function onArticleRefresh() {
  artStore.fetchList();
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
  await artStore.fetchList();
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
      await artStore.fetchList();
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
  });
  const currentTagIds = editingSub.value.tags?.map((t: any) => t.id) || [];
  const toAdd = editSubTags.value.filter((id) => !currentTagIds.includes(id));
  const toRemove = currentTagIds.filter((id: string) => !editSubTags.value.includes(id));
  for (const tagId of toAdd) {
    await tagStore.tagSubscription(editingSub.value.id, [tagId]);
  }
  for (const tagId of toRemove) {
    await tagStore.untagSubscription(editingSub.value.id, tagId);
  }
  await subStore.fetchAll();
  showEditSub.value = false;
  editingSub.value = null;
}

async function fetchSubscription(sub: any) {
  if (!sub || fetchingSub.value) return;
  fetchingSub.value = true;
  try {
    await api.POST("/api/subscriptions/fetch", { body: { ids: [sub.id] } });
    await artStore.fetchList();
    await notificationStore.fetchUnreadCount();
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

onMounted(() => {
  subStore.fetchAll();
  catStore.fetchAll();
  tagStore.fetchAll();
  notificationStore.fetchUnreadCount();
  detectTauri().then((isTauri) => {
    isMacClient.value = isTauri && isMac();
  });
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
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-body {
  flex: 1;
  overflow: hidden;
}

.top-bar {
  height: 40px;
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid var(--n-border-color, #eee);
  background: var(--n-color, #fff);
  flex-shrink: 0;
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
  justify-content: flex-start;
  padding: 0 12px;
}

.top-bar-left.mac-layout {
  justify-content: center;
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
  font-weight: bold;
  font-size: 18px;
  line-height: 1;
  white-space: nowrap;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  cursor: default;
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
</style>
