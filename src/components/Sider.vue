<script lang="ts">
import {inject, onMounted, ref} from 'vue';
import {AxiosInstanceKey} from "@/plugins/axios";
import Menu from "@/components/sider/Menu.vue";

export default {
  components: {
    Menu
  },
  setup(props) {
    const axios = inject(AxiosInstanceKey)
    const menu = ref(null)
    const categories = ref<object[]>([]);
    const subscriptions = ref<object[]>([]);

    function getAllCategories() {
      axios.get('/api/category/all').then(
          resp => {
            categories.value = resp.data
          }
      )
    }

    function getAllSubscriptions() {
      axios.get('/api/subscription/all').then(
          resp => {
            subscriptions.value = resp.data
          }
      )
    }

    onMounted(() => {
      getAllCategories()
      getAllSubscriptions()
    })

    return {
      menu,
      categories,
      subscriptions,
    }
  }
}
</script>

<template>
  <Menu ref="menu" :categories="categories" :subscriptions="subscriptions"></Menu>
</template>

<style scoped>

</style>