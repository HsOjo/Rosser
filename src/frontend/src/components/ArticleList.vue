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
        @update:page="onPageChange"
        @update:page-size="onPageChange"
      />
    </n-spin>

    <n-modal v-model:show="showArticle" preset="card" style="width: 80vw; max-width: 900px" :title="selectedArticle?.title">
      <div v-if="selectedArticle" class="article-content">
        <n-space v-if="tagStore.tags.length > 0" style="margin-bottom: 12px">
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
        </n-space>
        <template v-for="(item, idx) in resolvedContent" :key="idx">
          <div v-if="item.type === 'text/html'" v-html="item.value" />
          <pre v-else-if="item.type === 'text/plain'" class="plain-text">{{ item.value }}</pre>
          <n-tag v-else type="warning" size="small">{{ t('unsupportedType', { type: item.type }) }}</n-tag>
        </template>
      </div>
      <template #footer>
        <n-space>
          <n-button @click="openDetail">{{ t('articleDetail') }}</n-button>
          <n-button @click="openOriginal">{{ t('openOriginal') }}</n-button>
          <n-button @click="showArticle = false">{{ t('close') }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useArticleStore, useConnectionStore, useSubscriptionStore, useTagStore } from "@/stores";
import { relativeTime, resolveFilePlaceholders, wsClient } from "@rosser/shared";
import { openExternal } from "@/platform";
import DOMPurify from "dompurify";

const { t } = useI18n();
const router = useRouter();

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
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
}>();

const artStore = useArticleStore();
const connStore = useConnectionStore();
const subStore = useSubscriptionStore();
const tagStore = useTagStore();
const showArticle = ref(false);
const selectedArticle = ref<any>(null);
const resolvedContent = ref<{ type: string; value: string }[]>([]);
const selectedArticleTags = ref<string[]>([]);

const tagOptions = computed(() =>
  tagStore.tags.map((tag: any) => ({ label: tag.title, value: tag.id }))
);

async function openArticle(art: any) {
  selectedArticle.value = art;
  selectedArticleTags.value = art.tags?.map((t: any) => t.id) || [];
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

function openDetail() {
  if (selectedArticle.value?.id) {
    router.push(`/article/${selectedArticle.value.id}`);
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
