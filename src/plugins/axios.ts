import axios, {AxiosInstance} from "axios";
import {InjectionKey} from "vue";

export const AxiosInstanceKey: InjectionKey<AxiosInstance> = Symbol();

const _axios = axios.create({
  timeout: 30 * 1000, // Timeout
  withCredentials: false, // Check cross-site Access-Control
})

export default {
  install(app, options) {
    app.provide(AxiosInstanceKey, _axios)
  }
}
