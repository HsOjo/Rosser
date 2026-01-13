<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import {useStore} from 'vuex'
import api from '@/utils/api'
import {message} from 'ant-design-vue'
import {useI18n} from 'vue-i18n'
import {setLocale, getLocale, type LocaleType} from '@/locales'

const store = useStore()
const {t} = useI18n()
const loading = ref(false)
const saving = ref(false)
const localInterval = ref(30)
const localTheme = ref('dark')
const localFontSize = ref(14)
const localLanguage = ref<LocaleType>(getLocale())

const intervalOptions = computed(() => [
  {label: t('settings.general.disableAutoRefresh'), value: 0},
  {label: t('settings.general.every15Minutes'), value: 15},
  {label: t('settings.general.every30Minutes'), value: 30},
  {label: t('settings.general.every1Hour'), value: 60},
  {label: t('settings.general.every2Hours'), value: 120},
  {label: t('settings.general.every6Hours'), value: 360},
  {label: t('settings.general.every12Hours'), value: 720},
  {label: t('settings.general.everyDay'), value: 1440},
])

const themeOptions = computed(() => [
  {label: t('settings.general.themeDark'), value: 'dark'},
  {label: t('settings.general.themeLight'), value: 'light'},
])

const languageOptions = [
  {label: '简体中文', value: 'zh'},
  {label: 'English', value: 'en'},
]

onMounted(async () => {
  await loadSettings()
})

async function loadSettings() {
  loading.value = true
  try {
    const resp = await api.basic.settings.get()
    store.commit('updateState', {settings: resp.data})
    localInterval.value = resp.data.auto_refresh_interval
    localTheme.value = resp.data.theme || 'dark'
    localFontSize.value = resp.data.font_size || 14
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    const resp = await api.basic.settings.update({
      auto_refresh_interval: localInterval.value,
      theme: localTheme.value,
      font_size: localFontSize.value,
    })
    store.commit('updateState', {settings: resp.data})
    applyTheme(localTheme.value)
    applyFontSize(localFontSize.value)
    message.success(t('settings.general.settingsSaved'))
  } catch (e) {
    message.error(t('settings.general.saveFailed'))
  } finally {
    saving.value = false
  }
}

function applyTheme(theme: string) {
  document.body.setAttribute('data-theme', theme || 'dark')
}

function applyFontSize(fontSize: number) {
  document.documentElement.style.setProperty('--article-font-size', `${fontSize || 14}px`)
}

function onLanguageChange(value: LocaleType) {
  setLocale(value)
  localLanguage.value = value
}
</script>

<template>
  <a-spin :spinning="loading">
    <a-form layout="vertical">
      <a-form-item :label="$t('settings.general.language')">
        <a-select
          v-model:value="localLanguage"
          :options="languageOptions"
          style="width: 200px"
          @change="onLanguageChange"
        />
      </a-form-item>

      <a-form-item :label="$t('settings.general.autoRefreshInterval')">
        <a-select
          v-model:value="localInterval"
          :options="intervalOptions"
          style="width: 200px"
        />
        <div style="margin-top: 8px; color: var(--text-tertiary); font-size: 12px;">
          {{ $t('settings.general.autoRefreshHint') }}
        </div>
      </a-form-item>

      <a-form-item :label="$t('settings.general.theme')">
        <a-radio-group v-model:value="localTheme" :options="themeOptions" option-type="button" button-style="solid"/>
      </a-form-item>

      <a-form-item :label="$t('settings.general.fontSize')">
        <a-slider v-model:value="localFontSize" :min="12" :max="20" :marks="{12: '12px', 14: '14px', 16: '16px', 18: '18px', 20: '20px'}" style="width: 200px"/>
      </a-form-item>

      <a-form-item>
        <a-button type="primary" :loading="saving" @click="saveSettings">
          {{ $t('settings.general.saveSettings') }}
        </a-button>
      </a-form-item>
    </a-form>
  </a-spin>
</template>

<style scoped>

</style>
