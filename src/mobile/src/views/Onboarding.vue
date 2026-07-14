<template>
  <div class="h-full flex flex-col bg-white dark:bg-zinc-900">
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
      <!-- Step 1: Preferences -->
      <div v-if="step === 1" class="w-full max-w-xs space-y-6 animate-fadeIn">
        <div class="text-center space-y-2">
          <h1 class="text-2xl font-black text-slate-900 dark:text-zinc-50">
            {{ t("welcomeTitle") }}
          </h1>
          <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            {{ t("welcomeDescription") }}
          </p>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-[10px] font-bold text-slate-400 uppercase">{{ t("language") }}</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="lang in languages"
                :key="lang.value"
                class="py-2.5 rounded-xl text-xs font-bold border transition-all"
                :class="
                  form.locale === lang.value
                    ? 'bg-brand-light border-brand text-brand dark:bg-brand/10'
                    : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-300'
                "
                @click="form.locale = lang.value"
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
                class="py-2.5 rounded-xl text-[10px] font-bold border transition-all flex flex-col items-center gap-1"
                :class="
                  form.theme === themeOption.value
                    ? 'bg-brand-light border-brand text-brand dark:bg-brand/10'
                    : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-zinc-300'
                "
                @click="form.theme = themeOption.value"
              >
                <component :is="themeOption.icon" class="w-4 h-4" />
                {{ themeOption.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Connection -->
      <div v-else-if="step === 2" class="w-full max-w-xs space-y-6 animate-fadeIn">
        <div class="text-center space-y-2">
          <h1 class="text-xl font-black text-slate-900 dark:text-zinc-50">
            {{ t("onboardingTitle") }}
          </h1>
          <p class="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            {{ t("onboardingDesc") }}
          </p>
        </div>

        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase">{{ t("baseURL") }}</label>
            <input
              v-model="form.baseURL"
              type="text"
              :placeholder="t('baseURL')"
              class="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 focus:border-brand outline-none transition-colors"
              @keydown.enter="connect"
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-slate-400 uppercase">{{ t("token") }}</label>
            <input
              v-model="form.token"
              type="text"
              :placeholder="t('token')"
              class="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 focus:border-brand outline-none transition-colors"
              @keydown.enter="connect"
            />
          </div>
        </div>

        <p v-if="error" class="text-[10px] text-red-500 font-medium text-center">
          {{ error }}
        </p>
      </div>
    </div>

    <!-- Bottom actions -->
    <div class="p-4 border-t border-slate-100 dark:border-zinc-800 safe-bottom"
    >
      <div class="flex gap-3">
        <button
          v-if="step > 1"
          class="flex-1 py-3 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700/50 text-xs font-bold text-slate-600 dark:text-zinc-300 rounded-xl transition-colors"
          @click="step--"
        >
          {{ t("back") }}
        </button>
        <button
          class="flex-[2] py-3 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          :disabled="loading"
          @click="next"
        >
          <div
            v-if="loading"
            class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
          />
          <span v-else-if="step === 1">{{ t("next") }}</span>
          <span v-else>{{ t("connect") }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { Sunny, Moon, Contrast } from "@vicons/ionicons5";
import { useConnectionStore } from "@/stores";
import {
  saveUISettings,
  applyUISettings,
  hasUISettings,
  uiSettings,
  type Theme,
} from "@/settings/local";


const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const conn = useConnectionStore();

const step = ref(1);
const loading = ref(false);
const error = ref("");

const form = reactive({
  locale: uiSettings.value.locale,
  theme: uiSettings.value.theme,
  baseURL: "",
  token: "",
});

const languages = [
  { value: "zh-CN", label: "简体中文" },
  { value: "en", label: "English" },
];

const themes = computed(() => [
  { value: "light" as Theme, label: t("themeLight"), icon: Sunny },
  { value: "dark" as Theme, label: t("themeDark"), icon: Moon },
  { value: "auto" as Theme, label: t("themeAuto"), icon: Contrast },
]);

watch(
  () => form.locale,
  (val) => {
    locale.value = val;
  }
);

watch(
  () => form.theme,
  (val) => {
    uiSettings.value.theme = val;
    applyUISettings();
  }
);

onMounted(() => {
  if (conn.isReady) {
    router.replace("/");
    return;
  }
  if (hasUISettings()) {
    step.value = 2;
  }
  const saved = localStorage.getItem("rosser_config");
  if (saved) {
    try {
      const cfg = JSON.parse(saved);
      form.baseURL = cfg.baseURL || "";
      form.token = cfg.token || "";
    } catch {
      // ignore
    }
  }
});

async function next() {
  if (step.value === 1) {
    saveUISettings({ locale: form.locale, theme: form.theme });
    locale.value = form.locale;
    applyUISettings();
    step.value = 2;
    return;
  }

  await connect();
}

async function connect() {
  if (!form.baseURL || !form.token) return;
  loading.value = true;
  error.value = "";
  try {
    await conn.connect(form.baseURL, form.token);
    const redirect = (route.query.redirect as string) || "/";
    router.replace(redirect);
  } catch (e: any) {
    error.value = e.message || t("connectFailed");
  } finally {
    loading.value = false;
  }
}
</script>
