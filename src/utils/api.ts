import {inject} from "vue";
import {AxiosInstanceKey} from "@/plugins/axios";

const api = {
  axios: inject(AxiosInstanceKey),
  test() {
    return api.axios.get('/')
  },
  basic: {
    importOPML(path) {
      return api.axios.post(
        '/api/basic/import-opml',
        {path}
      )
    }
  },
  subscription: {
    all(filters = null, orders = null) {
      return api.axios.post(
        `/api/subscription/all`,
        {filters, orders}
      )
    },
    fetch(ids) {
      return api.axios.post(
        '/api/subscription/fetch',
        {ids}
      )
    },
    fetchAll() {
      return api.axios.post(
        '/api/subscription/fetch-all',
      )
    },
  },
  category: {
    all(filters = null, orders = null) {
      return api.axios.post(
        `/api/category/all`,
        {filters, orders}
      )
    }
  },
  article: {
    paginate({page, per_page, filters, orders, joins}) {
      return api.axios.post(
        `/api/subscription/article/paginate/${per_page}/${page}`,
        {filters, orders, joins}
      )
    },
  }
}
export default api 