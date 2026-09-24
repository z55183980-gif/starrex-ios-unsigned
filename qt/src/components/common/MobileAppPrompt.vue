<template>
  <van-popup
    v-model:show="visible"
    position="bottom"
    :overlay="true"
    :close-on-click-overlay="true"
    :lazy-render="true"
    class="mobile-app-prompt"
    @click-overlay="close('dismiss')"
    @closed="handleClosed"
  >
    <div class="prompt-card">
      <button class="prompt-close" type="button" aria-label="关闭" @click="close('dismiss')">
        <van-icon name="cross" size="18" />
      </button>
      <div class="prompt-hero">
        <img src="/assets/img/starrex-logo.png" alt="" class="prompt-logo" />
        <div class="prompt-copy">
          <h2>{{ isAndroid ? '下载安卓版 APP' : '添加到主屏幕' }}</h2>
          <p>{{ isAndroid ? '下载并安装 APP，访问更快捷' : '通过分享菜单添加快捷入口' }}</p>
        </div>
      </div>
      <div class="prompt-steps" aria-label="安装步骤">
        <div class="prompt-step">
          <span class="step-icon"><van-icon :name="isAndroid ? 'down' : 'share-o'" size="22" /></span>
          <strong>{{ isAndroid ? '点击下载' : '点击分享' }}</strong>
        </div>
        <span class="step-arrow"><van-icon name="arrow" size="24" /></span>
        <div class="prompt-step">
          <span class="step-icon"><van-icon :name="isAndroid ? 'success' : 'add-o'" size="22" /></span>
          <strong>{{ isAndroid ? '安装应用' : '加入主屏幕' }}</strong>
        </div>
        <span class="step-arrow"><van-icon name="arrow" size="24" /></span>
        <div class="prompt-step">
          <span class="step-icon step-logo"><img src="/assets/img/starrex-icon.png" alt="" /></span>
          <strong>{{ isAndroid ? '打开 APP' : '快捷访问' }}</strong>
        </div>
      </div>
      <button class="prompt-action" type="button" @click="handleInstall">
        <van-icon name="down" size="18" />
        <span>{{ actionText }}</span>
      </button>
    </div>
  </van-popup>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { isMobileUa } from '@/utils/device'

/**
 * 频率方案：首次访问延迟 900ms；主动关闭后 24 小时不再打扰；
 * 点击安装后 7 天不重复；兜底为 7 天最多展示 3 次。
 */
const PROMPT_POLICY = Object.freeze({
  delayMs: 900,
  dismissCooldownMs: 24 * 60 * 60 * 1000,
  actionCooldownMs: 7 * 24 * 60 * 60 * 1000,
  impressionWindowMs: 7 * 24 * 60 * 60 * 1000,
  maxImpressions: 3
})

const STORAGE_KEY = 'mobile-app-prompt-v1'
const visible = ref(false)
const isAndroid = ref(false)
let timer
let closeReason = ''

const actionText = computed(() => {
  if (isAndroid.value) return import.meta.env.VITE_ANDROID_APP_DOWNLOAD_URL || import.meta.env.VITE_APP_DOWNLOAD_URL ? '立即下载' : '我知道了'
  return import.meta.env.VITE_IOS_APP_DOWNLOAD_URL ? '打开安装指引' : '我知道了'
})

const detectMobilePlatform = () => {
  const ua = navigator.userAgent || ''
  isAndroid.value = /Android/i.test(ua)
  return isAndroid.value || /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

const isStandaloneDisplay = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  window.navigator.standalone === true

const readState = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

const writeState = (state) => localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

const shouldShow = (now = Date.now()) => {
  const state = readState()
  if (state.lastActionAt && now - state.lastActionAt < PROMPT_POLICY.actionCooldownMs) return false
  if (state.lastDismissedAt && now - state.lastDismissedAt < PROMPT_POLICY.dismissCooldownMs) return false
  const windowStartedAt = state.windowStartedAt || now
  if (now - windowStartedAt >= PROMPT_POLICY.impressionWindowMs) return true
  return Number(state.impressions || 0) < PROMPT_POLICY.maxImpressions
}

const markShown = (now = Date.now()) => {
  const state = readState()
  const inWindow = state.windowStartedAt && now - state.windowStartedAt < PROMPT_POLICY.impressionWindowMs
  writeState({
    ...state,
    windowStartedAt: inWindow ? state.windowStartedAt : now,
    impressions: inWindow ? Number(state.impressions || 0) + 1 : 1,
    lastShownAt: now
  })
}

const close = (reason) => {
  closeReason = reason
  visible.value = false
}

const handleInstall = () => {
  const state = readState()
  writeState({ ...state, lastActionAt: Date.now() })
  const downloadUrl = isAndroid.value
    ? (import.meta.env.VITE_ANDROID_APP_DOWNLOAD_URL || import.meta.env.VITE_APP_DOWNLOAD_URL)
    : import.meta.env.VITE_IOS_APP_DOWNLOAD_URL
  close('action')
  if (downloadUrl) window.location.assign(downloadUrl)
}

const handleClosed = () => {
  if (closeReason === 'dismiss') {
    const state = readState()
    writeState({ ...state, lastDismissedAt: Date.now() })
  }
  closeReason = ''
}

onMounted(() => {
  if (isStandaloneDisplay() || !isMobileUa() || !detectMobilePlatform() || !shouldShow()) return
  timer = window.setTimeout(() => {
    markShown()
    visible.value = true
  }, PROMPT_POLICY.delayMs)
})

onUnmounted(() => {
  if (timer) window.clearTimeout(timer)
})
</script>

<style lang="scss">
.mobile-app-prompt {
  width: 100%;
  overflow: hidden;
  background: transparent;
}

.prompt-card {
  position: relative;
  padding: 20px 16px calc(14px + env(safe-area-inset-bottom, 0px));
  border-radius: 0;
  overflow: hidden;
  background: linear-gradient(180deg, #dff4ff 0%, #ffffff 62%);
  box-shadow: 0 -10px 32px rgba(28, 58, 88, 0.18);
}

.prompt-close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 5px;
  color: #fff;
  background: #94a9cc;
}

.prompt-hero {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  text-align: left;
}

.prompt-logo {
  width: 58px;
  height: 58px;
  object-fit: contain;
}

.prompt-copy h2 {
  margin: 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 700;
}

.prompt-copy p {
  margin: 6px 0 0;
  color: #8290a8;
  font-size: 12px;
}

.prompt-steps {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
  gap: 4px;
  margin: 16px 0 14px;
}

.prompt-step {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  color: #182334;
  font-size: 12px;
  text-align: center;
}

.step-icon {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 8px;
  color: #8da4d3;
  background: rgba(255, 255, 255, 0.64);
}

.step-logo img {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.step-arrow { color: #88a2d3; }

.prompt-action {
  display: flex;
  width: 100%;
  height: 40px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: 4px;
  color: #fff;
  background: #367ed6;
  font-size: 14px;
  font-weight: 600;
}

.prompt-action:active,
.prompt-close:active { opacity: 0.82; }
</style>

