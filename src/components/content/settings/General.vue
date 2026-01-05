<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {useStore} from 'vuex'
import api from '@/utils/api'
import {message} from 'ant-design-vue'

const store = useStore()
const loading = ref(false)
const saving = ref(false)
const localInterval = ref(30)

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

onMounted(async () => {
  await loadSettings()
})

async function loadSettings() {
  loading.value = true
  try {
    const resp = await api.basic.settings.get()
    store.commit('updateState', {settings: resp.data})
    localInterval.value = resp.data.auto_refresh_interval
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    const resp = await api.basic.settings.update({
      auto_refresh_interval: localInterval.value
    })
    store.commit('updateState', {settings: resp.data})
    message.success('设置已保存')
  } catch (e) {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
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
        <div style="margin-top: 8px; color: rgba(255, 255, 255, 0.45); font-size: 12px;">
          设置后台自动抓取订阅的时间间隔
        </div>
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
