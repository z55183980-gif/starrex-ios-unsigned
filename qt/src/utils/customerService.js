import router from '@/router'
import { useConfigStore } from '@/stores/config'
import { contactCustomerService } from '@/api/im'
import { showToast } from 'vant'
import i18n from '@/locales'
import { getUserInfo } from '@/utils/auth'
import { isDesktop } from '@/utils/device'

/** 旧版假客服页路径，统一走 IM */
const LEGACY_SERVICE_PATHS = new Set([
  '/service',
  '/service/online',
  '/service/chat',
  '/yue-bao/service',
])

function normalizePath(url) {
  if (!url || !url.startsWith('/')) return ''
  const path = url.split('?')[0].replace(/\/+$/, '') || '/'
  return path
}

function isExternalServiceUrl(url) {
  return /^https?:\/\//i.test(url)
}

function isLegacyServicePath(url) {
  const path = normalizePath(url)
  return LEGACY_SERVICE_PATHS.has(path) || path.startsWith('/service/')
}

const POST_LOGIN_REDIRECT_KEY = 'postLoginRedirect'

function pickCsUserId(res) {
  const data = res?.data ?? res
  const id = data?.userId ?? data?.user_id ?? data?.id
  const n = Number(id)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** 获取在线客服会话用户 ID，不改变当前路由。 */
export async function fetchCustomerServiceUserId() {
  const res = await contactCustomerService()
  return pickCsUserId(res)
}

function ensureLocalUserId() {
  const cached = getUserInfo()
  const id = cached?.id ?? cached?.userId
  if (id != null && id !== '') {
    localStorage.setItem('userId', String(id))
  }
}

function csChatTitle() {
  try {
    return i18n.global.t('msgCenter.onlineServiceBtn')
  } catch {
    return '在线客服'
  }
}

async function navigateToImChat(csUserId, replace = false) {
  if (!csUserId || csUserId <= 0) {
    throw new Error(i18n.global.t('msgCenter.noCsOnline'))
  }
  ensureLocalUserId()
  const nav = {
    name: 'ImChat',
    params: { chatId: `private_${csUserId}` },
    query: { name: csChatTitle(), service: '1' }
  }
  if (replace) {
    await router.replace(nav)
  } else {
    await router.push(nav)
  }
}

/** 登录成功后继续进入客服（Home 刷新后调用） */
export async function resumeCustomerServiceAfterLogin() {
  const redirect = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
  if (!redirect || !localStorage.getItem('token')) return false
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
  if (redirect.includes('service') || redirect.includes('/im/chat')) {
    await openOnlineCustomerService({
      skipPortal: true,
      embedded: isDesktop(),
      replace: true
    })
    return true
  }
  await router.push(redirect)
  return true
}

export async function openImCustomerChat(options = {}) {
  const { replace = false } = options
  const csUserId = await fetchCustomerServiceUserId()
  if (!csUserId) {
    showToast(i18n.global.t('msgCenter.noCsOnline'))
    return false
  }
  await navigateToImChat(csUserId, replace)
  return true
}

function promptLoginForService() {
  sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, '/service/online')
  showToast('请先登录')
  return router.push({
    name: 'Home',
    query: { auth: 'login' }
  })
}

/**
 * 打开在线 IM 客服
 * @param {object} options
 * @param {boolean} options.requireLogin 未登录时是否要求先登录
 * @param {boolean} options.forceIm 为 true 时忽略后台 kefuthree，强制走 IM
 * @param {boolean} options.replace 使用 replace 跳转（避免停留在中转页）
 * @param {boolean} options.skipPortal 跳过一级客服选择弹窗，直接执行在线客服逻辑
 * @param {boolean} options.embedded 在 PC 端客服弹窗内打开聊天，不切换路由
 */
export async function openOnlineCustomerService(options = {}) {
  const {
    requireLogin = true,
    forceIm = false,
    replace = false,
    skipPortal = false,
    embedded = false
  } = options

  if (!forceIm && !skipPortal) {
    window.dispatchEvent(new CustomEvent('open-customer-service-portal'))
    return true
  }

  const configStore = useConfigStore()

  if (!configStore.loaded) {
    try {
      await configStore.fetchConfig()
    } catch {
      /* 配置失败仍尝试 IM */
    }
  }

  const url = (configStore.serviceUrl || '').trim()

  // PC 端的在线客服始终留在当前窗口的客服弹窗中，避免打开独立页面或新标签。
  if (embedded && isDesktop()) {
    const token = localStorage.getItem('token')
    if (!token) {
      if (requireLogin) {
        await promptLoginForService()
      } else {
        showToast('请先登录')
      }
      return false
    }

    try {
      const csUserId = await fetchCustomerServiceUserId()
      if (!csUserId) {
        showToast(i18n.global.t('msgCenter.noCsOnline'))
        return false
      }
      window.dispatchEvent(new CustomEvent('open-customer-service-chat', {
        detail: { csUserId }
      }))
      return true
    } catch (e) {
      showToast(e?.message || i18n.global.t('msgCenter.connectCsFailed'))
      return false
    }
  }

  if (!forceIm && url && isExternalServiceUrl(url)) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return true
  }

  const internalPath = url.startsWith('/') ? normalizePath(url) : ''
  if (!forceIm && internalPath && !isLegacyServicePath(internalPath)) {
    await router.push(internalPath)
    return true
  }

  const token = localStorage.getItem('token')
  if (!token) {
    if (requireLogin) {
      await promptLoginForService()
    } else {
      showToast('请先登录')
    }
    return false
  }

  try {
    const ok = await openImCustomerChat({ replace })
    if (!ok && replace) {
      await router.replace({ name: 'Home' })
    }
    return ok
  } catch (e) {
    showToast(e?.message || i18n.global.t('msgCenter.connectCsFailed'))
    if (replace) {
      await router.replace({ name: 'Home' })
    }
    return false
  }
}
