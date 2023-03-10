<script setup>
import HelloWorld from './components/HelloWorld.vue'
import Header from "./components/Header.vue";
import Menu from "./components/Menu.vue";

import {onMounted, reactive} from "vue";
import * as pywebview from "./utils/pywebview.js";

const state = reactive({menu_visible: true})

onMounted(() => {
  let timer = setInterval(() => {
    pywebview.init(() => {
      clearInterval(timer)
      pywebview.api.get_properties().then(
          properties => {
            let screen_w = (properties.x + properties.width * 0.5) * 2
            let window_w = 1280
            let window_h = 720
            pywebview.api.set_window_size(window_w, window_h)
            pywebview.api.move((screen_w - window_w) * 0.5, properties.y)
          }
      )
    })
  }, 100)
})
</script>
<template>
  <Header
      @toggle_menu="state.menu_visible = !state.menu_visible"
  ></Header>
  <div class="body">
    <div class="menu">
    <Menu v-show="state.menu_visible"></Menu>
      </div>
    <div class="content">
      <a href="https://vitejs.dev" target="_blank">
        <img src="/vite.svg" class="logo" alt="Vite logo"/>
      </a>
      <a href="https://vuejs.org/" target="_blank">
        <img src="./assets/vue.svg" class="logo vue" alt="Vue logo"/>
      </a>
      <HelloWorld msg="Vite + Vue"/>
    </div>
  </div>
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
  width: 256px;
  height: 100%;
  overflow: auto;
}

.content {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
