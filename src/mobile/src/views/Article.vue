<template>
  <div>
    <var-app-bar :title="article?.title || $t('articles')" title-position="center">
      <template #left>
        <var-button text type="primary" @click="$router.back()">{{ $t('back') }}</var-button>
      </template>
    </var-app-bar>

    <div v-if="tagStore.tags.length > 0" style="padding: 8px 16px;">
      <var-select
        v-model="selectedTags"
        multiple
        clearable
        size="small"
        variant="outlined"
        :placeholder="$t('selectTags')"
        @change="onTagsChange"
      >
        <var-option v-for="tag in tagStore.tags" :key="tag.id" :label="tag.title" :value="tag.id" />
      </var-select>
    </div>

    <div v-if="article" class="article-content" style="padding: 16px; padding-bottom: 80px;">
      <template v-for="(item, idx) in resolvedContent" :key="idx">
        <div v-if="item.type === 'text/html'" v-html="item.value" />
        <pre v-else-if="item.type === 'text/plain'" class="plain-text">{{ item.value }}</pre>
        <var-chip v-else type="warning" size="mini">{{ $t('unsupportedType', { type: item.type }) }}</var-chip>
      </template>
    </div>

    <var-bottom-navigation v-model:active="actionIndex" fixed placeholder safe-area>
      <var-bottom-navigation-item
        :label="article?.is_read ? $t('unread') : $t('read')"
        :icon="article?.is_read ? 'checkbox-blank-circle-outline' : 'checkbox-marked-circle'"
        @click="toggleRead"
      />
      <var-bottom-navigation-item
        :label="article?.is_star ? $t('unstar') : $t('star')"
        :icon="article?.is_star ? 'star-off' : 'star'"
        @click="toggleStar"
      />
      <var-bottom-navigation-item :label="$t('openOriginal')" icon="open-in-new" @click="openOriginal" />
    </var-bottom-navigation>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { Snackbar } from "@varlet/ui";
import { api, resolveFilePlaceholders } from "@rosser/shared";
import { useConnectionStore, useTagStore, useArticleStore } from "@/stores";
import DOMPurify from "dompurify";

const route = useRoute();
const connStore = useConnectionStore();
const tagStore = useTagStore();
const artStore = useArticleStore();

const article = ref<any>(null);
const actionIndex = ref(0);
const selectedTags = ref<string[]>([]);
const resolvedContent = ref<{ type: string; value: string }[]>([]);

async function load() {
  try {
    const { data } = await api.GET("/api/articles/{article_id}", {
      params: { path: { article_id: String(route.params.id) } },
    });
    if (data) {
      article.value = data;
      selectedTags.value = data.tags?.map((t: any) => t.id) || [];
      await resolveArticleContent(data);
    }
  } catch {
    Snackbar.error("加载失败");
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

async function toggleRead() {
  if (!article.value) return;
  try {
    if (article.value.is_read) {
      await artStore.markUnread([article.value.id]);
      article.value.is_read = false;
    } else {
      await artStore.markRead([article.value.id]);
      article.value.is_read = true;
    }
  } catch {
    Snackbar.error("操作失败");
  }
}

async function toggleStar() {
  if (!article.value) return;
  try {
    await artStore.markStar([article.value.id]);
    const updated = artStore.articles.find((a) => a.id === article.value.id);
    article.value.is_star = updated ? updated.is_star : !article.value.is_star;
  } catch {
    Snackbar.error("操作失败");
  }
}

function openOriginal() {
  if (article.value?.link) {
    window.open(article.value.link, "_blank");
  }
}

async function onTagsChange() {
  if (!article.value) return;
  const currentIds = article.value.tags?.map((t: any) => t.id) || [];
  const toAdd = selectedTags.value.filter((id) => !currentIds.includes(id));
  const toRemove = currentIds.filter((id: string) => !selectedTags.value.includes(id));
  try {
    for (const tagId of toAdd) {
      await tagStore.tagArticle(article.value.id, [tagId]);
    }
    for (const tagId of toRemove) {
      await tagStore.untagArticle(article.value.id, tagId);
    }
    article.value.tags = tagStore.tags.filter((t) => selectedTags.value.includes(t.id));
    Snackbar.success("已保存");
  } catch {
    Snackbar.error("保存失败");
  }
}

onMounted(() => {
  load();
  tagStore.fetchAll();
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
.plain-text {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}
</style>
