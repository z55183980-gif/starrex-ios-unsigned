/**
 * 功能开关：设为 false 时仅隐藏前端入口，相关页面/接口/逻辑保留便于后续恢复。
 */
export const MEMBER_REGISTER_ENABLED = true

/** 分享赚钱 / 底部「分享」入口（false = 仅隐藏，路由与页面保留） */
export const SHARE_EARN_ENABLED = false

/** 首页快捷区「APP下载」入口（false = 仅隐藏，后台配置保留） */
export const APP_DOWNLOAD_ENABLED = false

/** 是否为 APP 下载类快捷入口（名称 / 图标 / 链接） */
export function isAppDownloadEntry(entry = {}) {
  const name = String(entry.name || '')
  const icon = String(entry.icon || entry.iconRaw || '').toLowerCase()
  const link = String(entry.link || '').toLowerCase()
  if (/app\s*下载|下载\s*app|app\s*download|download\s*app/i.test(name)) return true
  if (icon.includes('icon_dt_1app') || icon.includes('/1app')) return true
  if (link.includes('.apk') || link.includes('/app/download') || link.includes('appdownload')) {
    return true
  }
  return false
}

/** 过滤快捷入口 / 更多菜单中的 APP 下载项 */
export function filterAppDownloadItems(items = []) {
  if (APP_DOWNLOAD_ENABLED) return items
  return items.filter((item) => !isAppDownloadEntry(item))
}

const SHARE_NAV_PATH = '/member/invite'

/** 底部导航项：关闭分享时过滤「分享」Tab */
export function filterFooterNavItems(items = []) {
  if (SHARE_EARN_ENABLED) return items
  return items.filter((item) => item.path !== SHARE_NAV_PATH)
}

/** 打开登录弹窗时使用的 tab（注册关闭时统一为 login） */
export function resolveAuthTab(tab = 'login') {
  if (!MEMBER_REGISTER_ENABLED && tab === 'register') {
    return 'login'
  }
  return tab || 'login'
}
