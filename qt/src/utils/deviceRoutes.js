const PC_ADAPTIVE_PREFIXES = [
  '/activity',
  '/vip',
  '/cashback',
  '/pending',
  '/interest',
  '/reward-record',
  '/member',
  '/security',
  '/account',
  '/payment',
  '/notice',
  '/marquee',
  '/help',
  '/about',
  '/service',
  '/im',
  '/lottery',
  '/hemai',
  '/yue-bao',
  '/game/play',
  '/game/search'
]

export function isPcRoutePath(path = '') {
  return path === '/pc' || path.startsWith('/pc/')
}

export function stripPcRoutePrefix(path = '') {
  if (path === '/pc') return '/'
  if (path.startsWith('/pc/')) return path.slice(3) || '/'
  return path || '/'
}

export function isPcAdaptivePath(path = '') {
  const normalizedPath = stripPcRoutePrefix(path)
  return PC_ADAPTIVE_PREFIXES.some((prefix) =>
    normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  )
}

export function toPcRoutePath(path = '') {
  if (!path || isPcRoutePath(path)) return path || '/pc'
  if (path === '/' || path === '/home-new') return '/pc'
  return isPcAdaptivePath(path) ? `/pc${path}` : path
}

/** PC 端固定返回目标；非 PC 返回 false，由调用方走原逻辑 */
export function navigatePcBack(router, route, targetPath = '/member') {
  if (!isPcRoutePath(route?.path || '')) return false
  router.replace(toPcRoutePath(targetPath))
  return true
}

function mergeAlias(alias, pcAlias) {
  if (!alias) return pcAlias
  const aliases = Array.isArray(alias) ? alias : [alias]
  return aliases.includes(pcAlias) ? aliases : [...aliases, pcAlias]
}

export function addPcRouteAliases(routeRecords = []) {
  return routeRecords.map((route) => {
    const cloned = { ...route }
    if (
      typeof route.path === 'string' &&
      route.path.startsWith('/') &&
      !isPcRoutePath(route.path) &&
      isPcAdaptivePath(route.path)
    ) {
      cloned.alias = mergeAlias(route.alias, `/pc${route.path}`)
    }
    if (Array.isArray(route.children)) {
      cloned.children = route.children.map((child) => ({ ...child }))
    }
    return cloned
  })
}
