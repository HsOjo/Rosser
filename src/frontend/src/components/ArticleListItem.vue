<template>
  <n-list-item style="padding: 12px 16px" @click="emit('click')">
    <div :style="itemStyle">
      <!-- Meta row -->
      <div
        v-if="showSource"
        style="display: flex; justify-content: space-between; align-items: center; gap: 8px;"
      >
        <n-ellipsis
          :line-clamp="1"
          :tooltip="false"
          style="font-size: 12px; color: #999;"
        >
          <n-space :size="4" align="center" :wrap-item="false">
            <img
              v-if="feedIcon"
              :src="feedIcon"
              alt=""
              style="width: 14px; height: 14px; border-radius: 2px; object-fit: cover; vertical-align: middle;"
              @error="onIconError"
            />
            <n-icon v-else size="14"><GlobeOutline /></n-icon>
            <span>{{ feedTitle }}</span>
          </n-space>
        </n-ellipsis>
        <span style="font-size: 12px; color: #999; white-space: nowrap;">
          {{ relativeTime(article.publish_time) }}
        </span>
      </div>

      <!-- Title -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
        <div style="font-size: 16px; font-weight: 500; line-height: 1.4; flex: 1;">
          {{ article.title }}
        </div>
        <span
          v-if="!showSource"
          style="font-size: 12px; color: #999; white-space: nowrap; margin-top: 2px;"
        >
          {{ relativeTime(article.publish_time) }}
        </span>
      </div>

      <!-- Summary -->
      <n-ellipsis
        v-if="article.summary"
        :line-clamp="2"
        :tooltip="false"
        style="font-size: 13px; color: #666;"
      >
        {{ stripHtml(article.summary) }}
      </n-ellipsis>

      <!-- Tags + actions -->
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
        <n-space :size="8" align="center">
          <span
            v-if="!article.is_read"
            class="unread-emoji"
            :title="t('new')"
          >🆕</span>
          <span
            v-if="article.is_star"
            class="star-emoji"
            :title="t('star')"
          >🌟</span>
        </n-space>
        <n-space>
          <n-button v-if="article.is_read" text size="tiny" @click.stop="emit('mark-unread')"
            >{{ t('unread') }}</n-button
          >
          <n-button v-else text size="tiny" @click.stop="emit('mark-read')"
            >{{ t('read') }}</n-button
          >
          <n-button text size="tiny" @click.stop="emit('toggle-star')"
            >{{ article.is_star ? t('unstar') : t('star') }}</n-button
          >
          <n-button text size="tiny" @click.stop="emit('toggle-hide')"
            >{{ article.is_hide ? t('unhide') : t('hide') }}</n-button
          >
        </n-space>
      </div>
    </div>
  </n-list-item>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { computed, ref, watch, type CSSProperties } from "vue";
import { GlobeOutline } from "@vicons/ionicons5";
import { relativeTime, buildFileUrl } from "@rosser/shared";
import { useSubscriptionStore, useSiteStore, useConnectionStore } from "@/stores";

const { t } = useI18n();

const props = defineProps<{
  article: any;
  showSource?: boolean;
  isHide?: boolean;
}>();

const subStore = useSubscriptionStore();
const siteStore = useSiteStore();
const connStore = useConnectionStore();

const feedIcon = ref("");

const itemStyle = computed<CSSProperties>(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  width: "100%",
  opacity: props.article.is_hide && !props.isHide ? 0.5 : 1,
}));

const feed = computed(() =>
  subStore.subscriptions.find((s: any) => s.id === props.article.subscription_id)
);

const feedTitle = computed(() => {
  if (feed.value?.title) return feed.value.title;
  const siteId = feed.value?.site_id;
  if (siteId) {
    const site = siteStore.byId[siteId];
    if (site?.title) return site.title;
  }
  return t("unknownSite");
});

watch(
  () => feed.value?.site_id,
  async (siteId) => {
    if (!siteId) {
      feedIcon.value = "";
      return;
    }
    const site = siteStore.byId[siteId];
    if (site?.favicon_id && connStore.baseURL && connStore.token) {
      try {
        feedIcon.value = await buildFileUrl(site.favicon_id, connStore.baseURL, connStore.token);
      } catch {
        feedIcon.value = "";
      }
    } else {
      feedIcon.value = "";
    }
  },
  { immediate: true }
);

function onIconError(e: Event) {
  (e.target as HTMLImageElement).style.display = "none";
}

const emit = defineEmits<{
  (e: "click"): void;
  (e: "mark-read"): void;
  (e: "mark-unread"): void;
  (e: "toggle-star"): void;
  (e: "toggle-hide"): void;
}>();

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}
</script>

<style scoped>
@keyframes unread-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.unread-emoji {
  font-size: 12px;
  line-height: 1;
  display: inline-block;
  animation: unread-pulse 1.5s ease-in-out infinite;
}

@keyframes star-shake {
  0%,
  100% {
    transform: rotate(0deg);
  }
  75% {
    transform: rotate(0deg);
  }
  78% {
    transform: rotate(-18deg);
  }
  81% {
    transform: rotate(18deg);
  }
  84% {
    transform: rotate(-18deg);
  }
  87% {
    transform: rotate(18deg);
  }
  90% {
    transform: rotate(0deg);
  }
}

.star-emoji {
  font-size: 12px;
  line-height: 1;
  display: inline-block;
  animation: star-shake 3s ease-in-out infinite;
  transform-origin: center;
}
</style>
