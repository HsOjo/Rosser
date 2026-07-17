<template>
  <div class="h-full">
    <div class="h-full flex flex-col bg-white dark:bg-zinc-900">
    <!-- Header -->
    <header
      class="px-3.5 py-2 flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800/40 shrink-0"
    >
      <button
        class="p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 transition-colors"
        @click="$router.back()"
      >
        <component :is="ArrowBackOutline" class="w-5 h-5" />
      </button>
      <span class="text-sm font-black text-slate-800 dark:text-zinc-100">{{ t("settings") }}</span>
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

    <!-- Tab content -->
    <div class="flex-1 overflow-y-auto px-4 py-4">
      <Transition name="fade" mode="out-in">
        <!-- General -->
        <div v-if="activeTab === 'general'" key="general" class="space-y-5">
        <div class="space-y-2">
          <label class="text-[10px] font-bold text-slate-400 uppercase">{{ t("language") }}</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="lang in languages"
              :key="lang.value"
              class="py-2.5 rounded-xl text-xs font-bold border transition-all"
              :class="
                uiSettings.locale === lang.value
                  ? 'bg-brand-light border-brand text-brand dark:bg-brand/10'
                  : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-300'
              "
              @click="saveLocale(lang.value)"
            >
              {{ lang.label }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-[10px] font-bold text-slate-400 uppercase">{{ t("theme") }}</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="themeOption in themes"
              :key="themeOption.value"
              class="py-2 rounded-xl text-[10px] font-bold border transition-all flex flex-col items-center gap-1"
              :class="
                uiSettings.theme === themeOption.value
                  ? 'bg-brand-light border-brand text-brand dark:bg-brand/10'
                  : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-300'
              "
              @click="saveTheme(themeOption.value)"
            >
              <component :is="themeOption.icon" class="w-4 h-4" />
              {{ themeOption.label }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-[10px] font-bold text-slate-400 uppercase">{{ t("animations") }}</label>
          <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800">
            <span class="text-xs font-bold text-slate-700 dark:text-zinc-200">{{ t("disableAnimations") }}</span>
            <button
              class="w-11 h-6 rounded-full transition-colors relative"
              :class="uiSettings.disableAnimations ? 'bg-brand' : 'bg-slate-300 dark:bg-zinc-600'"
              @click="toggleAnimations"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform"
                :class="uiSettings.disableAnimations ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>

        <div class="p-4 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-2">
          <div class="text-[10px] font-bold text-slate-400 uppercase">
            {{ t("serverInfo") }}
          </div>
          <div class="text-xs text-slate-700 dark:text-zinc-300 break-all font-mono">
            {{ conn.baseURL }}
          </div>
          <div class="text-xs text-slate-500 dark:text-zinc-400 font-mono">
            {{ maskedToken }}
          </div>
        </div>

        <div class="p-4 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-3">
          <div class="text-[10px] font-bold text-slate-400 uppercase">
            {{ t("about") }}
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700 dark:text-zinc-200">{{ t("currentVersion") }}</span>
            <span class="text-xs text-slate-500 dark:text-zinc-400 font-mono">{{ currentVersion }}</span>
          </div>
          <button
            class="w-full py-2 bg-brand hover:bg-brand-hover disabled:bg-slate-300 dark:disabled:bg-zinc-600 text-white font-bold text-xs rounded-xl transition-colors"
            :disabled="checkingUpdate"
            @click="handleCheckUpdate"
          >
            <span v-if="checkingUpdate">
              <div
                class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block align-middle mr-1"
              />
              {{ t("checkingUpdate") }}
            </span>
            <span v-else>{{ t("checkUpdate") }}</span>
          </button>
        </div>

        <button
          class="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 font-bold text-xs rounded-xl transition-colors"
          @click="disconnect"
        >
          {{ t("disconnect") }}
        </button>
      </div>

      <!-- Data Management -->
      <div v-else-if="activeTab === 'dataManagement'" key="dataManagement" class="space-y-4">
        <div
          class="p-4 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-3"
        >
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-200">
            <component :is="ArrowUpOutline" class="w-4 h-4 text-brand" />
            <span>{{ t("opmlImport") }}</span>
          </div>
          <input
            type="file"
            accept=".opml,.xml"
            class="block w-full text-[10px] text-slate-500 dark:text-zinc-400 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-brand file:text-white file:font-bold"
            @change="importOPML"
          />
        </div>

        <div class="p-4 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-200">
            <component :is="DownloadOutline" class="w-4 h-4 text-brand" />
            <span>{{ t("opmlExport") }}</span>
          </div>
          <button
            class="w-full py-2 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl transition-colors"
            @click="exportOPML"
          >
            {{ t("export") }}
          </button>
        </div>
      </div>

      <!-- Connection -->
      <div v-else-if="activeTab === 'connection'" key="connection" class="space-y-4">
        <div
          class="p-4 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700 dark:text-zinc-200">{{ t("proxyEnabled") }}</span>
            <button
              class="w-11 h-6 rounded-full transition-colors relative"
              :class="proxyEnabled ? 'bg-brand' : 'bg-slate-300 dark:bg-zinc-600'"
              @click="proxyEnabled = !proxyEnabled"
            >
              <span
                class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform"
                :class="proxyEnabled ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>

          <div v-if="proxyEnabled" class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase">{{ t("proxyUrl") }}</label>
            <input
              v-model="proxyUrl"
              type="text"
              :placeholder="t('proxyUrlPlaceholder')"
              class="w-full text-xs py-2 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:border-brand outline-none"
            />
          </div>

          <button
            class="w-full py-2 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl transition-colors"
            :disabled="savingProxy"
            @click="saveProxy"
          >
            <span v-if="savingProxy">
              <div
                class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block align-middle mr-1"
              />
              {{ t("loading") }}
            </span>
            <span v-else>{{ t("save") }}</span>
          </button>
        </div>
      </div>

      <!-- Tags -->
      <div v-else-if="activeTab === 'tags'" key="tags" class="space-y-3">
        <div
          v-for="tag in tagStore.tags"
          :key="tag.id"
          class="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800"
        >
          <div class="flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: tag.color || '#9ca3af' }"
            />
            <span class="text-xs font-bold text-slate-700 dark:text-zinc-200">{{ tag.title }}</span>
          </div>
          <div class="flex items-center gap-1">
            <button
              class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400"
              @click="editTag(tag)"
            >
              <component :is="PencilOutline" class="w-3.5 h-3.5" />
            </button>
            <button
              class="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
              @click="openDeleteTagConfirm(tag.id)"
            >
              <component :is="TrashOutline" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          class="w-full py-2.5 border border-dashed border-slate-300 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-brand hover:border-brand font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
          data-testid="add-tag-btn"
          @click="addTag"
        >
          <component :is="AddOutline" class="w-4 h-4" />
          {{ t("addTag") }}
        </button>
      </div>
      </Transition>
    </div>
  </div>

  <!-- Tag edit dialog -->
  <Transition name="modal" appear>
    <div
      v-if="editingTag"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      @click.self="editingTag = null"
    >
      <div class="modal-panel w-full max-w-[320px] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
      <h4 class="text-sm font-bold text-slate-800 dark:text-zinc-100">
        {{ editingTag.id ? t("editTag") : t("addTag") }}
      </h4>
      <div class="space-y-3">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-slate-400 uppercase">{{ t("tagTitle") }}</label>
          <input
            v-model="editingTag.title"
            type="text"
            class="w-full text-xs py-2 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 focus:border-brand outline-none"
          />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-slate-400 uppercase">{{ t("tagColor") }}</label>
          <div class="grid grid-cols-5 gap-2">
            <button
              v-for="color in colors"
              :key="color"
              class="w-8 h-8 rounded-full border-2 transition-all"
              :style="{ backgroundColor: color }"
              :class="editingTag.color === color ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent'"
              @click="editingTag.color = color"
            />
          </div>
        </div>
      </div>
      <div class="flex gap-2 justify-end pt-2">
        <button
          class="px-3.5 py-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 text-xs font-semibold text-slate-600 dark:text-zinc-300 rounded-lg"
          @click="editingTag = null"
        >
          {{ t("cancel") }}
        </button>
        <button
          class="px-3.5 py-2 bg-brand hover:bg-brand-hover text-xs font-bold text-white rounded-lg"
          @click="saveTag"
        >
          {{ t("save") }}
        </button>
      </div>
      </div>
    </div>
  </Transition>

  <!-- Tag delete confirm dialog -->
  <ConfirmDialog
    v-model:visible="showDeleteTagConfirm"
    :title="t('delete')"
    :message="t('deleteConfirm')"
    @confirm="deleteTag"
  >
    <template #icon>
      <component :is="TrashOutline" class="w-5 h-5 shrink-0 text-red-500" />
    </template>
  </ConfirmDialog>

  <!-- Update result dialog -->
  <Transition name="modal" appear>
    <div
      v-if="updateResult.show"
      class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      @click.self="updateResult.show = false"
    >
      <div class="modal-panel w-full max-w-[320px] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
        <h4 class="text-sm font-bold text-slate-800 dark:text-zinc-100">
          {{ updateResult.title }}
        </h4>
        <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
          {{ updateResult.message }}
        </p>
        <div class="flex gap-2 justify-end pt-1">
          <button
            class="px-4 py-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700/50 text-xs font-semibold text-slate-600 dark:text-zinc-300 rounded-xl transition-colors"
            @click="updateResult.show = false"
          >
            {{ t("cancel") }}
          </button>
          <button
            v-if="updateResult.url"
            class="px-4 py-2 bg-brand hover:bg-brand-hover text-xs font-bold text-white rounded-xl flex items-center gap-1.5 shadow-md shadow-brand/10 active:scale-[0.98] transition-all"
            @click="openUpdateUrl"
          >
            {{ t("download") }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  ArrowBackOutline,
  SunnyOutline,
  MoonOutline,
  ContrastOutline,
  DownloadOutline,
  ArrowUpOutline,
  PencilOutline,
  TrashOutline,
  AddOutline,
} from "@vicons/ionicons5";
import { api, maskToken } from "@rosser/shared";
import { useConnectionStore } from "@/stores/connection";
import { useSettingsStore, useTagStore } from "@/stores";
import {
  saveUISettings,
  applyUISettings,
  uiSettings,
  type Theme,
} from "@/settings/local";
import { colors } from "@/utils/colors";
import { checkForUpdate } from "@/utils/updater";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import type { components } from "@rosser/shared/api";

const router = useRouter();
const { t, locale } = useI18n();
const conn = useConnectionStore();
const settingsStore = useSettingsStore();
const tagStore = useTagStore();

const activeTab = ref("general");
const tabs = ["general", "dataManagement", "connection", "tags"];

const languages = [
  { value: "zh-CN", label: "简体中文" },
  { value: "en", label: "English" },
];

const themes = computed(() => [
  { value: "light" as Theme, label: t("themeLight"), icon: SunnyOutline },
  { value: "dark" as Theme, label: t("themeDark"), icon: MoonOutline },
  { value: "auto" as Theme, label: t("themeAuto"), icon: ContrastOutline },
]);

const maskedToken = computed(() => {
  return maskToken(conn.token);
});

const proxyEnabled = ref(false);
const proxyUrl = ref("");
const savingProxy = ref(false);

type TagOut = components["schemas"]["TagOut"];
const editingTag = ref<Partial<TagOut> | null>(null);
const tagToDelete = ref<string | null>(null);
const showDeleteTagConfirm = ref(false);
const checkingUpdate = ref(false);
const currentVersion = ref("0.2.0");
const updateResult = ref({
  show: false,
  title: "",
  message: "",
  url: "",
});

onMounted(async () => {
  await settingsStore.fetch();
  await tagStore.fetchAll();
  if (settingsStore.settings?.proxy) {
    proxyEnabled.value = settingsStore.settings.proxy.enabled;
    proxyUrl.value = settingsStore.settings.proxy.url || "";
  }
});

function saveLocale(val: string) {
  saveUISettings({ locale: val });
  locale.value = val;
}

function saveTheme(val: Theme) {
  saveUISettings({ theme: val });
  applyUISettings();
}

function toggleAnimations() {
  saveUISettings({ disableAnimations: !uiSettings.value.disableAnimations });
}

async function disconnect() {
  conn.disconnect();
  router.replace("/onboarding");
}

async function importOPML(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const text = await file.text();
  await api.POST("/api/opml/import", { params: { query: { file: text } } });
  input.value = "";
}

async function exportOPML() {
  const { data } = await api.GET("/api/opml/export");
  if (typeof data !== "string") return;
  const blob = new Blob([data], { type: "text/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rosser-export-${new Date().toISOString().slice(0, 10)}.opml`;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleCheckUpdate() {
  checkingUpdate.value = true;
  try {
    const result = await checkForUpdate();
      if (result.haveNew) {
        updateResult.value = {
          show: true,
          title: t("updateFound", { version: result.latest }),
          message: `${t("releaseTime")}: ${result.publishedAt}\n${result.body}`,
          url: result.htmlUrl,
        };
      } else {
      updateResult.value = {
        show: true,
        title: t("noUpdate"),
        message: t("noUpdateDetail"),
        url: "",
      };
    }
  } catch (e: any) {
    updateResult.value = {
      show: true,
      title: t("networkError"),
      message: e?.message || t("networkError"),
      url: "",
    };
  } finally {
    checkingUpdate.value = false;
  }
}

function openUpdateUrl() {
  if (updateResult.value.url) {
    window.open(updateResult.value.url, "_blank");
  }
  updateResult.value.show = false;
}

async function saveProxy() {
  savingProxy.value = true;
  try {
    await settingsStore.update({
      proxy: {
        enabled: proxyEnabled.value,
        url: proxyUrl.value || null,
      },
    });
  } finally {
    savingProxy.value = false;
  }
}

function addTag() {
  editingTag.value = { title: "", color: colors[0] };
}

function editTag(tag: TagOut) {
  editingTag.value = { ...tag };
}

async function saveTag() {
  if (!editingTag.value?.title) return;
  if (editingTag.value.id) {
    await tagStore.update(editingTag.value.id, {
      title: editingTag.value.title,
      color: editingTag.value.color,
    });
  } else {
    await tagStore.create({
      title: editingTag.value.title,
      color: editingTag.value.color,
    });
  }
  editingTag.value = null;
}

function openDeleteTagConfirm(id: string) {
  tagToDelete.value = id;
  showDeleteTagConfirm.value = true;
}

async function deleteTag() {
  if (!tagToDelete.value) return;
  await tagStore.remove(tagToDelete.value);
  tagToDelete.value = null;
}
</script>
