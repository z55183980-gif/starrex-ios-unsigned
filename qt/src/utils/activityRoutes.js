import { isPcRoutePath, toPcRoutePath } from '@/utils/deviceRoutes'

/** 活动类型 → 详情页路径（不含 PC 前缀） */
export const ACTIVITY_TYPE_ROUTE_MAP = {
  lucky_order: (id) => `/activity/lucky-order/${id}`,
  loss_rescue: (id) => `/activity/loss-rescue/${id}`,
  weekly_salary: (id) => `/activity/weekly-salary/${id}`,
  monthly_salary: (id) => `/activity/reward/${id}`,
  pg_betting_king: (id) => `/activity/pg-betting-king/${id}`,
  first_deposit: (id) => `/activity/first-deposit/${id}`,
  deposit_bonus: (id) => `/activity/deposit-bonus/${id}`,
  // 无独立页的类型统一走通用详情，避免落入全局 404 → 首页
  welcome: (id) => `/activity/detail/${id}`,
  general_activity: (id) => `/activity/detail/${id}`,
  checkin: (id) => `/activity/detail/${id}`,
  other: (id) => `/activity/detail/${id}`
}

function normalizeActivityType(activity = {}) {
  return String(activity.type_code || activity.typeCode || activity.type || '').trim()
}

function normalizeActivityId(activity = {}) {
  return activity.id ?? activity.activityId ?? activity.activity_id ?? ''
}

/** 解析活动落地路径（移动端路径；PC 由调用方或 beforeEach 加前缀） */
export function resolveActivityPath(activity = {}) {
  const id = normalizeActivityId(activity)
  if (id === '' || id === null || id === undefined) {
    return { kind: 'route', path: '/activity', activityId: '' }
  }

  const jumpType = Number(activity.jumpType ?? activity.jump_type ?? 0)
  const jumpUrl = String(activity.jumpUrl ?? activity.jump_url ?? '').trim()

  if (jumpType === 1) {
    return { kind: 'checkin', path: null, activityId: id }
  }

  if (jumpType === 2 && jumpUrl) {
    return { kind: 'url', path: jumpUrl, activityId: id }
  }

  const type = normalizeActivityType(activity)
  const builder = ACTIVITY_TYPE_ROUTE_MAP[type]
  const path = builder ? builder(id) : `/activity/detail/${id}`
  return { kind: 'route', path, activityId: id }
}

function isMatchedRoute(resolved) {
  if (!resolved?.name) return false
  if (resolved.name === 'NotFound' || resolved.name === 'ActivityUnknown') return false
  return Array.isArray(resolved.matched) && resolved.matched.length > 0
}

/** 若目标路由不存在，回退到通用详情或活动首页，避免 catch-all 踢回首页 */
export function sanitizeActivityPath(router, path, activityId) {
  if (!path) return '/activity'
  if (/^https?:\/\//i.test(path)) return path

  const resolved = router.resolve(path)
  if (isMatchedRoute(resolved)) return path

  if (activityId !== '' && activityId !== null && activityId !== undefined) {
    const detailPath = `/activity/detail/${activityId}`
    if (isMatchedRoute(router.resolve(detailPath))) return detailPath
  }

  return '/activity'
}

export function toDeviceActivityPath(currentPath, targetPath) {
  if (!targetPath || /^https?:\/\//i.test(targetPath)) return targetPath
  return isPcRoutePath(currentPath) ? toPcRoutePath(targetPath) : targetPath
}

/**
 * 统一活动跳转：校验路由存在，并在 PC 端补齐 /pc 前缀。
 * @returns {'checkin'|'navigated'|'external'|false}
 */
export function navigateToActivity(router, route, activity, options = {}) {
  const { replace = true } = options
  const resolved = resolveActivityPath(activity)

  if (resolved.kind === 'checkin') {
    return 'checkin'
  }

  if (resolved.kind === 'url' && /^https?:\/\//i.test(resolved.path)) {
    window.location.href = resolved.path
    return 'external'
  }

  const safePath = sanitizeActivityPath(router, resolved.path, resolved.activityId)
  const targetPath = toDeviceActivityPath(route.path, safePath)
  if (!targetPath) return false

  if (route.path === targetPath) return false
  if (replace) router.replace(targetPath)
  else router.push(targetPath)
  return 'navigated'
}

export function navigateActivityList(router, route, replace = true) {
  const targetPath = toDeviceActivityPath(route.path, '/activity')
  if (replace) router.replace(targetPath)
  else router.push(targetPath)
}
