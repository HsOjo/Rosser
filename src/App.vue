<script setup>
import Header from "@/components/Header.vue";
import Menu from "@/components/Menu.vue";

import {onMounted, ref} from "vue";
import * as pywebview from "@/utils/pywebview.js";
import store from "@/plugins/store";
import Index from "@/components/Index.vue";

const is_loaded = ref(false)
const menu_visible = ref(true)

onMounted(() => {
  let timer = setInterval(() => {
    pywebview.init(() => {
      clearInterval(timer)
      store.commit('loadPyContext')
      pywebview.api.get_properties().then(
          properties => {
            let screen_w = (properties.x + properties.width * 0.5) * 2
            let window_w = 1280
            let window_h = 720
            pywebview.api.resize(window_w, window_h)
            pywebview.api.move((screen_w - window_w) * 0.5, properties.y)
            is_loaded.value = true
          }
      )
    })
  }, 100)
})
</script>
<template>
  <template v-if="is_loaded">
    <transition
        enter-active-class="animate__animated animate__fadeInDown" appear
        leave-active-class="animate__animated animate__fadeOutDown"
    >
      <Header
          @toggle_menu="menu_visible = !menu_visible"
      ></Header>
    </transition>

    <div class="body">
      <transition
          enter-active-class="animate__animated animate__fadeInLeft" appear
          leave-active-class="animate__animated animate__fadeOutLeft"
      >
        <div class="menu" v-show="menu_visible">
          <Menu></Menu>
        </div>
      </transition>

      <transition
          enter-active-class="animate__animated animate__zoomIn" appear
          leave-active-class="animate__animated animate__zoomOut"
      >
        <div class="content parent-size">
          <Index></Index>
        </div>
      </transition>
    </div>
  </template>
</template>

<style scoped>
.body {
  height: calc(100% - 40px);
  border: #DEDEDE solid 1px;
  box-sizing: border-box;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
  display: flex;
}

.menu {
  width: 320px;
  height: 100%;
  overflow: auto;
}

.parent-size {
  width: 100%;
  height: 100%;
}

.content {
  --animate-duration: 1s;
}
</style>
