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
      title: 'Rosser',
      subscription: null,
    }
  },
  mutations: {
    initialize(state) {
      state.PY_CONTEXT = JSON.parse(String(localStorage.getItem('PY_CONTEXT')))
      pywebview.api.get_platform().then(
        platform => state.PLATFORM = platform
      )
    },
    openSubscription(state, item) {
      state.subscription = item
    },
    updateTitle(state, title) {
      state.title = String(title)
      pywebview.api.set_title(title)
    },
  },
  getters: {
    platform(state) {
      return state.PLATFORM
    },
    backendURL(state) {
      return state.PY_CONTEXT.backend_url
    },
    subscription(state) {
      return state.subscription
    },
    subscriptionId(state) {
      return state.subscription && state.subscription.id
    },
  }
})

export default store
