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
    },
    exportOPML(path) {
      return api.axios.post(
        '/api/basic/export-opml',
        {path}
      )
    },
  },
  subscription: {
    add(url, title, description, category_id) {
      return api.axios.post(
        '/api/subscription/add',
        {url, title, description, category_id}
      )
    },
    all(filters = null, orders = null) {
      return api.axios.post(
        `/api/subscription/all`,
        {filters, orders}
      )
    },
    delete(ids) {
      return api.axios.post(
        '/api/subscription/delete',
        {ids}
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
    fetchExpires() {
      return api.axios.post(
        '/api/subscription/fetch-expires',
      )
    },
  },
  category: {
    add(title, description) {
      return api.axios.post(
        '/api/category/add',
        {title, description}
      )
    },
    all(filters = null, orders = null) {
      return api.axios.post(
        `/api/category/all`,
        {filters, orders}
      )
    },
    delete(ids) {
      return api.axios.post(
        '/api/category/delete',
        {ids}
      )
    },
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
    get(id) {
      return api.axios.get(
        `/api/subscription/article/get/${id}`,
      )
    },
    read(...ids) {
      return api.axios.post(
        `/api/subscription/article/read`,
        {ids}
      )
    },
    unread(...ids) {
      return api.axios.post(
        `/api/subscription/article/unread`,
        {ids}
      )
    },
    hide(...ids) {
      return api.axios.post(
        `/api/subscription/article/hide`,
        {ids}
      )
    },
    unhide(...ids) {
      return api.axios.post(
        `/api/subscription/article/unhide`,
        {ids}
      )
    },
    star(...ids) {
      return api.axios.post(
        `/api/subscription/article/star`,
        {ids}
      )
    },
    unstar(...ids) {
      return api.axios.post(
        `/api/subscription/article/unstar`,
        {ids}
      )
    },
    readBeforeDays(subscription_id, days) {
      return api.axios.post(
        `/api/subscription/article/read-before-days`,
        {subscription_id, days}
      )
    }
  }
}
export default api 