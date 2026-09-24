<template>
  <teleport to="body">
    <Transition name="popup-fade">
      <div v-if="renderVisible" class="activity-popup-overlay" @click="handleClose">
        <Transition name="popup-scale" appear>
          <div class="activity-popup-wrapper" @click.stop>
            <div class="popup-main">
              <div class="desktop-popup-header">
                <div class="popup-brand">
                  <img src="/assets/img/starrex-logo.png" alt="StarRex 星恒 logo" class="popup-brand-logo" />
                  <span class="popup-brand-name">{{ siteName }}</span>
                </div>
                <span class="desktop-popup-title">活动公告</span>
              </div>
              <div class="mobile-popup-header">
                <div class="popup-brand">
                  <img src="/assets/img/starrex-logo.png" alt="StarRex 星恒 logo" class="mobile-popup-logo" />
                  <span class="mobile-popup-brand-name">{{ siteName }}</span>
                </div>
                <span class="mobile-popup-title">活动公告</span>
                <button type="button" class="mobile-popup-close" aria-label="关闭公告" @click.stop="handleClose">
                  <van-icon name="cross" size="18" />
                </button>
              </div>
              <div class="popup-image-wrap">
                <img
                  v-if="currentImage"
                  :src="currentImage"
                  class="popup-image"
                  @click="handleImageClick"
                  @error="handleImageError"
                />
                <div v-else class="popup-image-placeholder"><van-loading size="24px" /></div>
                <div v-if="activeTab > 0" class="nav-btn nav-prev" @click.stop="prevTab">
                  <van-icon name="arrow-left" />
                </div>
                <div v-if="activeTab < tabs.length - 1" class="nav-btn nav-next" @click.stop="nextTab">
                  <van-icon name="arrow" />
                </div>
              </div>
            </div>
            <div class="popup-footer">
              <div class="no-tip-text" @click.stop="toggleNoShowToday">
                <van-icon :name="noShowToday ? 'checked' : 'circle'" />
                <span>今日不再提示</span>
              </div>
              <div class="close-circle" @click.stop="handleClose">
                <van-icon name="cross" size="14" />
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { homeApi } from '@/api/home'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import { useConfigStore } from '@/stores/config'

const props = defineProps({
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['update:show'])
const router = useRouter()
const configStore = useConfigStore()
const siteName = computed(() => configStore.siteName || 'StarRex 星恒')

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const tabs = ref([])
const activeTab = ref(0)
const noShowToday = ref(false)
const displayReady = ref(false)
let isUnmounted = false

const currentTab = computed(() => tabs.value[activeTab.value] || null)
const renderVisible = computed(() => visible.value && displayReady.value && tabs.value.length > 0)

/** 规范化后的地址 404 时改用接口原始地址（历史弹窗图仍托管在旧图床） */
const rawFallbackIds = ref([])
const currentImage = computed(() => {
  const tab = currentTab.value
  if (!tab) return ''
  return rawFallbackIds.value.includes(tab.id) ? tab.rawImage : tab.image
})

const STORAGE_KEY = 'activity_popup_hide_date'
const SESSION_STORAGE_KEY = 'activity_popup_shown_session'

const checkShouldShow = () => {
  const hideDate = localStorage.getItem(STORAGE_KEY)
  if (hideDate === new Date().toDateString()) return false
  return sessionStorage.getItem(SESSION_STORAGE_KEY) !== '1'
}

const loadPopupData = async () => {
  displayReady.value = false
  if (!checkShouldShow()) {
    visible.value = false
    return
  }
  try {
    const res = await homeApi.getActivityPopup()
    if (isUnmounted || !props.show) return
    if (res.code === 0 && res.data?.length > 0) {
      rawFallbackIds.value = []
      tabs.value = res.data.map((tab) => ({
        ...tab,
        image: resolveMediaUrl(tab.image),
        rawImage: typeof tab.image === 'string' ? tab.image.trim() : ''
      })).filter((tab) => tab.image)
      if (tabs.value.length > 0) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, '1')
        displayReady.value = true
      } else {
        visible.value = false
      }
    } else {
      visible.value = false
    }
  } catch (e) {
    if (!isUnmounted) visible.value = false
  }
}

const handleImageClick = () => {
  const tab = currentTab.value
  if (!tab) return
  if (tab.jump_type === 'url' && tab.jump_url) {
    window.open(tab.jump_url, '_blank')
  } else if (tab.jump_type === 'route' && tab.jump_url) {
    router.push(tab.jump_url)
    handleClose()
  } else if (tab.jump_type === 'activity') {
    router.push('/activity')
    handleClose()
  }
}

const handleImageError = () => {
  const tab = currentTab.value
  if (!tab) return

  // 先重试接口原始地址；仍失败说明这张图已失效，直接丢弃该项而不是留一个空弹窗
  if (tab.rawImage && tab.rawImage !== tab.image && !rawFallbackIds.value.includes(tab.id)) {
    rawFallbackIds.value = [...rawFallbackIds.value, tab.id]
    return
  }

  const index = activeTab.value
  tabs.value = tabs.value.filter((_, i) => i !== index)
  if (tabs.value.length === 0) {
    displayReady.value = false
    visible.value = false
    return
  }
  activeTab.value = Math.min(index, tabs.value.length - 1)
}

const toggleNoShowToday = () => {
  noShowToday.value = !noShowToday.value
}

const prevTab = () => {
  if (activeTab.value > 0) activeTab.value--
}

const nextTab = () => {
  if (activeTab.value < tabs.value.length - 1) activeTab.value++
}

const handleClose = () => {
  if (noShowToday.value) {
    localStorage.setItem(STORAGE_KEY, new Date().toDateString())
  }
  displayReady.value = false
  visible.value = false
}

watch(() => props.show, (val) => {
  if (val) loadPopupData()
})

onMounted(() => {
  if (props.show) loadPopupData()
})

onUnmounted(() => {
  isUnmounted = true
})
</script>

<style scoped>
.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: opacity 0.25s ease;
}
.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
}

.popup-scale-enter-active,
.popup-scale-leave-active {
  transition: opacity 0.25s ease;
}
.popup-scale-enter-from,
.popup-scale-leave-to {
  opacity: 0;
}

.activity-popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: calc(-1 * constant(safe-area-inset-bottom));
  bottom: calc(-1 * env(safe-area-inset-bottom, 0px));
  height: auto;
  min-height: 100vh;
  min-height: 100dvh;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-popup-wrapper {
  /* 公告图内框固定比例与最大尺寸，任何尺寸的图都按此框铺满 */
  --popup-media-ratio: 920 / 720;
  --popup-media-width: min(960px, calc(100vw - 76px), calc((100dvh - 190px) * 920 / 720));
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: fit-content;
  min-width: min(420px, calc(100vw - 28px));
  max-width: calc(100vw - 28px);
  height: auto;
  max-height: calc(100dvh - 40px);
  position: relative;
  background: url('/assets/img/popup-bg.png') center / cover no-repeat;
  border-radius: 10px;
  overflow: hidden;
}

.popup-main {
  display: flex;
  flex-direction: column;
  width: auto;
  height: auto;
  background: transparent;
  border-radius: 0;
  overflow: hidden;
}

.desktop-popup-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 70px;
  padding-left: 30px;
  box-sizing: border-box;
  background: #00000024;
}

.popup-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #f8e4ac;
  white-space: nowrap;
}

.popup-brand-logo {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.popup-brand-name {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

.desktop-popup-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: #f8e4ac;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 3px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

.popup-image-wrap {
  position: relative;
  width: var(--popup-media-width);
  height: auto;
  aspect-ratio: var(--popup-media-ratio);
  /* 左右不留边距，图片横向铺满弹窗 */
  margin: 19px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  overflow: hidden;
}

.popup-image {
  width: 100%;
  height: 100%;
  display: block;
  cursor: pointer;
  /* 内框尺寸固定：任何比例的图都拉伸铺满，不裁切也不留白 */
  object-fit: fill;
  background: transparent;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}

.nav-btn:active {
  background: rgba(0, 0, 0, 0.5);
}

.nav-prev {
  left: 8px;
}

.nav-next {
  right: 8px;
}

.popup-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e8c978;
  background: #1c1c1c;
}

.popup-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  inset: 0;
  z-index: 4;
  margin-top: 0;
  gap: 12px;
  pointer-events: none;
}

.no-tip-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  pointer-events: auto;
}

.close-circle {
  position: absolute;
  top: 5px;
  right: 10px;
  z-index: 4;
  width: 52px;
  height: 56px;
  border: 0;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  background: url('/assets/img/popup-close.png') center / 52px 56px no-repeat;
  pointer-events: auto;
  cursor: pointer;
  transition: transform 0.2s;
}

.close-circle:active {
  transform: scale(0.9);
}

@media (max-width: 700px) {
  .activity-popup-wrapper {
    width: calc(100% - 24px);
    height: auto;
    max-height: calc(100dvh - 32px);
    background: #28251f;
    border: 1px solid rgba(201, 165, 92, 0.78);
    border-radius: 8px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55);
    overflow: hidden;
  }

  .popup-main {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: auto;
    max-height: calc(100dvh - 78px);
    background: #1c1c1c;
    border-radius: 0;
    overflow: hidden;
  }
  .popup-main::before,
  .activity-popup-wrapper::before,
  .activity-popup-wrapper::after { display: none; }
  .desktop-popup-header { display: none; }
  .mobile-popup-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 52px;
    height: 52px;
    color: #f8e4ac;
    background: linear-gradient(180deg, #454039 0%, #292722 100%);
    border-bottom: 1px solid rgba(201, 165, 92, 0.72);
  }
  .mobile-popup-logo {
    width: 30px;
    height: 30px;
    object-fit: contain;
  }
  .mobile-popup-header .popup-brand {
    position: absolute;
    left: 14px;
  }
  .mobile-popup-brand-name {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    font-weight: 700;
  }
  .mobile-popup-title {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 2px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
  }
  .mobile-popup-close {
    position: absolute;
    top: 50%;
    right: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    padding: 0;
    transform: translateY(-50%);
    border: 0;
    border-radius: 50%;
    color: #f8e4ac;
    background: transparent;
  }
  .popup-image-wrap {
    width: 100%;
    height: auto;
    max-height: calc(100dvh - 168px);
    margin: 0;
    border-radius: 0;
    overflow: hidden;
    background: #1c1c1c;
  }
  .popup-image {
    width: 100%;
    height: 100%;
    border-radius: 0;
    object-fit: fill;
  }
  .nav-btn { display: none; }
  .popup-footer {
    position: static;
    inset: auto;
    display: flex;
    flex-direction: row;
    justify-content: center;
    min-height: 42px;
    padding: 5px 0;
    box-sizing: border-box;
    background: #28251f;
    pointer-events: auto;
  }
  .no-tip-text {
    color: rgba(255, 255, 255, 0.78);
    font-size: 12px;
  }
  .close-circle { display: none; }
}

@media (min-width: 701px) {
  .mobile-popup-header { display: none; }
}

@media (min-width: 701px) {
  .no-tip-text { display: none; }
}
</style>
