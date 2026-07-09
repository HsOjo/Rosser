<template>
  <n-list-item style="padding: 12px 16px" @click="emit('click')">
    <n-thing :title="article.title">
      <template #header-extra>
        <span style="font-size: 12px; color: #999; white-space: nowrap;">
          {{ relativeTime(article.publish_time) }}
        </span>
      </template>
      <template #description>
        <n-ellipsis :line-clamp="2" :tooltip="false" style="font-size: 13px; color: #666;">
          {{ stripHtml(article.summary || "") }}
        </n-ellipsis>
      </template>
      <template #avatar>
        <n-tag v-if="!article.is_read" type="success" size="small">{{ t('new') }}</n-tag>
        <n-tag v-if="article.is_star" type="warning" size="small">{{ t('star') }}</n-tag>
      </template>
      <template #action>
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
      </template>
    </n-thing>
  </n-list-item>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { relativeTime } from "@rosser/shared";

const { t } = useI18n();

defineProps<{
  article: any;
}>();

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
