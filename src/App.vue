<script setup lang="ts">
import {computed, inject, onMounted, ref, watch} from "vue";
import {AxiosInstanceKey} from "@/plugins/axios";
import Header from "@/components/header/Header.vue";
import Content from "@/components/content/Content.vue";
import Menu from "@/components/menu/Menu.vue";
import api from "@/utils/api";
import {useStore} from "vuex";
import {useBrowser} from "@/utils/browser";

api.axios = inject(AxiosInstanceKey)
const store = useStore()
const backend_loaded = ref(false)
const isMac = computed(() => store.getters.isMac);
useBrowser()

api.axios.defaults.baseURL = store.getters.backendURL
function waitBackend(callback) {
  api.test().then(null, err => {
    if (err && err.response && err.response.status)
      callback()
    else
      setTimeout(() => waitBackend(callback), 1000)
  })
}

waitBackend(() => {
  backend_loaded.value = true
})

watch(backend_loaded, (nv) => {
  if (nv) {
    api.category.all().then(
        resp => store.commit('updateState', {categories: resp.data}))
    api.subscription.all().then(
        resp => store.commit('updateState', {subscriptions: resp.data}))
    api.site.all().then(
        resp => store.commit('updateState', {sites: resp.data}))
  }
})

</script>
<template>
  <template v-if="backend_loaded">
    <transition enter-active-class="animate__animated animate__fadeInDown" appear>
      <Header></Header>
    </transition>
    <div class="parent-size body" :class="{'body-border': isMac}">
      <transition enter-active-class="animate__animated animate__fadeInLeft" appear>
        <Menu></Menu>
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
