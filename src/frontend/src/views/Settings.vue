<template>
  <n-modal v-model:show="show" preset="card" style="width: 700px" :title="t('settingsTitle')"
    :content-style="{ height: '420px' }"
  >
    <n-tabs type="line" placement="left" style="height: 100%">
      <n-tab-pane :tab="t('general')" name="general">
        <n-form label-placement="left" label-width="160">
          <n-form-item :label="t('theme')">
            <n-select v-model:value="uiTheme" :options="[
              { label: t('themeLight'), value: 'light' },
              { label: t('themeDark'), value: 'dark' },
              { label: t('themeAuto'), value: 'auto' }
            ]" />
          </n-form-item>
          <n-form-item :label="t('language')">
            <n-select v-model:value="locale" :options="[
              { label: '简体中文', value: 'zh-CN' },
              { label: 'English', value: 'en' }
            ]" @update:value="changeLocale" />
          </n-form-item>
        </n-form>
      </n-tab-pane>

      <n-tab-pane :tab="t('dataManagement')" name="data">
        <n-space vertical>
          <n-card :title="t('opmlImport')" size="small">
            <n-space>
              <n-button :loading="importing" @click="triggerImport">{{ t('import') }}</n-button>
              <input ref="importInput" type="file" accept=".opml,.xml" style="display: none" @change="handleImport" />
            </n-space>
          </n-card>

          <n-card :title="t('opmlExport')" size="small">
            <n-button :loading="exporting" @click="handleExport">{{ t('export') }}</n-button>
          </n-card>
        </n-space>
      </n-tab-pane>

      <n-tab-pane :tab="t('connection')" name="connection">
        <n-space vertical>
          <n-descriptions bordered>
            <n-descriptions-item :label="t('baseURL')">{{ conn.baseURL }}</n-descriptions-item>
            <n-descriptions-item :label="t('token')">{{ conn.token.slice(0, 8) }}...</n-descriptions-item>
          </n-descriptions>

          <n-card :title="t('proxy')" size="small">
            <n-form label-placement="left" label-width="100">
              <n-form-item :label="t('proxyEnabled')">
                <n-switch v-model:value="form.proxy.enabled" />
              </n-form-item>
              <n-form-item :label="t('proxyUrl')">
                <n-input
                  v-model:value="form.proxy.url"
                  :placeholder="t('proxyUrlPlaceholder')"
                  :disabled="!form.proxy.enabled"
                  style="width: 100%"
                />
              </n-form-item>
            </n-form>
          </n-card>

          <n-button @click="logout">{{ t('disconnect') }}</n-button>
        </n-space>
      </n-tab-pane>

      <n-tab-pane :tab="t('tags')" name="tags">
        <n-space vertical>
          <n-space>
            <n-input v-model:value="newTagTitle" :placeholder="t('tagTitle')" style="width: 200px" />
            <div class="tag-color-picker" style="width: 34px">
              <n-color-picker v-model:value="newTagColor" :modes="['hex']" />
            </div>
            <n-button type="primary" :loading="addingTag" @click="addTag">{{ t('add') }}</n-button>
          </n-space>

          <n-spin :show="tagStore.loading">
            <n-empty v-if="!tagStore.loading && tagStore.tags.length === 0" :description="$t('noData')" />
            <n-space v-else wrap :wrap-item="false" :size="[12, 8]">
              <n-tag
                v-for="tag in tagStore.tags"
                :key="tag.id"
                :color="{ color: tag.color, textColor: '#fff' }"
                size="small"
                closable
                style="cursor: pointer"
                @click="startEditTag(tag)"
                @close="(e: MouseEvent) => { e.stopPropagation(); removeTag(tag.id); }"
              >
                {{ tag.title }}
              </n-tag>
            </n-space>
          </n-spin>
        </n-space>
      </n-tab-pane>
    </n-tabs>

    <n-modal v-model:show="showEditTag" preset="card" :title="t('editTag')" style="width: 360px">
      <n-space vertical>
        <n-input v-model:value="editTagTitle" :placeholder="t('tagTitle')" style="width: 100%" />
        <div class="tag-color-picker" style="width: 34px">
          <n-color-picker v-model:value="editTagColor" :modes="['hex']" />
        </div>
        <n-space>
          <n-button type="primary" :loading="savingTag" @click="saveEditTag">{{ t('save') }}</n-button>
          <n-button @click="showEditTag = false">{{ t('close') }}</n-button>
        </n-space>
      </n-space>
    </n-modal>

    <template #footer>
      <n-space>
        <n-button type="primary" :loading="saving" @click="save">{{ t('save') }}</n-button>
        <n-button @click="show = false">{{ t('close') }}</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useMessage } from "naive-ui";
import { useConnectionStore, useSettingsStore, useTagStore } from "@/stores";
import { getUISettings, saveUISettings } from "@/platform";
import { api } from "@rosser/shared";

const router = useRouter();
const { t, locale } = useI18n();
const message = useMessage();
const conn = useConnectionStore();
const settings = useSettingsStore();
const tagStore = useTagStore();

const show = defineModel<boolean>("show", { default: false });

const ui = getUISettings();
const uiTheme = ref(ui.value.theme);
const form = ref({ proxy: { enabled: false, url: "" } });
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
    const proxy = settings.settings.proxy || { enabled: false, url: "" };
    form.value = {
      proxy: {
        enabled: proxy.enabled || false,
        url: proxy.url || "",
      },
    };
  }
}

onMounted(() => {
  if (show.value) loadSettings();
});

watch(show, (val) => {
  if (val) loadSettings();
});

function changeLocale(val: string) {
  locale.value = val;
  saveUISettings({ locale: val });
}

async function save() {
  saving.value = true;
  try {
    const payload = { proxy: { ...form.value.proxy } };
    if (!payload.proxy.enabled) {
      payload.proxy.url = "";
    }
    await settings.update(payload);
    saveUISettings({ theme: uiTheme.value, locale: locale.value });
    message.success(t('saved'));
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
    message.success(t('saved'));
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
    message.success(t('saved'));
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
    message.success(t('saved'));
  } finally {
    savingTag.value = false;
  }
}

async function removeTag(id: string) {
  await tagStore.remove(id);
  message.success(t('saved'));
}

function logout() {
  conn.disconnect();
  show.value = false;
  router.push("/onboarding");
}
</script>

<style scoped>
.tag-color-picker :deep(.n-color-picker) {
  width: 100%;
}
.tag-color-picker :deep(.n-color-picker__value) {
  display: none;
}
</style>
