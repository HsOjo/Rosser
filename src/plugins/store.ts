import {createStore} from 'vuex'
import lodash from "lodash";
import isElectron from "is-electron";
import api from "@/utils/api";

// Create a new store instance.
const store = createStore({
  state() {
    return {
      is_mac: process.platform === 'darwin',
      is_electron: isElectron(),
      electron: null,
      STATE: {
        sider_collapsed: false,
        settings_visible: false,
        subscribe_modal_visible: false,
        categories: [],
        subscriptions: [],
        sites: [],
      },
      query: {
        mode: null,
        show_hide: false,
        subscription: null,
        time_order: 'desc',
        star_first: false,
      },
    }
  },
  mutations: {
    refreshState(state) {
      let _this = this
      api.category.all().then(
        resp => _this.commit('updateState', {categories: resp.data}))
      api.subscription.all().then(
        resp => _this.commit('updateState', {subscriptions: resp.data}))
      api.site.all().then(
        resp => _this.commit('updateState', {sites: resp.data}))
    },
    updateState(state, payload) {
      Object.assign(state.STATE, payload)
    },
    updateQuery(state, payload) {
      let query = lodash.cloneDeep(state.query)
      Object.assign(query, payload)
      if (!lodash.isEqual(query, state.query)) {
        delete query['refresh']
        state.query = query
      }
    },
  },
  getters: {
    isElectron(state, getters) {
      return state.is_electron
    },
    electron(state) {
      return state.is_electron ? window.require('electron') : null
    },
    isMac(state, getters) {
      return state.is_mac
    },
    backendURL(state) {
      return import.meta.env.VITE_APP_BASE_URL
    },
    state(state) {
      return state.STATE
    },
    query(state) {
      return state.query
    },
  }
})

export default store
