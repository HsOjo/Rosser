<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {LoadingOutlined} from "@ant-design/icons-vue";
import ArticleComp from "@/components/content/Article.vue";
import {Article} from "@/utils/types";
import api from "@/utils/api";
import {useStore} from "vuex";

const store = useStore()
const scroll_container = ref()
const loading_id = ref(0)
const page = ref(0)
const per_page = ref(10)
const total = ref(null)
const loading = ref(false)
const articles = ref<Article[]>([])

const query = computed(() => store.getters.query)
const subscription = computed(() => store.getters.query.subscription)
const subscriptionId = computed(() => subscription.value && subscription.value.id)
const noMore = computed(() => articles.value && articles.value.length >= total.value)

const filters = computed(() => {
  let _query = query.value
  let result = []
  if (subscriptionId.value)
    result.push({field: 'subscription_id', operate: 'eq', value: subscriptionId.value})
  if (_query.mode === 'read-only')
    result.push({field: 'article_state.is_read', operate: 'eq', value: true})
  else if (_query.mode === 'star-only')
    result.push({field: 'article_state.is_star', operate: 'eq', value: true})
  if (!_query.show_hide)
    result.push({field: 'article_state.is_hide', operate: 'ne', value: true})
  return result
})

const orders = computed(() => {
  let _query = query.value
  let result = []
  if (_query.star_first)
    result.push({field: 'article_state.is_star', operate: 'desc'})
  if (_query.time_order)
    result.push({field: 'publish_time', operate: _query.time_order})

  return result
})

watch(query, () => {
  page.value = 0
  total.value = null
  articles.value = []
  autoLoad()
})

function getPagiArticles(page_ = page.value, per_page_ = per_page.value, filters_ = filters.value, orders_ = orders.value) {
  return api.article.paginate({
    page: page_, per_page: per_page_, filters: filters_, orders: orders_,
    joins: [{table: 'article_state', outer: true}],
  }).then(
    resp => {
      if (filters_ != filters.value)
        return []
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

  return scroll_height <= container_height || scroll_height - scroll_top - container_height < 50
}

function loadMore() {
  loading.value = true
  let _loading_id = ++loading_id.value
  return getPagiArticles(++page.value).then(
    items => articles.value = articles.value.concat(items)
  ).finally(() => {
    if (loading_id.value == _loading_id)
      loading.value = false
  })
}

function autoLoad() {
  setTimeout(() => {
    if (checkLoad() && !loading.value)
      loadMore().then(autoLoad)
  }, 100)
}

onMounted(autoLoad)
</script>

<template>
  <div class="scroll-container" ref="scroll_container" @scroll="autoLoad">
    <div class="index">
      <template v-for="(article, index) in articles">
        <ArticleComp v-bind="article"></ArticleComp>
      </template>
    </div>
    <transition enter-active-class="animate__animated animate__bounceIn" appear>
      <template v-if="loading">
        <a-divider class="divider">
          <loading-outlined/>
          加载中...
        </a-divider>
      </template>
      <template v-else>
        <a-divider v-if="noMore" class="divider">抹得更多了</a-divider>
      </template>
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

>>> .no-more > span {
  opacity: 0.66;
}

.divider {
  overflow: hidden;
  min-width: 100%;
}
</style>