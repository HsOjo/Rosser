<script lang="ts">
import {ref, watch} from "vue";

export default {
  props: {
    visible: {type: Boolean}
  },
  setup(props) {
    const visible = ref(false)
    watch(props, (nv, ov) => {
      visible.value = nv.visible
    })

    function open() {
      visible.value = true
    }

    return {
      open, visible
    }
  }
}
</script>

<template>
  <a-drawer
      title="Basic Drawer"
      placement="right"
      :closable="true"
      :visible="visible"
      :get-container="false"
      :style="{ position: 'absolute' }"
      @close="visible = false"
  >
    <p>Some contents...</p>
  </a-drawer>
</template>

<style scoped>

</style>