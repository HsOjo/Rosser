<template>
  <n-space vertical>
    <n-page-header title="Settings" @back="$router.push('/')" />

    <n-card title="General">
      <n-form label-placement="left" label-width="160">
        <n-form-item label="Auto Refresh Interval (minutes)">
          <n-input-number v-model:value="form.auto_refresh_interval" :min="1" />
        </n-form-item>
        <n-form-item label="Theme">
          <n-select v-model:value="form.theme">
            <n-option value="light">Light</n-option>
            <n-option value="dark">Dark</n-option>
            <n-option value="auto">Auto</n-option>
          </n-select>
        </n-form-item>
        <n-form-item label="Font Size">
          <n-select v-model:value="form.font_size">
            <n-option value="small">Small</n-option>
            <n-option value="medium">Medium</n-option>
            <n-option value="large">Large</n-option>
          </n-select>
        </n-form-item>
        <n-form-item>
          <n-button type="primary" :loading="saving" @click="save">Save</n-button>
        </n-form-item>
      </n-form>
    </n-card>

    <n-card title="Connection">
      <n-space vertical>
        <n-descriptions bordered>
          <n-descriptions-item label="Base URL">{{ conn.baseURL }}</n-descriptions-item>
          <n-descriptions-item label="Token">{{ conn.token.slice(0, 8) }}...</n-descriptions-item>
        </n-descriptions>
        <n-button @click="logout">Disconnect</n-button>
      </n-space>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useConnectionStore, useSettingsStore } from "@/stores";

const router = useRouter();
const conn = useConnectionStore();
const settings = useSettingsStore();

const form = ref({ auto_refresh_interval: 30, theme: "auto", font_size: "medium" });
const saving = ref(false);

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

async function save() {
  saving.value = true;
  try {
    await settings.update(form.value);
  } finally {
    saving.value = false;
  }
}

function logout() {
  conn.disconnect();
  router.push("/onboarding");
}
</script>
