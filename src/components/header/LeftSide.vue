<template>
  <IconButton @click="toggleCollapse">
    <MenuUnfoldOutlined v-if="sider_collapsed"/>
    <MenuFoldOutlined v-else/>
  </IconButton>
  <IconButton @click="addSubscription">
    <PlusSquareOutlined/>
  </IconButton>
</template>

<script>
import {MenuFoldOutlined, MenuUnfoldOutlined, PlusSquareOutlined} from "@ant-design/icons-vue";
import {computed} from "vue";
import {useStore} from "vuex";
import IconButton from "@/components/header/IconButton.vue";


export default {
  components: {
    IconButton,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    PlusSquareOutlined,
  },
  name: "LeftSide",
  setup(props, {emit}) {
    const store = useStore()
    const sider_collapsed = computed(() => store.getters.state.sider_collapsed)

    function toggleCollapse() {
      store.commit('updateState', {sider_collapsed: !sider_collapsed.value})
    }

    function addSubscription() {
      store.commit('updateState', {subscribe_modal_visible: true})
    }

    return {
      sider_collapsed,
      toggleCollapse,
      addSubscription,
    }
  }
}
</script>

<style scoped>

</style>