<template>
  <div class="home-v5">
    <div class="main-scroll" ref="scrollRef" @scroll="onScroll">
      <V5Banner />
      <V5Notice />
      <V5GameContainer />
      <MobileParitySections @open-auth="openAuth" @open-deposit="showDepositPopup = true" />
      <div style="height: 20px"></div>
    </div>

    <V5AuthModal v-model="showAuthModal" :initial-tab="authTab" layout="mobile" />
    <DepositPopup v-model:show="showDepositPopup" />
    <ActivityPopup v-model:show="showActivityPopup" />
  </div>

  <Teleport to="body">
    <!-- 左侧悬浮窗-已隐藏
    <div class="float-left" :class="{ hidden: isScrolling }" v-if="showFloatLeft">
      <img src="/assets/img/marketing_medium_dx_2_18.webp" class="float-img" @error="hideBrokenImg" @click="$router.push('/activity')" />
      <img src="/assets/img/kjrk_icon_guanbi.avif" class="close-btn close-right" @error="hideBrokenImg" @click="showFloatLeft = false" />
      <p class="bounce-text" v-html="t('home.newUserGiftText')"></p>
    </div>
    -->

    <div class="float-right-wrap">
      <!-- 右侧悬浮窗-已隐藏
      <div class="float-right-item" :class="{ hidden: isScrolling }" v-if="showFloatRight">
        <img :src="floatIconSrc" class="float-img" @error="hideBrokenImg" @click="handleFloatIconClick" />
        <img src="/assets/img/kjrk_icon_guanbi.avif" class="close-btn close-left" @error="hideBrokenImg" @click="showFloatRight = false" />
      </div>
      -->
      <div class="to-top" v-show="showToTop" @click="scrollToTop">
        <van-icon name="back-top" size="20" />
        <span>{{ t('home.toTop') }}</span>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineOptions({ name: 'HomeV5' })

import { ref, provide, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfigStore } from '@/stores/config'

const { t } = useI18n()
const configStore = useConfigStore()
import { useRoute, useRouter } from 'vue-router'
import V5Banner from './components-v5/V5Banner.vue'
import V5Notice from './components-v5/V5Notice.vue'
import V5GameContainer from './components-v5/V5GameContainer.vue'
import MobileParitySections from './components-v5/MobileParitySections.vue'
import V5AuthModal from './components-v5/V5AuthModal.vue'
import DepositPopup from '@/components/deposit/DepositPopup.vue'
import ActivityPopup from '@/components/home/ActivityPopup.vue'
import { resumeCustomerServiceAfterLogin } from '@/utils/customerService'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import { hideBrokenImg } from '@/utils/staticAssets'
import { MEMBER_REGISTER_ENABLED, resolveAuthTab } from '@/constants/featureFlags'

const route = useRoute()
const router = useRouter()

const showAuthModal = ref(false)
const authTab = ref('login')
const showDepositPopup = ref(false)
const showActivityPopup = ref(false)
const showFloatLeft = ref(true)
const showFloatRight = ref(true)
const showToTop = ref(false)
const isScrolling = ref(false)
const scrollRef = ref(null)

let scrollTimer = null
let activityPopupTimer = null

const onScroll = () => {
  const scrollTop = scrollRef.value?.scrollTop || 0
  showToTop.value = scrollTop > 200
  isScrolling.value = true
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    isScrolling.value = false
  }, 1000)
}

const scrollToTop = () => {
  scrollRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const floatIconSrc = computed(() => resolveMediaUrl(configStore.floatIcon))

const handleFloatIconClick = () => {
  let link = configStore.floatIconLink
  if (!link || link.trim() === '') {
    link = '/activity'
  }
  link = link.trim()
  // 修正常见格式错误：https//xxx -> https://xxx
  link = link.replace(/^(https?)\/\//, '$1://')
  
  if (link.startsWith('http://') || link.startsWith('https://')) {
    window.open(link, '_blank')
  } else {
    if (!link.startsWith('/')) {
      link = '/' + link
    }
    router.push(link)
  }
}

const openAuth = (tab = 'login') => {
  authTab.value = resolveAuthTab(tab)
  showAuthModal.value = true
}

const handleHeaderAuth = (event) => openAuth(event?.detail || 'login')

onMounted(async () => {
  window.addEventListener('open-mobile-auth', handleHeaderAuth)
  if (await resumeCustomerServiceAfterLogin()) {
    return
  }

  const authParam = route.query.auth
  const inviteCode = route.query.invite || route.query.tgid || route.query.code
  if (inviteCode) {
    openAuth(MEMBER_REGISTER_ENABLED ? 'register' : 'login')
  } else if (authParam === 'login' || authParam === 'register') {
    openAuth(authParam)
    router.replace({ query: {} })
  }

  activityPopupTimer = setTimeout(() => {
    showActivityPopup.value = true
  }, 500)
})

onUnmounted(() => {
  window.removeEventListener('open-mobile-auth', handleHeaderAuth)
  clearTimeout(scrollTimer)
  clearTimeout(activityPopupTimer)
})

provide('openAuth', openAuth)
</script>

<style lang="scss" scoped>
.home-v5 {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #0d0d0d;
  background-size: 160px 160px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.main-scroll {
  flex: 1;
  overflow-y: auto;
  background: #0d0d0d;
  scrollbar-width: none;
}

.main-scroll::-webkit-scrollbar { display: none; }
</style>

<style lang="scss">
.float-left {
  position: fixed;
  left: 5px;
  bottom: 120px;
  z-index: 9999;
  transition: transform 0.3s ease;
}

.float-left .float-img {
  position: relative;
}

.float-left.hidden {
  transform: translateX(-50%);
}

.bounce-text {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  font-weight: 700;
  color: #FFFF00;
  text-align: center;
  margin: 0;
  line-height: 1.1;
  text-shadow: 
    -1px -1px 0 #006FFC,
    1px -1px 0 #006FFC,
    -1px 1px 0 #006FFC,
    1px 1px 0 #006FFC,
    0 0 3px #006FFC;
  animation: scaleWords 0.4s infinite cubic-bezier(.74, -.02, .27, .96);
}

@keyframes scaleWords {
  0%, 100% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(0.94);
  }
}

.float-right-wrap {
  position: fixed;
  right: 5px;
  bottom: 120px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.float-right-item {
  position: relative;
  transition: transform 0.3s ease;
}

.float-right-item.hidden {
  transform: translateX(50%);
}

.float-img {
  width: 70px;
  height: auto;
  display: block;
  cursor: pointer;
}

.close-btn {
  position: absolute;
  top: 0;
  width: 16px;
  height: 16px;
}

.close-right {
  right: 0;
}

.close-left {
  left: 0;
}

.to-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: #666;
  font-size: 12px;
  cursor: pointer;
}
</style>
