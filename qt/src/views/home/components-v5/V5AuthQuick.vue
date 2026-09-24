<template>
  <div class="v5-quick">
    <div class="auth-btns" :class="{ 'auth-btns--login-only': !memberRegisterEnabled }" v-if="!isLogin">
      <div class="btn login" @click="openAuth('login')">{{ $t('common.login') }}</div>
      <!-- 会员注册入口：由 featureFlags.MEMBER_REGISTER_ENABLED 控制 -->
      <div v-show="memberRegisterEnabled" class="btn reg" @click="openAuth('register')">{{ $t('common.register') }}</div>
    </div>

    <div class="user-info-panel" v-else>
      <div class="u-row top">
        <div class="level-badge">V{{ userInfo.groupid || 1 }}</div>
        <span class="username">{{ userInfo.username || 'User' }}</span>
        <van-icon name="orders-o" class="copy-icon" @click="copyText(userInfo.username)" />
      </div>
      <div class="u-row bottom">
        <van-icon name="gold-coin-o" class="coin-icon-van" color="#f5a623" size="16" />
        <div class="balance-box">
          <span class="balance">{{ userInfo.balance || '0.00' }}</span>
          <img src="/assets/img/comm_icon_sx1.svg" class="refresh-icon" :class="{ spinning: refreshing }" @click="refreshBalance" />
        </div>
      </div>
    </div>

    <div class="quick-icons">
      <div
        class="q-item"
        v-for="entry in quickEntries"
        :key="entry.id"
        @click="handleEntryClick(entry)"
      >
        <img
          :src="entry.icon"
          class="q-icon"
          referrerpolicy="no-referrer"
          @error="(e) => onQuickEntryImgError(e, entry)"
        />
        <span>{{ resolveQuickEntryLabel(entry) }}</span>
      </div>
    </div>
    
    <div v-if="showMore" class="custom-popup-mask" @click="showMore = false"></div>
    <div v-if="showMore" class="custom-popup">
      <div class="popup-arrow"></div>
      <div class="more-menu-grid">
        <div class="menu-item" v-for="(item, index) in moreItems" :key="index" @click="handleMenuClick(item)">
          <img
            v-if="item.iconImg"
            :src="item.iconImg"
            class="menu-icon-img"
            referrerpolicy="no-referrer"
          />
          <van-icon v-else :name="item.icon" size="24" color="#009688" />
          <span>{{ item.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast } from 'vant'
import { getUserInfo, isLoggedIn } from '@/utils/auth'
import { checkFundPasswordAndNavigate } from '@/utils/withdrawCheck'
import { authApi } from '@/api/auth'
import { useConfigStore } from '@/stores/config'
import { homeApi } from '@/api/home'
import {
  resolveQuickEntryLabel,
  resolveQuickEntryIconForEntry,
  fallbackQuickEntryIcon
} from '@/utils/quickEntry'
import {
  MEMBER_REGISTER_ENABLED,
  resolveAuthTab,
  filterAppDownloadItems
} from '@/constants/featureFlags'
import { hideBrokenImg } from '@/utils/staticAssets'
import { openOnlineCustomerService } from '@/utils/customerService'

const { t } = useI18n()

const router = useRouter()
const configStore = useConfigStore()
const emit = defineEmits(['open-auth', 'open-deposit'])
const showMore = ref(false)
const isLogin = ref(false)
const userInfo = ref({})
const refreshing = ref(false)
const backendMenus = ref([])
const memberRegisterEnabled = MEMBER_REGISTER_ENABLED

// Fallback only when API has no 客服 entry; order always follows backend `sort` (admin 金刚区配置).
const customerServiceFallback = {
  id: 'customer-service',
  name: '客服',
  name_en: 'Service',
  icon: '/uploads/icons/icon_dt_1kf.avif',
  link_type: 3,
  link: '',
  sort: 9999,
  status: 1
}

const normalizeQuickEntries = (items = []) =>
  filterAppDownloadItems(items).map((entry) => ({
    ...entry,
    iconRaw: entry.icon,
    icon: resolveQuickEntryIconForEntry(entry)
  }))

/** Keep API order; only append 客服 if admin list omitted it (never force first). */
const ensureCustomerServiceEntry = (items = []) => {
  const hasService = items.some((entry) => {
    if (Number(entry.link_type) === 3) return true
    const name = String(entry.name || '').toLowerCase()
    return name === 'service' || name.includes('客服')
  })
  return hasService ? items : [...items, customerServiceFallback]
}

const quickEntries = ref([])

onMounted(() => {
  checkLoginStatus()
  configStore.fetchConfig()
  loadQuickMenus()
  loadQuickEntries()
})

const loadQuickMenus = async () => {
  try {
    const res = await homeApi.getQuickMenus()
    if (res.code === 0 && res.data) {
      backendMenus.value = filterAppDownloadItems(res.data)
    }
  } catch (e) {}
}

const loadQuickEntries = async () => {
  try {
    const res = await homeApi.getQuickEntries()
    if (res.code === 0 && Array.isArray(res.data)) {
      quickEntries.value = normalizeQuickEntries(ensureCustomerServiceEntry(res.data))
    }
  } catch (e) {}
}

const checkLoginStatus = async () => {
  isLogin.value = isLoggedIn()
  if (isLogin.value) {
    userInfo.value = getUserInfo() || {}
    try {
      const res = await authApi.getProfile()
      if (res.code === 0 && res.data?.user) {
        userInfo.value = {
          ...userInfo.value,
          ...res.data.user,
          groupid: res.data.user.groupid || userInfo.value.groupid || 1
        }
      }
    } catch (e) {}
  }
}

const refreshBalance = async () => {
  refreshing.value = true
  try {
    const res = await authApi.getProfile()
    if (res.code === 0 && res.data?.user) {
      userInfo.value.balance = res.data.user.balance || 0
      showToast(t('common.refreshSuccess'))
    }
  } catch (e) {
    showToast(t('common.refreshFailed'))
  } finally {
    refreshing.value = false
  }
}

const copyText = (text) => {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    showToast(t('common.copySuccess'))
  }).catch(() => {
    showToast(t('common.copyFailed'))
  })
}

const onQuickEntryImgError = (e, entry) => {
  const el = e?.target
  if (!el || el.dataset.fallback) return
  const fb = fallbackQuickEntryIcon(entry)
  if (fb && el.src !== fb) {
    el.dataset.fallback = '1'
    el.src = fb
    return
  }
  hideBrokenImg(e)
}

const openAuth = (type) => {
  emit('open-auth', resolveAuthTab(type))
}

const go = (path) => router.push(path)

const goService = async () => {
  await openOnlineCustomerService()
}

const handleEntryClick = async (entry) => {
  if (Number(entry.link_type) === 3) {
    goService()
  } else if (entry.link_type === 4) {
    showMore.value = true
  } else if (entry.link_type === 2) {
    window.open(entry.link, '_blank')
  } else if (entry.link_type === 1 && entry.link) {
    router.push(entry.link)
  }
}

const moreItems = computed(() => {
  return backendMenus.value.map(item => ({
    name: resolveQuickEntryLabel(item),
    iconImg: resolveQuickEntryIconForEntry(item),
    path: item.link_type === 1 ? item.link : null,
    url: item.link_type === 2 ? item.link : null
  }))
})

const handleMenuClick = async (item) => {
  showMore.value = false
  if (item.action === 'deposit') {
    if (!isLoggedIn()) {
      emit('open-auth', 'login')
      return
    }
    emit('open-deposit')
    return
  }
  if (item.url) {
    window.open(item.url, '_blank')
    return
  }
  if (item.path === '/payment/withdraw' || item.path === '/withdraw/manage') {
    const options = item.path === '/withdraw/manage' ? { query: { active: '1' } } : {}
    await checkFundPasswordAndNavigate(router, options)
    return
  }
  if (item.path) router.push(item.path)
}
</script>

<style lang="scss" scoped>
.v5-quick {
  display: flex;
  padding: 12px;
  background: transparent;
  align-items: center;
  position: relative;
}

.auth-btns {
  flex: 0 0 38%;
  display: flex;
  gap: 12px;
  margin-right: 12px;

  &.auth-btns--login-only .btn.login {
    flex: 1;
  }
}

.btn {
  flex: 1;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 2px;

  &.login {
    border: 1px solid #26A17B;
    color: #26A17B;
    background: rgba(255, 255, 255, 0.8);
    animation: btn-pulse-login 1.5s ease-in-out infinite;
  }

  &.reg {
    background: #26A17B;
    color: #fff;
    box-shadow: 0 2px 6px rgba(0, 150, 136, 0.3);
    animation: btn-pulse-reg 1.5s ease-in-out infinite;
  }
}

@keyframes btn-pulse-login {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(38, 161, 123, 0);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(38, 161, 123, 0.2);
  }
}

@keyframes btn-pulse-reg {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 6px rgba(0, 150, 136, 0.3);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 150, 136, 0.5);
  }
}

.user-info-panel {
  flex: 0 0 38%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-right: 12px;
  gap: 4px;
}

.u-row {
  display: flex;
  align-items: center;
  gap: 8px;

  &.top {
    margin-bottom: 2px;
  }
}

.level-badge {
  background: #26A17B;
  color: #fff;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 3px;
  height: 16px;
  display: flex;
  align-items: center;
}

.username {
  font-size: 14px;
  font-weight: 700;
  color: #333;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-icon {
  color: #26A17B;
  cursor: pointer;
  font-size: 14px;
}

.coin-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.balance-box {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.balance {
  font-size: 16px;
  color: #FFAA09;
  font-weight: 700;
}

.refresh-icon {
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin-top: 1px;

  &.spinning {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.quick-icons {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.q-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  span {
    font-size: 12px;
    color: #555;
    font-weight: 500;
  }
}

.q-icon {
  width: 32px;
  height: 28px;
  object-fit: contain;
}

.custom-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.custom-popup {
  position: absolute;
  top: 70px;
  right: 12px;
  width: 309px;
  max-height: 360px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  overflow-y: auto;
}

.popup-arrow {
  position: absolute;
  top: -6px;
  right: 16px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #fff;
}

.more-menu-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: 5px 5px 15px 5px;
  background: transparent;
  height: 100%;
  align-content: flex-start;
  row-gap: 12px;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 57px;
  height: 62px;
  gap: 4px;

  span {
    font-size: 12px;
    color: #333;
    text-align: center;
    white-space: nowrap;
  }
}

.menu-icon-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
</style>
