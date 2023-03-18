<script lang="ts" setup>
import {startDrag} from "@/utils/drag.js";
import * as pywebview from "@/utils/pywebview.js";
import {BellFilled, EyeFilled, LayoutFilled, ScheduleFilled, SettingFilled, UndoOutlined} from "@ant-design/icons-vue";
import store from "@/plugins/store";
import {computed, inject, onMounted, watch} from "vue";
import {AxiosInstanceKey} from "@/plugins/axios";

const isMac = computed(() => store.getters.platform === 'Darwin');
const axios = inject(AxiosInstanceKey)
const slogan = computed(() => {
  let slogan = 'A simple RSS Reader'
  let subscription = store.getters.subscription
  slogan = (subscription && subscription.title) || slogan
  return slogan
})
const title = computed(() => {
  return `Rosser - ${slogan.value}`
})

watch(title, () => {
  store.commit('updateTitle', title.value)
})
onMounted(() => store.commit('updateTitle', title.value))

function toggleFullScreen() {
  pywebview.api.toggle_fullscreen()
}

function minimize() {
  pywebview.api.minimize()
}

function close() {
  pywebview.api.interupt()
}

function fetchSubscriptions() {
  let subscription_id = store.getters.subscriptionId
  if (subscription_id)
    axios.post('/api/subscription/fetch', {ids: [subscription_id]})
  else
    axios.post('/api/subscription/fetch-all')
}

function importOPML() {
  pywebview.api.create_file_dialog(
      0, '', false,
      null, ['OPML Files (*.opml)']).then(
      (paths) => {
        axios.post('/api/basic/import-opml', {path: paths.pop()})
      }
  )
}
</script>

<template>
  <div class="header">
    <div class="control-area" v-if="isMac">
      <button class="control-button close" @click="close"></button>
      <button class="control-button minimize" @click="minimize"></button>
      <button class="control-button maximize" @click="toggleFullScreen"></button>
    </div>
    <div class="plugin-area">
      <button class="icon-button" @click="$emit('toggle_menu')">
        <layout-filled/>
      </button>
    </div>
    <div class="title" @mousedown="isMac ? startDrag: null" @dblclick="toggleFullScreen">
      {{ isMac ? title : slogan }}
    </div>
    <div class="plugin-area" style="min-width: 200px">
      <button class="icon-button" @click="fetchSubscriptions">
        <undo-outlined style="font-weight: bolder"/>
      </button>
      <button class="icon-button" @click="$emit('mark-read')">
        <schedule-filled/>
      </button>
      <button class="icon-button" @click="$emit('notifications')">
        <bell-filled/>
      </button>
      <button class="icon-button" @click="$emit('view-options')">
        <eye-filled/>
      </button>
      <button class="icon-button" @click="importOPML" :class="{'mac-top-right-radius': isMac}">
        <setting-filled/>
      </button>
    </div>
  </div>
</template>

<style scoped>
.header {
  width: 100%;
  height: 40px;
  display: flex;
  background: #27282D;
  align-items: center;
  justify-content: space-between;
}

.control-area {
  margin: 0 16px;
  min-width: 60px;
}

.plugin-area {
  margin: 0;
}

.mac-top-right-radius {
  border-top-right-radius: 10px !important;
}

.control-button {
  width: 12px;
  height: 12px;
  border-radius: 12px;
  padding: 0;
  margin: 4px;
  cursor: default;
}

.control-button:active {
  opacity: 0.8;
}

.close {
  background: #ED6A5E;
}

.minimize {
  background: #F4BF4F;
}

.maximize {
  background: #62C554;
}

.title {
  color: #EBECF0;
  font-size: 0.9rem;
  font-weight: bold;
  width: 100%;
  padding: 8px;
  text-indent: 4rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.icon-button {
  width: 40px;
  height: 40px;
  padding: 0;
  margin: 0;
  border-radius: 0;
  background: transparent;
  color: #CED0D5;
}

.icon-button:hover {
  background: #383A41;
}

.icon-button:active {
  opacity: 0.8;
}
</style>
