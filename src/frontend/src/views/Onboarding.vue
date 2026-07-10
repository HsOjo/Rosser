<template>
  <div class="onboarding">
    <div class="onboarding-container">
      <div class="onboarding-header">
        <h1 class="onboarding-title">{{ $t('welcomeTitle') }}</h1>
        <p class="onboarding-desc">{{ $t('welcomeDescription') }}</p>
      </div>

      <n-steps :current="currentStep" class="onboarding-steps">
        <n-step :title="$t('stepPreferences')" />
        <n-step :title="$t('stepConnection')" />
      </n-steps>

      <div class="onboarding-content">
        <div v-if="currentStep === 1">
          <n-form label-placement="top">
            <n-form-item :label="$t('language')">
              <n-select
                v-model:value="selectedLocale"
                :options="localeOptions"
                @update:value="handleLocaleChange"
              />
            </n-form-item>
            <n-form-item :label="$t('theme')">
              <n-select
                v-model:value="selectedTheme"
                :options="themeOptions"
                @update:value="handleThemeChange"
              />
            </n-form-item>
          </n-form>
          <div class="onboarding-actions">
            <n-button type="primary" size="large" @click="goToStep2">
              {{ $t('next') }}
            </n-button>
          </div>
        </div>

        <div v-else>
          <n-space vertical>
            <n-radio-group v-model:value="mode">
              <n-radio-button v-if="tauri" value="builtin">{{ $t('builtIn') }}</n-radio-button>
              <n-radio-button value="remote">{{ $t('remote') }}</n-radio-button>
            </n-radio-group>

            <template v-if="mode === 'remote'">
              <n-input v-model:value="url" :placeholder="$t('baseURL')" />
              <n-input
                v-model:value="tokenInput"
                :placeholder="$t('token')"
                type="password"
              />
            </template>

            <div class="onboarding-actions">
              <n-button size="large" @click="currentStep = 1">
                {{ $t('back') }}
              </n-button>
              <n-button type="primary" size="large" :loading="connecting" @click="handleConnect">
                {{ $t('connect') }}
              </n-button>
            </div>
          </n-space>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useMessage } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import { useConnectionStore, BUILTIN_TOKEN } from "@/stores";
import { detectTauri, getPlatformConfig, getUISettings, saveUISettings, hasUISettings } from "@/platform";

const router = useRouter();
const message = useMessage();
const conn = useConnectionStore();
const { locale, t } = useI18n();
const tauri = ref(false);

const ui = getUISettings();
const currentStep = ref(1);
const selectedLocale = ref(locale.value);
const selectedTheme = ref(ui.value.theme);

const localeOptions = [
  { label: "简体中文", value: "zh-CN" },
  { label: "English", value: "en" },
];

const themeOptions = computed(() => [
  { label: t('themeLight'), value: "light" },
  { label: t('themeDark'), value: "dark" },
  { label: t('themeAuto'), value: "auto" },
]);

function handleLocaleChange(val: string) {
  locale.value = val;
  saveUISettings({ locale: val });
}

function handleThemeChange(val: string) {
  saveUISettings({ theme: val });
}

function goToStep2() {
  saveUISettings({ locale: selectedLocale.value, theme: selectedTheme.value });
  currentStep.value = 2;
}

onMounted(async () => {
  tauri.value = await detectTauri();
  if (hasUISettings()) {
    currentStep.value = 2;
  }
  const cfg = await getPlatformConfig();
  if (cfg.baseURL) {
    mode.value = cfg.isBuiltIn ? "builtin" : "remote";
    if (!cfg.isBuiltIn) {
      url.value = cfg.baseURL;
      tokenInput.value = cfg.token;
    }
  } else if (import.meta.env.PROD && tauri.value) {
    // No saved config likely means the previous session was built-in (not persisted).
    mode.value = "builtin";
  }
});

const mode = ref("remote");
const url = ref("http://127.0.0.1:8000");
const tokenInput = ref("dev-token-change-me");
const connecting = ref(false);

async function handleConnect() {
  connecting.value = true;
  try {
    if (mode.value === "builtin") {
      let port = 8000;
      let token = BUILTIN_TOKEN;
      if (import.meta.env.PROD) {
        const cfg = await invoke<{ port: number; token: string }>("start_builtin_backend");
        port = cfg.port;
        token = cfg.token;
      }
      await conn.connect(`http://127.0.0.1:${port}`, token, true);
    } else {
      await conn.connect(url.value, tokenInput.value);
    }
    router.push("/");
  } catch (e: any) {
    console.error(e);
    message.error(e.message || "连接失败，请检查服务器地址和 Token");
  } finally {
    connecting.value = false;
  }
}
</script>

<style scoped>
.onboarding {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  background-color: #ffffff;
  color: #1f2225;
  transition: background-color 0.2s ease, color 0.2s ease;
}

body.rosser-theme-dark .onboarding {
  background-color: #101014;
  color: #ffffff;
}

body.rosser-theme-light .onboarding {
  background-color: #ffffff;
  color: #1f2225;
}

.onboarding-container {
  width: 100%;
  max-width: 480px;
}

.onboarding-header {
  text-align: center;
  margin-bottom: 32px;
}

.onboarding-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 600;
}

.onboarding-desc {
  margin: 0;
  font-size: 14px;
  opacity: 0.7;
}

.onboarding-steps {
  margin-bottom: 32px;
}

.onboarding-content {
  margin-bottom: 24px;
}

.onboarding-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>
