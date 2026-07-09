<template>
  <div class="article-list">
    <n-spin :show="artStore.loading">
      <n-list clickable>
        <ArticleListItem
          v-for="art in artStore.articles"
          :key="art.id"
          :article="art"
          @click="openArticle(art)"
          @mark-read="markRead(art)"
          @mark-unread="markUnread(art)"
          @toggle-star="toggleStar(art)"
          @toggle-hide="toggleHide(art)"
        />
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

    <ArticleDrawer ref="articleDrawerRef" :drawer-target="drawerTarget" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useArticleStore, useSubscriptionStore } from "@/stores";
import { wsClient } from "@rosser/shared";
import ArticleListItem from "./ArticleListItem.vue";
import ArticleDrawer from "./ArticleDrawer.vue";

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
const subStore = useSubscriptionStore();
const articleDrawerRef = ref<InstanceType<typeof ArticleDrawer> | null>(null);

function openArticle(art: any) {
  articleDrawerRef.value?.open(art);
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
  articleDrawerRef.value?.close();
});
</script>

<style scoped>
.article-list {
  width: 100%;
  min-height: 100%;
}
</style>
