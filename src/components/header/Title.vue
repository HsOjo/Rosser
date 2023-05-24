<template>
  <div class="title" @dblclick="browser.maximize(store)">
    {{ isMac ? title : slogan }}
  </div>
</template>

<script lang="ts">
import {useStore} from "vuex";
import {computed, onMounted, watch} from "vue";
import * as browser from "@/utils/browser";

export default {
  name: "Title",
  setup() {
    const store = useStore()
    const isMac = computed(() => store.getters.isMac);
    const slogan = computed(() => {
      let subscription = store.getters.query.subscription
      return (subscription && subscription.title) || 'A simple RSS Reader'
    })
    const title = computed(() => {
      return `Rosser - ${slogan.value}`
    })

    function syncTitle() {
      store.getters.electron.ipcRenderer.send('set_title', title.value)
    }

    watch(title, syncTitle)
    onMounted(syncTitle)

    return {
      store,
      browser,
      isMac,
      title,
      slogan,
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
  -webkit-app-region: drag
}

</style>