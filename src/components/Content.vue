<template>
  <div class="content">
    <Index></Index>
    <Settings ref="settings"></Settings>
  </div>
</template>

<script>
import {computed, ref} from "vue";
import store from "@/plugins/store";
import Index from "@/components/content/Index.vue";
import Settings from "@/components/content/Settings.vue";

export default {
  name: "Content",
  components: {
    Index,
    Settings,
  },
  setup() {
    const isMac = computed(() => store.getters.platform === 'Darwin');
    const settings = ref(null)
    return {
      settings,
      isMac,
    }
  }
}
</script>

<style scoped>
.content {
  width: 100%;
  height: 100%;
  --animate-duration: 1s;
  position: relative;
}
</style>