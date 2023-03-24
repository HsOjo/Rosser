import {createStore} from 'vuex'
import * as pywebview from "@/utils/pywebview";
import lodash from "lodash";

// Create a new store instance.
const store = createStore({
  state() {
    return {
      PY_CONTEXT: {
        backend_url: null,
      },
      PLATFORM: null,
      STATE: {
        sider_collapsed: false,
        settings_visible: false,
        categories: [],
        subscriptions: [],
        sites: [],
      },
      query: {
        mode: null,
        show_hide: false,
        subscription: null,
        time_order: 'desc',
        favourite_first: false,
      },
    }
  },
  mutations: {
    initialize(state) {
      state.PY_CONTEXT = JSON.parse(String(localStorage.getItem('PY_CONTEXT')))
      pywebview.api.get_platform().then(
        platform => state.PLATFORM = platform
      )
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
    platform(state) {
      return state.PLATFORM
    },
    isMac(state, getters) {
      return getters.platform === 'Darwin'
    },
    backendURL(state) {
      return state.PY_CONTEXT.backend_url
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
