<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import Article from "@/components/Article.vue";
import axios from "@/plugins/axios";
import store from "@/plugins/store";

const scroll_container = ref()
const page = ref(0)
const per_page = ref(10)
const total = ref(null)
const loading = ref(false)
const articles = ref<object[]>([])

const subscription = computed(() => store.getters.subscription)
const subscriptionId = computed(() => subscription.value && subscription.value.id)
const noMore = computed(() => articles.value && articles.value.length >= total.value)

watch(subscriptionId, (nv, ov) => {
  page.value = 0
  total.value = null
  articles.value = []
  autoLoad()
})

function getPagiArticles(page_ = page.value, per_page_ = per_page.value, subscription_id = subscriptionId.value) {
  let filters = []
  if (subscription_id)
    filters.push({field: 'subscription_id', operate: 'eq', value: subscription_id})
  return axios().post(`/api/subscription/article/paginate/${per_page_}/${page_}`,
      {filters}
  ).then(
      resp => {
        total.value = resp.data.total
        return resp.data.items
      }
  )
}

function checkLoad() {
  if (total.value === null)
    return true
  if (noMore.value)
    return false

  let target = scroll_container.value
  let scroll_top = target.scrollTop
  let container_height = target.offsetHeight
  let scroll_height = target.scrollHeight

  return scroll_height - scroll_top - container_height < 50
}

function autoLoad() {
  if (checkLoad() && !loading.value)
    loadMore().then(autoLoad)
}

function loadMore() {
  loading.value = true
  return getPagiArticles(++page.value).then(
      items => articles.value = articles.value.concat(items)
  ).finally(() => loading.value = false)
}

onMounted(() => {
  autoLoad()
})
</script>

<template>
  <div class="scroll-container" ref="scroll_container" @scroll="autoLoad">
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
    <transition
        enter-active-class="animate__animated animate__bounceIn" appear
        leave-active-class="animate__animated animate__bounceOut">
      <a-divider v-if="noMore" class="no-more">抹得更多了</a-divider>
    </transition>
  </div>
</template>

<style scoped>
.scroll-container {
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

.index {
  margin: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  /*grid-auto-rows: 224px;*/
  grid-gap: 10px;
  align-items: center;
  justify-content: center;
}

/deep/ .no-more > span {
  opacity: 0.66;
}

.no-more {
  overflow: hidden;
  min-width: 100%;
}
</style>