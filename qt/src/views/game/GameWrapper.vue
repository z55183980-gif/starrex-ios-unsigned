<template>
  <div class="game-wrapper">
    <div
      class="home-btn"
      :style="homeBtnStyle"
      @touchstart.passive="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @mousedown="onMouseDown"
      @click="handleClick"
    >
      <van-icon name="wap-home-o" size="24" />
    </div>

    <div class="game-frame-container">
      <div class="loading-overlay" v-if="loading">
        <van-loading type="spinner" color="#fff" size="36" />
        <p>正在加载游戏...</p>
      </div>
      <iframe
        ref="gameFrame"
        :src="gameUrl"
        class="game-frame"
        :class="{ 'is-interacting-home': isDragging }"
        frameborder="0"
        allowfullscreen
        allow="autoplay; fullscreen"
        @load="onFrameLoad"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { gameApi } from '@/api/game'
import { getLocale } from '@/locales'
import { getGameEntryErrorMessage } from '@/utils/gameEntryError'
import { getDeviceType, getDeviceHomePath } from '@/utils/device'

const router = useRouter()
const route = useRoute()

const gameUrl = ref('')
const loading = ref(true)
const recovered = ref(false)
const gameFrame = ref(null)
const recoveryPlatform = ref('')
const returningHome = ref(false)
let recoveryRequest = null

const BG_ORIGINAL_RECOVERY_KEY = 'needRecoverBgOriginal'

const BTN_SIZE = 44
const EDGE = 8

const safeInsets = reactive({ top: 0, right: 0, bottom: 0, left: 0 })
const btnPosition = reactive({ x: EDGE, y: EDGE })
const isDragging = ref(false)
const startPos = reactive({ x: 0, y: 0 })
const startBtnPos = reactive({ x: 0, y: 0 })
const hasMoved = ref(false)

const homeBtnStyle = computed(() => ({
  left: `${btnPosition.x}px`,
  top: `${btnPosition.y}px`
}))

function readSafeInsets() {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') return
  const styles = getComputedStyle(document.documentElement)
  const read = (name) => {
    const raw = styles.getPropertyValue(name).trim()
    const n = parseFloat(raw)
    return Number.isFinite(n) ? n : 0
  }
  // 依赖 html/body 上已存在的 env()；若为 0，用常见刘海兜底仅作最小偏移
  safeInsets.top = read('--sat') || 0
  safeInsets.right = read('--sar') || 0
  safeInsets.bottom = read('--sab') || 0
  safeInsets.left = read('--sal') || 0

  // 无 CSS 变量时，用临时元素探测 env(safe-area-inset-*)
  if (!safeInsets.top && !safeInsets.left) {
    const probe = document.createElement('div')
    probe.style.cssText =
      'position:fixed;visibility:hidden;pointer-events:none;' +
      'padding-top:env(safe-area-inset-top);' +
      'padding-right:env(safe-area-inset-right);' +
      'padding-bottom:env(safe-area-inset-bottom);' +
      'padding-left:env(safe-area-inset-left);'
    document.body.appendChild(probe)
    const cs = getComputedStyle(probe)
    safeInsets.top = parseFloat(cs.paddingTop) || 0
    safeInsets.right = parseFloat(cs.paddingRight) || 0
    safeInsets.bottom = parseFloat(cs.paddingBottom) || 0
    safeInsets.left = parseFloat(cs.paddingLeft) || 0
    document.body.removeChild(probe)
  }
}

function clampBtnPosition(x, y) {
  const maxX = window.innerWidth - BTN_SIZE - EDGE - safeInsets.right
  const maxY = window.innerHeight - BTN_SIZE - EDGE - safeInsets.bottom
  const minX = EDGE + safeInsets.left
  const minY = EDGE + safeInsets.top
  return {
    x: Math.max(minX, Math.min(x, maxX)),
    y: Math.max(minY, Math.min(y, maxY))
  }
}

function resetBtnToSafeCorner() {
  const pos = clampBtnPosition(EDGE + safeInsets.left, EDGE + safeInsets.top)
  btnPosition.x = pos.x
  btnPosition.y = pos.y
}

function getPoint(e) {
  if (e.touches?.[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  if (e.changedTouches?.[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
  return { x: e.clientX, y: e.clientY }
}

const onTouchStart = (e) => {
  isDragging.value = true
  hasMoved.value = false
  const point = getPoint(e)
  startPos.x = point.x
  startPos.y = point.y
  startBtnPos.x = btnPosition.x
  startBtnPos.y = btnPosition.y
}

const onMouseDown = (e) => {
  if (e.button !== 0) return
  onTouchStart(e)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const onTouchMove = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  const point = getPoint(e)
  const dx = point.x - startPos.x
  const dy = point.y - startPos.y

  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
    hasMoved.value = true
  }

  const next = clampBtnPosition(startBtnPos.x + dx, startBtnPos.y + dy)
  btnPosition.x = next.x
  btnPosition.y = next.y
}

const onMouseMove = (e) => onTouchMove(e)

let homeTriggerAt = 0

const triggerHome = () => {
  const now = Date.now()
  if (now - homeTriggerAt < 600) return
  homeTriggerAt = now
  goHome()
}

const onTouchEnd = () => {
  const moved = hasMoved.value
  isDragging.value = false
  // iOS 上 click 常被吞掉：未拖动则在 touchend 直接回首页
  if (!moved) {
    triggerHome()
  }
}

const onMouseUp = () => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  onTouchEnd()
}

const handleClick = () => {
  if (hasMoved.value) return
  triggerHome()
}

const markBgOriginalRecovery = (platform) => {
  const normalizedPlatform = String(platform || '').trim().toUpperCase()
  if (!normalizedPlatform) return
  recoveryPlatform.value = normalizedPlatform
  localStorage.setItem(BG_ORIGINAL_RECOVERY_KEY, JSON.stringify({
    provider: 'BG_ORIGINAL',
    platform: normalizedPlatform,
    createdAt: Date.now()
  }))
}

const clearBgOriginalRecovery = (platform) => {
  const raw = localStorage.getItem(BG_ORIGINAL_RECOVERY_KEY)
  if (!raw) return
  try {
    const marker = JSON.parse(raw)
    if (marker?.provider === 'BG_ORIGINAL' && marker?.platform === platform) {
      localStorage.removeItem(BG_ORIGINAL_RECOVERY_KEY)
    }
  } catch (e) {
    localStorage.removeItem(BG_ORIGINAL_RECOVERY_KEY)
  }
}

const doRecover = async () => {
  const platform = recoveryPlatform.value
  if (!platform || recovered.value) return { code: 0, data: { amount: 0 } }
  if (recoveryRequest) return recoveryRequest

  recoveryRequest = (async () => {
    try {
      const res = await gameApi.recoverPlatformBalance({ platform })
      if (res?.code === 0) {
        recovered.value = true
        clearBgOriginalRecovery(platform)
      }
      return res
    } catch (e) {
      console.warn('BG原厂回收余额失败:', e)
      return { code: -1, data: { amount: 0 } }
    } finally {
      recoveryRequest = null
    }
  })()

  try {
    return await recoveryRequest
  } finally {
    recoveryRequest = null
  }
}

const goHome = async () => {
  if (returningHome.value) return
  returningHome.value = true

  if (recoveryPlatform.value) {
    showLoadingToast({ message: '回收余额...', forbidClick: true })
    try {
      await doRecover()
    } catch (e) {
      console.warn('BG原厂回收异常:', e)
    }
    closeToast()
  }
  router.push(getDeviceHomePath())
}

const onFrameLoad = () => {
  loading.value = false
  if (!recoveryPlatform.value || returningHome.value || !gameFrame.value?.contentWindow) return

  // 跨域游戏中读取 location 会抛异常；厂商退出并跳回本站后变为同源，此时立即回收。
  try {
    const frameLocation = new URL(gameFrame.value.contentWindow.location.href)
    if (frameLocation.origin === window.location.origin) {
      goHome()
    }
  } catch (e) {
    // 游戏仍在厂商跨域页面，保持正常运行。
  }
}

const loadGame = async () => {
  const { platform, gameId, url } = route.query
  loading.value = true
  gameUrl.value = ''
  recovered.value = false
  recoveryPlatform.value = ''
  returningHome.value = false

  if (url) {
    gameUrl.value = decodeURIComponent(String(url))
    loading.value = false
    return
  }

  if (!platform) {
    showToast('参数错误')
    router.back()
    return
  }

  try {
    const res = await gameApi.enterGame({
      platform,
      gameId: gameId || 'lobby',
      device: getDeviceType(),
      lang: getLocale()
    })

    if ((res.code === 0 || res.code === 10000) && res.data?.url) {
      const requiresBgOriginalRecovery = res.data?.requiresRecovery === true
      if (requiresBgOriginalRecovery && res.data?.recoveryPlatform) {
        markBgOriginalRecovery(res.data.recoveryPlatform)
      }

      const directRedirectPlatforms = ['SWC']
      if (directRedirectPlatforms.includes(String(platform).toUpperCase())) {
        if (!requiresBgOriginalRecovery) {
          localStorage.setItem('needRecoverGame', String(platform).toUpperCase())
        }
        window.location.replace(res.data.url)
        return
      }
      gameUrl.value = res.data.url
    } else {
      showToast(res.message || '进入游戏失败')
      setTimeout(() => router.back(), 1500)
    }
  } catch (e) {
    showToast(getGameEntryErrorMessage(e))
    setTimeout(() => router.back(), 1500)
  }
}

watch(
  () => [route.query.platform, route.query.gameId, route.query.url],
  () => {
    loadGame()
  },
  { immediate: true }
)

onMounted(() => {
  readSafeInsets()
  resetBtnToSafeCorner()
  window.addEventListener('resize', resetBtnToSafeCorner)
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      readSafeInsets()
      resetBtnToSafeCorner()
    }, 200)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resetBtnToSafeCorner)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  // 浏览器返回时由 App.vue 根据持久化标记回收，避免卸载钩子与路由钩子重复下分。
})
</script>

<style scoped>
/* 仅游戏页：固定视口 + 安全区，不影响主页 page-container */
.game-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  background: #000;
  z-index: 9999;
  overflow: hidden;
  /* 避免继承父级 transform 导致 fixed/触控异常 */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

.home-btn {
  position: fixed;
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  z-index: 10002;
  cursor: pointer;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.25);
  /* 保证盖在 iframe 之上可点 */
  pointer-events: auto;
}

.home-btn:active {
  background: rgba(0, 0, 0, 0.85);
}

.game-frame-container {
  position: absolute;
  /* 游戏内容避开刘海与底部手势条，减少裁切误触 */
  top: env(safe-area-inset-top, 0px);
  right: env(safe-area-inset-right, 0px);
  bottom: env(safe-area-inset-bottom, 0px);
  left: env(safe-area-inset-left, 0px);
  background: #000;
  overflow: hidden;
}

.game-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  background: #000;
  /* 默认可操作游戏；拖动主页按钮时临时禁用，避免 iOS iframe 抢触摸 */
  pointer-events: auto;
}

.game-frame.is-interacting-home {
  pointer-events: none;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  color: #fff;
  pointer-events: none;
}

.loading-overlay p {
  margin-top: 16px;
  font-size: 14px;
  color: #ccc;
}
</style>
