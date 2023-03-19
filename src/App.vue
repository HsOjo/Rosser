<script setup>
import {computed, inject, ref} from "vue";
import * as pywebview from "@/utils/pywebview.js";
import store from "@/plugins/store";
import {AxiosInstanceKey} from "@/plugins/axios";
import Header from "@/components/Header.vue";
import Content from "@/components/Content.vue";
import Sider from "@/components/Sider.vue";

const axios = inject(AxiosInstanceKey)
const is_loaded = ref(false)
const isMac = computed(() => store.getters.platform === 'Darwin');

function waitBackend(callback) {
  axios.get('/').then(null, err => {
    if (err && err.response && err.response.status)
      callback()
    else
      setTimeout(() => waitBackend(callback), 1000)
  })
}

let timer = setInterval(() => {
  pywebview.init(() => {
    clearInterval(timer)
    store.commit('initialize')
    axios.defaults.baseURL = store.getters.backendURL
    waitBackend(() => {
      is_loaded.value = true
    })
    pywebview.api.get_properties().then(
        properties => {
          let window_w = 1366
          let window_h = 768
          pywebview.api.resize(window_w, window_h)
          pywebview.api.move(
              properties.x - (window_w - properties.width) * 0.5,
              properties.y - (window_h - properties.height) * 0.1
          )
        }
    )
  })
}, 100)
</script>
<template>
  <template v-if="is_loaded">
    <transition enter-active-class="animate__animated animate__fadeInDown" appear>
      <Header></Header>
    </transition>
    <div class="parent-size body" :class="{'body-border': isMac}">
      <transition enter-active-class="animate__animated animate__fadeInLeft" appear>
        <Sider ref="sider"></Sider>
      </transition>
      <transition enter-active-class="animate__animated animate__zoomIn" appear>
        <Content ref="content"></Content>
      </transition>
    </div>
  </template>
  <template v-else>
    <div class="parent-size center">
      <a-spin tip="Loading..."/>
    </div>
  </template>
</template>

<style scoped>
.parent-size {
  width: 100%;
  height: 100%;
}

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

.body-border > .ant-menu {
  border-bottom-left-radius: 10px;
}

.center {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
