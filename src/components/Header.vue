<script setup>
import {startDrag} from "../utils/drag.js";
import * as pywebview from "../utils/pywebview.js";

import {BellFilled, EyeFilled, LayoutFilled, ScheduleFilled, SettingFilled, UndoOutlined} from "@ant-design/icons-vue";

function toggleFullScreen() {
  pywebview.api.toggle_fullscreen()
}

function minimize() {
  pywebview.api.minimize()
}

function close() {
  pywebview.api.interupt()
}

</script>

<template>
  <div class="header">
    <div class="control-area">
      <button class="control-button close" @click="close"></button>
      <button class="control-button minimize" @click="minimize"></button>
      <button class="control-button maximize" @click="toggleFullScreen"></button>
    </div>
    <div class="plugin-area">
      <button class="icon-button" @click="$emit('toggle_menu')">
        <layout-filled/>
      </button>
    </div>
    <div class="title" @mousedown="startDrag" @dblclick="toggleFullScreen">
      Rosser - A simple RSS Reader
    </div>
    <div class="plugin-area" style="min-width: 200px">
      <button class="icon-button" @click="$emit('refresh')">
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
      <button class="icon-button" @click="$emit('settings')"
              style="border-top-right-radius: 10px">
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
