<template>
  <div class="control-area">
    <button class="control-button close" @click="browser.close(store)"></button>
    <button class="control-button minimize" @click="browser.minimize(store)"></button>
    <button class="control-button maximize" @click="browser.maximize(store)"></button>
  </div>
</template>

<script>
import {useStore} from "vuex";
import * as browser from "@/utils/browser";

export default {
  name: "ControlArea",
  setup() {
    const store = useStore()
    return {
      store,
      browser,
    }
  }
}
</script>

<style scoped>
.control-area {
  margin: 0 16px;
  min-width: 60px;
}

.control-button {
  width: 12px;
  height: 12px;
  border-radius: 12px;
  padding: 0;
  margin: 4px;
  cursor: default;
}

.control-button:active {
  opacity: 0.8;
}

.close {
  background: #ED6A5E;
}

.minimize {
  background: #F4BF4F;
}

.maximize {
  background: #62C554;
}
</style>