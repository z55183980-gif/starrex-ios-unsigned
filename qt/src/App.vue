<template>
  <div class="app-wrapper">
    <HomeHeader v-if="showHomeHeader" />
    <ActivityHeader v-if="showActivityHeader" />
    
    <router-view v-slot="{ Component, route: currentRoute }">
      <transition :name="isStandalonePage(currentRoute) ? '' : transitionName">
        <!--
          keep-alive：避免从会员中心子页返回时整页销毁重建（会再次 onMounted 拉数，表现为“刷新”）
          使用 getPageKey，活动页共用同一缓存键
        -->
        <keep-alive :max="10">
          <div
            v-if="Component"
            class="page-container"
            :class="{
              'page-container--standalone': isStandalonePage(currentRoute),
              'page-container--pc': isPcPage(currentRoute),
              'page-container--pc-adaptive': isPcAdaptivePage(currentRoute),
              'page-container--pc-activity': isPcActivityPage(currentRoute),
              'page-container--pc-fullscreen': isPcFullscreenPage(currentRoute),
              'page-container--mobile-home': isMobileHomePage(currentRoute),
              'page-container--im-chat': isImChatPage(currentRoute.path)
            }"
            :key="getPageKey(currentRoute)"
            :style="{
              paddingBottom:
                isImPage(currentRoute.path) || isStandalonePage(currentRoute) || isPcPage(currentRoute) ? '0' : '',
              top: getHeaderHeight(currentRoute)
            }"
          >
            <component :is="Component" />
          </div>
        </keep-alive>
      </transition>
    </router-view>
    
    <FooterNav v-if="showFooter" @open-deposit="showDepositPopup = true" @open-auth="openAuthModal" />
    <DepositPopup v-model:show="showDepositPopup" :theme="isPcPage(route) ? 'pc' : ''" />
    <V5AuthModal v-model="showAuthModal" :initial-tab="authTab" layout="mobile" />
    <CustomerServicePortal />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FooterNav from '@/views/home/components-v5/V5Footer.vue'
import HomeHeader from '@/views/home/components-v5/V5Header.vue'
import ActivityHeader from '@/components/headers/ActivityHeader.vue'
import DepositPopup from '@/components/deposit/DepositPopup.vue'
import V5AuthModal from '@/views/home/components-v5/V5AuthModal.vue'
import CustomerServicePortal from '@/components/common/CustomerServicePortal.vue'
import { lotteryWS } from '@/utils/websocket'
import { useUserStore } from '@/stores/user'
import { heartbeatService } from '@/utils/heartbeat'
import { transitionDirection, setTransitionDirection } from '@/stores/transition'
import { showConfirmDialog, showLoadingToast, closeToast, showToast } from 'vant'
import { gameApi } from '@/api/game'
import { resolveAuthTab } from '@/constants/featureFlags'
import { isLoggedIn } from '@/utils/auth'
import { isPcRoutePath, stripPcRoutePrefix } from '@/utils/deviceRoutes'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const showDepositPopup = ref(false)
const showAuthModal = ref(false)
const authTab = ref('login')
const isRouterReady = ref(false)

const openAuthModal = (tab = 'login') => {
  authTab.value = resolveAuthTab(tab)
  showAuthModal.value = true
}

const homePaths = ['/', '/home-new']
const footerPaths = ['/', '/home-new', '/activity', '/vip', '/cashback', '/pending', '/interest', '/reward-record', '/member']
const activityPaths = ['/activity', '/vip', '/cashback', '/pending', '/interest', '/reward-record']
const BG_ORIGINAL_RECOVERY_KEY = 'needRecoverBgOriginal'
let bgOriginalRecovering = false

const normalizedPath = (path) => stripPcRoutePrefix(path)
const isImPage = (path) => normalizedPath(path).startsWith('/im')
const isImChatPage = (path) => normalizedPath(path).startsWith('/im/chat/')
const isStandalonePage = (route) => route.meta?.standalone === true
const isPcPage = (route) => route.meta?.pc === true || isPcRoutePath(route.path)
const isPcAdaptivePage = (route) => isPcPage(route) && !isStandalonePage(route)
const isPcActivityPage = (route) => isPcPage(route) && activityPaths.includes(normalizedPath(route.path))
const isPcFullscreenPage = (route) => isPcPage(route) && normalizedPath(route.path) === '/game/play'
const isMobileHomePage = (route) => !isPcPage(route) && homePaths.includes(normalizedPath(route.path))

const getHeaderHeight = (route) => {
  if (isStandalonePage(route)) return '0'
  const path = normalizedPath(route.path)
  if (homePaths.includes(path)) return 'calc(50px + env(safe-area-inset-top, 0px))'
  if (activityPaths.includes(path)) {
    return isPcPage(route) ? '35px' : 'calc(50.59px + env(safe-area-inset-top, 0px))'
  }
  return '0'
}

const transitionName = transitionDirection

const getPageKey = (route) => {
  const path = normalizedPath(route.path)
  if (activityPaths.includes(path)) {
    return isPcPage(route) ? 'PcActivityGroup' : 'ActivityGroup'
  }
  // 会员中心本体固定缓存键，从子页返回可直接复用实例
  if (path === '/member') {
    return isPcPage(route) ? 'PcMemberCenter' : 'MemberCenter'
  }
  return route.path
}

router.isReady().then(() => {
  setTimeout(() => {
    isRouterReady.value = true
  }, 50)
})

router.beforeEach((to, from) => {
  setTransitionDirection(from.path, to.path)
  const toPath = normalizedPath(to.path)
  const fromPath = normalizedPath(from.path)
  const isActivityDetailPage = (path) => path.startsWith('/activity/') && path !== '/activity'
  if (activityPaths.includes(toPath) && !activityPaths.includes(fromPath) && !isActivityDetailPage(fromPath)) {
    if (!homePaths.includes(fromPath)) {
      sessionStorage.setItem('activity_back_path', from.path)
    } else {
      sessionStorage.removeItem('activity_back_path')
    }
  }
})

router.afterEach(() => {
  setTimeout(() => {
    checkGameRecover()
  }, 100)
})

const showFooter = computed(() =>
  isRouterReady.value && !isStandalonePage(route) && !isPcPage(route) && footerPaths.includes(normalizedPath(route.path))
)
const showHomeHeader = computed(() =>
  isRouterReady.value && !isStandalonePage(route) && !isPcPage(route) && homePaths.includes(normalizedPath(route.path))
)
const showActivityHeader = computed(() =>
  isRouterReady.value && !isStandalonePage(route) && activityPaths.includes(normalizedPath(route.path))
)

const handleOpenDeposit = () => {
  if (!isLoggedIn()) {
    openAuthModal('login')
    return
  }
  showDepositPopup.value = true
}

// 未登录入口（含存款弹窗自身拦截）统一通过该事件唤起登录框
const handleOpenAuth = (event) => {
  openAuthModal(event?.detail?.tab || 'login')
}

const checkBgOriginalRecover = async () => {
  // 游戏仍在运行时不回收，避免切后台、旋转屏幕或刷新误触发下分。
  if (normalizedPath(route.path) === '/game/play' || bgOriginalRecovering) return

  const raw = localStorage.getItem(BG_ORIGINAL_RECOVERY_KEY)
  if (!raw) return

  let marker
  try {
    marker = JSON.parse(raw)
  } catch (e) {
    localStorage.removeItem(BG_ORIGINAL_RECOVERY_KEY)
    return
  }

  if (marker?.provider !== 'BG_ORIGINAL' || !marker?.platform) {
    localStorage.removeItem(BG_ORIGINAL_RECOVERY_KEY)
    return
  }

  bgOriginalRecovering = true
  showLoadingToast({ message: '回收余额...', forbidClick: true })
  let resultMessage = ''
  try {
    const res = await gameApi.recoverPlatformBalance({ platform: marker.platform })
    if (res.code === 0) {
      if (localStorage.getItem(BG_ORIGINAL_RECOVERY_KEY) === raw) {
        localStorage.removeItem(BG_ORIGINAL_RECOVERY_KEY)
      }
      resultMessage = `回收成功: ¥${res.data?.amount || 0}`
    } else {
      resultMessage = res.message || '回收失败'
    }
  } catch (e) {
    // 保留标记，待路由切换、页面恢复可见或下次进入时重试。
    console.warn('BG原厂余额回收失败:', e)
  } finally {
    closeToast()
    bgOriginalRecovering = false
  }
  if (resultMessage) showToast(resultMessage)
}

const checkGameRecover = async () => {
  await checkBgOriginalRecover()

  const needRecover = localStorage.getItem('needRecoverGame')
  if (needRecover) {
    localStorage.removeItem('needRecoverGame')
    try {
      await showConfirmDialog({
        title: '回收余额',
        message: '检测到您刚从游戏返回，是否回收游戏余额？',
        confirmButtonText: '回收',
        cancelButtonText: '稍后'
      })
      showLoadingToast({ message: '回收中...', forbidClick: true })
      const res = await gameApi.recoverAllBalance()
      closeToast()
      if (res.code === 0) {
        showToast(`回收成功: ¥${res.data?.amount || 0}`)
      } else {
        showToast(res.message || '回收失败')
      }
    } catch (e) {
      // 用户点击取消
    }
  }
}

const handlePageShow = (event) => {
  if (event.persisted) {
    lotteryWS.resume().catch(() => {})
  }
  checkGameRecover()
}

const handlePageHide = (event) => {
  if (event.persisted) {
    lotteryWS.suspend()
  }
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    checkGameRecover()
  }
}

onMounted(() => {
  lotteryWS.connect().catch(() => {})
  userStore.initWsListeners()
  
  const token = localStorage.getItem('token')
  if (token) {
    heartbeatService.start(1000)
  }
  
  window.addEventListener('open-deposit', handleOpenDeposit)
  window.addEventListener('open-auth', handleOpenAuth)
  window.addEventListener('pageshow', handlePageShow)
  window.addEventListener('pagehide', handlePageHide)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  checkGameRecover()
})

onUnmounted(() => {
  userStore.cleanupWsListeners()
  lotteryWS.disconnect()
  heartbeatService.stop()
  window.removeEventListener('open-deposit', handleOpenDeposit)
  window.removeEventListener('open-auth', handleOpenAuth)
  window.removeEventListener('pageshow', handlePageShow)
  window.removeEventListener('pagehide', handlePageHide)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style>
.app-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #090909;
}

.page-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1c1c1c;
  overflow-x: hidden;
  overflow-y: auto;
  overflow-y: scroll;
  will-change: transform;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  touch-action: pan-y;
  padding-bottom: calc(58px + env(safe-area-inset-bottom));
}

.page-container--standalone {
  padding-bottom: 0;
  overflow: hidden;
  background: #3e300f;
}

.page-container--mobile-home {
  bottom: calc(58px + env(safe-area-inset-bottom, 0px));
  height: auto;
  padding-bottom: 0;
  overflow: hidden;
}

@media (max-width: 600px) {
  html.device-mobile .page-container--im-chat {
    overflow: hidden;
    overscroll-behavior: none;
    /* Avoid standalone inflated height clipping the input safe-area */
    max-height: 100%;
    max-height: 100dvh;
  }
}

html.is-standalone.device-mobile .page-container--im-chat {
  height: 100dvh;
  max-height: 100dvh;
}

.none-enter-active,
.none-leave-active {
  transition: none;
}
.none-enter-from,
.none-leave-to {
  opacity: 1;
}

.slide-left-enter-active {
  position: absolute !important;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1c1c1c;
  transition: transform 0.3s ease-out;
  z-index: 10;
}
.slide-left-leave-active {
  position: absolute !important;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1c1c1c;
  transition: transform 0.3s ease-out;
  z-index: 1;
}
.slide-left-enter-from { transform: translateX(100%); }
.slide-left-enter-to { transform: translateX(0); }
.slide-left-leave-from { transform: translateX(0); }
.slide-left-leave-to { transform: translateX(-100%); }

.slide-right-enter-active {
  position: absolute !important;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1c1c1c;
  transition: transform 0.3s ease-out;
  z-index: 10;
}
.slide-right-leave-active {
  position: absolute !important;
  left: 0;
  width: 100%;
  height: 100%;
  background: #1c1c1c;
  transition: transform 0.3s ease-out;
  z-index: 1;
}
.slide-right-enter-from { transform: translateX(-100%); }
.slide-right-enter-to { transform: translateX(0); }
.slide-right-leave-from { transform: translateX(0); }
.slide-right-leave-to { transform: translateX(100%); }

.tab-slide-left-enter-active,
.tab-slide-left-leave-active {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}
.tab-slide-left-enter-from { transform: translateX(100%); opacity: 0; }
.tab-slide-left-enter-to { transform: translateX(0); opacity: 1; }
.tab-slide-left-leave-from { transform: translateX(0); opacity: 1; }
.tab-slide-left-leave-to { transform: translateX(-100%); opacity: 0; }

.tab-slide-right-enter-active,
.tab-slide-right-leave-active {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
}
.tab-slide-right-enter-from { transform: translateX(-100%); opacity: 0; }
.tab-slide-right-enter-to { transform: translateX(0); opacity: 1; }
.tab-slide-right-leave-from { transform: translateX(0); opacity: 1; }
.tab-slide-right-leave-to { transform: translateX(100%); opacity: 0; }
</style>
