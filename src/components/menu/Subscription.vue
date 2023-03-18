<template>
  <a-menu-item :key="subscription.id">
    <template #icon>
      <img :src="`${backendURL()}/api/basic/file/download/${subscription.site.favicon_id}`"
           v-if="subscription.site && subscription.site.favicon_id"
           class="menu-icon" alt="icon"/>
      <bars-outlined v-else/>
    </template>
    <a-dropdown ref="dropdown" :trigger="['contextmenu']">
      <div style="display: flex; align-items: center">
        <div class="menu-title">
          {{ subscription.title }}
        </div>
      </div>
      <template #overlay>
        {{ subscription.title }}
      </template>
    </a-dropdown>
  </a-menu-item>
</template>

<script lang="ts">
import {BarsOutlined} from "@ant-design/icons-vue";
import {mapGetters} from "vuex";

export default {
  components: {
    BarsOutlined,
  },
  props: {
    subscription: {type: Object}
  },
  setup() {
    return {
      ...mapGetters(['backendURL'])
    }
  }
}
</script>

<style scoped>
.menu-icon {
  width: 1rem;
  height: 1rem;
}

.menu-title {
  display: inline-block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>