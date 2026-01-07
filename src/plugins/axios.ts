import axios, {AxiosInstance} from "axios";
import {InjectionKey} from "vue";

export const AxiosInstanceKey: InjectionKey<AxiosInstance> = Symbol();

// 简单的响应缓存
const responseCache = new Map<string, {data: any, timestamp: number}>()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

function getCacheKey(config: any): string | null {
  // 只缓存 GET 请求的特定接口
  if (config.method !== 'get') return null
  const url = config.url || ''
  // 缓存分类、站点等相对稳定的数据
  if (url.includes('/category/all') || url.includes('/site/all')) {
    return `${config.baseURL || ''}${url}`
  }
  return null
}

const _axios = axios.create({
  timeout: 30 * 1000, // Timeout
  withCredentials: false, // Check cross-site Access-Control
})

// 请求拦截器 - 检查缓存
_axios.interceptors.request.use((config) => {
  const cacheKey = getCacheKey(config)
  if (cacheKey) {
    const cached = responseCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // 使用自定义 adapter 返回缓存数据
      config.adapter = () => Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      })
    }
  }
  return config
})

// 响应拦截器 - 存储缓存
_axios.interceptors.response.use((response) => {
  const cacheKey = getCacheKey(response.config)
  if (cacheKey && response.status === 200) {
    responseCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    })
  }
  return response
})

// 清除缓存的方法（供刷新时使用）
export function clearResponseCache() {
  responseCache.clear()
}

export default {
  install(app, options) {
    app.provide(AxiosInstanceKey, _axios)
  }
}
