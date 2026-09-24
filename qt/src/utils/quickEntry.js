import i18n from '@/locales'
import { resolveQuickEntryIcon, getQuickEntryIconFallback } from '@/utils/mediaUrl'

/** link_type: 1=内链 2=外链 3=在线客服 4=更多菜单 */
const LOCAL_ICONS = {
  service: '/assets/img/style_3_icon_top_kf.svg',
  vip: '/assets/img/img_vip_dqicon.svg',
  more: '/assets/img/comm_icon_fhdb.svg',
  default: '/assets/img/icon_sys_menu_service.svg'
}

export function resolveQuickEntryLabel(entry) {
  if (!entry) return ''
  const t = i18n.global.t
  const lt = Number(entry.link_type)
  if (lt === 3) return t('common.service')
  if (lt === 4) return t('common.more')

  const link = String(entry.link || '').toLowerCase()
  if (link.includes('vip')) return t('common.vip')

  const n = String(entry.name || '').trim().toLowerCase()
  if (n === 'service' || n.includes('客服') || n.includes('在线客服')) return t('common.service')
  if (n === 'vip') return t('common.vip')
  if (n === 'more' || n.includes('更多')) return t('common.more')

  return entry.name || ''
}

export function getQuickEntryIconByEntry(entry) {
  if (!entry) return LOCAL_ICONS.default
  const lt = Number(entry.link_type)
  const link = String(entry.link || '').toLowerCase()
  if (lt === 3) return LOCAL_ICONS.service
  if (lt === 4) return LOCAL_ICONS.more
  if (link.includes('vip')) return LOCAL_ICONS.vip

  const n = String(entry.name || '').toLowerCase()
  if (n.includes('vip')) return LOCAL_ICONS.vip
  if (n.includes('客服') || n === 'service') return LOCAL_ICONS.service
  if (n.includes('更多') || n === 'more') return LOCAL_ICONS.more

  return ''
}

/**
 * 快捷入口图标：优先 ss2211.cc/uploads/...（对应 webman/public/uploads）
 * 仅当远程 404 或路径为空时，在 img onerror 中换本地 SVG
 */
export function resolveQuickEntryIconForEntry(entry) {
  const remote = resolveQuickEntryIcon(entry?.icon)
  if (remote) return remote
  return getQuickEntryIconByEntry(entry) || LOCAL_ICONS.default
}

/** img 加载失败时调用 */
export function fallbackQuickEntryIcon(entry) {
  const mapped = getQuickEntryIconFallback(entry?.icon)
  if (mapped) return mapped
  return getQuickEntryIconByEntry(entry) || LOCAL_ICONS.default
}
