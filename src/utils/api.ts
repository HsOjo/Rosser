import {AxiosInstance} from "axios";

let axios: AxiosInstance = null
const api = {
  axios,
  test() {
    return api.axios.get('/')
  },
  url(path) {
    return `${api.axios.defaults.baseURL}/${path}`
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
  site: {
    fetch(id) {
      return api.axios.post(
        `/api/site/fetch/${id}`,
      )
    },
    all(filters = null, orders = null) {
      return api.axios.post(
        `/api/site/all`,
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