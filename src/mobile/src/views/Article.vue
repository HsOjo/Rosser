<template>
  <div
    v-if="article"
    ref="containerRef"
    class="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-900 overflow-hidden"
    tabindex="-1"
    @keydown.esc="handleEsc"
  >
    <!-- Top nav -->
    <div
      class="shrink-0 px-3.5 py-2 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/60 select-none"
    >
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <button
          class="p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors flex items-center justify-center"
          data-testid="article-back"
          @click="back"
        >
          <component :is="ArrowBack" class="w-5 h-5" />
          <span class="sr-only">{{ t("back") }}</span>
        </button>
        <div
          v-if="feed"
          class="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400 font-bold tracking-tight truncate"
        >
          <img
            v-if="feedIcon"
            :src="feedIcon"
            alt=""
            class="w-3.5 h-3.5 rounded object-contain"
            referrerpolicy="no-referrer"
          />
          <div
            v-else
            class="w-3.5 h-3.5 rounded bg-brand-light text-brand flex items-center justify-center font-bold text-[8px]"
          >
            R
          </div>
          <span class="truncate">{{ feedTitle }}</span>
        </div>
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <button
          class="p-1.5 rounded-lg transition-colors"
          :class="
            article.is_star
              ? 'bg-amber-500/10 text-amber-500'
              : 'text-slate-400 hover:text-amber-500'
          "
          @click="toggleStar"
        >
          <component :is="Star" class="w-5 h-5 fill-current" />
        </button>
        <button
          class="p-1.5 rounded-lg transition-colors"
          :class="
            article.is_hide
              ? 'bg-red-500/10 text-red-500'
              : 'text-slate-400 hover:text-red-500'
          "
          @click="toggleHide"
        >
          <component :is="EyeOff" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Scrollable content -->
    <div ref="scrollRef" class="flex-1 overflow-y-auto px-4 py-3 scroll-smooth space-y-3">
      <div class="space-y-1.5 mt-1">
        <h1
          class="text-base font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight leading-snug"
        >
          {{ article.title }}
        </h1>
        <div class="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-2 flex-wrap">
          <span
            >{{ t("author") }}:
            <strong class="text-slate-600 dark:text-zinc-300 font-semibold">
              {{ article.author || "-" }}
            </strong>
          </span>
          <span v-if="article.publish_time">• {{ displayDate }}</span>
        </div>
        <hr class="border-slate-100 dark:border-zinc-800/40 my-3" />
      </div>

      <!-- Outline -->
      <div
        v-if="headings.length >= 2"
        class="p-3 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-2"
      >
        <button
          class="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-200"
          @click="showOutline = !showOutline"
        >
          <div class="flex items-center gap-1.5">
            <component :is="List" class="w-4 h-4 text-brand" />
            <span>{{ t("outline") }}</span>
          </div>
          <component
            :is="ChevronDown"
            class="w-4 h-4 transition-transform duration-200"
            :class="showOutline ? '' : '-rotate-90'"
          />
        </button>

        <div v-if="showOutline" class="mt-2.5 space-y-1 max-h-[120px] overflow-y-auto pr-1">
          <button
            v-for="heading in headings"
            :key="heading.id"
            class="w-full text-left text-[11px] py-1 px-2 rounded-lg text-slate-500 hover:text-brand hover:bg-slate-50 dark:text-zinc-400 dark:hover:text-brand dark:hover:bg-zinc-800/40 font-medium flex items-center gap-1 truncate"
            :style="{ paddingLeft: `${(heading.level - 1) * 8}px` }"
            @click="scrollToHeading(heading.id)"
          >
            <component :is="ChevronForward" class="w-3 h-3 text-brand/80 shrink-0" />
            <span class="truncate">{{ heading.text }}</span>
          </button>
        </div>
      </div>

      <!-- Article body -->
      <ArticleContent
        ref="articleContentRef"
        :content="article.content"
        :summary="article.summary"
        @update:headings="headings = $event"
      />

      <!-- Tags -->
      <TagManager
        :article-id="article.id"
        :tag-ids="article.tags.map((t) => t.id)"
        @change="onTagsChange"
      />

      <!-- Meta inspector -->
      <div class="p-3 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-2">
        <button
          class="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-200"
          @click="showMeta = !showMeta"
        >
          <div class="flex items-center gap-1.5">
            <component :is="Server" class="w-4 h-4 text-brand" />
            <span>{{ t("metaViewer") }}</span>
          </div>
          <component
            :is="ChevronDown"
            class="w-4 h-4 transition-transform duration-200"
            :class="showMeta ? '' : '-rotate-90'"
          />
        </button>

        <div
          v-if="showMeta"
          class="mt-3.5 p-3 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 font-mono text-[9px] relative overflow-x-auto leading-normal"
        >
          <div
            v-if="copied"
            class="absolute top-2 right-2 p-1 px-2 bg-brand text-white rounded-md text-[8px] font-bold flex items-center gap-1"
          >
            <component :is="Checkmark" class="w-2.5 h-2.5" />
            {{ t("copied") }}
          </div>
          <div
            class="flex items-center justify-between text-[8px] text-zinc-500 uppercase pb-1.5 border-b border-zinc-900 mb-1"
          >
            <span>{{ t("doubleClickCopy") }}</span>
            <component :is="Copy" class="w-2.5 h-2.5" />
          </div>
          <MetaTree :data="article.meta" @copy="copy" />
        </div>
      </div>

      <!-- Open original -->
      <a
        v-if="article.link"
        :href="article.link"
        target="_blank"
        rel="noopener noreferrer"
        class="w-full py-3 bg-slate-900 hover:bg-slate-950 dark:bg-zinc-100 dark:hover:bg-zinc-50 dark:text-zinc-900 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
      >
        <component :is="Open" class="w-4 h-4" />
        {{ t("openOriginal") }}
      </a>

      <div class="h-6" />
    </div>
  </div>

  <!-- Loading / error state -->
  <div
    v-else
    class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 p-6"
  >
    <div
      v-if="loading"
      class="w-8 h-8 border-2 border-slate-200 dark:border-zinc-700 border-t-brand rounded-full animate-spin"
    />
    <div v-else class="text-center text-slate-500 dark:text-zinc-400">
      <p class="text-sm font-bold">{{ t("loadFailed") }}</p>
      <button
        class="mt-4 px-4 py-2 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-bold"
        @click="back"
      >
        {{ t("back") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  ArrowBack,
  Star,
  EyeOff,
  List,
  ChevronDown,
  ChevronForward,
  Server,
  Checkmark,
  Copy,
  Open,
} from "@vicons/ionicons5";
import { buildFileUrl } from "@rosser/shared";
import {
  useArticleStore,
  useSubscriptionStore,
  useSiteStore,
  useTagStore,
} from "@/stores";
import { useConnectionStore } from "@/stores/connection";
import ArticleContent from "@/components/ArticleContent.vue";
import TagManager from "@/components/TagManager.vue";
import MetaTree from "@/components/MetaTree.vue";
import type { components } from "@rosser/shared/api";
import type { OutlineItem } from "@/components/ArticleContent.vue";

type ArticleOut = components["schemas"]["ArticleOut"];

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const artStore = useArticleStore();
const subStore = useSubscriptionStore();
const siteStore = useSiteStore();
const tagStore = useTagStore();
const conn = useConnectionStore();

const article = ref<ArticleOut | null>(null);
const loading = ref(false);
const headings = ref<OutlineItem[]>([]);
const showOutline = ref(true);
const showMeta = ref(false);
const copied = ref(false);
const containerRef = ref<HTMLDivElement | null>(null);
const scrollRef = ref<HTMLDivElement | null>(null);
const articleContentRef = ref<InstanceType<typeof ArticleContent> | null>(null);

const articleId = computed(() => route.params.id as string);

const feed = computed(() =>
  subStore.subscriptions.find((s) => s.id === article.value?.subscription_id)
);

const feedTitle = computed(() => {
  if (feed.value?.title) return feed.value.title;
  const site = feed.value?.site_id
    ? siteStore.sites.find((s) => s.id === feed.value!.site_id)
    : undefined;
  return site?.title || t("unknownSite");
});

const feedIcon = ref("");

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


const displayDate = computed(() => {
  if (!article.value?.publish_time) return "";
  return new Date(article.value.publish_time).toLocaleDateString();
});

async function load() {
  if (!articleId.value) return;
  loading.value = true;
  try {
    const data = await artStore.fetchOne(articleId.value);
    if (data) {
      article.value = data;
      if (!data.is_read) {
        await artStore.markRead([data.id]);
        data.is_read = true;
      }
    }
  } finally {
    loading.value = false;
  }
}

async function toggleStar() {
  if (!article.value) return;
  await artStore.markStar([article.value.id]);
  article.value.is_star = !article.value.is_star;
}

async function toggleHide() {
  if (!article.value) return;
  if (article.value.is_hide) {
    await artStore.markUnhide([article.value.id]);
    article.value.is_hide = false;
  } else {
    await artStore.markHide([article.value.id]);
    article.value.is_hide = true;
  }
}

async function onTagsChange(newTagIds: string[]) {
  if (!article.value) return;
  const oldIds = article.value.tags.map((t) => t.id);
  const toAdd = newTagIds.filter((id) => !oldIds.includes(id));
  const toRemove = oldIds.filter((id) => !newTagIds.includes(id));

  if (toAdd.length > 0) {
    await tagStore.tagArticle(article.value.id, toAdd);
  }
  for (const id of toRemove) {
    await tagStore.untagArticle(article.value.id, id);
  }

  const data = await artStore.fetchOne(article.value.id);
  if (data) article.value = data;
}

function scrollToHeading(id: string) {
  const el = document.getElementById(id);
  if (el && scrollRef.value) {
    el.scrollIntoView({ behavior: "smooth" });
  }
}

function copy(value: string) {
  navigator.clipboard.writeText(value).then(() => {
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  });
}

function back() {
  router.back();
}

function handleEsc(e: KeyboardEvent) {
  if (e.key !== "Escape") return;
  if (articleContentRef.value?.isPreviewOpen) {
    articleContentRef.value.closePreview();
    return;
  }
  back();
}

onMounted(async () => {
  await Promise.all([
    subStore.fetchAll(),
    siteStore.fetchAll(),
    tagStore.fetchAll(),
  ]);
  await load();
  containerRef.value?.focus();
});

onUnmounted(() => {
  // Clean up copied timer if any
});

watch(
  () => route.params.id,
  () => load()
);
</script>
