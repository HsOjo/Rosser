<template>
  <n-space vertical>
    <n-page-header :title="t('settingsTitle')" @back="$router.push('/')" />

    <n-card :title="t('general')">
      <n-form label-placement="left" label-width="160">
        <n-form-item :label="t('autoRefreshInterval')">
          <n-input-number v-model:value="form.auto_refresh_interval" :min="1" />
        </n-form-item>
        <n-form-item :label="t('theme')">
          <n-select v-model:value="form.theme" :options="[
            { label: t('themeLight'), value: 'light' },
            { label: t('themeDark'), value: 'dark' },
            { label: t('themeAuto'), value: 'auto' }
          ]" />
        </n-form-item>
        <n-form-item :label="t('fontSize')">
          <n-select v-model:value="form.font_size" :options="[
            { label: t('fontSizeSmall'), value: 'small' },
            { label: t('fontSizeMedium'), value: 'medium' },
            { label: t('fontSizeLarge'), value: 'large' }
          ]" />
        </n-form-item>
        <n-form-item :label="t('language')">
          <n-select v-model:value="locale" :options="[
            { label: '简体中文', value: 'zh-CN' },
            { label: 'English', value: 'en' }
          ]" @update:value="changeLocale" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" :loading="saving" @click="save">{{ t('save') }}</n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <n-card :title="t('opmlImport')">
      <n-space>
        <n-button :loading="importing" @click="triggerImport">{{ t('import') }}</n-button>
        <input ref="importInput" type="file" accept=".opml,.xml" style="display: none" @change="handleImport" />
      </n-space>
    </n-card>

    <n-card :title="t('opmlExport')">
      <n-button :loading="exporting" @click="handleExport">{{ t('export') }}</n-button>
    </n-card>

    <n-card :title="t('tags')">
      <n-button @click="$router.push('/tags')">{{ t('tags') }}</n-button>
    </n-card>

    <n-card :title="t('connection')">
      <n-space vertical>
        <n-descriptions bordered>
          <n-descriptions-item :label="t('baseURL')">{{ conn.baseURL }}</n-descriptions-item>
          <n-descriptions-item :label="t('token')">{{ conn.token.slice(0, 8) }}...</n-descriptions-item>
        </n-descriptions>
        <n-button @click="logout">{{ t('disconnect') }}</n-button>
      </n-space>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useMessage } from "naive-ui";
import { useConnectionStore, useSettingsStore } from "@/stores";
import { api } from "@rosser/shared";

const router = useRouter();
const { t, locale } = useI18n();
const message = useMessage();
const conn = useConnectionStore();
const settings = useSettingsStore();

const form = ref({ auto_refresh_interval: 30, theme: "auto", font_size: "medium" });
const saving = ref(false);
const importing = ref(false);
const exporting = ref(false);
const importInput = ref<HTMLInputElement | null>(null);

onMounted(async () => {
  await settings.fetch();
  if (settings.settings) {
    form.value = {
      auto_refresh_interval: settings.settings.auto_refresh_interval || 30,
      theme: settings.settings.theme || "auto",
      font_size: settings.settings.font_size || "medium",
    };
  }
});

function changeLocale(val: string) {
  locale.value = val;
  localStorage.setItem("rosser_locale", val);
}

async function save() {
  saving.value = true;
  try {
    await settings.update(form.value);
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

function logout() {
  conn.disconnect();
  router.push("/onboarding");
}
</script>
