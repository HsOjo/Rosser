<template>
  <IconButton @click="toggleCollapse">
    <MenuUnfoldOutlined v-if="sider_collapsed"/>
    <MenuFoldOutlined v-else/>
  </IconButton>
</template>

<script>
import {MenuFoldOutlined, MenuUnfoldOutlined} from "@ant-design/icons-vue";
import {computed} from "vue";
import {useStore} from "vuex";
import IconButton from "@/components/header/IconButton.vue";


export default {
  components: {
    IconButton,
    MenuUnfoldOutlined,
    MenuFoldOutlined
  },
  name: "LeftSide",
  setup(props, {emit}) {
    const store = useStore()
    const sider_collapsed = computed(() => store.getters.state.sider_collapsed)

    function toggleCollapse() {
      store.commit('updateState', {sider_collapsed: !sider_collapsed.value})
    }

    return {
      sider_collapsed,
      toggleCollapse,
    }
  }
}
</script>

<style scoped>

</style>