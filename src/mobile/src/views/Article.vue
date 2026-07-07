<template>
  <div>
    <var-app-bar :title="article?.title || 'Article'" title-position="center">
      <template #left>
        <var-button text type="primary" @click="$router.back()">Back</var-button>
      </template>
    </var-app-bar>

    <div v-if="article" class="article-content" style="padding: 16px" v-html="sanitizedSummary" />

    <var-bottom-navigation v-model:active="action">
      <var-bottom-navigation-item label="Read" icon="checkbox-marked-circle" @click="markRead" />
      <var-bottom-navigation-item label="Star" icon="star" @click="markStar" />
      <var-bottom-navigation-item label="Open" icon="open-in-new" @click="openOriginal" />
    </var-bottom-navigation>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { api } from "@rosser/shared";
import DOMPurify from "dompurify";

const route = useRoute();
const article = ref<any>(null);
const action = ref(0);

const sanitizedSummary = computed(() => {
  if (!article.value?.summary) return "";
  return DOMPurify.sanitize(article.value.summary);
});

async function load() {
  const { data } = await api.GET("/api/articles", {
    query: { page: 1, size: 1, subscription_id: String(route.params.id) },
  });
  // This is a simplified approach; in production, add a dedicated GET /articles/{id} endpoint
  if (data?.items?.[0]) article.value = data.items[0];
}

async function markRead() {
  if (article.value) {
    await api.POST("/api/articles/read", { body: { ids: [article.value.id] } });
    article.value.is_read = true;
  }
}

async function markStar() {
  if (article.value) {
    await api.POST("/api/articles/star", { body: { ids: [article.value.id] } });
    article.value.is_star = true;
  }
}

function openOriginal() {
  if (article.value?.link) {
    window.open(article.value.link, "_blank");
  }
}

onMounted(load);
</script>
