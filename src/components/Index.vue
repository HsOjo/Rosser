<script setup lang="ts">
import {computed, ref, watch} from "vue";
import Article from "@/components/Article.vue";
import axios from "@/plugins/axios";
import store from "@/plugins/store";

const page = ref(1)
const per_page = ref(10)
const total = ref(0)
const articles = ref<object[]>([])

const subscription = computed(() => store.getters.subscription)
const subscriptionId = computed(() => subscription.value && subscription.value.id)

watch(subscription, (nv, ov) => {
  getPagiArticles({subscription_id: subscriptionId.value})
})

function getPagiArticles({page_ = page.value, per_page_ = per_page.value, subscription_id}) {
  axios().post('/api/subscription/article/paginate', {
    page_, per_page_, subscription_id
  }).then(
      resp => {
        articles.value = resp.data.items
        total.value = resp.data.total
      }
  )
}

getPagiArticles({subscription_id: subscriptionId.value})
</script>

<template>
  <div class="index">
    <template v-for="(article, index) in articles">
      <transition
          enter-active-class="animate__animated animate__zoomIn" appear
          leave-active-class="animate__animated animate__zoomOut"
      >
        <Article v-bind="article"></Article>
      </transition>
    </template>
  </div>
</template>

<style scoped>
.index {
  margin: 16px;

  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  /*grid-auto-rows: 224px;*/
  grid-gap: 10px;
}
</style>