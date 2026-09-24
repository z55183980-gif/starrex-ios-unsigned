<template>
  <header class="pc-header">
    <div class="pc-utility">
      <div class="pc-utility-inner">
        <div class="pc-utility-links" :aria-label="t('home.quickAccess')">
          <span>{{ currentTime }}</span>
          <button type="button" @click="$emit('home')">{{ t('tabbar.home') }}</button>
          <i aria-hidden="true">|</i>
          <button type="button" @click="$emit('service')">{{ t('common.service') }}</button>
        </div>

        <div class="pc-account-area">
          <template v-if="!loggedIn">
            <form class="pc-login" @submit.prevent="submitLogin">
              <input
                ref="usernameRef"
                :value="username"
                type="text"
                autocomplete="username"
                :placeholder="t('auth.username')"
                :aria-label="t('auth.username')"
                @input="$emit('update:username', $event.target.value)"
              />
              <input
                :value="password"
                type="password"
                autocomplete="current-password"
                :placeholder="t('auth.password')"
                :aria-label="t('auth.password')"
                @input="$emit('update:password', $event.target.value)"
              />
              <button class="pc-login-submit" type="submit" :disabled="loginLoading">
                {{ loginLoading ? `${t('common.loading')}...` : t('common.login') }}
              </button>
              <button class="pc-register" type="button" @click="$emit('register')">{{ t('common.register') }}</button>
            </form>
          </template>
          <template v-else>
            <div class="pc-account-summary">
              <button class="pc-account-name" type="button" :title="t('menu.userCenter')" @click="$emit('profile')">
                {{ userInfo?.username || t('tabbar.mine') }}
              </button>
              <strong>¥{{ formattedBalance }}</strong>
            </div>
            <button class="pc-deposit" type="button" @click="$emit('deposit')">{{ t('menu.deposit') }}</button>
            <button class="pc-withdraw" type="button" @click="$emit('withdraw')">{{ t('menu.withdraw') }}</button>
          </template>

          <div class="pc-language" @mouseleave="languageOpen = false">
            <button type="button" class="pc-language-trigger" @click="languageOpen = !languageOpen">
              <van-icon name="location-o" size="14" />
              <span>{{ currentLanguageLabel }}</span>
              <van-icon name="arrow-down" size="11" />
            </button>
            <transition name="language-fade">
              <div v-if="languageOpen" class="pc-language-menu">
                <button
                  v-for="language in languageOptions"
                  :key="language.value"
                  type="button"
                  :class="{ active: currentLocale === language.value }"
                  @click="chooseLanguage(language.value)"
                >
                  {{ language.text }}
                </button>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </div>

    <nav class="pc-main-nav" :aria-label="t('game.platformFilter')" @mouseleave="scheduleClose">
      <div class="pc-main-nav-inner">
        <div class="pc-main-nav-side pc-main-nav-left">
          <div
            v-for="item in leftItems"
            :key="item.code"
            class="pc-main-nav-item"
            @mouseenter="openItem(item)"
          >
            <button type="button" :class="{ active: activeCategory === item.code }" @click="selectItem(item)">
              <span>{{ item.label }}</span>
              <van-icon v-if="item.dropdown" name="arrow-down" size="12" />
            </button>
          </div>
        </div>

        <button class="pc-brand" type="button" :title="t('game.hall')" @mouseenter="cancelClose" @click="$emit('home')">
          <img class="pc-brand-icon" :src="brandLogo" :alt="siteName" @error="$emit('image-error', $event)" />
          <img class="pc-brand-wordmark" src="/assets/img/starrex-wordmark.png" alt="StarRex" />
        </button>

        <div class="pc-main-nav-side pc-main-nav-right">
          <div
            v-for="item in rightItems"
            :key="item.code"
            class="pc-main-nav-item"
            @mouseenter="openItem(item)"
          >
            <button type="button" :class="{ active: activeCategory === item.code }" @click="selectItem(item)">
              <span>{{ item.label }}</span>
              <van-icon v-if="item.dropdown" name="arrow-down" size="12" />
            </button>
          </div>
        </div>
      </div>

      <transition name="mega-panel">
        <div
          v-if="submenu"
          class="pc-mega-panel"
          @mouseenter="cancelClose"
          @mouseleave="scheduleClose"
        >
          <button class="pc-mega-arrow is-prev" type="button" :aria-label="t('common.prev')" @click="scrollMega(-1)">
            <van-icon name="arrow-left" size="20" />
          </button>
          <div ref="megaTrackRef" class="pc-mega-track">
            <button
              v-for="entry in submenu.items"
              :key="`${submenu.code}-${entry.value || entry.code}`"
              class="pc-mega-card"
              type="button"
              @click="selectSubmenu(entry)"
            >
              <span class="pc-mega-logo">
                <img v-if="entry.icon" :src="entry.icon" :alt="entry.label" @error="$emit('image-error', $event)" />
                <b v-else>{{ entry.mark || entry.label.slice(0, 2) }}</b>
              </span>
              <span class="pc-mega-name">{{ entry.label }}</span>
              <span class="pc-mega-enter">{{ entry.kind === 'link' ? t('common.view') : t('game.enterGame') }}</span>
            </button>
          </div>
          <button class="pc-mega-arrow is-next" type="button" :aria-label="t('common.next')" @click="scrollMega(1)">
            <van-icon name="arrow" size="20" />
          </button>
        </div>
      </transition>
    </nav>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  loggedIn: { type: Boolean, default: false },
  userInfo: { type: Object, default: () => ({}) },
  username: { type: String, default: '' },
  password: { type: String, default: '' },
  loginLoading: { type: Boolean, default: false },
  languageOptions: { type: Array, default: () => [] },
  currentLocale: { type: String, default: '' },
  currentLanguageLabel: { type: String, default: '' },
  activeCategory: { type: String, default: 'all' },
  leftItems: { type: Array, default: () => [] },
  rightItems: { type: Array, default: () => [] },
  submenu: { type: Object, default: null },
  openMenu: { type: String, default: '' },
  brandLogo: { type: String, required: true },
  siteName: { type: String, default: 'StarRex' }
})

const emit = defineEmits([
  'update:username',
  'update:password',
  'login',
  'register',
  'deposit',
  'withdraw',
  'profile',
  'home',
  'service',
  'task',
  'language-change',
  'menu-open',
  'menu-close',
  'nav-select',
  'submenu-select',
  'image-error'
])

const usernameRef = ref(null)
const languageOpen = ref(false)
const megaTrackRef = ref(null)
const currentTime = ref('')
let clockTimer = null
let closeTimer = null

const formattedBalance = computed(() => {
  const amount = Number(props.userInfo?.balance || 0)
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
})

function updateClock() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  currentTime.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function submitLogin() {
  emit('login')
}

function chooseLanguage(locale) {
  languageOpen.value = false
  emit('language-change', locale)
}

function cancelClose() {
  if (closeTimer) window.clearTimeout(closeTimer)
  closeTimer = null
}

function scheduleClose() {
  cancelClose()
  closeTimer = window.setTimeout(() => emit('menu-close'), 130)
}

function openItem(item) {
  cancelClose()
  if (item.dropdown) emit('menu-open', item.code)
  else emit('menu-close')
}

function selectItem(item) {
  emit('menu-close')
  emit('nav-select', item)
}

function selectSubmenu(item) {
  // 先通知选中再关闭：父组件依赖当前展开的菜单判断所属分类，先关闭会导致点击无效
  emit('submenu-select', item)
  emit('menu-close')
}

function scrollMega(direction) {
  megaTrackRef.value?.scrollBy({ left: direction * 520, behavior: 'smooth' })
}

function focusUsername() {
  usernameRef.value?.focus()
}

defineExpose({ focusUsername })

onMounted(() => {
  updateClock()
  clockTimer = window.setInterval(updateClock, 1000)
})

onBeforeUnmount(() => {
  if (clockTimer) window.clearInterval(clockTimer)
  cancelClose()
})
</script>

<style scoped>
.pc-header {
  position: relative;
  z-index: 70;
  height: 120px;
}

.pc-utility {
  height: 35px;
  color: #544623;
  background: #fbe59c;
}

.pc-utility-inner {
  width: min(1200px, calc(100% - 36px));
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto;
}

.pc-utility-links,
.pc-account-area,
.pc-login {
  display: flex;
  align-items: center;
}

.pc-utility-links {
  gap: 10px;
  font-size: 12px;
  white-space: nowrap;
}

.pc-utility-links button {
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.pc-utility-links i {
  opacity: 0.65;
  font-style: normal;
}

.pc-account-area {
  gap: 12px;
}

.pc-login {
  gap: 12px;
}

.pc-login input {
  width: 130px;
  height: 25px;
  box-sizing: border-box;
  padding: 0 11px;
  border: 1px solid #b69a50;
  border-radius: 5px;
  outline: 0;
  color: #2d2515;
  background: #e6cd7e;
  font-size: 13px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.pc-login input::placeholder {
  color: #766337;
}

.pc-login input:focus {
  border-color: #fff5c9;
  background: #f3dfa0;
  box-shadow: 0 0 0 2px rgba(255, 245, 201, 0.26);
}

.pc-login-submit,
.pc-register,
.pc-deposit,
.pc-withdraw {
  height: 25px;
  min-width: 70px;
  padding: 0 14px;
  border: 0;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.18s ease, transform 0.18s ease;
}

.pc-login-submit {
  background: #171717;
}

.pc-register {
  background: #e11b16;
}

.pc-deposit {
  background: #b98526;
}

.pc-withdraw {
  background: #b98526;
}

.pc-login-submit:hover,
.pc-register:hover,
.pc-deposit:hover,
.pc-withdraw:hover {
  filter: brightness(1.12);
}

.pc-login-submit:active,
.pc-register:active,
.pc-deposit:active,
.pc-withdraw:active {
  transform: translateY(1px);
}

.pc-login-submit:disabled {
  opacity: 0.65;
  cursor: wait;
}

.pc-account-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.pc-account-summary strong {
  color: #7b5710;
}

.pc-account-name {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: color 0.18s ease;
}

.pc-account-name:hover {
  color: #7b5710;
  text-decoration: underline;
}

.pc-language {
  position: relative;
}

.pc-language-trigger {
  height: 30px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  border: 1px solid #3a3a3a;
  border-radius: 5px;
  color: #f4f4f4;
  background: #2b2b2b;
  font-size: 13px;
  cursor: pointer;
}

.pc-language-menu {
  position: absolute;
  top: 33px;
  right: 0;
  z-index: 90;
  width: 145px;
  padding: 5px;
  border: 1px solid #484848;
  border-radius: 5px;
  background: #171717;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
}

.pc-language-menu button {
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 3px;
  color: #ddd;
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.pc-language-menu button:hover,
.pc-language-menu button.active {
  color: #fbe59c;
  background: rgba(251, 229, 156, 0.1);
}

.language-fade-enter-active,
.language-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.language-fade-enter-from,
.language-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.pc-main-nav {
  position: relative;
  height: 85px;
  color: #d7d7d7;
  background: #050505;
  border-bottom: 1px solid #4a391b;
}

.pc-main-nav-inner {
  width: min(1200px, calc(100% - 36px));
  height: 85px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px minmax(0, 1fr);
  align-items: center;
  margin: 0 auto;
}

.pc-main-nav-side {
  height: 85px;
  display: flex;
  align-items: center;
  min-width: 0;
}

.pc-main-nav-left {
  grid-column: 1;
  justify-content: flex-end;
}

.pc-main-nav-right {
  grid-column: 3;
  justify-content: flex-start;
}

.pc-main-nav-item {
  width: 100px;
  height: 85px;
  flex: 0 0 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pc-main-nav-item > button {
  height: 85px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0;
  border: 0;
  color: #d7d7d7;
  background: transparent;
  font-size: 16px;
  font-weight: 400;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.2s ease, text-shadow 0.2s ease;
}

.pc-main-nav-item > button :deep(.van-icon) {
  color: #929292;
  transition: color 0.2s ease, transform 0.22s ease;
}

.pc-main-nav-item:hover > button,
.pc-main-nav-item > button.active {
  color: #fbe59c;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(251, 229, 156, 0.18);
}

.pc-main-nav-item:hover > button :deep(.van-icon),
.pc-main-nav-item > button.active :deep(.van-icon) {
  color: #fbe59c;
  transform: rotate(180deg);
}

.pc-brand {
  width: 190px;
  height: 70px;
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  justify-self: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  transition: filter 0.2s ease, transform 0.2s ease;
}

.pc-brand:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.pc-brand-icon {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.pc-brand-wordmark {
  width: 100px;
  height: 46px;
  object-fit: contain;
  mix-blend-mode: screen;
}

.pc-mega-panel {
  position: absolute;
  top: 85px;
  right: 0;
  left: 0;
  z-index: 80;
  height: 170px;
  display: grid;
  grid-template-columns: 48px minmax(0, 1120px) 48px;
  align-items: center;
  justify-content: center;
  padding: 0 max(12px, calc((100vw - 1248px) / 2));
  border-top: 1px solid rgba(251, 229, 156, 0.12);
  border-bottom: 1px solid #5a4520;
  background: rgba(2, 2, 2, 0.985);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.55);
  transform-origin: top center;
}

.pc-mega-track {
  min-width: 0;
  height: 144px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  box-sizing: border-box;
  padding: 0 8px;
  overflow-x: auto;
  scroll-padding-inline: 8px;
  scrollbar-width: none;
  scroll-behavior: smooth;
}

.pc-mega-track::-webkit-scrollbar {
  display: none;
}

.pc-mega-card {
  width: 106px;
  height: 132px;
  flex: 0 0 106px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0;
  border: 0;
  color: #fff;
  background: transparent;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.pc-mega-logo {
  width: 92px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e9ce74;
  border: 1px solid transparent;
  border-radius: 4px;
  background: #050505;
  font-family: Rajdhani, Arial, sans-serif;
  font-size: 24px;
  font-weight: 700;
  transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;
}

.pc-mega-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pc-mega-name {
  width: 104px;
  overflow: hidden;
  color: #f0f0f0;
  font-size: 13px;
  line-height: 17px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.pc-mega-enter {
  width: 92px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  color: #fff7d8;
  border: 2px solid #f3d773;
  border-radius: 16px;
  font-size: 12px;
  transition: color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.pc-mega-card:hover {
  transform: translateY(-3px);
}

.pc-mega-card:hover .pc-mega-logo {
  border-color: rgba(243, 215, 115, 0.7);
  box-shadow: 0 0 17px rgba(243, 215, 115, 0.38);
  transform: scale(1.035);
}

.pc-mega-card:hover .pc-mega-name {
  color: #fbe59c;
}

.pc-mega-card:hover .pc-mega-enter {
  color: #171104;
  background: #f3d773;
  box-shadow: 0 0 14px rgba(243, 215, 115, 0.3);
}

.pc-mega-arrow {
  width: 44px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  color: #929292;
  background: #1b1b1b;
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.pc-mega-arrow:hover {
  color: #fbe59c;
  background: #272727;
}

.mega-panel-enter-active {
  transition: opacity 0.24s ease-out, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.mega-panel-leave-active {
  transition: opacity 0.17s ease-in, transform 0.17s ease-in;
}

.mega-panel-enter-from,
.mega-panel-leave-to {
  opacity: 0;
  transform: translateY(-10px) scaleY(0.96);
}

@media (max-width: 1180px) {
  .pc-main-nav-inner {
    grid-template-columns: minmax(0, 1fr) 176px minmax(0, 1fr);
  }

  .pc-main-nav-item {
    width: 88px;
    flex-basis: 88px;
  }

  .pc-main-nav-item > button {
    font-size: 14px;
  }

  .pc-brand {
    width: 168px;
  }
}

@media (max-width: 900px) {
  .pc-utility-links {
    display: none;
  }

  .pc-utility-inner {
    justify-content: flex-end;
  }

  .pc-language {
    display: none;
  }

  .pc-main-nav-inner {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    padding: 0 12px;
    overflow-x: auto;
  }

  .pc-main-nav-left,
  .pc-main-nav-right {
    display: contents;
  }

  .pc-brand {
    flex: 0 0 154px;
    order: -1;
  }

  .pc-brand-icon {
    width: 44px;
    height: 44px;
  }

  .pc-brand-wordmark {
    width: 78px;
    height: 36px;
  }

  .pc-mega-panel {
    grid-template-columns: 38px minmax(0, 1fr) 38px;
    padding: 0 8px;
  }

  .pc-mega-arrow {
    width: 34px;
  }
}
</style>
