<template>
  <n-drawer
    v-model:show="show"
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
              <HtmlRender
                v-if="item.type === 'text/html'"
                :html="item.value"
              />
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
              <n-button size="small" @click="openMeta">{{ t('metaInspector') }}</n-button>
            </n-space>
          </div>
        </div>
      </n-spin>
    </n-drawer-content>
  </n-drawer>

  <ArticleMetaDrawer ref="metaDrawerRef" :drawer-target="drawerTarget" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { AddOutline } from "@vicons/ionicons5";
import { useArticleStore, useConnectionStore, useTagStore } from "@/stores";
import { relativeTime, resolveFilePlaceholders } from "@rosser/shared";
import { openExternal } from "@/platform";
import HtmlRender from "./render/HtmlRender.vue";
import ArticleMetaDrawer from "./ArticleMetaDrawer.vue";
import DOMPurify from "dompurify";

const { t } = useI18n();

const props = defineProps<{
  drawerTarget?: HTMLElement | null;
}>();

const artStore = useArticleStore();
const connStore = useConnectionStore();
const tagStore = useTagStore();

const show = ref(false);
const selectedArticle = ref<any>(null);
const resolvedContent = ref<{ type: string; value: string }[]>([]);
const resolvedContentLoading = ref(false);
const selectedArticleTags = ref<string[]>([]);
const newTagTitle = ref("");
const metaDrawerRef = ref<InstanceType<typeof ArticleMetaDrawer> | null>(null);

const tagOptions = computed(() =>
  tagStore.tags.map((tag: any) => ({ label: tag.title, value: tag.id }))
);

function isImagePreviewOpen() {
  return !!document.querySelector(".n-image-preview-container");
}

function onKeydownCapture(e: KeyboardEvent) {
  if (e.key === "Escape" && isImagePreviewOpen()) {
    e.stopImmediatePropagation();
    const overlay = document.querySelector(".n-image-preview-overlay") as HTMLElement | null;
    overlay?.click();
  }
}

async function open(art: any) {
  selectedArticle.value = art;
  selectedArticleTags.value = art.tags?.map((t: any) => t.id) || [];
  show.value = true;
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

function close() {
  show.value = false;
  metaDrawerRef.value?.close();
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

function openOriginal() {
  if (selectedArticle.value?.link) {
    openExternal(selectedArticle.value.link);
  }
}

function openMeta() {
  metaDrawerRef.value?.open(selectedArticle.value?.meta);
}

onMounted(() => {
  document.addEventListener("keydown", onKeydownCapture, true);
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeydownCapture, true);
});

defineExpose({ open, close });
</script>

<style scoped>
.article-content {
  width: 100%;
  max-width: 100%;
  overflow-wrap: break-word;
  flex: 1;
}
.article-content :deep(.n-image-preview-mask),
.article-content :deep(.n-image-preview-container) {
  z-index: 2500;
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
