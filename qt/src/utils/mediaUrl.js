import { resolveStaticAsset } from './staticAssets'

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i

const BACKEND_STATIC_PREFIXES = ['/uploads/', '/touxiang/', '/app/']

/** 历史站点域名（已下线，浏览器会 ERR_NAME_NOT_RESOLVED） */
const LEGACY_MEDIA_HOST_RE = /(?:web\.)?hwyla8\.net|(?:www\.)?558[ox]\.vip/i

/**
 * 旧站 siteadmin/upload → 现管理后台磁盘 plugin/admin/public/upload
 * URL：/app/admin/upload/img/...
 */
export function normalizeLegacyMediaPath(path) {
  if (!path || typeof path !== 'string') return path
  const m = path.match(/\/siteadmin\/upload\/(.+)$/i)
  if (m) return `/app/admin/upload/${m[1]}`
  return path
}

function isLegacyMediaHost(hostname) {
  return LEGACY_MEDIA_HOST_RE.test(hostname || '')
}

/** 方案 A：www 页面上的 /uploads 应走 api 域 */
export function getMediaBase() {
  const fromEnv = (import.meta.env.VITE_MEDIA_BASE_URL || '').replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (import.meta.env.DEV) {
    const proxy = (import.meta.env.VITE_PROXY_TARGET || '').replace(/\/$/, '')
    if (proxy) return proxy
  }
  if (typeof window !== 'undefined' && import.meta.env.PROD) {
    const host = window.location.hostname
    if (host === 'ss2211.cc' || host === 'www.ss2211.cc') {
      return 'https://ss2211.cc'
    }
  }
  return ''
}

export function isBackendStaticPath(path) {
  if (!path || typeof path !== 'string') return false
  return BACKEND_STATIC_PREFIXES.some((prefix) => path.startsWith(prefix))
}

/**
 * 将主站上的 /uploads 或完整主站 URL 转为 api 域
 */
export function toPublicMediaUrl(path) {
  if (!path) return ''
  if (path.startsWith('data:')) return path

  const base = getMediaBase()

  if (/^https?:\/\//i.test(path)) {
    try {
      const parsed = new URL(path)
      if (
        base &&
        /^https?:\/\/(www\.)?1658\.to/i.test(parsed.origin) &&
        isBackendStaticPath(parsed.pathname)
      ) {
        return `${base}${normalizeLegacyMediaPath(parsed.pathname)}${parsed.search || ''}`
      }
      if (isLegacyMediaHost(parsed.hostname) || /\/siteadmin\/upload\//i.test(parsed.pathname)) {
        return resolveMediaUrl(normalizeLegacyMediaPath(parsed.pathname))
      }
    } catch {
      return path
    }
    return path
  }

  if (path.includes('/siteadmin/upload/')) {
    return resolveMediaUrl(normalizeLegacyMediaPath(path.startsWith('/') ? path : `/${path}`))
  }

  if (base && isBackendStaticPath(path)) {
    return `${base}${normalizeLegacyMediaPath(path)}`
  }
  return path
}

/**
 * 将后端/历史数据中的图片地址规范为可访问 URL
 */
export function resolveMediaUrl(url, defaultUrl = '') {
  if (url == null || url === '') return defaultUrl

  let u = String(url).trim()
  if (!u) return defaultUrl

  if (u.startsWith('data:')) return u

  // 管理后台上传图：必须走 api 域，避免 www 上请求 /app/admin/upload/... 404
  if (u.startsWith('/app/admin/upload/') || u.startsWith('app/admin/upload/')) {
    const path = u.startsWith('/') ? u : `/${u}`
    return toPublicMediaUrl(path) || defaultUrl
  }

  if (u.startsWith('//')) {
    try {
      const parsed = new URL(`https:${u}`)
      if (IMAGE_EXT.test(parsed.hostname)) {
        u = `/uploads/im/${parsed.hostname}${parsed.pathname || ''}`
      } else {
        u = parsed.pathname || defaultUrl
      }
    } catch {
      return defaultUrl
    }
  } else if (/^https?:\/\//i.test(u)) {
    const rewritten = toPublicMediaUrl(u)
    if (rewritten !== u) return rewritten

    try {
      const parsed = new URL(u)
      if (isLegacyMediaHost(parsed.hostname) || /\/siteadmin\/upload\//i.test(parsed.pathname)) {
        u = normalizeLegacyMediaPath(parsed.pathname)
      } else if (IMAGE_EXT.test(parsed.hostname)) {
        u = `/uploads/im/${parsed.hostname}${parsed.pathname || ''}`
      } else if (
        parsed.pathname.startsWith('/uploads/') ||
        parsed.pathname.startsWith('/touxiang/') ||
        parsed.pathname.startsWith('/app/')
      ) {
        u = normalizeLegacyMediaPath(parsed.pathname)
      } else if (parsed.pathname.includes('/uploads/')) {
        u = parsed.pathname
      } else {
        return u
      }
    } catch {
      return defaultUrl
    }
  } else if (u.includes('/siteadmin/upload/')) {
    u = normalizeLegacyMediaPath(u.startsWith('/') ? u : `/${u}`)
  } else if (!u.startsWith('/')) {
    if (u.startsWith('uploads/')) u = `/${u}`
    else if (/^\d{8}\//.test(u)) u = `/uploads/im/${u}`
    else if (u.includes('/')) u = `/uploads/${u.replace(/^uploads\//, '')}`
    else if (IMAGE_EXT.test(u)) {
      // 仅文件名时优先 IM 目录；活动 banner 应带完整 /app/admin/upload/img/ 路径
      u = `/uploads/im/${u}`
    } else u = `/${u}`
  }

  const resolved = u || defaultUrl
  const withApi = toPublicMediaUrl(resolved) || defaultUrl
  // 不在此处替换为本地 SVG；磁盘有文件时应走 api 域 /uploads/（加载失败由 applyQuickEntryIconFallback 处理）
  if (withApi && String(withApi).startsWith('/assets/')) {
    return resolveStaticAsset(withApi) || defaultUrl
  }
  return withApi
}

export function resolveAvatarUrl(avatar, defaultAvatar = '/assets/img/cat.jpeg') {
  return resolveMediaUrl(avatar, defaultAvatar) || defaultAvatar
}

/**
 * 图片 onerror 时的本地兜底（磁盘路径：/www/wwwroot/webman/public/uploads/icons/）
 * 正常应优先请求 https://ss2211.cc/uploads/icons/...
 */
export const QUICK_ENTRY_ICON_FALLBACKS = {
  '/uploads/icons/icon_dt_1kf.avif': '/assets/img/style_3_icon_top_kf.svg',
  '/uploads/icons/icon_dt_1vip.avif': '/assets/img/img_vip_dqicon.svg',
  '/uploads/icons/icon_dt_1app.avif': '/assets/img/icon_sys_menu_service.svg',
  '/uploads/icons/icon_dt_1gd.avif': '/assets/img/comm_icon_fhdb.svg'
}

function uploadIconLocalFallback(url) {
  const path = normalizeUploadIconPath(url)
  return path ? QUICK_ENTRY_ICON_FALLBACKS[path] || '' : ''
}

export function normalizeUploadIconPath(icon) {
  if (!icon) return ''
  let p = String(icon).trim()
  try {
    if (/^https?:\/\//i.test(p)) p = new URL(p).pathname
  } catch {
    /* keep */
  }
  if (!p.startsWith('/')) p = `/${p}`
  return p
}

export function getQuickEntryIconFallback(icon) {
  return QUICK_ENTRY_ICON_FALLBACKS[normalizeUploadIconPath(icon)] || ''
}

export function resolveQuickEntryIcon(icon) {
  return resolveMediaUrl(icon, '') || ''
}

function decodeHtmlEntities(html) {
  if (!html || typeof html !== 'string') return html
  if (!html.includes('&lt;') && !html.includes('&gt;') && !html.includes('&quot;')) {
    return html
  }
  if (typeof document !== 'undefined') {
    const ta = document.createElement('textarea')
    ta.innerHTML = html
    return ta.value
  }
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

/** 活动详情等 v-html 内图片 URL → ss2211.cc（含旧站、siteadmin、/app/admin/upload） */
export function rewriteHtmlMediaUrls(html) {
  if (!html || typeof html !== 'string') return html

  let out = decodeHtmlEntities(html)

  // 兜底：正文中任何 hwyla8 / siteadmin 绝对地址
  out = out.replace(/https?:\/\/(?:web\.)?hwyla8\.net[^\s"'<>)]*/gi, (url) => resolveMediaUrl(url))
  out = out.replace(/\/siteadmin\/upload\/[^\s"'<>)]+/gi, (path) =>
    resolveMediaUrl(path.startsWith('/') ? path : `/${path}`)
  )

  const rewriteAttr = (attr, quote, url) => `${attr}=${quote}${resolveMediaUrl(url)}${quote}`

  out = out
    .replace(
      /(src|href)\s*=\s*(["'])(https?:\/\/[^"']+)\2/gi,
      (_, attr, quote, url) => rewriteAttr(attr, quote, url)
    )
    .replace(
      /(src|href)\s*=\s*(["'])(\/siteadmin\/upload\/[^"']+)\2/gi,
      (_, attr, quote, url) => rewriteAttr(attr, quote, url)
    )
    .replace(
      /(src|href)\s*=\s*(["'])(\/app\/admin\/upload\/[^"']+)\2/gi,
      (_, attr, quote, url) => rewriteAttr(attr, quote, url)
    )
    .replace(
      /url\((["']?)(https?:\/\/[^)"']+)\1\)/gi,
      (_, quote, url) => `url(${quote}${resolveMediaUrl(url)}${quote})`
    )

  return out
}

/** 活动规则 HTML：解码 + 替换旧图床（所有 v-html activityContent 应使用） */
export function prepareActivityHtml(content) {
  if (content == null || content === '') return '<p>暂无活动说明</p>'
  return rewriteHtmlMediaUrls(String(content))
}

export function applyQuickEntryIconFallback(imgEl, iconRaw) {
  if (!imgEl || imgEl.dataset.fallback) return

  if (!imgEl.dataset.retried) {
    imgEl.dataset.retried = '1'
    imgEl.referrerPolicy = 'no-referrer'
    const retryUrl = resolveQuickEntryIcon(iconRaw)
    if (retryUrl && imgEl.src !== retryUrl) {
      imgEl.src = retryUrl
      return
    }
  }

  const fb = getQuickEntryIconFallback(iconRaw)
  if (!fb) return
  imgEl.dataset.fallback = '1'
  imgEl.src = fb
}
