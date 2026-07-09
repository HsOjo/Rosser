<template>
  <div class="article-list">
    <n-spin :show="artStore.loading">
      <n-list clickable>
        <n-list-item v-for="art in artStore.articles" :key="art.id"
          @click="openArticle(art)"
          style="padding: 12px 16px"
        >
          <n-thing :title="art.title">
            <template #header-extra>
              <span style="font-size: 12px; color: #999; white-space: nowrap;">{{ relativeTime(art.publish_time) }}</span>
            </template>
            <template #description>
              <n-ellipsis :line-clamp="2" :tooltip="false" style="font-size: 13px; color: #666;">
                {{ stripHtml(art.summary || "") }}
              </n-ellipsis>
            </template>
            <template #avatar>
              <n-tag v-if="!art.is_read" type="success" size="small">{{ t('new') }}</n-tag>
              <n-tag v-if="art.is_star" type="warning" size="small">{{ t('star') }}</n-tag>
            </template>
            <template #action>
              <n-space>
                <n-button v-if="art.is_read" text size="tiny" @click.stop="markUnread(art)"
                  >{{ t('unread') }}</n-button>
                <n-button v-else text size="tiny" @click.stop="markRead(art)"
                  >{{ t('read') }}</n-button>
                <n-button text size="tiny" @click.stop="toggleStar(art)"
                  >{{ art.is_star ? t('unstar') : t('star') }}</n-button>
                <n-button text size="tiny" @click.stop="toggleHide(art)"
                  >{{ art.is_hide ? t('unhide') : t('hide') }}</n-button>
              </n-space>
            </template>
          </n-thing>
        </n-list-item>
      </n-list>

      <n-empty v-if="!artStore.loading && artStore.articles.length === 0" :description="$t('noData')" />

      <n-pagination
        v-if="artStore.total > 0"
        v-model:page="artStore.page"
        v-model:page-size="artStore.size"
        :item-count="artStore.total"
        :page-sizes="[20, 50, 100]"
        show-size-picker
        style="padding: 12px 16px"
        @update:page="onPageChange"
        @update:page-size="onPageChange"
      />
    </n-spin>

    <n-drawer
      v-model:show="showArticle"
      :to="drawerTarget"
      placement="right"
      width="100%"
      :block-scroll="false"
      :close-on-esc="true"
      :style="{ '--n-border-radius': '0' }"
    >
      <n-drawer-content :closable="true">
        <template #header>
          <div class="drawer-header">
            <div class="drawer-title">{{ selectedArticle?.title }}</div>
            <div class="drawer-meta">
              <span v-if="selectedArticle?.author">{{ selectedArticle.author }}</span>
              <span v-if="selectedArticle?.author && selectedArticle?.publish_time"> · </span>
              <span v-if="selectedArticle?.publish_time">{{ relativeTime(selectedArticle.publish_time) }}</span>
            </div>
          </div>
        </template>

        <n-spin :show="resolvedContentLoading">
          <div v-if="selectedArticle" class="article-body">
            <div class="article-content">
              <template v-for="(item, idx) in resolvedContent" :key="idx">
                <div v-if="item.type === 'text/html'" v-html="item.value" />
                <pre v-else-if="item.type === 'text/plain'" class="plain-text">{{ item.value }}</pre>
                <n-tag v-else type="warning" size="small">{{ t('unsupportedType', { type: item.type }) }}</n-tag>
              </template>
            </div>
            <div class="article-actions">
              <n-space justify="space-between" style="width: 100%">
                <n-space>
                  <n-button size="small" @click="openOriginal">{{ t('openOriginal') }}</n-button>
                  <n-button
                    size="small"
                    :type="selectedArticle?.is_star ? 'warning' : 'default'"
                    @click="toggleSelectedStar"
                  >
                    {{ selectedArticle?.is_star ? t('unstar') : t('star') }}
                  </n-button>
                  <n-popover trigger="click" placement="top-start" :width="260">
                    <template #trigger>
                      <n-button size="small">{{ t('tagManagement') }}</n-button>
                    </template>
                    <n-space vertical style="padding: 8px 0">
                      <n-select
                        v-model:value="selectedArticleTags"
                        :options="tagOptions"
                        multiple
                        clearable
                        size="small"
                        style="min-width: 200px"
                        :placeholder="t('tagged')"
                        @update:value="onArticleTagsChange"
                      />
                      <n-input-group>
                        <n-input
                          v-model:value="newTagTitle"
                          size="small"
                          :placeholder="t('addTag')"
                          @keyup.enter="addNewTag"
                        />
                        <n-button size="small" @click="addNewTag">
                          <template #icon>
                            <n-icon><AddOutline /></n-icon>
                          </template>
                        </n-button>
                      </n-input-group>
                    </n-space>
                  </n-popover>
                </n-space>
                <n-button size="small" @click="showMetaDrawer = true">{{ t('metaInspector') }}</n-button>
              </n-space>
            </div>
          </div>
        </n-spin>
      </n-drawer-content>
    </n-drawer>

    <n-drawer
      v-model:show="showMetaDrawer"
      :to="drawerTarget"
      placement="right"
      width="100%"
      :block-scroll="false"
      :close-on-esc="true"
      :style="{ '--n-border-radius': '0' }"
    >
      <n-drawer-content :title="t('metaInspector')" :closable="true">
        <n-data-table
          v-if="metaTreeData.length"
          :columns="metaColumns"
          :data="metaTreeData"
          :row-props="metaRowProps"
          default-expand-all
          size="small"
          :bordered="false"
          :single-line="false"
          :scroll-x="320"
        />
        <n-empty v-else :description="t('noData')" />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { AddOutline } from "@vicons/ionicons5";
import { useArticleStore, useConnectionStore, useSubscriptionStore, useTagStore } from "@/stores";
import { relativeTime, resolveFilePlaceholders, wsClient } from "@rosser/shared";
import { openExternal } from "@/platform";
import DOMPurify from "dompurify";

const { t } = useI18n();

const props = defineProps<{
  subscriptionId?: string;
  categoryId?: string;
  siteId?: string;
  tag?: string;
  search?: string;
  isRead?: boolean;
  isStar?: boolean;
  isHide?: boolean;
  order?: string;
  drawerTarget?: HTMLElement | null;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
}>();

const artStore = useArticleStore();
const connStore = useConnectionStore();
const subStore = useSubscriptionStore();
const tagStore = useTagStore();
const showArticle = ref(false);
const showMetaDrawer = ref(false);
const selectedArticle = ref<any>(null);
const resolvedContent = ref<{ type: string; value: string }[]>([]);
const resolvedContentLoading = ref(false);
const selectedArticleTags = ref<string[]>([]);
const newTagTitle = ref("");

const tagOptions = computed(() =>
  tagStore.tags.map((tag: any) => ({ label: tag.title, value: tag.id }))
);

const metaColumns = computed(() => [
  {
    title: t("metaKey"),
    key: "key",
    width: 160,
    ellipsis: { tooltip: true },
  },
  {
    title: t("metaType"),
    key: "type",
    width: 100,
  },
  {
    title: t("metaValue"),
    key: "value",
    minWidth: 160,
    ellipsis: { tooltip: true },
  },
]);

interface MetaTreeRow {
  key: string;
  keyPath: string;
  label: string;
  type: string;
  value: string;
  depth: number;
  children?: MetaTreeRow[];
}

function buildMetaTree(obj: any, parentKey = "", depth = 0): MetaTreeRow[] {
  if (obj === null) {
    return [
      {
        key: parentKey || "null",
        keyPath: parentKey || "null",
        label: parentKey ? parentKey.split(".").pop() || "" : "null",
        type: "null",
        value: "null",
        depth,
      },
    ];
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return [
        {
          key: parentKey,
          keyPath: parentKey,
          label: parentKey ? parentKey.split(".").pop() || "" : "",
          type: "array",
          value: "[]",
          depth,
        },
      ];
    }
    return obj.flatMap((item, idx) => {
      const itemKey = parentKey ? `${parentKey}.${idx}` : String(idx);
      const children = buildMetaTree(item, itemKey, depth + 1);
      if (children.length === 1 && children[0].key === itemKey) {
        return children;
      }
      return [
        {
          key: itemKey,
          keyPath: itemKey,
          label: String(idx),
          type: "array",
          value: "",
          depth,
          children,
        },
      ];
    });
  }
  if (typeof obj === "object") {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return [
        {
          key: parentKey,
          keyPath: parentKey,
          label: parentKey ? parentKey.split(".").pop() || "" : "",
          type: "object",
          value: "{}",
          depth,
        },
      ];
    }
    return keys.flatMap((k) => {
      const childKey = parentKey ? `${parentKey}.${k}` : k;
      const children = buildMetaTree(obj[k], childKey, depth + 1);
      if (children.length === 1 && children[0].key === childKey) {
        return children;
      }
      return [
        {
          key: childKey,
          keyPath: childKey,
          label: k,
          type: "object",
          value: "",
          depth,
          children,
        },
      ];
    });
  }
  return [
    {
      key: parentKey,
      keyPath: parentKey,
      label: parentKey ? parentKey.split(".").pop() || "" : String(obj),
      type: typeof obj,
      value: String(obj),
      depth,
    },
  ];
}

const metaTreeData = computed(() => {
  const meta = selectedArticle.value?.meta;
  if (!meta || typeof meta !== "object") return [];
  return buildMetaTree(meta);
});

function metaRowProps(row: MetaTreeRow) {
  return {
    style: {
      paddingLeft: `${row.depth * 12}px`,
    },
  };
}

async function openArticle(art: any) {
  selectedArticle.value = art;
  selectedArticleTags.value = art.tags?.map((t: any) => t.id) || [];
  showArticle.value = true;
  resolvedContent.value = [];
  resolvedContentLoading.value = true;

  if (!art.is_read) {
    artStore.markRead([art.id]);
    art.is_read = true;
  }

  try {
    const full = await artStore.fetchOne(art.id);
    if (full) {
      selectedArticle.value = full;
      selectedArticleTags.value = full.tags?.map((t: any) => t.id) || [];
    }

    const items: { type: string; value: string }[] = [];
    const rawContent = selectedArticle.value?.content;
    if (Array.isArray(rawContent) && rawContent.length > 0) {
      for (const item of rawContent) {
        if (item.value) {
          items.push({
            type: item.type || "text/plain",
            value: DOMPurify.sanitize(
              await resolveFilePlaceholders(item.value, connStore.baseURL, connStore.token)
            ),
          });
        }
      }
    }
    if (items.length === 0) {
      const html = selectedArticle.value?.summary || "";
      items.push({
        type: "text/html",
        value: DOMPurify.sanitize(
          await resolveFilePlaceholders(html, connStore.baseURL, connStore.token)
        ),
      });
    }
    resolvedContent.value = items;
  } finally {
    resolvedContentLoading.value = false;
  }
}

async function onArticleTagsChange(tagIds: string[]) {
  if (!selectedArticle.value) return;
  const currentIds = selectedArticle.value.tags?.map((t: any) => t.id) || [];
  const toAdd = tagIds.filter((id) => !currentIds.includes(id));
  const toRemove = currentIds.filter((id: string) => !tagIds.includes(id));
  for (const tagId of toAdd) {
    await tagStore.tagArticle(selectedArticle.value.id, [tagId]);
  }
  for (const tagId of toRemove) {
    await tagStore.untagArticle(selectedArticle.value.id, tagId);
  }
  selectedArticle.value.tags = tagStore.tags.filter((t) => tagIds.includes(t.id));
}

async function addNewTag() {
  const title = newTagTitle.value.trim();
  if (!title || !selectedArticle.value) return;
  const tag = await tagStore.create({ title });
  newTagTitle.value = "";
  if (tag) {
    await tagStore.tagArticle(selectedArticle.value.id, [tag.id]);
    if (!selectedArticleTags.value.includes(tag.id)) {
      selectedArticleTags.value.push(tag.id);
    }
    if (!selectedArticle.value.tags) selectedArticle.value.tags = [];
    selectedArticle.value.tags.push(tag);
  }
}

async function toggleSelectedStar() {
  if (!selectedArticle.value) return;
  const listArt = artStore.articles.find((a) => a.id === selectedArticle.value.id);
  if (listArt) listArt.is_star = selectedArticle.value.is_star;
  await artStore.markStar([selectedArticle.value.id]);
  selectedArticle.value.is_star = listArt?.is_star ?? !selectedArticle.value.is_star;
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}

function openOriginal() {
  if (selectedArticle.value?.link) {
    openExternal(selectedArticle.value.link);
  }
}

function onPageChange() {
  load();
}

async function markRead(art: any) {
  await artStore.markRead([art.id]);
  art.is_read = true;
}

async function markUnread(art: any) {
  await artStore.markUnread([art.id]);
  art.is_read = false;
}

async function toggleStar(art: any) {
  await artStore.markStar([art.id]);
  const updated = artStore.articles.find((a) => a.id === art.id);
  if (updated) art.is_star = updated.is_star;
}

async function toggleHide(art: any) {
  if (art.is_hide) {
    await artStore.markUnhide([art.id]);
    art.is_hide = false;
  } else {
    await artStore.markHide([art.id]);
    art.is_hide = true;
  }
}

function load() {
  const params: Record<string, any> = {};
  if (props.subscriptionId) params.subscription_id = props.subscriptionId;
  if (props.categoryId) params.category_id = props.categoryId;
  if (props.siteId) params.site_id = props.siteId;
  if (props.tag) params.tag = props.tag;
  if (props.search) params.search = props.search;
  if (props.isRead !== undefined) params.is_read = props.isRead;
  if (props.isStar !== undefined) params.is_star = props.isStar;
  if (props.isHide !== undefined) params.is_hide = props.isHide;
  if (props.order) params.order = props.order;
  artStore.fetchList(params);
}

function handleSubscriptionFetch(payload: { subscription_id?: string; added?: number; error?: string }) {
  if (!props.subscriptionId || payload.subscription_id !== props.subscriptionId) return;
  subStore.fetch(payload.subscription_id);
  load();
}

onMounted(() => {
  wsClient.on("subscription.fetch", handleSubscriptionFetch);
});

onUnmounted(() => {
  wsClient.off("subscription.fetch", handleSubscriptionFetch);
});

watch(() => [props.subscriptionId, props.categoryId, props.siteId, props.tag, props.search, props.isRead, props.isStar, props.isHide, props.order], () => {
  artStore.page = 1;
  load();
}, { immediate: true });

watch(() => artStore.articles, () => {
  showArticle.value = false;
  showMetaDrawer.value = false;
  selectedArticle.value = null;
}, { deep: true });
</script>

<style scoped>
.article-list {
  width: 100%;
  min-height: 100%;
}
.article-content {
  width: 100%;
  max-width: 100%;
  overflow-wrap: break-word;
  flex: 1;
}
.article-content > div {
  max-width: 100%;
}
.article-content :deep(img) {
  max-width: 100% !important;
  width: auto !important;
  height: auto !important;
  display: block;
}
.article-content :deep(table) {
  max-width: 100%;
  width: 100%;
  table-layout: fixed;
}
.article-content :deep(pre) {
  overflow-x: auto;
  max-width: 100%;
}
.article-content :deep(pre),
.article-content :deep(code) {
  white-space: pre-wrap;
  word-break: break-word;
}
.article-content .plain-text {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}
.article-body {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
.article-actions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--n-border-color, #eee);
}
.drawer-header {
  line-height: 1.3;
}
.drawer-title {
  font-size: 16px;
  font-weight: 600;
  word-break: break-word;
}
.drawer-meta {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>
