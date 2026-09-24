import axios from 'axios'
import { getDeviceHomePath } from '@/utils/device'
import { refreshAccessToken, removeToken } from '@/utils/auth'
import { ERROR_CODES, isAuthError } from '@/constants/lottery'
import { decrypt, encrypt, isEncrypted } from '@/utils/crypto'
import { getLocale } from '@/locales'

const ENABLE_ENCRYPTION = true

const localeToApiLang = {
  'zh-CN': 'zh-hans',
  'zh-TW': 'zh-hant',
  'en-US': 'en',
  'vi-VN': 'vi',
  'th-TH': 'th',
  'ja-JP': 'ja',
  'ko-KR': 'ko',
  'id-ID': 'id',
  'ms-MY': 'ms',
  'hi-IN': 'hi',
  'es-ES': 'es',
  'pt-BR': 'pt'
}

const getApiLang = () => {
  const locale = getLocale()
  return localeToApiLang[locale] || 'zh-hans'
}

let isLoggingOut = false
let hasAuthenticatedOnce = false
let isRefreshing = false
let refreshSubscribers = []

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken))
  refreshSubscribers = []
}

export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api'

/** API 站点源（无 /api 后缀），用于拼接 /uploads 等静态资源 */
export function getApiOrigin() {
  const media = (import.meta.env.VITE_MEDIA_BASE_URL || '').replace(/\/$/, '')
  if (media) return media
  const base = API_BASE_URL.replace(/\/$/, '')
  if (/^https?:\/\//i.test(base)) {
    return base.replace(/\/api$/i, '') || base
  }
  return ''
}

/** 拼接会员 API 完整路径，如 base=/api + /v1/foo → /api/v1/foo */
export function buildApiUrl(path) {
  const base = API_BASE_URL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  if (p.startsWith('/api/')) {
    return `${base}${p.slice(4)}`
  }
  return `${base}${p}`
}

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(
  config => {
    config.metadata = { startTime: Date.now() }

    const lang = getApiLang()
    config.params = config.params || {}
    config.params.lang = lang

    const noAuthUrls = ['/auth/login', '/register', '/auth/refresh', '/v1/config']
    const skipAuth = noAuthUrls.some(path => config.url?.includes(path))
    
    if (!skipAuth) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    if (config.data instanceof FormData) {
      // Let the browser set multipart boundary; default application/json breaks uploads
      if (typeof config.headers?.delete === 'function') {
        config.headers.delete('Content-Type')
      } else if (typeof config.headers?.set === 'function') {
        config.headers.set('Content-Type', false)
      } else if (config.headers) {
        delete config.headers['Content-Type']
      }
    } else if (ENABLE_ENCRYPTION && config.data && ['post', 'put', 'patch'].includes(config.method)) {
      const encrypted = encrypt(config.data)
      if (encrypted) {
        config.data = encrypted
        config.headers['Content-Type'] = 'text/plain'
        config.headers['X-Encrypted'] = '1'
      }
    }
    
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    let res = response.data
    const isEncryptedResponse = response.headers?.['x-encrypted'] === '1'
    if (ENABLE_ENCRYPTION && isEncryptedResponse && typeof res === 'string') {
      res = decrypt(res)
      if (res == null) {
        return Promise.reject(new Error('响应解密失败，请检查加密密钥是否与后端一致'))
      }
      response.data = res
    }
    
    if (typeof res?.code !== 'undefined') {
      // 未登录也可访问、或预期可能返回 401 的接口，勿触发强制登出回首页
      const silentFailUrls = [
        '/heartbeat',
        '/profile',
        '/v1/notice',
        '/v1/message',
        '/activity/check-reward',
        '/activity/pending-rewards',
        '/activity/participation-history',
        '/activity/rebate-detail',
        '/activity/rebate-by-vendor'
      ]
      const isSilentFail = silentFailUrls.some(u => response.config.url?.includes(u))
      
      if (isAuthError(res.code)) {
        if (!isSilentFail && hasAuthenticatedOnce) {
          handleAuthFailure()
        }
        return Promise.reject(new Error(res.message))
      }
      
      // 仅在确有登录态的成功响应后标记；公开接口 code=0 不得当作已登录
      if ((res.code === 0 || res.code === 200) && localStorage.getItem('token')) {
        hasAuthenticatedOnce = true
      }
      
      if (res.code !== 200 && res.code !== 0) {
        return Promise.reject(new Error(res.message || res.msg))
      }
      
      return res
    }
    return res
  },
  async error => {
    if (error.response?.status === 401) {
      const silentFailUrls = [
        '/heartbeat',
        '/profile',
        '/v1/notice',
        '/v1/message',
        '/activity/check-reward',
        '/activity/pending-rewards',
        '/activity/participation-history',
        '/activity/rebate-detail',
        '/activity/rebate-by-vendor'
      ]
      const isSilentFail = silentFailUrls.some(u => error.config?.url?.includes(u))

      // 无登录态时，静默接口的 401 直接失败，勿走 refresh / 强制回首页
      if (isSilentFail && !localStorage.getItem('token')) {
        return Promise.reject(error)
      }
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (newToken) {
              error.config.headers.Authorization = `Bearer ${newToken}`
              resolve(request(error.config))
            } else {
              reject(error)
            }
          })
        })
      }
      
      isRefreshing = true
      
      try {
        const newToken = await refreshAccessToken()
        isRefreshing = false
        
        if (newToken) {
          onTokenRefreshed(newToken)
          error.config.headers.Authorization = `Bearer ${newToken}`
          return request(error.config)
        } else {
          onTokenRefreshed(null)
          if (!isSilentFail && hasAuthenticatedOnce) {
            handleAuthFailure()
          }
          return Promise.reject(error)
        }
      } catch (refreshError) {
        isRefreshing = false
        onTokenRefreshed(null)
        if (!isSilentFail && hasAuthenticatedOnce) {
          handleAuthFailure()
        }
        return Promise.reject(refreshError)
      }
    }
    
    if (!error.response) {
      const hint =
        error.code === 'ERR_NETWORK' || /network error/i.test(error.message || '')
          ? '请求被浏览器拦截（多为 ss2211.cc 跨域 CORS 响应头重复或无效，请检查生产 Nginx 配置）'
          : error.message || '网络请求失败'
      return Promise.reject(new Error(hint))
    }

    return Promise.reject(error)
  }
)

function handleAuthFailure() {
  if (isLoggingOut) return
  
  isLoggingOut = true
  removeToken()
  
  setTimeout(() => {
    isLoggingOut = false
    hasAuthenticatedOnce = false
    window.location.href = getDeviceHomePath()
  }, 300)
}

export function resetAuthState() {
  hasAuthenticatedOnce = false
  isLoggingOut = false
}

export default request
