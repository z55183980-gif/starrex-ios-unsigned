<template>
  <section class="mobile-parity" :aria-label="t('home.platformShowcase')">
    <div class="quick-actions" :aria-label="t('home.quickAccess')">
      <button class="quick-action quick-action-register" type="button" @click="openAuth('register')">
        <span class="quick-action-icon"><img src="/assets/img/pic1.png" alt="" /></span>
        <span class="quick-action-copy"><strong>{{ t('home.freeRegister') }}</strong><small>REGISTRATION</small></span>
        <span class="quick-action-arrow" aria-hidden="true">›</span>
      </button>
      <button class="quick-action quick-action-deposit" type="button" @click="openDeposit">
        <span class="quick-action-icon"><img src="/assets/img/pic2.png" alt="" /></span>
        <span class="quick-action-copy"><strong>{{ t('home.fastDeposit') }}</strong><small>FAST RECHARGE</small></span>
        <span class="quick-action-arrow" aria-hidden="true">›</span>
      </button>
      <button class="quick-action quick-action-promotion" type="button" @click="router.push('/activity')">
        <span class="quick-action-icon"><img src="/assets/img/pic3.png" alt="" /></span>
        <span class="quick-action-copy"><strong>{{ t('home.promotionHall') }}</strong><small>PROMOTION HALL</small></span>
        <span class="quick-action-arrow" aria-hidden="true">›</span>
      </button>
      <button class="quick-action quick-action-app" type="button" @click="router.push('/download')">
        <span class="quick-action-icon"><img src="/assets/img/pic4.png" alt="" /></span>
        <span class="quick-action-copy"><strong>{{ t('home.appDownload') }}</strong><small>APP DOWNLOAD</small></span>
        <span class="quick-action-arrow" aria-hidden="true">›</span>
      </button>
    </div>

    <section class="platform-showcase" aria-labelledby="mobile-platform-title">
      <div class="showcase-heading">
        <span class="heading-line"></span>
        <div><h2 id="mobile-platform-title">{{ t('home.platformShowcase') }}</h2><p>{{ t('home.platformShowcaseSub') }}</p></div>
        <span class="heading-line"></span>
      </div>

      <div class="platform-feature-list">
        <article v-for="platform in featuredPlatforms" :key="platform.code" class="platform-card">
          <button class="platform-art" type="button" :aria-label="`${platform.label} ${t('game.hall')}`" @click="goPlatform(platform.code)">
            <img class="platform-bg" :src="platform.background" alt="" />
            <img class="platform-character" :src="platform.art" alt="" />
            <span class="platform-label">{{ platform.label }}</span>
          </button>
          <div class="platform-body">
            <p>{{ platform.description }}</p>
            <button class="platform-play" type="button" @click="goPlatform(platform.code)">PLAY <van-icon name="play-circle-o" size="19" /></button>
          </div>
        </article>
      </div>

      <div class="platform-small-grid">
        <button v-for="platform in secondaryPlatforms" :key="platform.code" class="platform-small" type="button" :aria-label="platform.label" @click="goPlatform(platform.code)">
          <img :src="platform.background" alt="" />
          <img class="platform-small-character" :src="platform.art" alt="" />
          <span>{{ platform.label }}</span>
        </button>
      </div>
    </section>

    <section class="service-showcase" :aria-label="t('home.qualityService')">
      <div class="showcase-heading compact"><span class="heading-line"></span><div><h2>{{ t('home.qualityService') }}</h2><p>{{ t('home.qualityServiceSub') }}</p></div><span class="heading-line"></span></div>
      <div class="service-grid">
        <div v-for="item in services" :key="item.title" class="service-card" :class="item.theme"><strong>{{ item.title }}</strong><span>{{ item.subtitle }}</span><img :src="item.image" alt="" /></div>
      </div>
    </section>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveAllPlatformsPath } from '@/utils/gameNavigation'
import { isLoggedIn } from '@/utils/auth'

const router = useRouter()
const { t } = useI18n()
const emit = defineEmits(['open-auth', 'open-deposit'])

const featuredPlatforms = computed(() => [
  { code: 'chess', label: t('game.chess'), background: '/assets/img/platform-chess-bg.png', art: '/assets/img/platform-chess-art.png', description: t('home.platformDescription') },
  { code: 'slot', label: t('game.slot'), background: '/assets/img/platform-slot-bg.png', art: '/assets/img/platform-slot-art.png', description: t('home.platformDescription') }
])
const secondaryPlatforms = computed(() => [
  { code: 'fish', label: t('game.fish'), background: '/assets/img/platform-fish-bg.png', art: '/assets/img/platform-fish-art.png' },
  { code: 'lottery', label: t('game.lottery'), background: '/assets/img/platform-lottery-bg.png', art: '/assets/img/platform-lottery-art.png' },
  { code: 'sport', label: t('game.sport'), background: '/assets/img/platform-sport-bg.png', art: '/assets/img/platform-sport-art.png' }
])
const services = computed(() => [
  { title: t('home.services.speed'), subtitle: t('home.services.speedDesc'), image: '/assets/img/pic1.png', theme: 'service-orange' },
  { title: t('home.services.secure'), subtitle: t('home.services.secureDesc'), image: '/assets/img/pic2.png', theme: 'service-purple' },
  { title: t('home.services.freeFee'), subtitle: t('home.services.freeFeeDesc'), image: '/assets/img/pic3.png', theme: 'service-blue' },
  { title: t('home.services.alwaysOn'), subtitle: t('home.services.alwaysOnDesc'), image: '/assets/img/pic4.png', theme: 'service-gold' }
])

const openAuth = (tab) => emit('open-auth', tab)
// 未登录先唤起登录框，避免直接弹出存款弹窗
const openDeposit = () => {
  if (!isLoggedIn()) {
    emit('open-auth', 'login')
    return
  }
  emit('open-deposit')
}
const goPlatform = (code) => router.push(resolveAllPlatformsPath({ code }))
</script>

<style lang="scss" scoped>
.mobile-parity { container-type: inline-size; padding: 0 12px 28px; background: #0d0d0d; color: #f4e3a4; }
.quick-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 14px 0 22px; }
.quick-action { position: relative; min-width: 0; height: 67px; display: flex; align-items: center; gap: 8px; overflow: hidden; padding: 7px 10px 7px 7px; border: 0; border-left: 4px solid #e7c65d; border-radius: 0 22px 22px 0; color: #fbe59c; background: #242424; text-align: left; }
.quick-action::before { position: absolute; inset: 0 auto 0 0; width: 4px; content: ''; background: #fbe59c; }
.quick-action-icon { position: relative; z-index: 1; flex: 0 0 44px; width: 44px; height: 44px; overflow: hidden; border-radius: 50%; }
.quick-action-icon img { width: 100%; height: 100%; display: block; }
.quick-action-copy { position: relative; z-index: 1; min-width: 0; display: flex; flex-direction: column; }
.quick-action-copy strong { overflow: hidden; font-size: 15px; font-weight: 600; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
.quick-action-copy small { margin-top: 2px; color: #898989; font-size: 8px; white-space: nowrap; }
.quick-action-arrow { position: absolute; right: 8px; color: #e9cf77; font-size: 24px; line-height: 1; }
.quick-action-deposit { border-left-color: #3ea8ff; } .quick-action-deposit::before { background: #3ea8ff; }
.quick-action-promotion { border-left-color: #fedb41; } .quick-action-promotion::before { background: #fedb41; }
.quick-action-app { border-left-color: #ff523e; } .quick-action-app::before { background: #ff523e; }
.showcase-heading { display: flex; align-items: center; justify-content: center; gap: 9px; margin: 3px 0 16px; text-align: center; }
.showcase-heading h2 { margin: 0; color: #fbe59c; font-size: 21px; font-weight: 500; white-space: nowrap; }
.showcase-heading p { margin: 3px 0 0; color: #9d8855; font-size: 9px; }
.heading-line { width: 24px; height: 1px; background: linear-gradient(90deg, transparent, #8c7538); } .heading-line:last-child { transform: rotate(180deg); }
.platform-feature-list { display: grid; gap: 13px; }
.platform-card { overflow: hidden; border: 1px solid rgba(232, 203, 112, .16); border-radius: 14px; background: #242424; box-shadow: 0 7px 18px rgba(0,0,0,.27); }
.platform-art { position: relative; display: block; width: 100%; height: 128px; overflow: hidden; padding: 0; border: 0; background: #222; text-align: left; }
.platform-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.platform-character { position: absolute; right: 2%; bottom: 0; max-width: 58%; max-height: 112%; object-fit: contain; }
.platform-label { position: absolute; left: 14px; bottom: 12px; padding: 5px 9px; border-radius: 5px; color: #fff2bd; background: rgba(13,13,13,.64); font-size: 15px; font-weight: 600; }
.platform-body { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 10px 11px 13px; }
.platform-body p { margin: 0; color: #c9c9c9; font-size: 11px; line-height: 1.55; }
.platform-play { flex: 0 0 76px; height: 31px; display: inline-flex; align-items: center; justify-content: center; gap: 3px; padding: 0; border: 1px solid #fbe59c; border-radius: 17px; color: #fbe59c; background: transparent; font-size: 11px; font-weight: 700; }
.platform-small-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
.platform-small { position: relative; height: 86px; overflow: hidden; padding: 0; border: 1px solid rgba(232,203,112,.14); border-radius: 10px; background: #242424; text-align: left; }
.platform-small > img:first-child { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.platform-small-character { position: absolute; right: -4px; bottom: 0; width: 74%; height: 100%; object-fit: contain; object-position: right bottom; }
.platform-small span { position: absolute; left: 7px; bottom: 7px; z-index: 1; color: #fff0af; font-size: 10px; font-weight: 600; text-shadow: 0 1px 3px #000; }
.service-showcase { margin-top: 28px; }
.showcase-heading.compact h2 { font-size: 20px; }
.service-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.service-card { position: relative; height: 69px; overflow: hidden; padding: 12px 8px 7px 12px; box-sizing: border-box; border-radius: 13px; color: #fff; }
.service-card strong, .service-card span { position: relative; z-index: 1; display: block; }.service-card strong { font-size: 15px; line-height: 1.15; }.service-card span { margin-top: 3px; font-size: 9px; opacity: .85; }
.service-card img { position: absolute; right: -3px; bottom: -8px; width: 58px; height: 58px; object-fit: contain; }
.service-orange { background: linear-gradient(115deg, #ff8c5c, #ed3e45); }.service-purple { background: linear-gradient(115deg, #d05ed1, #664ce7); }.service-blue { background: linear-gradient(115deg, #48c8ee, #4282ec); }.service-gold { background: linear-gradient(115deg, #f0a73c, #ee6e35); }
/* 断点必须以模块内容宽度为准。HomeV5 在宽屏浏览器里仍是窄版移动端壳层，
   若使用 viewport media query 会把约 500px 的内容误排成四列并造成裁剪。 */
@container (min-width: 560px) {
  .quick-actions { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .platform-feature-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .platform-body { display: block; min-height: 92px; }
  .platform-play { width: 100%; margin-top: 8px; }
}
</style>
