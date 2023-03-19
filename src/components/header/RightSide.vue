<template>
  <a-dropdown :trigger="['contextmenu']">
    <IconButton class="hover-rotate" @click="fetchSubscriptions">
      <redo-outlined style="font-weight: bolder"/>
    </IconButton>
    <template #overlay>
      <slot name="fetch-overlay"></slot>
    </template>
  </a-dropdown>
  <a-dropdown :trigger="['click']">
    <IconButton class="hover-rotate-y">
      <schedule-filled/>
    </IconButton>
    <template #overlay>
      <slot name="read-overlay"></slot>
    </template>
  </a-dropdown>
  <a-dropdown :trigger="['click']">
    <IconButton class="hover-rotate-y">
      <bell-filled/>
    </IconButton>
    <template #overlay>
      <slot name="notification-overlay"></slot>
    </template>
  </a-dropdown>
  <a-dropdown :trigger="['click']">
    <IconButton class="hover-rotate-x">
      <eye-filled/>
    </IconButton>
    <template #overlay>
      <slot name="view-overlay"></slot>
    </template>
  </a-dropdown>
  <IconButton class="hover-rotate"
              @click="toggleSettingsVisible"
              :class="{'mac-top-right-radius': isMac}">
    <setting-filled/>
  </IconButton>
</template>

<script>
import {BellFilled, EyeFilled, RedoOutlined, ScheduleFilled, SettingFilled} from "@ant-design/icons-vue";
import store from "@/plugins/store";
import {inject} from "vue";
import {AxiosInstanceKey} from "@/plugins/axios";
import IconButton from "@/components/header/IconButton.vue";

export default {
  name: "RightSide",
  components: {IconButton, BellFilled, EyeFilled, RedoOutlined, ScheduleFilled, SettingFilled},
  setup() {
    const isMac = store.getters.isMac
    const axios = inject(AxiosInstanceKey)

    function fetchSubscriptions() {
      let subscription = store.getters.state.subscription
      let subscription_id = subscription && subscription.id
      if (subscription_id)
        axios.post('/api/subscription/fetch', {ids: [subscription_id]})
      else
        axios.post('/api/subscription/fetch-all')
    }

    function toggleSettingsVisible() {
      store.commit('updateState', {settings_visible: !store.getters.state.settings_visible})
    }

    return {
      isMac,
      fetchSubscriptions,
      toggleSettingsVisible,
    }
  }
}
</script>

<style scoped>

.hover-rotate:hover > span {
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.hover-rotate-y:hover > span {
  animation: rotate-y 0.5s linear;
}

@keyframes rotate-y {
  from {
    transform: rotateY(0deg);
  }
  to {
    transform: rotateY(360deg);
  }
}

.hover-rotate-x:hover > span {
  animation: rotate-x 0.5s linear;
}

@keyframes rotate-x {
  from {
    transform: rotateX(0deg);
  }
  to {
    transform: rotateX(360deg);
  }
}
</style>