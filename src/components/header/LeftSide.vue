<template>
  <IconButton @click="toggleCollapse">
    <MenuUnfoldOutlined v-if="sider_collapsed"/>
    <MenuFoldOutlined v-else/>
  </IconButton>
  <IconButton @click="addSubscription">
    <PlusSquareOutlined/>
  </IconButton>
  <a-popover trigger="click" placement="bottom" v-model:open="searchVisible">
    <IconButton class="hover-scale">
      <SearchOutlined/>
    </IconButton>
    <template #content>
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="搜索文章标题"
        style="width: 200px"
        allow-clear
        @search="onSearch"
        @pressEnter="onSearch"
      />
    </template>
  </a-popover>
</template>

<script>
import {MenuFoldOutlined, MenuUnfoldOutlined, PlusSquareOutlined, SearchOutlined} from "@ant-design/icons-vue";
import {computed, ref} from "vue";
import {useStore} from "vuex";
import IconButton from "@/components/header/IconButton.vue";


export default {
  components: {
    IconButton,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    PlusSquareOutlined,
    SearchOutlined,
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

    // 搜索相关
    const searchVisible = ref(false)
    const searchKeyword = ref('')

    function onSearch() {
      store.commit('updateQuery', {search_keyword: searchKeyword.value})
      searchVisible.value = false
    }

    return {
      sider_collapsed,
      toggleCollapse,
      addSubscription,
      searchVisible,
      searchKeyword,
      onSearch,
    }
  }
}
</script>

<style scoped>
.hover-scale:hover > span {
  animation: scale 0.3s ease;
}

@keyframes scale {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
</style>