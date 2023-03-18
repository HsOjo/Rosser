<script setup>
import Header from "@/components/Header.vue";
import Menu from "@/components/Menu.vue";

import {computed, inject, onMounted, ref} from "vue";
import * as pywebview from "@/utils/pywebview.js";
import store from "@/plugins/store";
import Index from "@/components/Index.vue";
import {AxiosInstanceKey} from "@/plugins/axios";

const isMac = computed(() => store.getters.platform === 'Darwin');
const axios = inject(AxiosInstanceKey)
const is_loaded = ref(false)
const menu_collapsed = ref(false)

onMounted(() => {
  let timer = setInterval(() => {
    pywebview.init(() => {
      clearInterval(timer)
      store.commit('initialize')
      axios.defaults.baseURL = store.getters.backendURL
      pywebview.api.get_properties().then(
          properties => {
            let window_w = 1366
            let window_h = 768
            pywebview.api.resize(window_w, window_h)
            pywebview.api.move(
                properties.x - (window_w - properties.width) * 0.5,
                properties.y - (window_h - properties.height) * 0.1
            )
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
          @toggle_menu="menu_collapsed = !menu_collapsed"
      ></Header>
    </transition>

    <div class="body" :class="{'body-border': isMac}">
      <transition
          enter-active-class="animate__animated animate__fadeInLeft" appear
          leave-active-class="animate__animated animate__fadeOutLeft"
      >
        <Menu :collapsed="menu_collapsed"></Menu>
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
  display: flex;
}

.body-border {
  border: #DEDEDE solid 1px;
  box-sizing: border-box;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.parent-size {
  width: 100%;
  height: 100%;
}

.content {
  --animate-duration: 1s;
}
</style>
