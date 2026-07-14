<template>
  <div
    class="group py-3.5 cursor-pointer transition-all flex flex-col gap-1.5 relative"
    data-testid="article-cell"
    @click="$emit('open', art.id)"
  >
    <!-- Meta row -->
    <div class="flex justify-between items-center text-[10px] font-bold">
      <span class="uppercase tracking-wider text-brand font-extrabold flex items-center gap-1 truncate">
        <img
          v-if="feedIcon"
          :src="feedIcon"
          alt=""
          class="w-3.5 h-3.5 rounded object-contain shrink-0"
          referrerpolicy="no-referrer"
        />
        <span
          v-else
          class="w-3.5 h-3.5 bg-brand-light text-brand flex items-center justify-center text-[8px] font-black rounded shrink-0"
        >
          R
        </span>
        <span class="truncate">{{ feedTitle }}</span>
      </span>
      <span class="text-slate-400 dark:text-zinc-500 font-mono text-[9px] font-medium shrink-0">
        {{ displayTime }}
      </span>
    </div>

    <!-- Title -->
    <h2
      class="text-sm font-semibold text-slate-800 dark:text-zinc-100 leading-snug tracking-tight group-hover:text-brand transition-colors line-clamp-2"
    >
      {{ art.title }}
    </h2>

    <!-- Summary row -->
    <p
      v-if="art.summary"
      class="text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed line-clamp-2"
    >
      {{ plainSummary }}
    </p>

    <!-- Tags + quick controls -->
    <div class="flex items-center justify-between mt-1">
      <div class="flex flex-wrap gap-1.5 items-center">
        <span
          v-if="!art.is_read"
          class="w-1.5 h-1.5 rounded-full bg-brand shrink-0 animate-pulse"
        />
        <span
          v-for="tag in visibleTags"
          :key="tag.id"
          class="px-2 py-0.5 text-[9px] rounded font-bold uppercase tracking-wide border"
          :style="tagStyle(tag)"
        >
          {{ tag.title }}
        </span>

        <span
          v-if="art.tags?.length === 0"
          class="px-2 py-0.5 bg-slate-50 dark:bg-zinc-800/50 text-slate-400 dark:text-zinc-500 text-[9px] rounded uppercase font-bold tracking-wide"
        >
          {{ t("article") }}
        </span>
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <button
          class="p-1 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          :class="art.is_star ? 'text-amber-500' : 'text-slate-300 dark:text-zinc-600 hover:text-amber-500'"
          @click.stop="$emit('star', art.id)"
        >
          <component
            :is="Star"
            class="w-3.5 h-3.5"
            :class="art.is_star ? 'fill-current' : ''"
          />
        </button>
        <button
          class="p-1 rounded hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-300 dark:text-zinc-600 hover:text-red-400 transition-colors"
          @click.stop="$emit('hide', art.id)"
        >
          <component :is="EyeOff" class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { Star, EyeOff } from "@vicons/ionicons5";
import { relativeTime, buildFileUrl } from "@rosser/shared";
import { useSubscriptionStore } from "@/stores/subscription";
import { useSiteStore } from "@/stores/site";
import { useConnectionStore } from "@/stores/connection";
import type { components } from "@rosser/shared/api";

type ArticleListItem = components["schemas"]["ArticleListItem"];
type Tag = components["schemas"]["TagOut"];

const props = defineProps<{
  art: ArticleListItem;
}>();

const emit = defineEmits<{
  (e: "open", id: string): void;
  (e: "star", id: string): void;
  (e: "hide", id: string): void;
}>();

const { t, locale } = useI18n();
const subStore = useSubscriptionStore();
const siteStore = useSiteStore();
const conn = useConnectionStore();

const feedIcon = ref("");

const feed = computed(() =>
  subStore.subscriptions.find((s) => s.id === props.art.subscription_id)
);

const feedTitle = computed(() => {
  if (feed.value?.title) return feed.value.title;
  return t("unknownSite");
});

watch(
  () => feed.value?.site_id,
  async (siteId) => {
    if (!siteId) {
      feedIcon.value = "";
      return;
    }
    const site = siteStore.sites.find((s) => s.id === siteId);
    if (site?.favicon_id) {
      feedIcon.value = await buildFileUrl(site.favicon_id, conn.baseURL, conn.token);
    } else {
      feedIcon.value = "";
    }
  },
  { immediate: true }
);

const displayTime = computed(() => {
  return relativeTime(props.art.publish_time, locale.value);
});

const plainSummary = computed(() => {
  if (!props.art.summary) return "";
  return props.art.summary.replace(/\u003c[^\u003e]*\u003e/g, "");
});

const visibleTags = computed(() => {
  return (props.art.tags || []).slice(0, 3) as Tag[];
});

function tagStyle(tag: Tag) {
  const color = tag.color || "#9ca3af";
  return {
    color,
    borderColor: `${color}20`,
  };
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
