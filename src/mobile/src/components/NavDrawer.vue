<template>
  <div class="absolute inset-0 bg-black/60 z-50 flex" @click.self="$emit('close')">
    <div
      class="w-[280px] h-full bg-white dark:bg-zinc-900 border-r border-slate-100 dark:border-zinc-800 p-4 flex flex-col z-50 relative shadow-2xl animate-fadeIn"
    >
      <!-- Brand bar -->
      <div class="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-zinc-800 pb-3">
        <div class="flex items-center gap-1.5 font-black tracking-tight text-slate-800 dark:text-zinc-50">
          <span>Rosser</span>
        </div>
        <button
          class="p-1 rounded-full bg-slate-50 dark:bg-zinc-800 text-slate-500 hover:scale-105 active:scale-95 transition-all"
          @click="$emit('close')"
        >
          <component :is="CloseOutline" class="w-4 h-4" />
        </button>
      </div>

      <!-- Fixed shortcuts -->
      <div class="space-y-1 mb-4">
        <button
          v-for="item in fixedItems"
          :key="item.key"
          class="w-full py-2 px-3 rounded-xl text-xs font-bold text-left flex items-center gap-2 transition-colors"
          :data-testid="item.key === 'unread' ? 'nav-unread' : undefined"
          :class="
            activeFilter === item.filter && activeFilterId === null
              ? 'bg-brand-light dark:bg-brand/10 text-brand font-black'
              : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
          "
          @click="select(item.filter, null)"
        >
          <component :is="item.icon" class="w-3.5 h-3.5 shrink-0" :class="item.iconClass" />
          <span>{{ item.label }}</span>
        </button>
      </div>

      <!-- Section tabs -->
      <div class="flex bg-slate-50 dark:bg-zinc-800/40 p-1 rounded-xl gap-1 text-[10px] font-bold mb-3">
        <button
          v-for="sec in sections"
          :key="sec"
          class="flex-1 py-1 rounded-lg text-center transition-all"
          :class="
            activeSection === sec
              ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-sm font-bold'
              : 'text-slate-400 hover:text-slate-600'
          "
          @click="activeSection = sec"
        >
          {{ t(sec) }}
        </button>
      </div>

      <!-- Tree contents -->
      <div class="flex-1 overflow-y-auto pr-1 space-y-3">
        <!-- Categories -->
        <template v-if="activeSection === 'categories'">
          <div v-for="cat in catStore.categories" :key="cat.id" class="space-y-1">
            <button
              class="w-full flex items-center justify-between py-2 px-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/20 rounded-xl text-left transition-colors"
              @click="toggleCat(cat.id)"
            >
              <div class="flex items-center gap-1.5 min-w-0 flex-1">
                <component :is="FolderOutline" class="w-4 h-4 text-brand shrink-0" />
                <span class="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                  {{ cat.title }}
                </span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <component
                  :is="ChevronForwardOutline"
                  class="w-4 h-4 text-slate-400 transition-transform duration-200"
                  :class="expandedCats[cat.id] ? 'rotate-90' : ''"
                />
              </div>
            </button>

            <div
              v-if="expandedCats[cat.id]"
              class="pl-3.5 border-l border-slate-100 dark:border-zinc-800 space-y-0.5 mt-0.5"
            >
              <button
                v-for="feed in feedsByCategory(cat.id)"
                :key="feed.id"
                class="w-full text-left py-2 px-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-xs text-slate-600 dark:text-zinc-400 flex items-center justify-between"
                @click="select('subscription', feed.id)"
              >
                <span class="truncate flex items-center gap-1.5">
                  <img
                    v-if="feed.site_id && faviconUrls[feed.site_id]"
                    :src="faviconUrls[feed.site_id]"
                    alt=""
                    class="w-4 h-4 rounded object-contain shrink-0"
                    referrerpolicy="no-referrer"
                    @error="faviconUrls[feed.site_id] = ''"
                  />
                  <component v-else :is="NewspaperOutline" class="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                  <span class="truncate">{{ feed.title }}</span>
                </span>
              </button>
            </div>
          </div>

          <!-- Uncategorized -->
          <div v-if="uncategorizedFeeds.length > 0" class="space-y-1">
            <button
              class="w-full flex items-center justify-between py-2 px-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/20 rounded-xl text-left transition-colors"
              @click="toggleCat('uncategorized')"
            >
              <div class="flex items-center gap-1.5 min-w-0 flex-1">
                <component :is="FolderOpenOutline" class="w-4 h-4 text-slate-400 shrink-0" />
                <span class="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                  {{ t("uncategorized") }}
                </span>
              </div>
              <component
                :is="ChevronForwardOutline"
                class="w-4 h-4 text-slate-400 transition-transform duration-200"
                :class="expandedCats['uncategorized'] ? 'rotate-90' : ''"
              />
            </button>

            <div
              v-if="expandedCats['uncategorized']"
              class="pl-3.5 border-l border-slate-100 dark:border-zinc-800 space-y-0.5 mt-0.5"
            >
              <button
                v-for="feed in uncategorizedFeeds"
                :key="feed.id"
                class="w-full text-left py-2 px-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-xs text-slate-600 dark:text-zinc-400 flex items-center justify-between"
                @click="select('subscription', feed.id)"
              >
                <span class="truncate flex items-center gap-1.5">
                  <img
                    v-if="feed.site_id && faviconUrls[feed.site_id]"
                    :src="faviconUrls[feed.site_id]"
                    alt=""
                    class="w-4 h-4 rounded object-contain shrink-0"
                    referrerpolicy="no-referrer"
                    @error="faviconUrls[feed.site_id] = ''"
                  />
                  <component v-else :is="NewspaperOutline" class="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                  <span class="truncate">{{ feed.title }}</span>
                </span>
              </button>
            </div>
          </div>
        </template>

        <!-- Sites -->
        <div v-else-if="activeSection === 'sites'" class="space-y-2 animate-fadeIn">
          <div v-for="site in siteStore.sites" :key="site.id" class="space-y-1">
            <button
              class="w-full flex items-center justify-between py-2 px-2.5 hover:bg-slate-50 dark:hover:bg-zinc-800/20 rounded-xl text-left transition-colors"
              @click="toggleSite(site.id)"
            >
              <div class="flex items-center gap-1.5 min-w-0 flex-1">
                <img
                  v-if="faviconUrls[site.id]"
                  :src="faviconUrls[site.id]"
                  alt=""
                  class="w-4 h-4 rounded object-contain shrink-0"
                  referrerpolicy="no-referrer"
                  @error="faviconUrls[site.id] = ''"
                />
                <component v-else :is="GlobeOutline" class="w-4 h-4 text-brand shrink-0" />
                <span class="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                  {{ site.title || site.url }}
                </span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <component
                  :is="ChevronForwardOutline"
                  class="w-4 h-4 text-slate-400 transition-transform duration-200"
                  :class="expandedSites[site.id] ? 'rotate-90' : ''"
                />
              </div>
            </button>

            <div
              v-if="expandedSites[site.id]"
              class="pl-3.5 border-l border-slate-100 dark:border-zinc-800 space-y-0.5 mt-0.5"
            >
              <button
                v-for="feed in feedsBySite(site.id)"
                :key="feed.id"
                class="w-full text-left py-2 px-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-xs text-slate-600 dark:text-zinc-400 flex items-center justify-between"
                @click="select('subscription', feed.id)"
              >
                <span class="truncate flex items-center gap-1.5">
                  <img
                    v-if="feed.site_id && faviconUrls[feed.site_id]"
                    :src="faviconUrls[feed.site_id]"
                    alt=""
                    class="w-4 h-4 rounded object-contain shrink-0"
                    referrerpolicy="no-referrer"
                    @error="faviconUrls[feed.site_id] = ''"
                  />
                  <component v-else :is="NewspaperOutline" class="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                  <span class="truncate">{{ feed.title }}</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div v-else-if="activeSection === 'tags'" class="space-y-1 animate-fadeIn">
          <button
            v-for="tag in tagStore.tags"
            :key="tag.id"
            class="w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/30 flex items-center justify-between transition-colors"
            @click="select('tag', tag.id)"
          >
            <div class="flex items-center gap-2 truncate">
              <span
                class="w-2.5 h-2.5 rounded-full"
                :style="{ backgroundColor: tag.color || '#9ca3af' }"
              />
              <span class="truncate">{{ tag.title }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-3 border-t border-slate-100 dark:border-zinc-800 shrink-0">
        <button
          class="w-full py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
          @click="$emit('addFeed')"
        >
          <component :is="AddOutline" class="w-4 h-4" />
          {{ t("addSubscription") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  AppsOutline,
  MailUnreadOutline,
  StarOutline,
  EyeOffOutline,
  FolderOutline,
  FolderOpenOutline,
  GlobeOutline,
  NewspaperOutline,
  ChevronForwardOutline,
  CloseOutline,
  AddOutline,
} from "@vicons/ionicons5";
import { buildFileUrl } from "@rosser/shared";
import {
  useCategoryStore,
  useSubscriptionStore,
  useSiteStore,
  useTagStore,
  useConnectionStore,
} from "@/stores";

export type FilterType =
  | "all"
  | "unread"
  | "starred"
  | "hidden"
  | "subscription"
  | "category"
  | "site"
  | "tag";

const props = defineProps<{
  activeFilter: FilterType;
  activeFilterId: string | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "addFeed"): void;
  (e: "select", filter: FilterType, id: string | null): void;
}>();

const { t } = useI18n();
const catStore = useCategoryStore();
const subStore = useSubscriptionStore();
const siteStore = useSiteStore();
const tagStore = useTagStore();
const conn = useConnectionStore();

const activeSection = ref<"categories" | "sites" | "tags">("categories");
const expandedCats = ref<Record<string, boolean>>({ uncategorized: true });
const expandedSites = ref<Record<string, boolean>>({});
const sections: ("categories" | "sites" | "tags")[] = ["categories", "sites", "tags"];
const faviconUrls = ref<Record<string, string>>({});

async function resolveFaviconUrls() {
  const result: Record<string, string> = {};
  if (!conn.baseURL || !conn.token) {
    faviconUrls.value = result;
    return;
  }
  const sitesWithFavicon = siteStore.sites.filter((s) => s.favicon_id);
  await Promise.all(
    sitesWithFavicon.map(async (site) => {
      if (!site.favicon_id) return;
      try {
        result[site.id] = await buildFileUrl(site.favicon_id, conn.baseURL, conn.token);
      } catch {
        // ignore single favicon resolution failures
      }
    })
  );
  faviconUrls.value = result;
}

watch(
  () => [siteStore.sites.length, conn.baseURL, conn.token],
  () => {
    resolveFaviconUrls();
  },
  { immediate: true }
);

const fixedItems = computed(() => [
  {
    key: "all",
    filter: "all" as FilterType,
    label: t("all"),
    icon: AppsOutline,
    iconClass: "text-slate-500 dark:text-zinc-400",
  },
  {
    key: "unread",
    filter: "unread" as FilterType,
    label: t("unread"),
    icon: MailUnreadOutline,
    iconClass: "text-blue-500 dark:text-blue-400",
  },
  {
    key: "starred",
    filter: "starred" as FilterType,
    label: t("starred"),
    icon: StarOutline,
    iconClass: "text-amber-500",
  },
  {
    key: "hidden",
    filter: "hidden" as FilterType,
    label: t("hidden"),
    icon: EyeOffOutline,
    iconClass: "text-slate-400 dark:text-zinc-500",
  },
]);

const feedsByCategory = (catId: string) =>
  subStore.subscriptions.filter((s) => s.category_id === catId);

const uncategorizedFeeds = computed(() =>
  subStore.subscriptions.filter((s) => !s.category_id)
);

const feedsBySite = (siteId: string) =>
  subStore.subscriptions.filter((s) => s.site_id === siteId);

function toggleCat(id: string) {
  expandedCats.value[id] = !expandedCats.value[id];
}

function toggleSite(id: string) {
  expandedSites.value[id] = !expandedSites.value[id];
}

function select(filter: FilterType, id: string | null = null) {
  emit("select", filter, id);
  emit("close");
}
</script>
