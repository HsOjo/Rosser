<template>
  <div class="h-full flex flex-col bg-white dark:bg-zinc-900">
    <header
      class="px-3.5 py-2 flex items-center justify-between border-b border-slate-100 dark:border-zinc-800/40 shrink-0"
    >
      <div class="flex items-center gap-2">
        <button
          class="p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"
          @click="$router.back()"
        >
          <component :is="ArrowBackOutline" class="w-5 h-5" />
        </button>
        <span class="text-sm font-black text-slate-800 dark:text-zinc-100">{{ t("manage") }}</span>
      </div>

      <button
        class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
        @click="openFetchAllConfirm"
      >
        <component
          :is="RefreshOutline"
          class="w-4 h-4"
          :class="{ 'animate-spin text-brand': fetchingAll }"
        />
      </button>
    </header>

    <!-- Tabs -->
    <div class="px-4 pt-3">
      <div class="flex bg-slate-50 dark:bg-zinc-800/40 p-1 rounded-xl gap-1 text-[10px] font-bold">
        <button
          v-for="tab in tabs"
          :key="tab"
          class="flex-1 py-1.5 rounded-lg text-center transition-all"
          :class="
            activeTab === tab
              ? 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 shadow-sm font-bold'
              : 'text-slate-400 hover:text-slate-600'
          "
          @click="activeTab = tab"
        >
          {{ t(tab) }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-4">
      <!-- Subscriptions -->
      <div v-if="activeTab === 'subscriptions'" class="space-y-4">
        <!-- Add subscription -->
        <div class="p-4 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-200">
            <component :is="AddOutline" class="w-4 h-4 text-brand" />
            <span>{{ t("addSubscription") }}</span>
          </div>
          <input
            v-model="newUrl"
            type="text"
            :placeholder="t('rssURL')"
            class="w-full text-xs py-2 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-brand outline-none"
            @keydown.enter="previewAndAdd"
          />
          <div v-if="previewData" class="space-y-2">
            <input
              v-model="previewData.title"
              type="text"
              class="w-full text-xs py-2 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-brand outline-none"
            />
            <select
              v-model="newCategoryId"
              class="w-full text-xs py-2 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-brand outline-none"
            >
              <option :value="null">{{ t("uncategorized") }}</option>
              <option
                v-for="cat in catStore.categories"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.title }}
              </option>
            </select>
          </div>
          <button
            class="w-full py-2 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl transition-colors"
            :disabled="adding"
            @click="previewAndAdd"
          >
            <span v-if="adding">
              <div
                class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block align-middle mr-1"
              />
              {{ t("loading") }}
            </span>
            <span v-else-if="previewData">{{ t("add") }}</span>
            <span v-else>{{ t("preview") }}</span>
          </button>
        </div>

        <!-- Subscriptions by category -->
        <div class="space-y-4">
          <div v-for="cat in catStore.categories" :key="cat.id" class="space-y-2">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-0.5">
              {{ cat.title }}
            </div>
            <div class="space-y-2">
              <div
                v-for="sub in subscriptionsByCategory(cat.id)"
                :key="sub.id"
                class="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl"
              >
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <img
                    v-if="sub.site_id && siteFavicons[sub.site_id]"
                    :src="siteFavicons[sub.site_id]"
                    alt=""
                    class="w-5 h-5 rounded object-contain shrink-0"
                    referrerpolicy="no-referrer"
                    @error="siteFavicons[sub.site_id] = ''"
                  />
                  <component v-else :is="NewspaperOutline" class="w-5 h-5 text-slate-400 dark:text-zinc-500 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
                      {{ sub.title }}
                    </div>
                    <div class="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                      {{ sub.url }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                    :disabled="fetchingId === sub.id"
                    @click="fetchOne(sub.id)"
                  >
                    <component
                      :is="RefreshOutline"
                      class="w-3.5 h-3.5"
                      :class="{ 'animate-spin text-brand': fetchingId === sub.id }"
                    />
                  </button>
                  <button
                    class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                    @click="editSubscription(sub)"
                  >
                    <component :is="PencilOutline" class="w-3.5 h-3.5" />
                  </button>
                  <button
                    class="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                    @click="openDeleteSubscriptionConfirm(sub.id)"
                  >
                    <component :is="TrashOutline" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Uncategorized -->
          <div v-if="uncategorizedSubscriptions.length > 0" class="space-y-2">
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-0.5">
              {{ t("uncategorized") }}
            </div>
            <div class="space-y-2">
              <div
                v-for="sub in uncategorizedSubscriptions"
                :key="sub.id"
                class="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl"
              >
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <img
                    v-if="sub.site_id && siteFavicons[sub.site_id]"
                    :src="siteFavicons[sub.site_id]"
                    alt=""
                    class="w-5 h-5 rounded object-contain shrink-0"
                    referrerpolicy="no-referrer"
                    @error="siteFavicons[sub.site_id] = ''"
                  />
                  <component v-else :is="NewspaperOutline" class="w-5 h-5 text-slate-400 dark:text-zinc-500 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <div class="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
                      {{ sub.title }}
                    </div>
                    <div class="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                      {{ sub.url }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                    :disabled="fetchingId === sub.id"
                    @click="fetchOne(sub.id)"
                  >
                    <component
                      :is="RefreshOutline"
                      class="w-3.5 h-3.5"
                      :class="{ 'animate-spin text-brand': fetchingId === sub.id }"
                    />
                  </button>
                  <button
                    class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                    @click="editSubscription(sub)"
                  >
                    <component :is="PencilOutline" class="w-3.5 h-3.5" />
                  </button>
                  <button
                    class="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                    @click="openDeleteSubscriptionConfirm(sub.id)"
                  >
                    <component :is="TrashOutline" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories -->
      <div v-else-if="activeTab === 'categories'" class="space-y-3">
        <div class="flex gap-2">
          <input
            v-model="newCategoryName"
            type="text"
            :placeholder="t('addCategory')"
            class="flex-1 text-xs py-2 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-brand outline-none"
            @keydown.enter="addCategory"
          />
          <button
            class="px-3 py-2 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl"
            data-testid="add-category-btn"
            @click="addCategory"
          >
            <component :is="AddOutline" class="w-4 h-4" />
          </button>
        </div>

        <div
          v-for="cat in catStore.categories"
          :key="cat.id"
          class="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800"
        >
          <span class="text-xs font-bold text-slate-700 dark:text-zinc-200">{{ cat.title }}</span>
          <div class="flex items-center gap-1">
            <button
              class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400"
              @click="openEditCategoryDialog(cat)"
            >
              <component :is="PencilOutline" class="w-3.5 h-3.5" />
            </button>
            <button
              class="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
              @click="openDeleteCategoryConfirm(cat.id)"
            >
              <component :is="TrashOutline" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Sites -->
      <div v-else-if="activeTab === 'sites'" class="space-y-3">
        <div
          v-for="site in siteStore.sites"
          :key="site.id"
          class="p-3 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <img
                v-if="site.favicon_id"
                :src="siteFavicons[site.id]"
                alt=""
                class="w-5 h-5 rounded object-contain"
                referrerpolicy="no-referrer"
              />
              <div class="flex-1 min-w-0">
                <div class="text-xs font-bold text-slate-700 dark:text-zinc-200 truncate">
                  {{ site.title || site.url }}
                </div>
                <div class="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                  {{ site.url }}
                </div>
              </div>
            </div>
            <button
              class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400"
              :disabled="refreshingSiteId === site.id"
              @click="refreshSiteFavicon(site.id)"
            >
              <component
                :is="RefreshOutline"
                class="w-3.5 h-3.5"
                :class="{ 'animate-spin text-brand': refreshingSiteId === site.id }"
              />
            </button>
          </div>

          <div class="flex gap-2">
            <input
              v-model="siteEdits[site.id].title"
              type="text"
              :placeholder="t('title')"
              class="flex-1 text-xs py-2 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-brand outline-none"
            />
            <input
              v-model.number="siteEdits[site.id].concurrency_limit"
              type="number"
              min="1"
              class="w-20 text-xs py-2 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-brand outline-none"
            />
          </div>

          <button
            class="w-full py-2 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl transition-colors"
            @click="saveSite(site.id)"
          >
            {{ t("save") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit subscription dialog -->
    <div
      v-if="editingSub"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      @click.self="editingSub = null"
    >
      <div class="w-full max-w-[320px] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <h4 class="text-sm font-bold text-slate-800 dark:text-zinc-100">
          {{ t("editSubscription") }}
        </h4>
        <div class="space-y-3">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase">{{ t("title") }}</label>
            <input
              v-model="editingSub.title"
              type="text"
              class="w-full text-xs py-2 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 focus:border-brand outline-none"
            />
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase">{{ t("category") }}</label>
            <select
              v-model="editingSub.category_id"
              class="w-full text-xs py-2 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 focus:border-brand outline-none"
            >
              <option :value="null">{{ t("uncategorized") }}</option>
              <option
                v-for="cat in catStore.categories"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.title }}
              </option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase">{{ t("refreshInterval") }}</label>
            <input
              v-model.number="editingSub.refresh_interval"
              type="number"
              min="1"
              class="w-full text-xs py-2 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 focus:border-brand outline-none"
            />
          </div>
        </div>
        <div class="flex gap-2 justify-end pt-2">
          <button
            class="px-3.5 py-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 text-xs font-semibold text-slate-600 dark:text-zinc-300 rounded-lg"
            @click="editingSub = null"
          >
            {{ t("cancel") }}
          </button>
          <button
            class="px-3.5 py-2 bg-brand hover:bg-brand-hover text-xs font-bold text-white rounded-lg"
            @click="saveSubscription"
          >
            {{ t("save") }}
          </button>
        </div>
      </div>
    </div>
    <!-- Confirm dialog -->
    <ConfirmDialog
      v-model:visible="showConfirm"
      :title="confirmTitle"
      :message="confirmMessage"
      @confirm="onConfirmAction"
      @cancel="pendingDeleteId = null"
    >
      <template #icon>
        <component
          :is="confirmIcon"
          class="w-5 h-5 shrink-0"
          :class="confirmIconClass"
        />
      </template>
    </ConfirmDialog>
    <!-- Input dialog -->
    <InputDialog
      v-model:visible="showInputDialog"
      v-model:modelValue="inputDialogValue"
      :title="inputDialogTitle"
      :placeholder="t('title')"
      @confirm="saveCategoryFromDialog"
      @cancel="resetInputDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  ArrowBackOutline,
  AddOutline,
  RefreshOutline,
  PencilOutline,
  TrashOutline,
  NewspaperOutline,
} from "@vicons/ionicons5";
import { buildFileUrl } from "@rosser/shared";
import {
  useSubscriptionStore,
  useCategoryStore,
  useSiteStore,
} from "@/stores";
import { useConnectionStore } from "@/stores/connection";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import InputDialog from "@/components/InputDialog.vue";
import type { components } from "@rosser/shared/api";

const { t } = useI18n();
const subStore = useSubscriptionStore();
const catStore = useCategoryStore();
const siteStore = useSiteStore();
const conn = useConnectionStore();

const activeTab = ref("subscriptions");
const tabs = ["subscriptions", "categories", "sites"];

const newUrl = ref("");
const newCategoryId = ref<string | null>(null);
const previewData = ref<Partial<components["schemas"]["SubscriptionCreate"]> | null>(
  null
);
const adding = ref(false);
const fetchingAll = ref(false);
const fetchingId = ref<string | null>(null);
const refreshingSiteId = ref<string | null>(null);

const newCategoryName = ref("");

const editingSub = ref<components["schemas"]["SubscriptionOut"] | null>(null);

const showConfirm = ref(false);
const confirmType = ref<"deleteSubscription" | "deleteCategory" | "fetchAll">(
  "fetchAll"
);
const pendingDeleteId = ref<string | null>(null);

const confirmTitle = computed(() => {
  switch (confirmType.value) {
    case "deleteSubscription":
    case "deleteCategory":
      return t("delete");
    case "fetchAll":
      return t("fetchAll");
  }
});

const confirmMessage = computed(() => {
  switch (confirmType.value) {
    case "deleteSubscription":
    case "deleteCategory":
      return t("deleteConfirm");
    case "fetchAll":
      return t("fetchAllConfirm");
  }
});

const confirmIcon = computed(() => {
  switch (confirmType.value) {
    case "deleteSubscription":
    case "deleteCategory":
      return TrashOutline;
    case "fetchAll":
      return RefreshOutline;
  }
});

const confirmIconClass = computed(() => {
  switch (confirmType.value) {
    case "deleteSubscription":
    case "deleteCategory":
      return "text-red-500";
    case "fetchAll":
      return "text-brand";
  }
});

const showInputDialog = ref(false);
const inputDialogTitle = ref("");
const inputDialogValue = ref("");
const editingCategoryId = ref<string | null>(null);

const subscriptionsByCategory = (catId: string) =>
  subStore.subscriptions.filter((s) => s.category_id === catId);

const uncategorizedSubscriptions = computed(() =>
  subStore.subscriptions.filter((s) => !s.category_id)
);

const siteEdits = reactive<Record<string, { title: string; concurrency_limit: number }>>({});
const siteFavicons = reactive<Record<string, string>>({});

onMounted(async () => {
  await Promise.all([
    subStore.fetchAll(),
    catStore.fetchAll(),
    siteStore.fetchAll(),
  ]);
  initSiteEdits();
  await initSiteFavicons();
});

async function initSiteFavicons() {
  for (const site of siteStore.sites) {
    if (site.favicon_id) {
      try {
        siteFavicons[site.id] = await buildFileUrl(site.favicon_id, conn.baseURL, conn.token);
      } catch {
        siteFavicons[site.id] = "";
      }
    }
  }
}

function initSiteEdits() {
  for (const site of siteStore.sites) {
    if (!siteEdits[site.id]) {
      siteEdits[site.id] = {
        title: site.title || "",
        concurrency_limit: site.concurrency_limit,
      };
    }
  }
}

async function previewAndAdd() {
  if (!newUrl.value) return;
  if (!previewData.value) {
    adding.value = true;
    try {
      const data = await subStore.preview(newUrl.value);
      previewData.value = {
        title: data?.title || newUrl.value,
        description: data?.description || "",
        url: newUrl.value,
        refresh_interval: 60,
        category_id: newCategoryId.value,
      };
    } finally {
      adding.value = false;
    }
    return;
  }

  adding.value = true;
  try {
    const created = await subStore.create({
      title: previewData.value.title || newUrl.value,
      description: previewData.value.description,
      url: newUrl.value,
      refresh_interval: previewData.value.refresh_interval ?? 60,
      category_id: newCategoryId.value,
    });
    if (created) {
      await subStore.fetchNow([created.id]);
    }
    newUrl.value = "";
    previewData.value = null;
    newCategoryId.value = null;
  } finally {
    adding.value = false;
  }
}

async function fetchOne(id: string) {
  fetchingId.value = id;
  try {
    await subStore.fetchNow([id]);
  } finally {
    fetchingId.value = null;
  }
}

async function doFetchAll() {
  fetchingAll.value = true;
  try {
    await subStore.fetchAllNow();
  } finally {
    fetchingAll.value = false;
  }
}

function editSubscription(sub: components["schemas"]["SubscriptionOut"]) {
  editingSub.value = { ...sub };
}

async function saveSubscription() {
  if (!editingSub.value) return;
  await subStore.update(editingSub.value.id, {
    title: editingSub.value.title,
    category_id: editingSub.value.category_id,
    refresh_interval: editingSub.value.refresh_interval,
  });
  editingSub.value = null;
}

async function deleteSubscription(id: string) {
  await subStore.remove(id);
}

async function addCategory() {
  const name = newCategoryName.value.trim();
  if (!name) return;
  await catStore.create({ title: name });
  newCategoryName.value = "";
}

function openEditCategoryDialog(cat: components["schemas"]["CategoryOut"]) {
  editingCategoryId.value = cat.id;
  inputDialogTitle.value = t("editCategory");
  inputDialogValue.value = cat.title;
  showInputDialog.value = true;
}

async function saveCategoryFromDialog() {
  const name = inputDialogValue.value.trim();
  if (name && editingCategoryId.value) {
    await catStore.update(editingCategoryId.value, { title: name });
  }
  resetInputDialog();
}

function resetInputDialog() {
  showInputDialog.value = false;
  inputDialogValue.value = "";
  editingCategoryId.value = null;
}

async function deleteCategory(id: string) {
  await catStore.remove(id);
}

function openDeleteSubscriptionConfirm(id: string) {
  pendingDeleteId.value = id;
  confirmType.value = "deleteSubscription";
  showConfirm.value = true;
}

function openDeleteCategoryConfirm(id: string) {
  pendingDeleteId.value = id;
  confirmType.value = "deleteCategory";
  showConfirm.value = true;
}

function openFetchAllConfirm() {
  confirmType.value = "fetchAll";
  showConfirm.value = true;
}

async function onConfirmAction() {
  switch (confirmType.value) {
    case "deleteSubscription":
      if (pendingDeleteId.value) {
        await deleteSubscription(pendingDeleteId.value);
      }
      break;
    case "deleteCategory":
      if (pendingDeleteId.value) {
        await deleteCategory(pendingDeleteId.value);
      }
      break;
    case "fetchAll":
      await doFetchAll();
      break;
  }
  pendingDeleteId.value = null;
}

async function refreshSiteFavicon(id: string) {
  refreshingSiteId.value = id;
  try {
    const site = await siteStore.refreshFavicon(id);
    if (site?.favicon_id) {
      siteFavicons[id] = await buildFileUrl(site.favicon_id, conn.baseURL, conn.token);
    }
  } finally {
    refreshingSiteId.value = null;
  }
}

async function saveSite(id: string) {
  const edit = siteEdits[id];
  if (!edit) return;
  await siteStore.update(id, {
    title: edit.title || null,
    concurrency_limit: edit.concurrency_limit,
  });
}

// Re-init site edits when sites change
const sitesWatcher = computed(() => siteStore.sites.length);
watch(sitesWatcher, () => {
  initSiteEdits();
  initSiteFavicons();
});
</script>
