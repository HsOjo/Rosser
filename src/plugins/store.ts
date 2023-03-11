import {createStore} from 'vuex'

// Create a new store instance.
const store = createStore({
  state() {
    return {
      PY_CONTEXT: {
        backend_url: null,
      },
      subscription: null,
    }
  },
  mutations: {
    loadPyContext(state) {
      state.PY_CONTEXT = JSON.parse(String(localStorage.getItem('PY_CONTEXT')))
    },
    openSubscription(state, item) {
      state.subscription = item
    }
  },
  getters: {
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
