<script lang="ts">
import {onMounted, ref} from 'vue';
import Menu from "@/components/sider/Menu.vue";
import api from "@/utils/api";

export default {
  components: {
    Menu
  },
  setup(props) {
    const menu = ref(null)
    const categories = ref<object[]>([]);
    const subscriptions = ref<object[]>([]);

    function getAllCategories() {
      api.category.all().then(
          resp => {
            categories.value = resp.data
          }
      )
    }

    function getAllSubscriptions() {
      api.subscription.all().then(
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