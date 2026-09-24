/**
 * 利博原站 device 工具（webpack 模块 d257）：
 * - isMobileUa：UA 正则
 * - getDeviceOrientation：横竖屏
 * - isIpadProDevice：iPad / Mac 触控 + 屏幕像素尺寸表
 */

const MOBILE_UA_RE =
  /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i

const MOBILE_HOME_PATH = '/home-new'
const PC_HOME_PATH = '/pc'
const MOBILE_LAYOUT_MAX_WIDTH = 768

const IPAD_PRO_SIZES = [
  { width: 1024, height: 1366 },
  { width: 2048, height: 2732 },
  { width: 1668, height: 2388 },
  { width: 1640, height: 2360 }
]

/** 识别移动设备；新版 iPadOS 可能使用 Macintosh 桌面 UA。 */
export function isMobileUserAgent(userAgent = '', maxTouchPoints = 0) {
  return MOBILE_UA_RE.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && Number(maxTouchPoints) > 1)
}

/** 原站 g()：是否移动端 UA */
export function isMobileUa() {
  if (typeof navigator === 'undefined') return false
  return isMobileUserAgent(navigator.userAgent, navigator.maxTouchPoints)
}

/**
 * 页面布局分流同时参考 UA 与可视宽度。
 * 这样桌面浏览器的响应式预览（以及小窗设备）也会进入移动端界面，
 * 与目标站按断点切换的行为保持一致。
 */
export function isMobileLayout() {
  if (isMobileUa()) return true
  if (typeof window === 'undefined') return false
  return window.innerWidth <= MOBILE_LAYOUT_MAX_WIDTH
}

/** 原站 e()：portrait | landscape */
export function getDeviceOrientation() {
  if (window.screen.orientation) {
    return window.screen.orientation.type.includes('landscape')
      ? 'landscape'
      : 'portrait'
  }
  const o = window.orientation
  if (o === 0 || o === 180) return 'portrait'
  if (o === 90 || o === -90) return 'landscape'
  if (screen.orientation?.type) {
    const t = screen.orientation.type
    if (t === 'portrait-primary' || t === 'portrait-secondary') return 'portrait'
    if (t === 'landscape-primary' || t === 'landscape-secondary') return 'landscape'
  }
  return window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape'
}

/** 原站 f()：是否 iPad Pro 类分辨率（用于不加 is-not-ipad） */
export function isIpadProDevice() {
  const ua = navigator.userAgent
  const touchIpad = /iPad|Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 0
  if (!touchIpad) return false
  const w =
    Math.max(window.screen.width, window.screen.height) * window.devicePixelRatio
  const h =
    Math.min(window.screen.width, window.screen.height) * window.devicePixelRatio
  return IPAD_PRO_SIZES.some(
    (s) => (s.width === w && s.height === h) || (s.width === h && s.height === w)
  )
}

/** @deprecated 使用 isMobileUa；保留别名避免其它引用报错 */
export function isMobile() {
  return isMobileLayout()
}

export function isDesktop() {
  return !isMobileLayout()
}

/** @deprecated 使用 isIpadProDevice */
export function isIpad() {
  return isIpadProDevice()
}

export function getDeviceType() {
  return isMobileLayout() ? 'mobile' : 'pc'
}

export function getDeviceHomePath() {
  return isMobileLayout() ? MOBILE_HOME_PATH : PC_HOME_PATH
}

export function normalizeDeviceHomePath(path = '') {
  return path === MOBILE_HOME_PATH || path === PC_HOME_PATH
    ? getDeviceHomePath()
    : path
}

export function applyDeviceClasses(target = document.documentElement) {
  const mobile = isMobileLayout()
  const ipadPro = isIpadProDevice()
  const orientation = getDeviceOrientation()
  target.classList.toggle('mobile', mobile)
  target.classList.toggle('device-mobile', mobile)
  target.classList.toggle('device-pc', !mobile)
  target.classList.toggle('is-not-ipad', !ipadPro)
  target.setAttribute('data-device', mobile ? 'mobile' : 'pc')
  target.setAttribute('data-orientation', orientation)
  target.setAttribute('data-ipad-pro', ipadPro ? '1' : '0')
}

let inited = false

export function initDeviceClass() {
  if (inited || typeof window === 'undefined') return
  inited = true
  const update = () => applyDeviceClasses()
  update()
  window.addEventListener('resize', update, { passive: true })
  window.addEventListener('orientationchange', update)
}
