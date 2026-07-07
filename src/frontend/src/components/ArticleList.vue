<template>
  <n-space vertical>
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
              <n-tag v-if="!art.is_read" type="success" size="small">New</n-tag>
              <n-tag v-if="art.is_star" type="warning" size="small">Star</n-tag>
            </template>
            <template #action>
              <n-space>
                <n-button text size="tiny" @click.stop="artStore.markRead([art.id])"
                  >Read</n-button>
                <n-button text size="tiny" @click.stop="artStore.markStar([art.id])"
                  >Star</n-button>
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
        @update:page="onPageChange"
        @update:page-size="onPageChange"
      />
    </n-spin>

    <n-modal v-model:show="showArticle" preset="card" style="width: 80vw; max-width: 900px" :title="selectedArticle?.title">
      <div v-if="selectedArticle" class="article-content">
        <template v-for="(item, idx) in resolvedContent" :key="idx">
          <div v-if="item.type === 'text/html'" v-html="item.value" />
          <pre v-else-if="item.type === 'text/plain'" class="plain-text">{{ item.value }}</pre>
          <n-tag v-else type="warning" size="small">未支持: {{ item.type }}</n-tag>
        </template>
      </div>
      <template #footer>
        <n-space>
          <n-button @click="openOriginal">Open Original</n-button>
          <n-button @click="showArticle = false">Close</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useArticleStore, useConnectionStore } from "@/stores";
import { relativeTime, resolveFilePlaceholders } from "@rosser/shared";
import { openExternal } from "@/platform";
import DOMPurify from "dompurify";

const props = defineProps<{
  subscriptionId?: string;
  categoryId?: string;
  search?: string;
  isRead?: boolean;
  isStar?: boolean;
}>();

const artStore = useArticleStore();
const connStore = useConnectionStore();
const showArticle = ref(false);
const selectedArticle = ref<any>(null);
const resolvedContent = ref<{ type: string; value: string }[]>([]);

async function openArticle(art: any) {
  selectedArticle.value = art;
  showArticle.value = true;
  if (!art.is_read) {
    artStore.markRead([art.id]);
    art.is_read = true;
  }

  const items: { type: string; value: string }[] = [];
  const rawContent = art.content;
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
    const html = art.summary || "";
    items.push({
      type: "text/html",
      value: DOMPurify.sanitize(
        await resolveFilePlaceholders(html, connStore.baseURL, connStore.token)
      ),
    });
  }
  resolvedContent.value = items;
}

function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
}

function openOriginal() {
  if (selectedArticle.value?.link) {
    openExternal(selectedArticle.value.link);
  }
}

function onPageChange() {
  load();
}

function load() {
  const params: Record<string, any> = {};
  if (props.subscriptionId) params.subscription_id = props.subscriptionId;
  if (props.categoryId) params.category_id = props.categoryId;
  if (props.search) params.search = props.search;
  if (props.isRead !== undefined) params.is_read = props.isRead;
  if (props.isStar !== undefined) params.is_star = props.isStar;
  artStore.fetchList(params);
}

watch(() => [props.subscriptionId, props.categoryId, props.search, props.isRead, props.isStar], load, { immediate: true });
</script>

<style scoped>
.article-content {
  width: 100%;
  max-width: 100%;
  overflow-wrap: break-word;
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
</style>
