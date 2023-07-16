<script setup lang="ts">
import {useStore} from "vuex";
import {computed, ref, watch} from "vue";
import lodash from "lodash";

const store = useStore()
const visible = ref(false)
const progress = computed(() => store.getters.state.progress)

watch(progress, (nv, ov) => {
  visible.value = true
  if (nv.toFixed(3) == 1) {
    lodash.debounce(() => {
      visible.value = false
    }, 1000)()
  }
})
</script>

<template>
  <transition
    enter-active-class="animate__animated animate__fadeIn"
    leave-active-class="animate__animated animate__fadeOut"
    appear>
    <div
      class="progress-bar"
      v-if="visible"
      :style="{width: `${progress * 100}%`}"
    ></div>
  </transition>
</template>

<style scoped>
.progress-bar {
  position: fixed;
  top: calc(40px - 2px);
  height: 4px;
  background: #646cff;
  border-bottom-left-radius: 2px;
  border-bottom-right-radius: 2px;
  transition: 0.6s linear;
}
</style>