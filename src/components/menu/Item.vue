<template>
  <a-menu-item :key="id">
    <template #icon>
      <img :src="`${backendURL}/api/basic/file/download/${site['favicon_id']}`"
           v-if="site && site['favicon_id']"
           class="menu-icon" alt="icon"/>
      <bars-outlined v-else/>
    </template>
    <a-dropdown ref="dropdown" :trigger="['contextmenu']">
        <span class="menu-title" :class="{'menu-title-auto-width': !store.getters.state.sider_collapsed}">
          {{ title }}
        </span>
      <template #overlay>
        <a-menu @click="itemClick">
          <a-menu-item-group>
            <template #title>
              <img :src="`${backendURL}/api/basic/file/download/${site['favicon_id']}`"
                   v-if="site && site['favicon_id']"
                   class="menu-icon" alt="icon"/>
              <bars-outlined v-else/>
              <span class="menu-title" style="margin-left: 8px">
                {{ title }}
              </span>
            </template>
            <a-menu-item key="delete">删除</a-menu-item>
          </a-menu-item-group>
        </a-menu>
      </template>
    </a-dropdown>
  </a-menu-item>
</template>

<script lang="ts">
import {BarsOutlined} from "@ant-design/icons-vue";
import {mapGetters, useStore} from "vuex";
import api from "@/utils/api";

export default {
  components: {
    BarsOutlined,
  },
  props: {
    id: {type: Number},
    title: {type: String},
    site: {type: Object}
  },
  computed: {
    ...mapGetters(['backendURL'])
  },
  setup(props) {
    const store = useStore()

    function itemClick({key}) {
      let funcs = {
        delete() {
          api.subscription.delete([props.id]).then(
            () => store.commit('refreshState')
          )
        },
      }

      funcs[key]()
    }

    return {store, itemClick}
  }
}
</script>

<style scoped>
.menu-icon {
  width: 1rem;
  height: 1rem;
}

.menu-title-auto-width {
  width: 100%;
}

.menu-title {
  display: inline-block;
  height: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
}

</style>