<template>
  <n-space vertical>
    <n-spin :show="artStore.loading">
      <n-list hoverable clickable>
        <n-list-item v-for="art in artStore.articles" :key="art.id"
          @click="openArticle(art)"
          style="padding: 12px 16px"
        >
          <n-thing
            :title="art.title"
            :description="relativeTime(art.publish_time)"
          >
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
      <div v-if="selectedArticle" class="article-content" v-html="resolvedSummary" />
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
}>();

const artStore = useArticleStore();
const connStore = useConnectionStore();
const showArticle = ref(false);
const selectedArticle = ref<any>(null);
const resolvedSummary = ref("");

async function openArticle(art: any) {
  selectedArticle.value = art;
  showArticle.value = true;
  if (!art.is_read) {
    artStore.markRead([art.id]);
    art.is_read = true;
  }
  const html = art.content || art.summary || "";
  resolvedSummary.value = DOMPurify.sanitize(
    await resolveFilePlaceholders(html, connStore.baseURL, connStore.token)
  );
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
  artStore.fetchList(params);
}

watch(() => [props.subscriptionId, props.categoryId, props.search], load, { immediate: true });
</script>

<style scoped>
.article-content {
  max-width: 100%;
}
.article-content img {
  max-width: 100%;
  height: auto;
  display: block;
}
.article-content pre {
  overflow-x: auto;
}
.article-content pre,
.article-content code {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
