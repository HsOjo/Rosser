<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {useStore} from 'vuex'
import api from '@/utils/api'
import {message} from 'ant-design-vue'

const store = useStore()
const loading = ref(false)
const saving = ref(false)
const localInterval = ref(30)
const localTheme = ref('dark')
const localFontSize = ref(14)

const intervalOptions = [
  {label: '禁用自动刷新', value: 0},
  {label: '每 15 分钟', value: 15},
  {label: '每 30 分钟', value: 30},
  {label: '每 1 小时', value: 60},
  {label: '每 2 小时', value: 120},
  {label: '每 6 小时', value: 360},
  {label: '每 12 小时', value: 720},
  {label: '每天', value: 1440},
]

const themeOptions = [
  {label: '深色', value: 'dark'},
  {label: '浅色', value: 'light'},
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
    // 立即应用主题和字体大小
    applyTheme(localTheme.value)
    applyFontSize(localFontSize.value)
    message.success('设置已保存')
  } catch (e) {
    message.error('保存失败')
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
</script>

<template>
  <a-spin :spinning="loading">
    <a-form layout="vertical">
      <a-form-item label="自动刷新间隔">
        <a-select
          v-model:value="localInterval"
          :options="intervalOptions"
          style="width: 200px"
        />
        <div style="margin-top: 8px; color: var(--text-tertiary); font-size: 12px;">
          设置后台自动抓取订阅的时间间隔
        </div>
      </a-form-item>

      <a-form-item label="主题">
        <a-radio-group v-model:value="localTheme" :options="themeOptions" option-type="button" button-style="solid"/>
      </a-form-item>

      <a-form-item label="字体大小">
        <a-slider v-model:value="localFontSize" :min="12" :max="20" :marks="{12: '12px', 14: '14px', 16: '16px', 18: '18px', 20: '20px'}" style="width: 200px"/>
      </a-form-item>

      <a-form-item>
        <a-button type="primary" :loading="saving" @click="saveSettings">
          保存设置
        </a-button>
      </a-form-item>
    </a-form>
  </a-spin>
</template>

<style scoped>

</style>
