<template>
  <n-space vertical style="padding: 16px; max-width: 900px; margin: 0 auto">
    <n-page-header @back="$router.push('/')" />

    <n-spin :show="loading">
      <n-card v-if="article" :title="article.title">
        <n-space style="margin-bottom: 12px">
          <span style="font-size: 12px; color: #999">{{ relativeTime(article.publish_time) }}</span>
          <n-tag v-if="!article.is_read" type="success" size="small">{{ t('new') }}</n-tag>
          <n-tag v-if="article.is_star" type="warning" size="small">{{ t('star') }}</n-tag>
        </n-space>

        <n-space v-if="tagStore.tags.length > 0" style="margin-bottom: 12px">
          <n-select
            v-model:value="articleTags"
            :options="tagOptions"
            multiple
            clearable
            size="small"
            style="min-width: 200px"
            :placeholder="t('tagged')"
            @update:value="onTagsChange"
          />
        </n-space>

        <div class="article-content">
          <template v-for="(item, idx) in resolvedContent" :key="idx">
            <div v-if="item.type === 'text/html'" v-html="item.value" />
            <pre v-else-if="item.type === 'text/plain'" class="plain-text">{{ item.value }}</pre>
            <n-tag v-else type="warning" size="small">{{ t('unsupportedType', { type: item.type }) }}</n-tag>
          </template>
        </div>

        <template #footer>
          <n-space>
            <n-button @click="toggleRead">{{ article.is_read ? t('unread') : t('read') }}</n-button>
            <n-button @click="toggleStar">{{ article.is_star ? t('unstar') : t('star') }}</n-button>
            <n-button @click="openOriginal">{{ t('openOriginal') }}</n-button>
          </n-space>
        </template>
      </n-card>

      <n-empty v-else-if="!loading" :description="$t('noData')" />
    </n-spin>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useArticleStore, useConnectionStore, useTagStore } from "@/stores";
import { api, relativeTime, resolveFilePlaceholders } from "@rosser/shared";
import { openExternal } from "@/platform";
import DOMPurify from "dompurify";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const artStore = useArticleStore();
const connStore = useConnectionStore();
const tagStore = useTagStore();

const article = ref<any>(null);
const loading = ref(false);
const resolvedContent = ref<{ type: string; value: string }[]>([]);

const articleTags = computed({
  get: () => article.value?.tags?.map((t: any) => t.id) || [],
  set: () => {},
});

const tagOptions = computed(() =>
  tagStore.tags.map((tag: any) => ({ label: tag.title, value: tag.id }))
);

async function loadArticle(id: string) {
  loading.value = true;
  try {
    const { data } = await api.GET("/api/articles/{article_id}", { params: { path: { article_id: id } } });
    article.value = data;
    if (data && !data.is_read) {
      await artStore.markRead([id]);
      article.value.is_read = true;
    }
    await resolveArticleContent(data);
  } finally {
    loading.value = false;
  }
}

async function resolveArticleContent(art: any) {
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

async function onTagsChange(tagIds: string[]) {
  if (!article.value) return;
  const currentIds = article.value.tags?.map((t: any) => t.id) || [];
  const toAdd = tagIds.filter((id) => !currentIds.includes(id));
  const toRemove = currentIds.filter((id: string) => !tagIds.includes(id));
  for (const tagId of toAdd) {
    await tagStore.tagArticle(article.value.id, [tagId]);
  }
  for (const tagId of toRemove) {
    await tagStore.untagArticle(article.value.id, tagId);
  }
  article.value.tags = tagStore.tags.filter((t) => tagIds.includes(t.id));
}

async function toggleRead() {
  if (!article.value) return;
  if (article.value.is_read) {
    await artStore.markUnread([article.value.id]);
    article.value.is_read = false;
  } else {
    await artStore.markRead([article.value.id]);
    article.value.is_read = true;
  }
}

async function toggleStar() {
  if (!article.value) return;
  await artStore.markStar([article.value.id]);
  article.value.is_star = !article.value.is_star;
}

function openOriginal() {
  if (article.value?.link) {
    openExternal(article.value.link);
  }
}

onMounted(() => {
  tagStore.fetchAll();
  const id = route.params.id as string;
  if (id) loadArticle(id);
});

watch(() => route.params.id, (id) => {
  if (id) loadArticle(id as string);
});
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
