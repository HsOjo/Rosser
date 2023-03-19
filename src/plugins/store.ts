import {createStore} from 'vuex'
import * as pywebview from "@/utils/pywebview";

// Create a new store instance.
const store = createStore({
  state() {
    return {
      PY_CONTEXT: {
        backend_url: null,
      },
      PLATFORM: null,
      STATE: {
        subscription: null,
        sider_collapsed: false,
        settings_visible: false,
      }
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
  }
})

export default store
