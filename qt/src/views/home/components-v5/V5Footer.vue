<template>
  <div class="v5-footer">
    <div class="footer-content">
      <div
        class="tab-item"
        v-for="(item, index) in navItems"
        :key="index"
        :class="{ active: isTabActive(item) }"
        @click="handleClick(item)"
      >
        <div class="tab-item-inner">
          <van-icon
            :name="isTabActive(item) ? item.activeIcon : item.icon"
            class="tab-icon"
          />
          <span class="tab-label">{{ item.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { isLoggedIn } from '@/utils/auth'
import { checkFundPasswordAndNavigate } from '@/utils/withdrawCheck'
import { setTransitionDirection } from '@/stores/transition'
import { resolveAuthTab, filterFooterNavItems } from '@/constants/featureFlags'
import { openOnlineCustomerService } from '@/utils/customerService'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const activePath = computed(() => {
  if (route.path === '/') return '/home-new'
  const activityPaths = ['/activity', '/vip', '/cashback', '/pending', '/interest', '/reward-record']
  if (activityPaths.includes(route.path)) return '/activity'
  return route.path
})

const isTabActive = (item) => {
  if (item.action) return false
  if (!item.path) return false
  return activePath.value === item.path
}

const isLogin = computed(() => isLoggedIn())

const emit = defineEmits(['open-auth', 'open-deposit'])

const handleClick = async (item) => {
  const token = localStorage.getItem('token')
  console.log('[V5Footer] handleClick:', item.path, 'token:', !!token)
  if (item.path === '/login') {
    emit('open-auth', 'login')
    return
  }
  if (item.path === '/register') {
    emit('open-auth', resolveAuthTab('register'))
    return
  }
  if (item.action === 'deposit') {
    if (!token) {
      emit('open-auth', 'login')
      return
    }
    emit('open-deposit')
    return
  }
  if (item.action === 'withdraw') {
    return
  }
  if (item.action === 'service') {
    await openOnlineCustomerService()
    return
  }
  if (item.requireAuth && !token) {
    emit('open-auth', 'login')
    return
  }
  if (item.path === '/member' && !token) {
    console.log('[V5Footer] No token, opening auth modal')
    emit('open-auth', 'login')
    return
  }
  setTransitionDirection(route.path, item.path)
  router.push(item.path)
}

const navItems = computed(() => {
  const items = [
    { name: t('tabbar.home'), icon: 'wap-home-o', activeIcon: 'wap-home', path: '/home-new' },
    { name: t('menu.cashback'), icon: 'balance-list-o', activeIcon: 'balance-list', path: '/cashback' },
    { name: t('tabbar.deposit'), icon: 'gold-coin-o', activeIcon: 'gold-coin', path: '', action: 'deposit' },
    { name: t('common.service'), icon: 'service-o', activeIcon: 'service', path: '', action: 'service' },
    { name: t('tabbar.mine'), icon: 'user-o', activeIcon: 'user', path: '/member' }
  ]
  return filterFooterNavItems(items)
})
</script>

<style lang="scss" scoped>
.v5-footer {
  height: calc(58px + env(safe-area-inset-bottom, 0px));
  background: #090909;
  border-top: 1px solid #211d13;
  box-shadow: 0 -4px 14px rgba(0, 0, 0, 0.35);
  padding-bottom: env(safe-area-inset-bottom);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

@media (max-width: 600px) {
  :global(html.is-standalone.device-mobile .v5-footer) {
    bottom: calc(-1 * env(safe-area-inset-bottom, 0px));
  }
}

.footer-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  align-items: stretch;
  background: #090909;
}

.tab-item {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 2px 3px;
  color: #777;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  .tab-item-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    min-width: 44px;
    max-width: 100%;
    padding: 3px 6px 2px;
    border-radius: 10px;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .tab-icon {
    font-size: 21px;
    line-height: 1;
  }

  .tab-label {
    font-size: 11px;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
    text-shadow: none;
    -webkit-font-smoothing: antialiased;
  }

  &.active {
    color: #e1c05b;

    .tab-item-inner {
      background: rgba(225, 192, 91, 0.08);
    }

    .tab-label {
      font-weight: 600;
    }
  }

  &:active .tab-item-inner {
    background: rgba(225, 192, 91, 0.12);
  }
}
</style>
