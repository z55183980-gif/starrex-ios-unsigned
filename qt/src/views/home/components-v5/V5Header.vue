<template>
  <header class="mobile-site-header">
    <button class="mobile-menu-trigger" type="button" :aria-label="t('home.categories')" @click="drawerOpen = true">
      <span></span><span></span><span></span>
    </button>

    <button class="mobile-brand" type="button" :aria-label="t('tabbar.home')" @click="router.push('/home-new')">
      <img class="mobile-brand-icon" :src="brandLogo" alt="" @error="hideBrokenImg" />
      <img class="mobile-brand-wordmark" src="/assets/img/starrex-wordmark.png" alt="StarRex" />
    </button>

    <div class="mobile-header-actions">
      <template v-if="!loggedIn">
        <button type="button" @click="openAuth('register')"><van-icon name="manager-o" size="17" /><span>{{ t('common.register') }}</span></button>
        <button type="button" @click="openAuth('login')"><van-icon name="sign" size="17" /><span>{{ t('common.login') }}</span></button>
      </template>
      <button v-else type="button" @click="router.push('/member')"><van-icon name="user-o" size="19" /><span>{{ t('tabbar.mine') }}</span></button>
    </div>
  </header>

  <Teleport to="body">
    <transition name="drawer-fade">
      <div v-if="drawerOpen" class="mobile-drawer-mask" @click="drawerOpen = false"></div>
    </transition>
    <transition name="drawer-slide">
      <aside v-if="drawerOpen" class="mobile-drawer">
        <div class="mobile-drawer-brand">
          <img :src="brandLogo" alt="" @error="hideBrokenImg" />
          <div><strong>StarRex</strong><span>{{ t('home.hall') }}</span></div>
          <button type="button" :aria-label="t('common.close')" @click="drawerOpen = false"><van-icon name="cross" size="20" /></button>
        </div>

        <nav class="mobile-drawer-nav" :aria-label="t('home.categories')">
          <button v-for="item in drawerItems" :key="item.code" type="button" @click="goCategory(item)">
            <img :src="item.icon" alt="" @error="hideBrokenImg" />
            <span>{{ item.label }}</span>
            <van-icon name="arrow" size="15" />
          </button>
        </nav>

        <button
          class="mobile-language-row"
          type="button"
          :aria-label="`${t('home.languageSettings')}: ${currentLangText}`"
          @click="showLangPicker = true"
        >
          <span class="mobile-language-icon"><van-icon name="globe-o" size="21" /></span>
          <span class="mobile-language-copy">
            <small>{{ t('home.languageSettings') }}</small>
            <strong>{{ currentLangText }}</strong>
          </span>
          <van-icon class="mobile-language-arrow" name="arrow" size="16" />
        </button>
      </aside>
    </transition>
  </Teleport>

  <van-action-sheet
    v-model:show="showLangPicker"
    :title="t('home.languageSettings')"
    :actions="langActions"
    :cancel-text="t('common.cancel')"
    @select="onSelectLang"
  />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getThemeLogo } from '@/constants/branding'
import { isLoggedIn } from '@/utils/auth'
import { hideBrokenImg } from '@/utils/staticAssets'
import { resolveAllPlatformsPath } from '@/utils/gameNavigation'
import { getLocale, getLocaleOptions, loadEnabledLanguages, normalizeLocaleCode, setLocale } from '@/locales'
import { gameApi } from '@/api/game'

const router = useRouter()
const { t } = useI18n()
const drawerOpen = ref(false)
const showLangPicker = ref(false)
const currentLocale = ref(getLocale())
const loggedIn = ref(isLoggedIn())
const brandLogo = getThemeLogo()
const configuredCategories = ref([])

const fallbackCategories = computed(() => [
  { code: 'chess', name: t('game.chess'), icon: '/assets/img/icon_dtfl_qp_1.avif' },
  { code: 'slot', name: t('game.slot'), icon: '/assets/img/icon_dtfl_dz_1.avif' },
  { code: 'fish', name: t('game.fish'), icon: '/assets/img/icon_dtfl_by_1.avif' },
  { code: 'live', name: t('game.live'), icon: '/assets/img/icon_dtfl_zr_1.avif' },
  { code: 'lottery', name: t('game.lottery'), icon: '/assets/img/icon_dtfl_cp_1.avif' },
  { code: 'sport', name: t('game.sport'), icon: '/assets/img/icon_dtfl_ty_1.avif' },
  { code: 'esport', name: t('game.esport'), icon: '/assets/img/icon_dtfl_dj_1.avif' }
])

const drawerItems = computed(() => [
  ...(configuredCategories.value.length ? configuredCategories.value : fallbackCategories.value)
    .filter((item) => item.code !== 'hot')
    .map((item) => ({
      ...item,
      label: item.name || item.label || item.code,
      icon: item.icon || '/assets/img/icon_dtfl_zh_0.svg'
    })),
  { code: 'activity', label: t('home.activityTasks'), icon: '/assets/img/icon_dt_1tg.avif' }
])

const langActions = computed(() => {
  return getLocaleOptions().map((item) => ({ name: item.text, value: item.value }))
})

const currentLangText = computed(() => {
  const active = getLocaleOptions().find((item) => item.value === currentLocale.value)
  return active?.text || currentLocale.value
})

function openAuth(tab) {
  window.dispatchEvent(new CustomEvent('open-mobile-auth', { detail: tab }))
}

function goCategory(item) {
  drawerOpen.value = false
  if (item.code === 'activity') router.push('/activity')
  else router.push(resolveAllPlatformsPath(item))
}

async function loadCategories() {
  try {
    const res = await gameApi.getCategories()
    const list = Array.isArray(res?.data) ? res.data : res?.data?.list || []
    if (res?.code === 0 && list.length) {
      configuredCategories.value = list.filter((item) => item?.code && item.code !== 'lobby')
    }
  } catch (e) {}
}

function onSelectLang(action) {
  const code = normalizeLocaleCode(action.value)
  currentLocale.value = code
  setLocale(code)
  showLangPicker.value = false
  location.reload()
}

onMounted(() => {
  loadEnabledLanguages()
  loadCategories()
})
</script>

<style lang="scss" scoped>
.mobile-site-header {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 120;
  height: calc(50px + env(safe-area-inset-top, 0px));
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 66px minmax(0, 1fr) 86px;
  align-items: center;
  padding: env(safe-area-inset-top, 0px) 10px 0;
  color: #e8cb70;
  background: #070707;
  border-bottom: 1px solid rgba(232, 203, 112, 0.22);
}

.mobile-menu-trigger {
  width: 38px;
  height: 38px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0;
  border: 0;
  background: transparent;
}

.mobile-menu-trigger span {
  width: 21px;
  height: 2px;
  border-radius: 2px;
  background: #d8b755;
}

.mobile-brand {
  min-width: 0;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 0;
  border: 0;
  background: transparent;
}

.mobile-brand-icon { width: 34px; height: 34px; object-fit: contain; }
.mobile-brand-wordmark { width: 82px; height: 37px; object-fit: contain; mix-blend-mode: screen; }
.mobile-header-actions { display: flex; justify-content: flex-end; gap: 8px; }
.mobile-header-actions button {
  min-width: 34px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 0;
  border: 0;
  color: #d8b755;
  background: transparent;
  font-size: 10px;
}

.mobile-drawer-mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(2px);
}

.mobile-drawer {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  width: min(78vw, 310px);
  box-sizing: border-box;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 14px 20px;
  color: #eee;
  background: #0d0d0d;
  border-right: 1px solid rgba(232, 203, 112, 0.34);
  box-shadow: 14px 0 32px rgba(0, 0, 0, 0.52);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-drawer-brand {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) 36px;
  align-items: center;
  gap: 9px;
  padding-bottom: 14px;
  border-bottom: 1px solid #282828;
}

.mobile-drawer-brand > img { width: 44px; height: 44px; object-fit: contain; }
.mobile-drawer-brand div { display: flex; flex-direction: column; gap: 2px; }
.mobile-drawer-brand strong { color: #f3d77c; font-size: 16px; }
.mobile-drawer-brand span { color: #777; font-size: 11px; }
.mobile-drawer-brand button { width: 34px; height: 34px; border: 0; color: #aaa; background: transparent; }
.mobile-drawer-nav {
  display: grid;
  flex: 1;
  align-content: start;
  min-height: 0;
  gap: 3px;
  padding: 12px 0;
  overflow-y: auto;
  scrollbar-width: none;
}
.mobile-drawer-nav::-webkit-scrollbar { display: none; }
.mobile-drawer-nav button,
.mobile-language-row {
  width: 100%;
  height: 48px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  color: #ddd;
  text-align: left;
  background: transparent;
}

.mobile-drawer-nav button:active,
.mobile-language-row:active { color: #f3d77c; background: rgba(243, 215, 124, 0.1); }
.mobile-drawer-nav img { width: 28px; height: 28px; object-fit: contain; }
.mobile-language-row {
  flex: 0 0 auto;
  height: 62px;
  grid-template-columns: 38px minmax(0, 1fr) 18px;
  gap: 10px;
  margin-top: 6px;
  padding: 0 12px;
  border: 1px solid rgba(243, 215, 124, 0.38);
  border-radius: 10px;
  color: #f7e7b0;
  background: linear-gradient(135deg, rgba(243, 215, 124, 0.14), rgba(243, 215, 124, 0.04));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
.mobile-language-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #17130a;
  background: linear-gradient(145deg, #f8e69f, #c79b35);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
}
.mobile-language-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
  line-height: 1.2;
}
.mobile-language-copy small {
  overflow: hidden;
  color: #a9a9a9;
  font-size: 11px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mobile-language-copy strong {
  overflow: hidden;
  color: #fff4cb;
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mobile-language-arrow { color: #e6c766; }
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.22s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-slide-enter-active, .drawer-slide-leave-active { transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1); }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(-100%); }
</style>
