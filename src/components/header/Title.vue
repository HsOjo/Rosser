<template>
  <div class="title" @mousedown="titleMouseDown" @dblclick="toggleFullScreen">
    {{ isMac ? title : slogan }}
  </div>
</template>

<script lang="ts">
import store from "@/plugins/store";
import {startDrag} from "@/utils/drag.js";
import * as pywebview from "@/utils/pywebview.js";
import {computed, onMounted, watch} from "vue";

export default {
  name: "Title",
  setup() {
    const isMac = store.getters.isMac;
    const slogan = computed(() => {
      let slogan = 'A simple RSS Reader'
      let subscription = store.getters.state.subscription
      slogan = (subscription && subscription.title) || slogan
      return slogan
    })
    const title = computed(() => {
      return `Rosser - ${slogan.value}`
    })

    function syncTitle() {
      pywebview.api.set_title(title.value)
    }

    watch(title, syncTitle)
    onMounted(syncTitle)

    function toggleFullScreen() {
      pywebview.api.toggle_fullscreen()
    }

    function titleMouseDown(...args) {
      if (isMac)
        startDrag(...args)
    }

    return {
      isMac,
      titleMouseDown,
      toggleFullScreen,
      title, slogan
    }
  },
}
</script>

<style scoped>
.title {
  color: #EBECF0;
  font-size: 0.9rem;
  font-weight: bold;
  width: 100%;
  padding: 8px;
  text-indent: 100px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>