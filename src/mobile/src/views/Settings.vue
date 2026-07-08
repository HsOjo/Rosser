<template>
  <div>
    <var-app-bar :title="$t('settingsTitle')" title-position="center">
      <template #left>
        <var-button text type="primary" @click="$router.back()">{{ $t('back') }}</var-button>
      </template>
    </var-app-bar>

    <var-tabs v-model:active="activeTab">
      <var-tab>{{ $t('general') }}</var-tab>
      <var-tab>{{ $t('dataManagement') }}</var-tab>
      <var-tab>{{ $t('tags') }}</var-tab>
      <var-tab>{{ $t('connection') }}</var-tab>
    </var-tabs>

    <var-tabs-items v-model:active="activeTab">
      <var-tab-item>
        <var-space direction="column" size="large" style="padding: 16px;">
          <var-cell :title="$t('theme')">
            <var-select v-model="form.theme" variant="outlined" @change="applyTheme">
              <var-option :label="$t('themeLight')" value="light" />
              <var-option :label="$t('themeDark')" value="dark" />
              <var-option :label="$t('themeAuto')" value="auto" />
            </var-select>
          </var-cell>

          <var-cell :title="$t('fontSize')">
            <var-select v-model="form.font_size" variant="outlined" @change="applyFontSize">
              <var-option :label="$t('fontSizeSmall')" value="small" />
              <var-option :label="$t('fontSizeMedium')" value="medium" />
              <var-option :label="$t('fontSizeLarge')" value="large" />
            </var-select>
          </var-cell>

          <var-cell :title="$t('language')">
            <var-select v-model="locale" variant="outlined" @change="changeLocale">
              <var-option label="简体中文" value="zh-CN" />
              <var-option label="English" value="en" />
            </var-select>
          </var-cell>

          <var-cell :title="$t('autoRefreshInterval')">
            <var-input v-model="refreshIntervalStr" type="number" variant="outlined" />
          </var-cell>

          <var-button type="primary" block :loading="saving" @click="save">{{ $t('save') }}</var-button>
        </var-space>
      </var-tab-item>

      <var-tab-item>
        <var-space direction="column" size="large" style="padding: 16px;">
          <var-cell :title="$t('opmlImport')">
            <var-button :loading="importing" @click="triggerImport">{{ $t('import') }}</var-button>
            <input ref="importInput" type="file" accept=".opml,.xml" style="display: none" @change="handleImport" />
          </var-cell>

          <var-cell :title="$t('opmlExport')">
            <var-button :loading="exporting" @click="handleExport">{{ $t('export') }}</var-button>
          </var-cell>
        </var-space>
      </var-tab-item>

      <var-tab-item>
        <var-space direction="column" size="large" style="padding: 16px;">
          <var-space>
            <var-input v-model="newTagTitle" :placeholder="$t('tagTitle')" variant="outlined" />
            <var-input v-model="newTagColor" :placeholder="$t('tagColor')" variant="outlined" style="width: 80px;" />
            <var-button type="primary" :loading="addingTag" @click="addTag">{{ $t('add') }}</var-button>
          </var-space>

          <var-space wrap :size="[8, 8]">
            <var-chip
              v-for="tag in tagStore.tags"
              :key="tag.id"
              closable
              :color="tag.color"
              @close="removeTag(tag.id)"
              @click="startEditTag(tag)"
            >
              {{ tag.title }}
            </var-chip>
          </var-space>
        </var-space>
      </var-tab-item>

      <var-tab-item>
        <var-space direction="column" size="large" style="padding: 16px;">
          <var-cell :title="$t('baseURL')" :description="conn.baseURL" />
          <var-cell :title="$t('token')" :description="conn.token.slice(0, 8) + '...'" />
          <var-button type="danger" block @click="confirmLogout">{{ $t('disconnect') }}</var-button>
        </var-space>
      </var-tab-item>
    </var-tabs-items>

    <var-dialog v-model:show="showEditTag" :title="$t('editTag')">
      <var-space direction="column" size="small">
        <var-input v-model="editTagTitle" :placeholder="$t('tagTitle')" variant="outlined" />
        <var-input v-model="editTagColor" :placeholder="$t('tagColor')" variant="outlined" />
      </var-space>
      <template #actions>
        <var-space>
          <var-button type="primary" :loading="savingTag" @click="saveEditTag">{{ $t('save') }}</var-button>
          <var-button @click="showEditTag = false">{{ $t('close') }}</var-button>
        </var-space>
      </template>
    </var-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Snackbar, Dialog } from "@varlet/ui";
import { useConnectionStore, useSettingsStore, useTagStore } from "@/stores";
import { api } from "@rosser/shared";

const router = useRouter();
const { t, locale } = useI18n();
const conn = useConnectionStore();
const settings = useSettingsStore();
const tagStore = useTagStore();

const activeTab = ref(0);
const form = ref({ auto_refresh_interval: 30, theme: "auto", font_size: "medium" });
const refreshIntervalStr = computed({
  get: () => String(form.value.auto_refresh_interval),
  set: (val) => { form.value.auto_refresh_interval = Number(val) || 30; }
});
const saving = ref(false);
const importing = ref(false);
const exporting = ref(false);
const importInput = ref<HTMLInputElement | null>(null);

const newTagTitle = ref("");
const newTagColor = ref(randomColor());
const addingTag = ref(false);
const showEditTag = ref(false);
const savingTag = ref(false);
const editingTag = ref<any>(null);
const editTagTitle = ref("");
const editTagColor = ref("");

function randomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
}

async function loadSettings() {
  await Promise.all([settings.fetch(), tagStore.fetchAll()]);
  if (settings.settings) {
    form.value = {
      auto_refresh_interval: settings.settings.auto_refresh_interval || 30,
      theme: settings.settings.theme || "auto",
      font_size: settings.settings.font_size || "medium",
    };
  }
}

onMounted(loadSettings);

function changeLocale(val: string) {
  locale.value = val;
  localStorage.setItem("rosser_locale", val);
}

function applyTheme() {
  const t = form.value.theme;
  if (t === "dark") {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  } else if (t === "light") {
    document.documentElement.classList.add("light");
    document.documentElement.classList.remove("dark");
  } else {
    document.documentElement.classList.remove("dark", "light");
  }
}

function applyFontSize() {
  const map: Record<string, string> = {
    small: "14px",
    medium: "16px",
    large: "18px",
  };
  document.documentElement.style.fontSize = map[form.value.font_size] || "16px";
}

async function save() {
  saving.value = true;
  try {
    await settings.update(form.value);
    applyTheme();
    applyFontSize();
    Snackbar.success(t('saved'));
  } finally {
    saving.value = false;
  }
}

function triggerImport() {
  importInput.value?.click();
}

async function handleImport(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  importing.value = true;
  try {
    const text = await file.text();
    await api.POST("/api/opml/import", { params: { query: { file: text } } });
    Snackbar.success(t('saved'));
  } finally {
    importing.value = false;
    target.value = "";
  }
}

async function handleExport() {
  exporting.value = true;
  try {
    const { data } = await api.GET("/api/opml/export");
    const blob = new Blob([data as any], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rosser-export-${new Date().toISOString().slice(0, 10)}.opml`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    exporting.value = false;
  }
}

async function addTag() {
  if (!newTagTitle.value.trim()) return;
  addingTag.value = true;
  try {
    await tagStore.create({ title: newTagTitle.value.trim(), color: newTagColor.value });
    newTagTitle.value = "";
    newTagColor.value = randomColor();
    Snackbar.success(t('saved'));
  } finally {
    addingTag.value = false;
  }
}

function startEditTag(tag: any) {
  editingTag.value = tag;
  editTagTitle.value = tag.title;
  editTagColor.value = tag.color;
  showEditTag.value = true;
}

async function saveEditTag() {
  if (!editingTag.value || !editTagTitle.value.trim()) return;
  savingTag.value = true;
  try {
    await tagStore.update(editingTag.value.id, {
      title: editTagTitle.value.trim(),
      color: editTagColor.value,
    });
    showEditTag.value = false;
    editingTag.value = null;
    Snackbar.success(t('saved'));
  } finally {
    savingTag.value = false;
  }
}

async function removeTag(id: string) {
  try {
    await tagStore.remove(id);
    Snackbar.success(t('saved'));
  } catch {
    Snackbar.error("删除失败");
  }
}

function confirmLogout() {
  Dialog({
    title: t('disconnect'),
    message: t('confirmDisconnect'),
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    onConfirm: () => {
      conn.disconnect();
      router.push("/onboarding");
    },
  });
}
</script>
