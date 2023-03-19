<template>
  <div class="control-area">
    <button class="control-button close" @click="close"></button>
    <button class="control-button minimize" @click="minimize"></button>
    <button class="control-button maximize" @click="toggleFullScreen"></button>
  </div>
</template>

<script>
import * as pywebview from "@/utils/pywebview.js";

export default {
  name: "ControlArea",
  setup() {
    function toggleFullScreen() {
      pywebview.api.toggle_fullscreen()
    }

    function minimize() {
      pywebview.api.minimize()
    }

    function close() {
      pywebview.api.interupt()
    }

    return {
      toggleFullScreen,
      minimize,
      close,
    }
  }
}
</script>

<style scoped>
.control-area {
  margin: 0 16px;
  min-width: 60px;
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
</style>