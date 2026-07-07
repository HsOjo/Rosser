<template>
  <div>
    <var-app-bar :title="$t('appName')">
      <template #right>
        <var-button text type="primary" @click="$router.push('/settings')">{{ $t('settings') }}</var-button>
      </template>
    </var-app-bar>

    <var-tabs v-model:active="activeTab">
      <var-tab>{{ $t('articles') }}</var-tab>
      <var-tab>{{ $t('subscriptions') }}</var-tab>
    </var-tabs>

    <var-tabs-items v-model:active="activeTab">
      <var-tab-item>
        <var-list loading-text="Loading" :finished="finished" @load="loadMore">
          <var-cell v-for="art in artStore.articles" :key="art.id" :title="art.title"
            @click="openArticle(art)"
          >
            <template #description>
              <span>{{ relativeTime(art.publish_time) }}</span>
              <var-chip v-if="!art.is_read" type="primary" size="mini">New</var-chip>
              <var-chip v-if="art.is_star" type="warning" size="mini">Star</var-chip>
            </template>
          </var-cell>
        </var-list>
      </var-tab-item>

      <var-tab-item>
        <var-cell v-for="sub in subStore.subscriptions" :key="sub.id" :title="sub.title"
          @click="filterBySub(sub.id)"
        />
      </var-tab-item>
    </var-tabs-items>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useArticleStore, useSubscriptionStore } from "@/stores";
import { relativeTime } from "@rosser/shared";

const router = useRouter();
const artStore = useArticleStore();
const subStore = useSubscriptionStore();

const activeTab = ref(0);
const finished = ref(false);

function loadMore() {
  artStore.page += 1;
  artStore.fetchList().then(() => {
    finished.value = artStore.articles.length >= artStore.total;
  });
}

function openArticle(art: any) {
  router.push(`/article/${art.id}`);
}

function filterBySub(subId: string) {
  activeTab.value = 0;
  artStore.page = 1;
  artStore.fetchList({ subscription_id: subId });
}

onMounted(() => {
  artStore.fetchList();
  subStore.fetchAll();
});
</script>
