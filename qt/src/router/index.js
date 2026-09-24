

import { createRouter, createWebHistory } from 'vue-router'
import { useConfigStore } from '@/stores/config'
import { getDeviceHomePath, isMobileLayout } from '@/utils/device'
import {
  addPcRouteAliases,
  isPcAdaptivePath,
  isPcRoutePath,
  stripPcRoutePrefix,
  toPcRoutePath
} from '@/utils/deviceRoutes'

import authRoutes from './modules/auth'
import lotteryRoutes from './modules/lottery'
import memberRoutes from './modules/member'
import paymentRoutes from './modules/payment'
import activityRoutes from './modules/activity'
import serviceRoutes from './modules/service'
import imRoutes from './modules/im'
import legacyRoutes from './modules/legacy'
import gameRoutes from './modules/game'

const baseRoutes = [
  {
    path: '/',
    name: 'Home',
    redirect: (to) => ({ path: getDeviceHomePath(), query: to.query, hash: to.hash }),
    meta: { title: '首页' }
  },
  {
    path: '/home-new',
    name: 'HomeNew',
    component: () => import('@/views/home/HomeV5.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/pc',
    alias: '/pc/',
    name: 'PcHome',
    component: () => import('@/views/pc/PcHome.vue'),
    meta: { title: '首页', standalone: true, pc: true }
  }
]

const errorRoutes = [
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: (to) => ({ path: getDeviceHomePath(), query: to.query })
  }
]

const routes = addPcRouteAliases([
  ...baseRoutes,
  ...authRoutes,
  ...lotteryRoutes,
  ...memberRoutes,
  ...paymentRoutes,
  ...activityRoutes,
  ...serviceRoutes,
  ...imRoutes,
  ...gameRoutes,
  ...legacyRoutes, // 旧路径兼容，放在最后
  ...errorRoutes   // 404必须放在最后
])

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {

    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  const configStore = useConfigStore()
  const isHomeRoute = to.path === '/' || to.path === '/home-new' || to.path === '/pc'
  document.title = isHomeRoute
    ? configStore.siteName || 'StarRex 星恒'
    : to.meta.title || configStore.siteName || '官方平台'

  const deviceHomePath = getDeviceHomePath()
  const isDeviceHome = to.path === '/home-new' || to.path === '/pc'
  if (isDeviceHome && to.path !== deviceHomePath) {
    next({ path: deviceHomePath, query: to.query, hash: to.hash, replace: true })
    return
  }

  const mobileDevice = isMobileLayout()
  // PC 优惠活动以内嵌方式展示在大厅轮播图下方，不再打开独立活动页。
  if (!mobileDevice && (to.path === '/activity' || to.path === '/pc/activity')) {
    next({ path: '/pc', query: { ...to.query, view: 'activity' }, replace: true })
    return
  }
  const gameHallType = String(to.meta?.type || to.params?.type || '').trim()
  const normalizeHallType = (type) => (type === 'fishing' ? 'fish' : type)

  // PC 端不进入独立的在线客服中转页，统一回到首页并在当前窗口打开客服弹窗。
  const normalizedToPath = stripPcRoutePrefix(to.path)
  if (!mobileDevice && (normalizedToPath === '/service' || normalizedToPath.startsWith('/service/'))) {
    next({ path: '/pc', query: { cs: 'online' }, replace: true })
    return
  }

  if (mobileDevice && isPcRoutePath(to.path) && isPcAdaptivePath(to.path)) {
    next({ path: stripPcRoutePrefix(to.path), query: to.query, hash: to.hash, replace: true })
    return
  }

  if (!mobileDevice && !isPcRoutePath(to.path) && isPcAdaptivePath(to.path)) {
    next({ path: toPcRoutePath(to.path), query: to.query, hash: to.hash, replace: true })
    return
  }

  if (to.name === 'PcGameHall' && mobileDevice && gameHallType) {
    next({
      path: `/game/${normalizeHallType(gameHallType)}`,
      query: to.query,
      hash: to.hash,
      replace: true
    })
    return
  }
  if (
    !mobileDevice &&
    gameHallType &&
    to.path.startsWith('/game/') &&
    !['play', 'search'].includes(gameHallType)
  ) {
    next({
      path: `/pc/game/${normalizeHallType(gameHallType)}`,
      query: to.query,
      hash: to.hash,
      replace: true
    })
    return
  }

  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    sessionStorage.setItem('postLoginRedirect', to.fullPath)
    next({ path: deviceHomePath, query: { auth: 'login' } })
    return
  }

  if (to.meta.guest && token) {
    next({ path: deviceHomePath })
    return
  }
  
  next()
})

router.afterEach(() => {
  window.requestAnimationFrame(() => {
    window.dispatchEvent(new Event('resize'))
  })
})

export default router

