import {computed, ComputedRef} from "vue";
import {Category, Site, Subscription} from "@/utils/types";

function arrayToMapping(array: any[], key: string) {
  let mapping = {}
  array.map(x => mapping[x[key]] = x)
  return mapping
}

export function useArrays(store) {
  const state = store.getters.state
  const subscriptions: ComputedRef<Subscription[]> = computed(() => state.subscriptions)
  const sites: ComputedRef<Site[]> = computed(() => state.sites)
  const categories: ComputedRef<Category[]> = computed(() => state.categories)

  return {subscriptions, sites, categories}
}

export function useMappings(store) {
  const state = store.getters.state
  const subscriptionsMapping = computed(() => arrayToMapping(state.subscriptions, 'id'))
  const sitesMapping = computed(() => arrayToMapping(state.sites, 'id'))
  const categoriesMapping = computed(() => arrayToMapping(state.categories, 'id'))

  return {subscriptionsMapping, sitesMapping, categoriesMapping}
}

export function useCompositions(store) {
  const state = store.getters.state
  const subscriptionCompositions = computed(() => state.subscriptions.map(
    subscription => {
      return {
        ...subscription,
        site: state.sites.find(site => site.id === subscription.site_id),
        category: state.categories.find(category => category.id === subscription.category_id),
      }
    }))
  const siteCompositions = computed(() => state.sites.map(
    site => {
      return {
        ...site,
        subscriptions: state.subscriptions.filter(subscription => subscription.site_id === site.id),
      }
    }))
  const categoryCompositions = computed(() => state.categories.map(
    category => {
      return {
        ...category,
        subscriptions: state.subscriptions.filter(subscription => subscription.category_id === category.id),
      }
    }))

  return {subscriptionCompositions, siteCompositions, categoryCompositions}
}
