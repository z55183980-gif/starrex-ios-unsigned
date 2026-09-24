<template>
  <div class="pc-home is-dark">
    <PcHeader
      ref="pcHeaderRef"
      v-model:username="headerLogin.username"
      v-model:password="headerLogin.password"
      :logged-in="loggedIn"
      :user-info="userInfo"
      :login-loading="headerLoginLoading"
      :language-options="languageOptions"
      :current-locale="currentLocale"
      :current-language-label="currentLanguageLabel"
      :active-category="activeCategory"
      :left-items="topNavLeft"
      :right-items="topNavRight"
      :submenu="activeNavSubmenu"
      :open-menu="openNavMenu || ''"
      :brand-logo="brandLogo"
      :site-name="configStore.siteName || 'StarRex'"
      @login="submitHeaderLogin"
      @register="openAuth('register')"
      @deposit="openDeposit"
      @withdraw="openWithdraw"
      @profile="goMember"
      @home="goLobby"
      @service="goService"
      @task="goInvite"
      @language-change="changeLanguage"
      @menu-open="openNavMenu = $event"
      @menu-close="openNavMenu = null"
      @nav-select="handleTopNavClick"
      @submenu-select="selectNavSubmenu"
      @image-error="useFallbackLogo"
    />

    <div class="pc-layout">
      <main ref="mainRef" class="pc-content" :class="{ 'is-source-hall': usesSourceHallPage }">
        <section v-if="showsLegacyLobby || showEmbeddedPanel" id="pc-lobby" class="hero-grid" data-section="lobby">
          <button v-if="activeHero" class="hero-primary" type="button" @click="handleHeroClick">
            <img class="hero-image" :src="activeHero.image" :alt="activeHero.title || ''" />
            <div class="hero-dots" aria-hidden="true">
              <span v-for="(_, index) in heroSlides" :key="index" :class="{ active: index === heroIndex }" />
            </div>
          </button>
          <div v-else class="hero-primary hero-empty" aria-hidden="true" />
        </section>

        <TabActivity v-if="showEmbeddedActivity" :embedded="true" class="pc-embedded-activity" />
        <TabVip v-else-if="showEmbeddedVip" :embedded="true" class="pc-embedded-vip" />

        <div v-if="!showEmbeddedPanel && showsLegacyLobby" class="notice-bar">
          <span class="notice-label"><i aria-hidden="true"></i>{{ t('notice.notice') }}:</span>
          <div
            class="notice-marquee"
            :class="{ 'is-clickable': noticeClickable }"
            :role="noticeClickable ? 'link' : undefined"
            :tabindex="noticeClickable ? 0 : undefined"
            aria-live="polite"
            @click="handleNoticeClick"
            @keydown.enter="handleNoticeClick"
          >
            <span>{{ noticeText }}</span>
          </div>
        </div>

        <section v-if="!showEmbeddedPanel && showsLegacyLobby" class="pc-quick-actions" :aria-label="t('home.quickAccess')">
          <button class="quick-action quick-action-register" type="button" @click="openAuth('register')">
            <span class="quick-action-icon"><img src="/assets/img/pic1.png" alt="" /></span>
            <span><strong>{{ t('home.freeRegister') }}</strong><small>REGISTRATION</small></span>
            <i aria-hidden="true"></i>
          </button>
          <button class="quick-action quick-action-deposit" type="button" @click="openDeposit">
            <span class="quick-action-icon"><img src="/assets/img/pic2.png" alt="" /></span>
            <span><strong>{{ t('home.fastDeposit') }}</strong><small>FAST RECHARGE</small></span>
            <i aria-hidden="true"></i>
          </button>
          <button class="quick-action quick-action-promotion" type="button" @click="router.push({ path: '/pc', query: { view: 'activity' } })">
            <span class="quick-action-icon"><img src="/assets/img/pic3.png" alt="" /></span>
            <span><strong>{{ t('home.promotionHall') }}</strong><small>PROMOTION HALL</small></span>
            <i aria-hidden="true"></i>
          </button>
          <button class="quick-action quick-action-app" type="button" @click="router.push('/download')">
            <span class="quick-action-icon"><img src="/assets/img/pic4.png" alt="" /></span>
            <span><strong>{{ t('home.appDownload') }}</strong><small>APP DOWNLOAD</small></span>
            <i aria-hidden="true"></i>
          </button>
        </section>

        <template v-if="!showEmbeddedPanel && showsLegacyLobby">
          <section v-if="searchTerm" id="pc-search-results" class="game-section search-results">
            <div class="section-heading">
              <div>
                <van-icon name="search" size="21" />
                <h2>{{ t('game.searchResult') }}</h2>
                <span>{{ t('home.gameCount', { count: filteredGames.length }) }}</span>
              </div>
            </div>
            <div v-if="filteredGames.length" class="game-row game-row-wrap">
              <button
                v-for="game in filteredGames"
                :key="`search-${game.id}`"
                class="game-card"
                type="button"
                @click="openGame(game)"
              >
                <div class="game-image"><img :src="game.image" alt="" @error="hideGameImage" /></div>
                <strong>{{ game.name }}</strong>
                <span>{{ game.provider }}</span>
              </button>
            </div>
            <div v-else class="empty-state">{{ t('game.noRelatedGames') }}</div>
          </section>

          <div class="legacy-home">
            <section
              v-for="section in gameSections.filter((item) => item.code === 'hot')"
              :id="`pc-${section.code}`"
              :key="section.code"
              class="game-section"
              :class="{ 'home-hot-section': section.code === 'hot' }"
              :data-section="section.code"
            >
              <div class="section-heading" :class="{ 'hot-heading': section.code === 'hot' }">
                <div>
                  <img :src="section.icon" alt="" />
                  <h2>{{ section.code === 'hot' ? t('game.hotGames') : section.label }}</h2>
                  <span>{{ section.subtitle }}</span>
                </div>
                <button
                  v-if="getFilteredSectionItems(section).length > LOBBY_PREVIEW_LIMIT"
                  class="view-all-button"
                  type="button"
                  @click="toggleSectionExpanded(section.code)"
                >
                  {{ isSectionExpanded(section.code) ? t('common.close') : t('common.view') }}
                  <van-icon :name="isSectionExpanded(section.code) ? 'arrow-up' : 'arrow'" size="14" />
                </button>
              </div>

              <div
                class="provider-tabs"
                v-if="section.code !== 'hot' && section.code !== 'lottery' && section.code !== 'sport' && section.code !== 'live' && getLobbyProviderOptions(section.code).length > 1"
                role="tablist"
                :aria-label="`${section.label} ${t('game.platformFilter')}`"
              >
                <button
                  v-for="provider in getLobbyProviderOptions(section.code)"
                  :key="`${section.code}-${provider.value}`"
                  type="button"
                  role="tab"
                  :aria-label="provider.label"
                  :title="provider.label"
                  :aria-selected="getLobbyProvider(section.code) === provider.value"
                  :class="{ active: getLobbyProvider(section.code) === provider.value }"
                  @click="setLobbyProvider(section.code, provider.value)"
                >
                  <van-icon v-if="provider.value === 'all'" name="apps-o" size="25" />
                  <img v-else-if="provider.icon" :src="provider.icon" alt="" @error="hideGameImage" />
                  <span v-else-if="provider.mark" class="provider-mark">{{ provider.mark }}</span>
                  <span v-if="provider.value === 'all' || (!provider.icon && !provider.mark)">{{ provider.label }}</span>
                </button>
              </div>

              <div class="live-hall-list" v-if="section.code === 'live'">
                <button
                  v-for="game in getVisibleSectionItems(section)"
                  :key="game.id"
                  type="button"
                  class="live-hall-card"
                  :aria-label="resolveLiveHallTitle(game)"
                  @click="openGame(game)"
                >
                  <img
                    :src="resolveLiveHallCover(game)"
                    class="live-hall-cover"
                    alt=""
                    loading="lazy"
                    @error="hideBrokenImg"
                  />
                </button>
              </div>
              <div class="game-row" v-else>
                <button
                  v-for="game in getVisibleSectionItems(section)"
                  :key="game.id"
                  class="game-card"
                  :class="{ 'hot-game-card': section.code === 'hot' }"
                  type="button"
                  @click="openGame(game)"
                >
                  <strong>{{ game.name }}</strong>
                  <div class="game-image" :class="`tone-${game.tone || section.tone}`">
                    <img :src="game.image" alt="" @error="hideGameImage" />
                  </div>
                  <span v-if="section.code !== 'hot'">{{ game.provider }}</span>
                </button>
              </div>
            </section>

            <section class="platform-showcase" aria-labelledby="platform-showcase-title">
              <div class="platform-showcase-heading">
                <h2 id="platform-showcase-title">{{ t('home.platformShowcase') }}</h2>
                <p>{{ t('home.platformShowcaseSub') }}</p>
              </div>

              <div class="platform-feature-grid">
                <article v-for="platform in featuredPlatforms" :key="platform.code" class="platform-feature-card">
                  <button class="platform-feature-art" type="button" :aria-label="`${platform.label} ${t('game.hall')}`" @click="selectCategory(platform.code)">
                    <img class="platform-feature-bg" :src="platform.background" alt="" />
                    <img class="platform-feature-character" :src="platform.art" alt="" />
                  </button>
                  <div class="platform-feature-body">
                    <p>{{ platform.description }}</p>
                    <button class="platform-play-button" type="button" @click="selectCategory(platform.code)">
                      PLAY <van-icon name="play-circle-o" size="24" />
                    </button>
                  </div>
                </article>
              </div>

              <div class="platform-small-grid">
                <button v-for="platform in secondaryPlatforms" :key="platform.code" class="platform-small-card" type="button" @click="selectCategory(platform.code)">
                  <img class="platform-small-bg" :src="platform.background" alt="" />
                  <img class="platform-small-character" :src="platform.art" alt="" />
                </button>
              </div>
            </section>
          </div>
        </template>

        <section
          v-else-if="!showEmbeddedPanel"
          id="pc-game-catalog"
          class="game-catalog"
          :class="{
            'source-game-hall': usesSourceGameHall,
            [`source-hall-${activeCategory}`]: usesSourceGameHall,
            'source-live-hall-page': activeCategory === 'live',
            'source-sport-hall-page': activeCategory === 'sport',
            'source-esport-hall-page': activeCategory === 'esport'
          }"
          :style="sourceHallStyle"
          :aria-label="currentCategory.label"
        >
          <div v-if="activeCategory === 'sport'" class="source-sport-hall">
            <img class="source-sport-hero" src="/assets/img/source-hall/sport-hero.png" alt="" />
            <div class="source-sport-copy">
              <div class="source-sport-brand" role="img" aria-label="StarRex">
                <img class="source-sport-brand-lockup" src="/assets/img/starrex-logo-horizontal.png" alt="" />
              </div>
              <p>{{ t('home.sportIntro') }}</p>
              <div class="source-sport-balls" aria-hidden="true">
                <img v-for="index in 5" :key="index" :src="`/assets/img/source-hall/sport-ball-${index}.png`" alt="" />
              </div>
              <div class="source-sport-platforms">
                <button v-for="game in sourceSportGames" :key="game.id" type="button" @click="openGame(game)">
                  {{ game.name }}
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="activeCategory === 'esport'" class="source-esport-hall">
            <div class="source-esport-copy">
              <div v-if="sourceEsportGames.length" class="source-esport-platforms" :aria-label="t('game.esportPlatform')">
                <button v-for="game in sourceEsportGames" :key="game.id" type="button" @click="openGame(game)">
                  <img :src="game.image" :alt="game.name" @error="hideGameImage" />
                  <span>{{ game.name }}</span>
                </button>
              </div>
              <p>{{ t('home.esportIntro') }}</p>
              <img class="source-esport-games" src="/assets/img/source-hall/esport-games.png" alt="" />
            </div>
            <img class="source-esport-hero" src="/assets/img/source-hall/esport-hero.png" alt="" />
          </div>

          <div v-else-if="activeCategory === 'live'" class="source-live-hall">
            <div class="source-live-stage">
              <div class="source-live-person">
                <img :src="activeLiveArtwork.person" alt="" />
              </div>
              <div class="source-live-copy">
                <h1 :class="activeLiveNameSizeClass">{{ activeLiveName }}</h1>
                <p>{{ t('home.liveIntro') }}</p>
                <button type="button" @click="activeLiveGame && openGame(activeLiveGame)">{{ t('game.enterGame') }}</button>
                <div class="source-live-categories" aria-hidden="true">
                  <img src="/assets/img/source-hall/live-categories.png" alt="" />
                </div>
              </div>
            </div>
            <div v-if="sourceLiveGames.length" class="source-live-tabs" role="tablist" :aria-label="t('game.livePlatform')">
              <button
                v-for="(game, index) in sourceLiveGames"
                :key="`${game.platform}-${game.id}`"
                type="button"
                role="tab"
                :aria-selected="sourceLiveIndex === index"
                :class="{ active: sourceLiveIndex === index }"
                @click="sourceLiveIndex = index"
              >
                {{ resolveSourceLiveName(game) }}
              </button>
            </div>
          </div>

          <div v-else-if="usesSourceGameHall" class="source-hall-panel">
            <div
              v-if="['slot', 'chess'].includes(activeCategory) && providerOptions.length > 1"
              class="source-provider-tabs"
              :class="{ 'is-logo-bar': activeCategory === 'chess' }"
              role="tablist"
              :aria-label="t('game.platformFilter')"
            >
              <button
                v-for="provider in providerOptions"
                :key="provider.value"
                type="button"
                role="tab"
                :title="provider.label"
                :aria-selected="activeProvider === provider.value"
                :class="{ active: activeProvider === provider.value }"
                @click="selectProvider(provider.value)"
              >
                <span v-if="provider.value === 'all'" class="source-provider-all">{{ t('common.all') }}</span>
                <img v-else-if="provider.icon" :src="provider.icon" alt="" @error="hideGameImage" />
                <span v-else-if="provider.mark" class="provider-mark">{{ provider.mark }}</span>
                <span class="source-provider-name">{{ provider.label }}</span>
              </button>
            </div>

            <div class="source-catalog-toolbar">
              <div class="source-catalog-tabs" role="tablist" :aria-label="t('game.gameFilter')">
                <button
                  v-for="mode in catalogModes"
                  :key="mode.value"
                  type="button"
                  role="tab"
                  :aria-selected="catalogMode === mode.value"
                  :class="{ active: catalogMode === mode.value }"
                  @click="selectCatalogMode(mode.value)"
                >
                  {{ mode.label }}
                </button>
              </div>
              <label class="source-search-box">
                <input v-model.trim="searchTerm" type="search" :placeholder="t('game.searchGame')" />
                <span aria-hidden="true"></span>
              </label>
            </div>

            <div v-if="catalogLoading || catalogModeLoading" class="source-catalog-loading">
              <van-loading color="#fbe59c" size="28" />
              <span>{{ t('game.gameLoading') }}</span>
            </div>
            <div v-else-if="activeCategory === 'lottery' && sourceLotteryGames.length" class="source-lottery-games">
              <article
                v-for="game in sourceLotteryGames"
                :key="`lottery-${game.id}`"
                class="source-lottery-card"
                role="button"
                tabindex="0"
                @click="openGame(game)"
                @keydown.enter="openGame(game)"
              >
                <div class="source-lottery-card-art">
                  <img :src="game.image" :alt="game.name" loading="lazy" @error="hideGameImage" />
                </div>
                <div class="source-lottery-card-name">
                  <span>{{ game.name }}</span>
                  <button
                    type="button"
                    :class="{ active: isCatalogFavorite(game) }"
                    :aria-label="isCatalogFavorite(game) ? t('game.unfavorite') : t('game.favorite')"
                    @click.stop="toggleCatalogFavorite(game)"
                  ></button>
                </div>
              </article>
            </div>
            <div v-else-if="visibleCatalogGames.length" class="source-game-grid">
              <article
                v-for="game in visibleCatalogGames"
                :key="`${game.providerCode || game.provider}-${game.id}`"
                class="source-game-card"
                role="button"
                tabindex="0"
                @click="openGame(game)"
                @keydown.enter="openGame(game)"
              >
                <div class="source-game-art" :class="{ 'is-fallback': game.isFallback }">
                  <img :src="game.image" :alt="game.name" loading="lazy" @error="hideGameImage" />
                  <span class="source-game-enter"><img src="/assets/img/source-hall/enter-game.png" alt="" />{{ t('game.enterGame') }}</span>
                </div>
                <div class="source-game-name">
                  <span>{{ game.name }}</span>
                  <button
                    type="button"
                    :class="{ active: isCatalogFavorite(game) }"
                    :aria-label="isCatalogFavorite(game) ? t('game.unfavorite') : t('game.favorite')"
                    @click.stop="toggleCatalogFavorite(game)"
                  ></button>
                </div>
              </article>
            </div>
            <div v-else class="source-empty-state">{{ t('game.noRelatedGames') }}</div>
          </div>

          <template v-else>
            <div class="catalog-breadcrumb" :aria-label="t('game.hall')">
              <span>{{ t('game.hall') }}</span>
              <van-icon name="arrow" size="13" />
              <strong>{{ currentCategory.label }}</strong>
            </div>

            <div class="provider-tabs" v-if="activeCategory !== 'lottery' && activeCategory !== 'sport' && activeCategory !== 'live' && providerOptions.length > 1" role="tablist" :aria-label="t('game.platformFilter')">
              <button
                v-for="provider in providerOptions"
                :key="provider.value"
                type="button"
                role="tab"
                :aria-label="provider.label"
                :title="provider.label"
                :aria-selected="activeProvider === provider.value"
                :class="{ active: activeProvider === provider.value }"
                @click="selectProvider(provider.value)"
              >
                <van-icon v-if="provider.value === 'all'" name="apps-o" size="25" />
                <img v-else-if="provider.icon" :src="provider.icon" alt="" @error="hideGameImage" />
                <span v-else-if="provider.mark" class="provider-mark">{{ provider.mark }}</span>
                <span v-if="provider.value === 'all' || (!provider.icon && !provider.mark)">{{ provider.label }}</span>
              </button>
            </div>

            <div class="catalog-heading" v-if="activeCategory !== 'live'">
              <div class="catalog-title">
                <img :src="currentCategory.icon" alt="" />
                <div>
                  <h2>{{ currentCatalogTitle }}</h2>
                  <span>{{ t('home.gameCount', { count: visibleCatalogGames.length }) }}</span>
                </div>
              </div>
            </div>

            <div v-if="catalogLoading" class="catalog-loading">
              <van-loading color="#159f86" size="28" />
              <span>{{ t('game.gameLoading') }}</span>
            </div>
            <div v-else-if="activeCategory === 'live' && visibleCatalogGames.length" class="live-hall-list">
              <button
                v-for="game in visibleCatalogGames"
                :key="game.id"
                type="button"
                class="live-hall-card"
                :aria-label="resolveLiveHallTitle(game)"
                @click="openGame(game)"
              >
                <img
                  :src="resolveLiveHallCover(game)"
                  class="live-hall-cover"
                  alt=""
                  loading="lazy"
                  @error="hideBrokenImg"
                />
              </button>
            </div>
            <div v-else-if="visibleCatalogGames.length" class="game-row game-row-wrap">
              <button v-for="game in visibleCatalogGames" :key="game.id" class="game-card" type="button" @click="openGame(game)">
                <div
                  class="game-image"
                  :class="[`tone-${game.tone || currentCategory.tone}`, { 'is-fallback': game.isFallback }]"
                >
                  <img :src="game.image" alt="" @error="hideGameImage" />
                  <span v-if="game.badge" class="game-badge">{{ game.badge }}</span>
                </div>
                <strong>{{ game.name }}</strong>
                <span>{{ game.provider }}</span>
              </button>
            </div>
            <div v-else class="empty-state">{{ t('game.noRelatedGames') }}</div>
          </template>
        </section>

        <footer class="pc-footer">
          <div class="footer-partners" :aria-label="t('game.platform')">
            <img src="https://tya.5618861.cc/static/media/index_130.0f2f09c8.png" :alt="t('game.platform')" />
          </div>
          <div class="footer-brand">
            <img class="footer-brand-icon" src="/assets/img/starrex-icon.png" alt="StarRex" />
            <span class="footer-brand-wordmark" aria-label="StarRex"><strong>StarRex</strong></span>
          </div>
          <p class="footer-cookie">{{ t('home.cookieNotice') }}</p>
          <div class="footer-links">
            <button type="button" @click="router.push('/about')">{{ t('menu.aboutUs') }}</button>
          </div>
          <p class="copyright">©2006-2031 {{ configStore.siteName || 'StarRex' }} {{ t('home.copyright') }}</p>
        </footer>
      </main>
    </div>

    <button class="floating-service" type="button" :title="t('common.service')" @click="goService">
      <van-icon name="service-o" size="25" />
      <span>{{ t('common.service') }}</span>
    </button>

    <!-- PC 页眉保留快捷登录；需登录功能使用目标站点风格弹窗。 -->
    <V5AuthModal v-if="showAuthModal" v-model="showAuthModal" :initial-tab="authTab" layout="desktop" @success="refreshUserState" />
    <TargetLoginModal
      v-model="showTargetLoginModal"
      @success="handleTargetLoginSuccess"
      @register="openAuth('register')"
    />
    <LoginNoticeDialog
      v-model="showLoginNotice"
      :message="loginNoticeMessage"
      :close-label="t('common.close')"
    />
    <ActivityPopup v-model:show="showActivityPopup" />
    <DepositPopup v-model:show="showDepositPopup" theme="pc" />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast } from 'vant'
import { useConfigStore } from '@/stores/config'
import { homeApi } from '@/api/home'
import { gameApi } from '@/api/game'
import { authApi } from '@/api/auth'
import { getUserInfo, handleLoginSuccess, isLoggedIn } from '@/utils/auth'
import { resetAuthState } from '@/api/request'
import { heartbeatService } from '@/utils/heartbeat'
import { getCookie, setCookie } from '@/utils/cookie'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import { getThemeLogo } from '@/constants/branding'
import { SLOT_PROVIDER_CATEGORIES } from '@/constants/slotProviders'
import { loadSlotProviderStats, hasSlotProviderGames } from '@/utils/slotProviderStats'
import { createProviderMark, normalizeProviderLabel } from '@/utils/platformPresentation'
import { resolveAllPlatformsPath, resolvePlatformNavigation, resolveGamePlayLocation } from '@/utils/gameNavigation'
import { resolveLiveHallCover, resolveLiveHallTitle } from '@/utils/liveHallCovers'
import { hideBrokenImg } from '@/utils/staticAssets'
import { getLocale, getLocaleOptions, setLocale } from '@/locales'
import V5AuthModal from '@/views/home/components-v5/V5AuthModal.vue'
import TargetLoginModal from '@/components/auth/TargetLoginModal.vue'
import LoginNoticeDialog from '@/components/auth/LoginNoticeDialog.vue'
import ActivityPopup from '@/components/home/ActivityPopup.vue'
import DepositPopup from '@/components/deposit/DepositPopup.vue'
import { openOnlineCustomerService, resumeCustomerServiceAfterLogin } from '@/utils/customerService'
import { checkFundPasswordAndNavigate } from '@/utils/withdrawCheck'
import PcHeader from './components/PcHeader.vue'
import TabActivity from '@/views/activity/components/TabActivity.vue'
import TabVip from '@/views/activity/components/TabVip.vue'

defineOptions({ name: 'PcHome' })

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const configStore = useConfigStore()
const mainRef = ref(null)
const openNavMenu = ref(null)
const searchTerm = ref('')
const showAuthModal = ref(false)
const showTargetLoginModal = ref(false)
const showDepositPopup = ref(false)
const showActivityPopup = ref(false)
const showEmbeddedActivity = computed(() => route.query.view === 'activity')
const showEmbeddedVip = computed(() => route.query.view === 'vip')
const showEmbeddedPanel = computed(() => showEmbeddedActivity.value || showEmbeddedVip.value)
const authTab = ref('login')
const loggedIn = ref(isLoggedIn())
const userInfo = ref(getUserInfo() || {})
const pcHeaderRef = ref(null)
const headerLogin = ref({ username: getCookie('account') || '', password: '' })
const headerLoginLoading = ref(false)
const showLoginNotice = ref(false)
const loginNoticeMessage = ref('')
const currentLocale = ref(getLocale())
const activeCategory = ref('all')
const activeProvider = ref('all')
const lobbyProviderMap = reactive({})
const heroIndex = ref(0)
const noticeText = ref('')
/** 加载到公告后滚动条可点击，进入消息中心公告列表 */
const noticeClickable = ref(false)
const expandedSectionCodes = ref(new Set())
let heroTimer = null
let activityPopupTimer = null

const LOBBY_PREVIEW_LIMIT = 12
const fallbackLogo = '/assets/img/icon_sys_menu_service.svg'
const brandLogo = getThemeLogo()
const configuredGameCategories = ref([])

const categoryMeta = computed(() => [
  ...(configuredGameCategories.value.length
    ? configuredGameCategories.value
    : [
        { code: 'lobby', name: t('game.hall'), icon: '/assets/img/icon_dtfl_rm_1.avif' },
        { code: 'hot', name: t('game.hotGames'), icon: '/assets/img/icon_dtfl_rm_1.avif' },
        { code: 'live', name: t('game.live'), icon: '/assets/img/icon_dtfl_zr_1.avif' },
        { code: 'sport', name: t('game.sport'), icon: '/assets/img/icon_dtfl_ty_1.avif' },
        { code: 'lottery', name: t('game.lottery'), icon: '/assets/img/icon_dtfl_cp_1.avif' },
        { code: 'chess', name: t('game.chess'), icon: '/assets/img/icon_dtfl_qp_1.avif' },
        { code: 'slot', name: t('game.slot'), icon: '/assets/img/icon_dtfl_dz_1.avif' },
        { code: 'fish', name: t('game.fish'), icon: '/assets/img/icon_dtfl_by_1.avif' },
        { code: 'esport', name: t('game.esport'), icon: '/assets/img/icon_dtfl_dj_1.avif' },
        { code: 'blockchain', name: t('game.blockchain'), icon: '/assets/img/icon_dtfl_qkl_1.avif' },
        { code: 'mini', name: t('game.mini'), icon: '/assets/img/icon_dtfl_dz_1.avif' },
        { code: 'special', name: t('game.special'), icon: '/assets/img/icon_dtfl_dz_1.avif' }
      ]
  ).map((item) => {
    const fallback = {
      lobby: { label: t('game.hall'), icon: '/assets/img/icon_dtfl_rm_1.avif' },
      hot: { label: t('game.hotGames'), icon: '/assets/img/icon_dtfl_rm_1.avif' },
      live: { label: t('game.live'), icon: '/assets/img/icon_dtfl_zr_1.avif' },
      sport: { label: t('game.sport'), icon: '/assets/img/icon_dtfl_ty_1.avif' },
      lottery: { label: t('game.lottery'), icon: '/assets/img/icon_dtfl_cp_1.avif' },
      chess: { label: t('game.chess'), icon: '/assets/img/icon_dtfl_qp_1.avif' },
      slot: { label: t('game.slot'), icon: '/assets/img/icon_dtfl_dz_1.avif' },
      fish: { label: t('game.fish'), icon: '/assets/img/icon_dtfl_by_1.avif' },
      esport: { label: t('game.esport'), icon: '/assets/img/icon_dtfl_dj_1.avif' },
      blockchain: { label: t('game.blockchain'), icon: '/assets/img/icon_dtfl_qkl_1.avif' },
      mini: { label: t('game.mini'), icon: '/assets/img/icon_dtfl_dz_1.avif' },
      special: { label: t('game.special'), icon: '/assets/img/icon_dtfl_dz_1.avif' }
    }[item.code] || {}
    return {
      ...item,
      label: item.name || item.label || fallback.label || item.code,
      icon: fallback.icon || item.icon || '/assets/img/icon_dtfl_zh_0.svg'
    }
  })
])

const categoryByCode = (code) => {
  const item = categoryMeta.value.find((category) => category.code === code)
  return item ? { code: item.code, label: item.label, dropdown: ['slot', 'live', 'fish', 'chess', 'lottery', 'sport', 'esport'].includes(item.code) } : null
}

const topNavGameItems = computed(() =>
  categoryMeta.value
    .filter((item) => item.code !== 'lobby' && item.code !== 'hot')
    .map((item) => ({
      code: item.code,
      label: item.label,
      dropdown: ['slot', 'live', 'fish', 'chess', 'lottery', 'sport', 'esport'].includes(item.code)
    }))
)

// Keep the configured order while placing the logo between the two sides.
const topNavLeft = computed(() => {
  const leftCodes = new Set(categoryMeta.value.filter((item) => item.code !== 'lobby').slice(0, 5).map((item) => item.code))
  return topNavGameItems.value.filter((item) => leftCodes.has(item.code))
})

const topNavRight = computed(() => [
  ...topNavGameItems.value.filter((item) => !topNavLeft.value.some((leftItem) => leftItem.code === item.code)),
  { code: 'vip', label: t('vip.vipPrivilege'), dropdown: true, action: goVip },
  // 推广赚钱不展开子菜单，点击直达分享赚钱页（未登录时打开登录框）
  { code: 'promotion', label: t('menu.shareEarn'), dropdown: false, action: goInvite },
  { code: 'activity', label: t('menu.activity'), dropdown: false, action: () => router.push({ path: '/pc', query: { view: 'activity' } }) }
].filter(Boolean))

const navSubmenuFallbacks = computed(() => ({
  slot: [
    { value: 'PG', label: 'PG', mark: 'PG', icon: '/assets/img/platform/pg.png' },
    { value: 'YOPLAY', label: 'YOPLAY', mark: 'YO' },
    { value: 'MG', label: 'MG', mark: 'MG', icon: '/assets/img/platform/MG.png' },
    { value: 'YGG', label: 'YGG', mark: 'YG' },
    { value: 'PP', label: 'PP', mark: 'PP', icon: '/assets/img/platform/pp.png' }
  ],
  live: [
    { value: 'all', label: `${t('common.all')} ${t('game.live')}`, mark: 'LIVE' },
    { value: 'AG', label: 'AG', mark: 'AG' },
    { value: 'BBIN', label: 'BBIN', mark: 'BB', icon: '/assets/img/platform/bbin.png' },
    { value: 'WM', label: 'WM', mark: 'WM' }
  ],
  fish: [
    { value: 'all', label: `${t('common.all')} ${t('game.fish')}`, mark: 'FISH' },
    { value: 'JDB', label: 'JDB', mark: 'JDB', icon: '/assets/img/platform/JDB.png' },
    { value: 'JILI', label: 'JILI', mark: 'JILI', icon: '/assets/img/platform/JILI.png' }
  ],
  chess: [
    { value: 'all', label: `${t('common.all')} ${t('game.chess')}`, mark: 'ALL' },
    { value: 'KY', label: 'KY', mark: 'KY' },
    { value: 'LEG', label: 'LEG', mark: 'LEG' }
  ],
  lottery: [
    { value: 'all', label: `${t('common.all')} ${t('game.lottery')}`, mark: 'ALL' }
  ],
  sport: [
    { value: 'all', label: `${t('common.all')} ${t('game.sport')}`, mark: 'SPORT' }
  ],
  esport: [
    { value: 'all', label: `${t('common.all')} ${t('game.esport')}`, mark: 'ESPORT' }
  ],
  // 与奖励中心顶部标签（ActivityIndexNew topTabs）保持一致
  vip: [
    { value: 'activity', label: t('menu.activity'), mark: 'ACT', kind: 'link', path: '/activity' },
    { value: 'vip', label: 'VIP', mark: 'VIP', kind: 'link', path: '/vip' },
    { value: 'cashback', label: t('menu.cashback'), mark: 'CB', kind: 'link', path: '/cashback' },
    { value: 'pending', label: t('menu.pending'), mark: 'P', kind: 'link', path: '/pending' },
    { value: 'interest', label: t('menu.interest'), mark: 'INT', kind: 'link', path: '/interest' },
    { value: 'reward-record', label: t('menu.rewardRecord'), mark: 'R', kind: 'link', path: '/reward-record' }
  ],
  more: [
    { value: 'blockchain', label: t('game.blockchain'), mark: 'BC' },
    { value: 'mini', label: t('game.mini'), mark: 'MINI' },
    { value: 'special', label: t('game.special'), mark: 'NEW' }
  ]
}))

const activeNavSubmenu = computed(() => {
  if (!openNavMenu.value) return null
  const code = openNavMenu.value
  const category = categoryMeta.value.find((item) => item.code === code)
  const section = gameSections.value.find((item) => item.code === code)
  const platforms = section?.platforms?.length ? section.platforms : []
  const items = platforms.length
    ? platforms.slice(0, 12).map((platform) => ({
      ...platform,
      kind: 'provider',
      label: normalizeProviderLabel(platform.name, platform.code),
      mark: platform.mark || createProviderMark(platform.code, platform.name)
    }))
    : (navSubmenuFallbacks.value[code] || []).map((item) => ({ ...item, kind: item.kind || 'provider' }))
  if (!items.length && category) return { code, label: category.label, items: [{ value: 'all', label: category.label, mark: category.label.slice(0, 2), kind: 'category' }] }
  return { code, label: category?.label || t('game.moreGames'), items }
})

// 轮播图由后台 yzz_banner 管理。接口不可用或暂无启用数据时不再渲染写死图片。
const fallbackHeroSlides = []
const heroSlides = ref(fallbackHeroSlides)

const activeHero = computed(() => heroSlides.value[heroIndex.value] || null)

const sectionConfig = computed(() => [
  ['hot', t('game.hotGames'), '', 'red'], ['slot', t('game.slot'), '', 'red'],
  ['live', t('game.live'), '', 'teal'], ['fish', t('game.fish'), '', 'blue'],
  ['chess', t('game.chess'), '', 'violet'], ['lottery', t('game.lottery'), '', 'gold'],
  ['blockchain', t('game.blockchain'), '', 'teal']
])

const featuredPlatforms = computed(() => [
  {
    code: 'chess',
    label: t('game.chess'),
    en: 'CHESS GAME',
    background: '/assets/img/platform-chess-bg.png',
    art: '/assets/img/platform-chess-art.png',
    description: t('home.platformDescription')
  },
  {
    code: 'slot',
    label: t('game.slot'),
    en: 'SLOT GAMES',
    background: '/assets/img/platform-slot-bg.png',
    art: '/assets/img/platform-slot-art.png',
    description: t('home.platformDescription')
  }
])

const secondaryPlatforms = computed(() => [
  { code: 'fish', label: t('game.fish'), en: 'FISHING', background: '/assets/img/platform-fish-bg.png', art: '/assets/img/platform-fish-art.png' },
  { code: 'lottery', label: t('game.lottery'), en: 'LOTTERY', background: '/assets/img/platform-lottery-bg.png', art: '/assets/img/platform-lottery-art.png' },
  { code: 'sport', label: t('game.sport'), en: 'SPORTS', background: '/assets/img/platform-sport-bg.png', art: '/assets/img/platform-sport-art.png' }
])

const fallbackHotGames = [
  { gameId: '830', platform: 'KY', image: 'https://d1r7hkze6j5e5j.cloudfront.net/youxilogo/ky-qznn.png' },
  { gameId: '220', platform: 'JILI', image: 'https://d1r7hkze6j5e5j.cloudfront.net/youxilogo/pg-mjhl.png' },
  { gameId: '920', platform: 'VGQP', image: 'https://d1r7hkze6j5e5j.cloudfront.net/youxilogo/gonn.png' },
  { gameId: '221', platform: 'JILI', image: 'https://d1r7hkze6j5e5j.cloudfront.net/youxilogo/pg-mjhl2.png' },
  { gameId: '230', platform: 'LGQP', image: 'https://d1r7hkze6j5e5j.cloudfront.net/youxilogo/gozjh.png' },
  { gameId: '610', platform: 'LCQP', image: 'https://d1r7hkze6j5e5j.cloudfront.net/youxilogo/GODZ.png' },
  { gameId: '510', platform: 'CHOICE', image: 'https://j-raw.img2fi9oos2oksx.com:9663/test4/20260520/GAMEIMAGE/3/AG/1779256228237.png' },
  { gameId: '700', platform: 'JILI', image: 'https://d1r7hkze6j5e5j.cloudfront.net/youxilogo/jdb-csby.png' },
  { gameId: '710', platform: 'KY', image: 'https://d1r7hkze6j5e5j.cloudfront.net/youxilogo/ky-21d.png' },
  { gameId: '810', platform: 'IM', image: 'https://d1r7hkze6j5e5j.cloudfront.net/youxilogo/im-ty.png' },
  { gameId: '711', platform: 'KY', image: 'https://d1r7hkze6j5e5j.cloudfront.net/youxilogo/ky-bjl.png' },
  { gameId: '701', platform: 'JILI', image: 'https://dimc2jm786424.cloudfront.net/3-gg/FG-ttby.png' }
]

// 仅用于开发环境的首页样式预览数据，不写入数据库，也不会进入生产构建。
const previewHotGames = [
  ['Fire Carnival', 'AFBG', 'afbg/zh/319.webp'],
  ['Lucky Fruits', 'AFBG', 'afbg/zh/320.webp'],
  ['Gold Miner', 'AFBG', 'afbg/zh/321.webp'],
  ['Gem Blast', 'AFBG', 'afbg/zh/322.webp'],
  ['Super Fruit King', 'AFBG', 'afbg/zh/323.webp'],
  ['Hot Mania', 'EPK', 'epk/zh/hot_mania.webp'],
  ['Hot Volcano', 'EPK', 'epk/zh/hot_volcano.webp'],
  ['Food Battle', 'EG', 'eg/zh/dimsumhottie.webp'],
  ['Chilli Heat', 'MG', 'mg/zh/smg_chillipepehotstacks.webp'],
  ['Super Chilli', 'BNG', 'bngk/zh/super_hot_chilli.webp'],
  ['Hotpot Feast', 'LGDK', 'lgdk/zh/hotpotfeast.webp'],
  ['Hot Aces', 'RUBY', 'rubyk/zh/jmaniahotasses.webp'],
  ['Hot Summer', 'HBK', 'hbk/zh/SGHotHotSummer.webp'],
  ['Tropical Colors', 'HB', 'hb/zh/sghothotsummer.webp'],
  ['Hot KTV', 'RT', 'rt/zh/hotktv.webp'],
  ['Hot Coins', 'PTK', 'ptk/zh/hot_coins.webp'],
  ['Super Shot', 'KA', 'ka/zh/supershot.webp'],
  ['Hot Muchacho', 'POPOK', 'popok/zh/hotMuchacho.webp'],
  ['Fire Hot', 'PP', 'pp/zh/vs100firehot.webp'],
  ['Hot Joker', 'PPK', 'ppk/zh/vs10jokerhot.webp']
].map(([name, platform, asset], index) => ({
  name,
  gameId: `preview-${index + 1}`,
  platform,
  image: `/assets/img/preview-games/game-${String(index + 1).padStart(2, '0')}.webp`
}))

const usePreviewHotGames = import.meta.env.DEV

const localizedFallbackHotGames = computed(() => fallbackHotGames.map((game, index) => ({
  ...game,
  name: t('game.gameNumber', { number: index + 1 })
})))

const createFallbackSections = () =>
  sectionConfig.value.map(([code, label, subtitle, tone]) => ({
    code,
    label,
    subtitle,
    tone,
    icon: categoryMeta.value.find((item) => item.code === code)?.icon || categoryMeta.value[1].icon,
    path: resolveAllPlatformsPath({ code }),
    items: code === 'hot' ? (usePreviewHotGames ? previewHotGames : localizedFallbackHotGames.value).map((item, index) => normalizeApiGame(item, {
      code,
      label,
      path: resolveAllPlatformsPath({ code }, { pc: true }),
      tone,
      icon: categoryMeta.value.find((category) => category.code === code)?.icon || categoryMeta.value[1].icon
    }, index)) : []
  }))

const gameSections = ref(createFallbackSections())
const catalogGames = ref([])
const catalogPlatforms = ref([])
const catalogLoading = ref(false)
const catalogMode = ref('all')
const catalogModeGames = ref([])
const catalogModeLoading = ref(false)
const sportCatalogGames = ref([])
const catalogFavoriteKeys = ref(new Set())
const sourceLiveIndex = ref(0)
const catalogGameCache = new Map()
const catalogPlatformCache = new Map()
let catalogRequestId = 0

const lotteryCardImages = [
  '/assets/img/lottery/sgwin-reference.webp',
  '/assets/img/lottery/vr-reference.webp'
]

const sourceLotteryGames = computed(() => visibleCatalogGames.value.slice(0, 2).map((game, index) => ({
  ...game,
  name: `${index === 0 ? 'SGWIN' : 'VR'} ${t('game.hall')}`,
  image: lotteryCardImages[index] || game.image
})))

const catalogModes = computed(() => [
  { value: 'all', label: t('game.allGames') },
  { value: 'hot', label: t('game.hotGames') },
  { value: 'favorite', label: t('game.favoriteGames') }
])
const sourceHallBackgrounds = {
  slot: '/assets/img/source-hall/hall-slot.png',
  fish: '/assets/img/source-hall/hall-fish.png',
  chess: '/assets/img/source-hall/hall-chess.png',
  lottery: '/assets/img/source-hall/hall-lottery.png'
}
const sourceLiveArtworks = [
  {
    key: 'choice',
    platformCodes: ['AG', 'CHOICE'],
    person: '/assets/img/source-hall/live-choice-person.png'
  },
  {
    key: 'db',
    platformCodes: ['WL', 'OBG', 'IGZR', 'DB'],
    person: '/assets/img/source-hall/live-db-person.png'
  },
  {
    key: 'bg',
    platformCodes: ['BGCTRL', 'BGZR', 'BG'],
    person: '/assets/img/source-hall/live-bg-person.png'
  },
  {
    key: 'bbin',
    platformCodes: ['BBIN'],
    person: '/assets/img/source-hall/live-bbin-person.png'
  }
]

const LIVE_PLATFORM_ALIASES = {
  DB: 'WL',
  DBR: 'WL',
  OBG: 'WL',
  IGZR: 'WL'
}

const normalizeLivePlatformCode = (value) => {
  const code = String(value || '').trim().toUpperCase()
  return LIVE_PLATFORM_ALIASES[code] || code
}

const languageOptions = computed(() => getLocaleOptions())
const currentLanguageLabel = computed(
  () => languageOptions.value.find((item) => item.value === currentLocale.value)?.text || currentLocale.value
)

const showsLegacyLobby = computed(() => activeCategory.value === 'all')
const usesSourceGameHall = computed(() => Boolean(sourceHallBackgrounds[activeCategory.value]))
const usesSourceHallPage = computed(() =>
  usesSourceGameHall.value || ['live', 'sport', 'esport'].includes(activeCategory.value)
)
const sourceHallStyle = computed(() =>
  usesSourceGameHall.value
    ? { '--source-hall-bg': `url(${sourceHallBackgrounds[activeCategory.value]})` }
    : undefined
)
const sourceLiveGames = computed(() => {
  const availablePlatforms = new Map()

  catalogPlatforms.value.forEach((platform) => {
    const code = normalizeLivePlatformCode(platform.code || platform.platform)
    if (code && !availablePlatforms.has(code)) {
      availablePlatforms.set(code, {
        code: platform.code || platform.platform || code,
        name: platform.name || platform.provider || code,
        source: platform
      })
    }
  })
  catalogGames.value.forEach((game) => {
    const code = normalizeLivePlatformCode(game.platform)
    if (code && !availablePlatforms.has(code)) {
      availablePlatforms.set(code, {
        code: game.platform || code,
        name: game.provider || game.platform || code,
        source: game
      })
    }
  })

  return sourceLiveArtworks.flatMap((artwork) => {
    const code = artwork.platformCodes.find((platformCode) => availablePlatforms.has(platformCode))
    if (!code) return []
    const platform = availablePlatforms.get(code)
    const lobbyGame = catalogGames.value.find((game) => {
      const gamePlatform = normalizeLivePlatformCode(game.platform)
      const gameId = String(game.gameId || game.game_id || game.code || '').trim().toLowerCase()
      return gamePlatform === code && (gameId === 'lobby' || gameId.endsWith('_lobby'))
    })
    return [{
      ...platform.source,
      id: `live-${artwork.key}-${code}`,
      name: platform.name,
      provider: platform.name,
      platform: platform.code,
      gameId: lobbyGame?.gameId || lobbyGame?.game_id || lobbyGame?.code || 'lobby',
      type: 'live',
      entryKind: 'platform',
      artwork
    }]
  })
})
const activeLiveGame = computed(() => sourceLiveGames.value[sourceLiveIndex.value] || sourceLiveGames.value[0] || null)
const activeLiveArtwork = computed(() => activeLiveGame.value?.artwork || sourceLiveArtworks[0])
const resolveSourceLiveName = (game) => {
  const platform = normalizeLivePlatformCode(game?.platform || game?.code)
  if (platform === 'WL') return `WL ${t('game.live')}`
  const name = String(game?.name || game?.provider || game?.platform || '').trim()
  return name || t('game.livePlatform')
}
const activeLiveName = computed(() => resolveSourceLiveName(activeLiveGame.value))
const activeLiveNameSizeClass = computed(() => {
  const length = Array.from(activeLiveName.value).length
  if (length > 10) return 'is-extra-long'
  if (length > 7) return 'is-long'
  return ''
})
const sourceSportGames = computed(() => {
  const seenPlatforms = new Set()
  return catalogGames.value.filter((game) => {
    const platform = String(game.platform || game.provider || game.id).toUpperCase()
    if (seenPlatforms.has(platform)) return false
    seenPlatforms.add(platform)
    return true
}).slice(0, 6)
})

const sourceEsportGames = computed(() => {
  const platformLogos = {
    FB: '/assets/img/mobile-halls/sport-fb-tab.png',
    IM: '/assets/img/mobile-halls/sport-im-tab.png',
    SS: '/assets/img/mobile-halls/sport-ss-tab.png'
  }
  const seenPlatforms = new Set()
  return sportCatalogGames.value.filter((game) => {
    const platform = String(game.platform || game.provider || game.id).toUpperCase()
    if (seenPlatforms.has(platform)) return false
    seenPlatforms.add(platform)
    return true
  }).slice(0, 3).map((game) => ({
    ...game,
    image: platformLogos[String(game.platform || game.provider || '').toUpperCase()] || game.image
  }))
})

const filteredGames = computed(() => {
  const keyword = searchTerm.value.toLowerCase()
  if (!keyword) return []
  return gameSections.value
    .flatMap((section) => section.items || [])
    .filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index)
    .filter((item) => `${item.name} ${item.provider}`.toLowerCase().includes(keyword))
    .slice(0, 18)
})

const allCategory = computed(() => ({
  code: 'all',
  label: t('game.allGames'),
  navLabel: t('game.hall'),
  description: t('game.allGames'),
  icon: '/assets/img/icon_dtfl_rm_1.avif',
  tone: 'blue'
}))

const catalogCategories = computed(() => [allCategory.value, ...gameSections.value])

const currentCategory = computed(
  () => catalogCategories.value.find((category) => category.code === activeCategory.value) || allCategory.value
)

const providerOptions = computed(() =>
  filterProvidersWithGames(
    buildProviderOptions(activeCategory.value, catalogPlatforms.value),
    catalogGames.value
  )
)

watch(
  providerOptions,
  (options) => {
    if (!options.some((provider) => provider.value === activeProvider.value)) {
      activeProvider.value = 'all'
    }
  },
  { immediate: true }
)

const selectedProvider = computed(
  () => providerOptions.value.find((provider) => provider.value === activeProvider.value) || providerOptions.value[0]
)

const currentCatalogTitle = computed(() =>
  activeProvider.value === 'all' ? currentCategory.value.label : selectedProvider.value.label
)

const visibleCatalogGames = computed(() => {
  const keyword = searchTerm.value.toLowerCase()
  const games = catalogMode.value === 'all' ? catalogGames.value : catalogModeGames.value
  return games.filter((item) => {
    const selected = selectedProvider.value
    const matchesProviderFilter = matchesProvider(item, selected)
    const matchesKeyword = !keyword || `${item.name} ${item.provider}`.toLowerCase().includes(keyword)
    return matchesProviderFilter && matchesKeyword
  })
})

function buildProviderOptions(code, platforms = []) {
  if (code === 'slot') {
    return [{ value: 'all', label: t('common.all') }, ...SLOT_PROVIDER_CATEGORIES.filter(hasSlotProviderGames)]
  }

  return [
    { value: 'all', label: t('common.all') },
    ...platforms.map((platform) => ({
      value: platform.code || platform.value,
      label: normalizeProviderLabel(
        platform.name || platform.label,
        platform.code || platform.value
      ),
      icon: platform.icon || '',
      mark: platform.mark || createProviderMark(
        platform.code || platform.value,
        platform.name || platform.label
      )
    })).filter((platform) => platform.value)
  ]
}

function getLobbyProvider(code) {
  const value = lobbyProviderMap[code] || 'all'
  if (value === 'all') return 'all'
  return getLobbyProviderOptions(code).some((provider) => provider.value === value) ? value : 'all'
}

function setLobbyProvider(code, value) {
  lobbyProviderMap[code] = value
  if (activeCategory.value === code) {
    activeProvider.value = value
  }
}

function matchesProvider(game, provider) {
  if (!provider || provider.value === 'all') return true
  const itemPlatform = String(game.platform || '').toUpperCase()
  if (provider.gameProvider) {
    return itemPlatform === String(provider.platform || '').toUpperCase() &&
      String(game.gameProvider || '').toUpperCase() === String(provider.gameProvider).toUpperCase()
  }
  return itemPlatform === String(provider.platform || provider.value || provider.code || '').toUpperCase()
}

function filterProvidersWithGames(options, games = []) {
  const list = Array.isArray(games) ? games : []
  return options.filter((provider) => {
    if (provider.value === 'all') return true
    return list.some((game) => matchesProvider(game, provider))
  })
}

function getLobbyProviderOptions(code) {
  let options
  if (code === 'slot') {
    options = buildProviderOptions(code)
  } else {
    const section = gameSections.value.find((item) => item.code === code)
    const platforms = [...(section?.platforms || [])]
    const seen = new Set(platforms.map((platform) => String(platform.code || '').toUpperCase()))
    for (const game of section?.items || []) {
      const platform = String(game.platform || '').toUpperCase()
      if (!platform || seen.has(platform)) continue
      seen.add(platform)
      platforms.push({
        code: platform,
        name: game.provider || platform,
        icon: ''
      })
    }
    options = buildProviderOptions(code, platforms)
  }

  const section = gameSections.value.find((item) => item.code === code)
  return filterProvidersWithGames(options, section?.items || [])
}

function getFilteredSectionItems(section) {
  const selectedValue = getLobbyProvider(section.code)
  if (selectedValue === 'all') return section.items || []
  const selected = getLobbyProviderOptions(section.code).find((provider) => provider.value === selectedValue)
  return (section.items || []).filter((item) => matchesProvider(item, selected))
}

watch(
  () => route.query.auth,
  (value) => {
    if (value === 'login' || value === 'register') openAuth(value)
  },
  { immediate: true }
)

function useFallbackLogo(event) {
  if (event?.target) event.target.src = fallbackLogo
}

function hideGameImage(event) {
  const image = event?.target
  if (!image || image.dataset.fallback) return
  image.dataset.fallback = '1'
  image.src = fallbackLogo
}

function openAuth(tab) {
  authTab.value = tab
  if (tab === 'register') {
    // PC 注册使用独立新版页面；登录仍使用页眉常驻表单。
    router.push('/register')
    showAuthModal.value = false
    return
  }
  if (tab === 'login') {
    showTargetLoginModal.value = true
    return
  }
  showAuthModal.value = true
}

async function handleTargetLoginSuccess() {
  await refreshUserState()
  const redirect = sessionStorage.getItem('postLoginRedirect')
  if (redirect) {
    sessionStorage.removeItem('postLoginRedirect')
    await router.push(redirect)
  }
}

async function submitHeaderLogin() {
  if (!headerLogin.value.username || !headerLogin.value.password) {
    loginNoticeMessage.value = t('auth.pleaseInputUsernameAndPassword')
    showLoginNotice.value = true
    nextTick(() => {
      if (!headerLogin.value.username) pcHeaderRef.value?.focusUsername()
    })
    return
  }

  if (headerLoginLoading.value) return
  headerLoginLoading.value = true
  try {
    const res = await authApi.login(headerLogin.value)
    if (res.code !== 0 && res.code !== 200) {
      loginNoticeMessage.value = res.message || res.msg || t('auth.loginFailed')
      showLoginNotice.value = true
      return
    }

    const loginData = {
      token: res.data?.token,
      refreshToken: res.data?.refreshToken,
      user: res.data?.user || res.data?.userInfo,
      expiresIn: res.data?.expiresIn || 7200
    }
    if (!handleLoginSuccess(loginData)) {
      loginNoticeMessage.value = t('auth.loginFailed')
      showLoginNotice.value = true
      return
    }

    setCookie('account', headerLogin.value.username, 7)
    resetAuthState()
    heartbeatService.restart()
    headerLogin.value.password = ''
    await refreshUserState()
    // 客服入口会在未登录时保存回跳标记；PC 端登录成功后继续进入客服会话。
    const resumedCustomerService = await resumeCustomerServiceAfterLogin()
    if (resumedCustomerService) return
    showToast({ type: 'success', message: t('auth.loginSuccess') })
  } catch (error) {
    loginNoticeMessage.value = error?.message || t('auth.loginFailed')
    showLoginNotice.value = true
  } finally {
    headerLoginLoading.value = false
  }
}

async function refreshUserState() {
  loggedIn.value = isLoggedIn()
  userInfo.value = getUserInfo() || {}
  if (!loggedIn.value) return
  try {
    const res = await authApi.getProfile()
    if (res.code === 0 && res.data?.user) userInfo.value = { ...userInfo.value, ...res.data.user }
  } catch {
    /* 使用登录缓存 */
  }
}

function goMember() {
  if (!loggedIn.value) {
    openAuth('login')
    return
  }
  router.push('/member')
}

function goVip() {
  if (!loggedIn.value) {
    // 未登录时直接打开目标站风格登录弹窗，登录成功后回到 VIP 权益页。
    sessionStorage.setItem('postLoginRedirect', '/pc?view=vip')
    openAuth('login')
    return
  }
  router.push({ path: '/pc', query: { view: 'vip' } })
}

function openDeposit() {
  if (!loggedIn.value) {
    openAuth('login')
    return
  }
  showDepositPopup.value = true
}

function openWithdraw() {
  if (!loggedIn.value) {
    sessionStorage.setItem('postLoginRedirect', '/payment/withdraw')
    openAuth('login')
    return
  }
  checkFundPasswordAndNavigate(router)
}

function goInvite() {
  if (!loggedIn.value) {
    // 仅聚焦页眉输入框没有可见反馈；提示登录，并在登录成功后回跳分享赚钱页
    sessionStorage.setItem('postLoginRedirect', '/member/invite')
    showToast(t('game.pleaseLogin'))
    openAuth('login')
    return
  }
  router.push('/member/invite')
}

function handleTopNavClick(item) {
  openNavMenu.value = null
  if (item.action) {
    item.action()
    return
  }
  selectCategory(item.code)
}

function selectNavSubmenu(item) {
  const code = activeNavSubmenu.value?.code
  openNavMenu.value = null
  if (!code) return
  if (item.path) {
    if (item.path === '/vip') {
      goVip()
      return
    }
    router.push(item.path)
    return
  }
  if (code === 'more') {
    selectCategory(item.value)
    return
  }
  if (item.kind === 'category' || item.value === 'all') {
    selectCategory(code)
    return
  }
  selectCategory(code).then(() => {
    const provider = getLobbyProviderOptions(code).find((option) =>
      String(option.value).toUpperCase().includes(String(item.value || item.code || '').toUpperCase())
    )
    if (provider) selectProvider(provider.value)
  })
}

async function goLobby() {
  activeCategory.value = 'all'
  activeProvider.value = 'all'
  searchTerm.value = ''
  if (route.fullPath !== '/pc') {
    await router.push('/pc')
  }
  await nextTick()
  mainRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

async function goService() {
  await openOnlineCustomerService()
}

async function selectCategory(code) {
  if (showEmbeddedPanel.value) {
    const query = { ...route.query }
    delete query.view
    await router.replace({ path: '/pc', query, hash: route.hash })
  }

  if (code === 'all') {
    // 切回首页时让未完成的分类请求失效，避免旧响应覆盖当前状态。
    catalogRequestId += 1
    catalogLoading.value = false
    activeCategory.value = 'all'
    activeProvider.value = 'all'
    searchTerm.value = ''
    await nextTick()
    mainRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  if (activeCategory.value === code) {
    // 失败请求不会写入缓存，允许用户再次点击体育/电竞进行重试。
    if (catalogLoading.value || catalogGameCache.has(code)) return
  }
  activeCategory.value = code
  activeProvider.value = getLobbyProvider(code)
  sourceLiveIndex.value = 0
  catalogMode.value = 'all'
  catalogModeGames.value = []
  searchTerm.value = ''
  await loadCatalog(code)
  if (code === 'esport' && !sportCatalogGames.value.length) {
    try {
      const rawSportGames = await requestCatalogGames('sport')
      sportCatalogGames.value = rawSportGames.map((item, index) => normalizeCatalogGame(item, 'sport', index, new Map()))
    } catch {
      sportCatalogGames.value = []
    }
  }
  if (loggedIn.value && usesSourceGameHall.value) refreshCatalogFavoriteKeys()
}

function selectProvider(code) {
  activeProvider.value = code
  if (activeCategory.value && activeCategory.value !== 'all') {
    lobbyProviderMap[activeCategory.value] = code
  }
}

function getCatalogGameKey(game) {
  return `${String(game.platform || '').toUpperCase()}:${String(game.gameId || game.id)}`
}

function isCatalogFavorite(game) {
  return catalogFavoriteKeys.value.has(getCatalogGameKey(game))
}

async function refreshCatalogFavoriteKeys() {
  if (!loggedIn.value) {
    catalogFavoriteKeys.value = new Set()
    return []
  }
  try {
    const response = await gameApi.getFavorites({ limit: 500 })
    const rawGames = getResponseList(response)
    catalogFavoriteKeys.value = new Set(rawGames.map((game) => getCatalogGameKey({
      platform: game.platform || game.platformCode || game.provider,
      gameId: game.gameId || game.game_id || game.gameCode || game.game_code || game.id
    })))
    return rawGames
  } catch {
    return []
  }
}

async function selectCatalogMode(mode) {
  if (mode === catalogMode.value && mode !== 'favorite') return
  if (mode === 'favorite' && !loggedIn.value) {
    openAuth('login')
    return
  }

  catalogMode.value = mode
  catalogModeGames.value = []
  if (mode === 'all') return

  catalogModeLoading.value = true
  try {
    const response = mode === 'hot'
      ? await gameApi.getHotGames({ type: resolveGameApiType(activeCategory.value), limit: 500 })
      : await gameApi.getFavorites({ limit: 500 })
    const rawGames = getResponseList(response).filter((game) => {
      if (mode !== 'favorite') return true
      const type = String(game.type || game.gameType || game.category || '').toLowerCase()
      return !type || type === resolveGameApiType(activeCategory.value)
    })
    const platformMap = new Map(catalogPlatforms.value.map((platform) => [platform.code.toUpperCase(), platform]))
    catalogModeGames.value = rawGames.map((game, index) => normalizeCatalogGame(game, activeCategory.value, index, platformMap))
    if (mode === 'favorite') {
      catalogFavoriteKeys.value = new Set(catalogModeGames.value.map(getCatalogGameKey))
    }
  } catch {
    catalogModeGames.value = []
  } finally {
    catalogModeLoading.value = false
  }
}

async function toggleCatalogFavorite(game) {
  if (!loggedIn.value) {
    openAuth('login')
    return
  }

  const key = getCatalogGameKey(game)
  const wasFavorite = catalogFavoriteKeys.value.has(key)
  const payload = { platform: game.platform, gameId: game.gameId, type: game.type }
  try {
    if (wasFavorite) await gameApi.removeFavorite(payload)
    else await gameApi.addFavorite(payload)
    const nextKeys = new Set(catalogFavoriteKeys.value)
    if (wasFavorite) nextKeys.delete(key)
    else nextKeys.add(key)
    catalogFavoriteKeys.value = nextKeys
    if (wasFavorite && catalogMode.value === 'favorite') {
      catalogModeGames.value = catalogModeGames.value.filter((item) => getCatalogGameKey(item) !== key)
    }
    showToast(wasFavorite ? t('game.unfavoriteSuccess') : t('game.favoriteSuccess'))
  } catch (error) {
    showToast(error?.message || t('game.operateFailed'))
  }
}

function changeLanguage(locale) {
  currentLocale.value = locale
  setLocale(locale)
  location.reload()
}

function handleHeroClick() {
  const slide = activeHero.value
  if (!slide) return
  if (slide.link) {
    const link = String(slide.link).trim()
    if (/^https?:\/\//i.test(link)) {
      window.open(link, '_blank', 'noopener,noreferrer')
    } else if (/^(?:www\.)|\.(?:com|cn|net|org)(?:\/|$)/i.test(link)) {
      window.open(`https://${link}`, '_blank', 'noopener,noreferrer')
    } else {
      router.push(link.startsWith('/') ? link : `/${link}`)
    }
  }
}

function isSectionExpanded(code) {
  return expandedSectionCodes.value.has(code)
}

function getVisibleSectionItems(section) {
  const filtered = getFilteredSectionItems(section)
  if (isSectionExpanded(section.code)) return filtered
  return filtered.slice(0, LOBBY_PREVIEW_LIMIT)
}

function toggleSectionExpanded(code) {
  const next = new Set(expandedSectionCodes.value)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  expandedSectionCodes.value = next
}

function openGame(item) {
  if (item.isFallback) {
    showToast(t('game.gameLoading'))
    return
  }

  if (item.entryKind === 'game' && item.gameId && item.platform) {
    if (!loggedIn.value) {
      openAuth('login')
      return
    }
    gameApi.addRecent({ platform: item.platform, gameId: item.gameId, type: item.type }).catch(() => {})
    router.push(resolveGamePlayLocation(item))
    return
  }

  if (item.entryKind === 'platform') {
    const target = resolvePlatformNavigation(item, item.type, { pc: true })
    if (target.requiresAuth && !loggedIn.value) {
      openAuth('login')
      return
    }
    router.push(target.location)
    return
  }

  const targetRoute = item.route || '/game/slot'
  const hallMatch = targetRoute.match(/^\/game\/([^/?#]+)/)
  if (hallMatch) {
    router.push({
      path: resolveAllPlatformsPath({ code: hallMatch[1] }, { pc: true }),
      query: item.provider ? { platform: item.provider } : {}
    })
    return
  }
  router.push(targetRoute)
}

function normalizeApiGame(item, section, index) {
  const platform = String(item.platform || item.platformCode || item.provider || '').trim()
  const gameProvider = String(item.gameProvider || item.providerCategory || '').trim().toUpperCase()
  const gameId = item.gameId || item.game_id || item.gameCode || item.game_code || item.id || item.code
  return {
    id: `${section.code}-${platform || 'game'}-${gameId || index}`,
    name: item.name || item.gameName || item.game_name || item.title || item.code || section.label,
    provider:
      item.platformName ||
      item.providerName ||
      (platform.toUpperCase() === 'BGCTRL' && gameProvider ? gameProvider : '') ||
      item.provider ||
      platform ||
      section.label,
    image: resolveMediaUrl(item.cover || item.icon || item.image || item.banner || item.logo, section.icon),
    platform,
    gameProvider,
    code: item.code || gameId,
    gameId,
    type: item.type || item.gameType || resolveGameApiType(section.code),
    entryKind: 'game',
    route: section.path || resolveAllPlatformsPath(section, { pc: true }),
    tone: section.tone,
    badge: section.code === 'hot' || item.hot || item.isHot ? 'HOT' : ''
  }
}

function getResponseList(response) {
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.list)) return response.data.list
  if (Array.isArray(response?.list)) return response.list
  return []
}

function resolveGameApiType(code) {
  return code === 'fish' ? 'fishing' : code
}

function normalizeCatalogPlatforms(items) {
  return items
    .map((item) => ({
      code: String(item.code || item.platform || item.platformCode || '').trim(),
      name: item.name || item.platformName || item.code || item.platform,
      icon: resolveMediaUrl(item.icon || item.logo || item.mobile_icon || item.image, '')
    }))
    .filter((item) => item.code)
    .filter(
      (item, index, list) =>
        list.findIndex((candidate) => candidate.code.toUpperCase() === item.code.toUpperCase()) === index
    )
}

function normalizeCatalogGame(item, categoryCode, index, platformMap) {
  const platform = String(item.platform || item.platformCode || item.provider || item.code || '').trim()
  const gameProvider = String(item.gameProvider || item.providerCategory || '').trim().toUpperCase()
  const gameId = item.gameId || item.game_id || item.gameCode || item.game_code || item.id || item.code
  const platformInfo = platformMap.get(platform.toUpperCase())
  const gameCategory = categoryCode === 'all' ? item.type || item.gameType || 'slot' : categoryCode
  const category = gameSections.value.find((section) => section.code === gameCategory)
  return {
    id: `${categoryCode}-${platform || 'game'}-${gameId || index}`,
    name: item.name || item.gameName || item.game_name || item.title || t('game.gameNumber', { number: index + 1 }),
    provider:
      item.platformName ||
      item.providerName ||
      (platform.toUpperCase() === 'BGCTRL' && gameProvider ? gameProvider : '') ||
      platformInfo?.name ||
      platform,
    image: resolveMediaUrl(item.cover || item.icon || item.image || item.banner, platformInfo?.icon || category?.icon || fallbackLogo),
    platform,
    gameProvider,
    gameId,
    type:
      item.type ||
      item.gameType ||
      item.category ||
      (categoryCode === 'all' ? '' : resolveGameApiType(categoryCode)),
    tone: category?.tone || 'blue',
    badge: categoryCode === 'hot' || item.hot || item.isHot ? 'HOT' : '',
    entryKind: 'game'
  }
}

function derivePlatformsFromGames(games, existingPlatforms) {
  const platforms = [...existingPlatforms]
  games.forEach((game) => {
    if (!game.platform) return
    const exists = platforms.some((platform) => platform.code.toUpperCase() === game.platform.toUpperCase())
    if (!exists) {
      platforms.push({
        code: game.platform,
        name: game.provider || game.platform,
        icon: ''
      })
    }
  })
  return platforms
}

async function loadHeroContent() {
  // 数据库轮播图由管理端维护；接口暂时不可用时保留本地默认图。
  heroSlides.value = fallbackHeroSlides
  heroIndex.value = 0
  try {
    const res = await homeApi.getBanners({ platform: 1, limit: 10 })
    const list = Array.isArray(res.data) ? res.data : []
    if (res.code === 0) {
      const nextSlides = list
        .map((item, index) => ({
          id: item.id || `banner-${index}`,
          image: resolveMediaUrl(item.image, ''),
          title: item.title || '',
          link: item.url || item.link || item.jump_url || ''
        }))
        .filter((item) => item.image)
      if (nextSlides.length) {
        heroSlides.value = nextSlides
        heroIndex.value = 0
      }
    }
  } catch {
    heroSlides.value = fallbackHeroSlides
  }

  // 跑马灯设置已并入「公告管理」：与移动端 V5Notice 一致，滚动展示最新 5 条公告标题
  try {
    const res = await homeApi.getNotices({ page: 1, limit: 5 })
    const list = Array.isArray(res.data) ? res.data : res.data?.list || []
    const titles = list.map((item) => String(item.title || '').trim()).filter(Boolean)
    if (res.code === 0 && titles.length) {
      noticeText.value = titles.join('　　　')
      noticeClickable.value = true
    }
  } catch {
    /* 使用默认公告 */
  }
}

function handleNoticeClick() {
  if (noticeClickable.value) router.push('/notice?tab=announcement')
}

function createCategorySection(category, index) {
  const fallback = categoryMeta.value.find((item) => item.code === category.code)
  const tones = ['red', 'teal', 'blue', 'gold', 'violet']
  return {
    code: category.code,
    label: category.label || fallback?.label || category.code,
    subtitle: category.description || fallback?.description || t('game.featuredPlatforms'),
    tone: category.tone || tones[index % tones.length],
    icon: category.icon || fallback?.icon || categoryMeta.value[1].icon,
    path: resolveAllPlatformsPath(category, { pc: true }),
    platforms: [],
    items: []
  }
}

async function loadCategoryConfiguration() {
  try {
    const res = await gameApi.getCategories()
    const list = Array.isArray(res.data) ? res.data : res.data?.list || []
  if (res.code !== 0 || !list.length) return

    const categories = list
      .filter((item) => item?.code && item.code !== 'lobby')
      .map((item) => {
        const fallback = categoryMeta.value.find((meta) => meta.code === item.code)
        return {
          code: item.code,
          label: item.name || fallback?.label || item.code,
          name: item.name || fallback?.label || item.code,
          description: item.description || fallback?.description || t('game.featuredPlatforms'),
          icon: fallback?.icon || resolveMediaUrl(item.icon || item.image, categoryMeta.value[1].icon),
          tone: item.tone
        }
      })

    const nextSections = categories.map(createCategorySection)
    configuredGameCategories.value = categories
    let hotSection = nextSections.find((section) => section.code === 'hot')
    if (!hotSection) {
      hotSection = createCategorySection({
        code: 'hot',
        name: t('game.hotGames'),
        description: t('game.featuredPlatforms'),
        icon: '/assets/img/icon_dtfl_rm_1.avif'
      })
      nextSections.unshift(hotSection)
    }
    const hotGames = usePreviewHotGames ? previewHotGames : localizedFallbackHotGames.value
    hotSection.items = hotGames.map((item, index) => normalizeApiGame(item, hotSection, index))
    gameSections.value = nextSections
  } catch {
    gameSections.value = createFallbackSections()
  }
}

async function loadGameSections() {
  // 首页只展示热门游戏，其余分类在进入大厅时按需加载，避免首屏并发请求阻塞体育大厅。
  const sectionsToLoad = gameSections.value.filter((section) => section.code === 'hot')
  await Promise.all(
    sectionsToLoad.map(async (section) => {
      try {
        const type = resolveGameApiType(section.code)
        const [gameResult, platformResult] = await Promise.allSettled([
          section.code === 'hot'
            ? gameApi.getHotGames({ limit: 500 })
            : gameApi.getGameList({
                type,
                page: 1,
                limit: section.code === 'slot' ? 5000 : 500
              }),
          section.code === 'hot' ? Promise.resolve(null) : gameApi.getPlatforms({ type })
        ])
        const res = gameResult.status === 'fulfilled' ? gameResult.value : null
        const platformRes = platformResult.status === 'fulfilled' ? platformResult.value : null
        const list = getResponseList(res)
        section.platforms = normalizeCatalogPlatforms(getResponseList(platformRes))
        if (section.code === 'hot' && usePreviewHotGames) {
          section.items = previewHotGames.map((item, index) => normalizeApiGame(item, section, index))
        } else if (res?.code === 0 && list.length) {
          section.items = list.map((item, index) => normalizeApiGame(item, section, index))
        }
      } catch {
        // 接口不可用时保留当前的视觉占位数据，避免首页出现空白模块。
      }
    })
  )
}

async function requestCatalogGames(code) {
  if (code === 'hot') {
    return getResponseList(await gameApi.getHotGames({ limit: 500 }))
  }

  if (code !== 'all') {
    const type = resolveGameApiType(code)
    // 体育大厅只需要各平台入口，避免拉取数百条无用记录拖慢进入速度。
    const limit = code === 'slot' ? 5000 : code === 'sport' ? 100 : 500
    return getResponseList(await gameApi.getGameList({ type, page: 1, limit }))
  }

  const categoryCodes = gameSections.value
    .map((section) => section.code)
    .filter((categoryCode) => categoryCode !== 'hot')
  const results = await Promise.allSettled(
    categoryCodes.map(async (categoryCode) => {
      const response = await gameApi.getGameList({
        type: resolveGameApiType(categoryCode),
        page: 1,
        limit: 500
      })
      return getResponseList(response).map((item) => ({
        ...item,
        type: item.type || item.gameType || categoryCode
      }))
    })
  )

  return results
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value)
    .filter(
      (item, index, list) =>
        list.findIndex(
          (candidate) =>
            String(candidate.platform || candidate.platformCode || '').toUpperCase() ===
              String(item.platform || item.platformCode || '').toUpperCase() &&
            String(candidate.gameId || candidate.game_id || candidate.id) ===
              String(item.gameId || item.game_id || item.id)
        ) === index
    )
}

async function loadCatalog(code) {
  const cachedGames = catalogGameCache.get(code)
  const cachedPlatforms = catalogPlatformCache.get(code)
  if (cachedGames && cachedPlatforms) {
    catalogGames.value = cachedGames
    catalogPlatforms.value = cachedPlatforms
    activeProvider.value = getLobbyProvider(code)
    return
  }

  const requestId = ++catalogRequestId
  catalogLoading.value = true
  catalogGames.value = []
  catalogPlatforms.value = []
  activeProvider.value = getLobbyProvider(code)

  try {
    const gameRequest = requestCatalogGames(code)
    const platformRequest =
      code === 'hot' || code === 'all'
        ? gameApi.getPlatforms({})
        : gameApi.getPlatforms({ type: resolveGameApiType(code) })
    const [gameResult, platformResult] = await Promise.allSettled([gameRequest, platformRequest])
    const gamesLoaded = gameResult.status === 'fulfilled'
    const platformsLoaded = platformResult.status === 'fulfilled'
    const rawGames = gamesLoaded ? gameResult.value : []
    const rawPlatforms = platformsLoaded ? getResponseList(platformResult.value) : []
    const normalizedPlatforms = normalizeCatalogPlatforms(rawPlatforms)
    const platformMap = new Map(
      normalizedPlatforms.map((platform) => [platform.code.toUpperCase(), platform])
    )
    const games = rawGames.map((item, index) => normalizeCatalogGame(item, code, index, platformMap))
    const platforms = derivePlatformsFromGames(games, normalizedPlatforms)

    if (code === 'sport' && requestId === catalogRequestId) sportCatalogGames.value = games

    // 请求完全失败时不要缓存空目录，否则再次进入会直接命中空缓存而不重试。
    if (gamesLoaded) {
      catalogGameCache.set(code, games)
      catalogPlatformCache.set(code, platforms)
    } else if (requestId === catalogRequestId) {
      catalogGameCache.delete(code)
      catalogPlatformCache.delete(code)
    }
    if (requestId === catalogRequestId) {
      catalogGames.value = games
      catalogPlatforms.value = platforms
    }
  } catch {
    if (requestId === catalogRequestId) {
      catalogGameCache.delete(code)
      catalogPlatformCache.delete(code)
    }
    if (requestId === catalogRequestId) {
      catalogGames.value = []
      catalogPlatforms.value = []
    }
  } finally {
    if (requestId === catalogRequestId) catalogLoading.value = false
  }
}

onMounted(async () => {
  const html = document.documentElement
  html.setAttribute('data-ui-contain', '0')
  html.style.setProperty('--app-zoom', '1')
  html.style.setProperty('--app-max-width', '100%')
  html.style.setProperty('--app-total-width', '100%')

  await Promise.allSettled([configStore.fetchConfig(), loadCategoryConfiguration(), loadSlotProviderStats()])
  await loadGameSections()
  refreshUserState()
  loadHeroContent()
  activityPopupTimer = window.setTimeout(() => {
    showActivityPopup.value = true
  }, 500)
  heroTimer = window.setInterval(() => {
    if (heroSlides.value.length > 1) {
      heroIndex.value = (heroIndex.value + 1) % heroSlides.value.length
    }
  }, 5000)
})

onBeforeUnmount(() => {
  if (heroTimer) window.clearInterval(heroTimer)
  if (activityPopupTimer) window.clearTimeout(activityPopupTimer)
  window.setTimeout(() => window.dispatchEvent(new Event('resize')), 0)
})
</script>

<style scoped>
.pc-home {
  --pc-bg: #101010;
  --pc-surface: #1c1c1c;
  --pc-surface-soft: #282828;
  --pc-border: #3a3a3a;
  --pc-text: #e0e0e0;
  --pc-muted: #999;
  --pc-primary: #d5aa54;
  --pc-blue: #c9973d;
  --pc-red: #c45c3d;
  --pc-gold: #e8c978;
  --pc-shadow: 0 8px 26px rgba(0, 0, 0, 0.3);
  width: 100%;
  height: 100%;
  min-width: 0;
  color: var(--pc-text);
  background: var(--pc-bg);
  overflow: hidden;
}

.pc-home.is-dark {
  --pc-bg: #101010;
  --pc-surface: #1c1c1c;
  --pc-surface-soft: #282828;
  --pc-border: #3a3a3a;
  --pc-text: #f5f1e5;
  --pc-muted: #aaa;
  --pc-shadow: 0 8px 26px rgba(0, 0, 0, 0.28);
}

button,
input {
  font: inherit;
  letter-spacing: 0;
}

button {
  color: inherit;
}

.pc-topbar {
  position: relative;
  z-index: 40;
  height: 120px;
  padding: 35px 20px 0;
  box-sizing: border-box;
  background: linear-gradient(to bottom, #fbe59c 0, #fbe59c 35px, #080808 35px, #080808 100%);
  border-bottom: 1px solid #5a4520;
}

.pc-topbar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: min(1200px, calc(100% - 40px));
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  transform: translateX(-50%);
  color: #6c5b37;
  font-size: 12px;
  white-space: pre;
}

.icon-button {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--pc-border);
  border-radius: 6px;
  background: var(--pc-surface-soft);
  cursor: pointer;
}

.brand {
  position: relative;
  grid-column: 2;
  grid-row: 1;
  align-self: center;
  justify-self: center;
  z-index: 2;
  width: 194px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.brand-icon {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.brand-wordmark {
  width: 100px;
  height: 46px;
  object-fit: contain;
  mix-blend-mode: screen;
}

.pc-nav-row {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 82px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 194px minmax(0, 1fr);
  align-items: center;
  padding: 0 clamp(18px, 5vw, 80px);
  background: #080808;
}

.pc-nav-group {
  display: flex;
  align-items: center;
  gap: clamp(10px, 1.8vw, 30px);
  min-width: 0;
}

.pc-nav-left {
  grid-column: 1;
  justify-content: flex-end;
  padding-right: 12px;
}

.pc-nav-right {
  grid-column: 3;
  justify-content: flex-start;
  padding-left: 12px;
}

.pc-nav-group button {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 40px;
  padding: 0;
  border: 0;
  color: #ddd;
  background: transparent;
  font-size: clamp(13px, 1.15vw, 16px);
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.22s ease, transform 0.22s ease;
}

.pc-nav-group button::after {
  position: absolute;
  right: 0;
  bottom: 2px;
  left: 0;
  height: 2px;
  content: '';
  background: #f6d36d;
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.22s ease;
}

.pc-nav-group button:hover,
.pc-nav-group button.active {
  color: #f6d36d;
  transform: translateY(-1px);
}

.pc-nav-group button:hover::after,
.pc-nav-group button.active::after {
  transform: scaleX(1);
}

.pc-nav-group .van-icon {
  color: #888;
}

.pc-nav-group button:hover .van-icon,
.pc-nav-group button.active .van-icon {
  color: #f6d36d;
}

.pc-nav-more {
  position: relative;
}

.pc-nav-item {
  height: 82px;
  display: flex;
  align-items: center;
}

.pc-nav-mega {
  position: absolute;
  top: 100%;
  right: 0;
  left: 0;
  z-index: 60;
  min-height: 158px;
  padding: 18px clamp(28px, 7vw, 100px) 20px;
  border-top: 1px solid rgba(232, 201, 120, 0.18);
  border-bottom: 1px solid rgba(232, 201, 120, 0.45);
  background: rgba(4, 4, 4, 0.98);
  box-shadow: 0 20px 36px rgba(0, 0, 0, 0.5);
}

.pc-nav-mega-inner {
  width: min(1120px, 100%);
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: clamp(10px, 1.4vw, 22px);
  margin: 0 auto;
  overflow-x: auto;
  scrollbar-width: none;
}

.pc-nav-mega-inner::-webkit-scrollbar {
  display: none;
}

.pc-nav-mega-card {
  width: 100px;
  height: 122px;
  flex: 0 0 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  padding: 3px 2px 0;
  border: 0;
  color: #fff;
  background: transparent;
  cursor: pointer;
  transform: none;
}

.pc-nav-mega-card::after {
  display: none;
}

.pc-nav-mega-icon {
  width: 84px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #f3d57d;
  border: 1px solid rgba(232, 201, 120, 0.2);
  border-radius: 5px;
  background: #0c0c0c;
  font-family: Rajdhani, Arial, sans-serif;
  font-size: 22px;
  font-weight: 700;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.pc-nav-mega-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pc-nav-mega-label {
  max-width: 96px;
  overflow: hidden;
  color: #f2f2f2;
  font-size: 13px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-nav-mega-cta {
  min-width: 88px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  color: #fff6d5;
  border: 2px solid #f3d773;
  border-radius: 16px;
  font-size: 12px;
  line-height: 1;
  transition: color 0.2s ease, background 0.2s ease;
}

.pc-nav-mega-card:hover {
  color: #f6d36d;
  transform: translateY(-2px);
}

.pc-nav-mega-card:hover .pc-nav-mega-icon {
  border-color: #f3d773;
  box-shadow: 0 0 14px rgba(243, 215, 115, 0.36);
  transform: translateY(-1px);
}

.pc-nav-mega-card:hover .pc-nav-mega-label {
  color: #f6d36d;
}

.pc-nav-mega-card:hover .pc-nav-mega-cta {
  color: #151007;
  background: #f3d773;
}

.nav-mega-enter-active,
.nav-mega-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.nav-mega-enter-from,
.nav-mega-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.top-actions {
  position: absolute;
  top: 0;
  right: calc(max(20px, calc((100% - 1200px) / 2)) + 150px);
  height: 35px;
  display: flex;
  align-items: center;
  gap: 9px;
  margin-left: 0;
}

.top-actions.is-authenticated {
  position: absolute;
  top: 0;
  right: calc(max(20px, calc((100% - 1200px) / 2)) + 150px);
  height: 35px;
  margin-left: 0;
}

/* 常驻页眉的 PC 登录区：保持紧凑尺寸，避免再用遮罩弹窗打断浏览。 */
.header-auth {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 4px;
}

.header-auth-input {
  width: 130px;
  height: 25px;
  box-sizing: border-box;
  padding: 0 11px;
  border: 1px solid #b69a50;
  border-radius: 5px;
  outline: 0;
  color: #2d2515;
  background: #f6e7ad;
  font-size: 13px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.header-auth-input::placeholder {
  color: #88784e;
}

.header-auth-input:focus {
  border-color: #fff1b6;
  box-shadow: 0 0 0 2px rgba(255, 241, 182, 0.18);
}

.header-auth-login,
.header-auth-register {
  height: 25px;
  min-width: 70px;
  padding: 0 14px;
  border: 0;
  border-radius: 5px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.18s ease, transform 0.18s ease;
}

.header-auth-login {
  background: #171717;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}

.header-auth-register {
  background: #e11b16;
}

.header-auth-login:hover,
.header-auth-register:hover {
  filter: brightness(1.12);
}

.header-auth-login:active,
.header-auth-register:active {
  transform: translateY(1px);
}

.header-auth-login:disabled {
  opacity: 0.65;
  cursor: wait;
}

.text-button,
.icon-text-button,
.view-all-button {
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 17px;
  border: 1px solid var(--pc-border);
  border-radius: 6px;
  background: var(--pc-surface-soft);
  cursor: pointer;
}

.register-button {
  color: var(--pc-primary);
}

.login-button,
.deposit-button {
  color: #fff;
  background: var(--pc-blue);
  border-color: var(--pc-blue);
}

.account-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
}

.account-summary span {
  font-size: 12px;
  color: var(--pc-muted);
}

.account-summary strong {
  color: var(--pc-primary);
  font-size: 14px;
}

.language-control {
  position: absolute;
  top: 2px;
  right: max(20px, calc((100% - 1200px) / 2));
  z-index: 2;
}

.language-control .icon-text-button {
  height: 30px;
  gap: 4px;
  padding: 0 10px;
  border-radius: 5px;
  font-size: 13px;
}

.language-control .van-icon {
  font-size: 14px !important;
}

.language-menu {
  position: absolute;
  top: 34px;
  right: 0;
  width: 150px;
  padding: 5px;
  background: var(--pc-surface);
  border: 1px solid var(--pc-border);
  border-radius: 6px;
  box-shadow: var(--pc-shadow);
}

.language-menu button {
  width: 100%;
  padding: 9px 10px;
  text-align: left;
  border: 0;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
}

.language-menu button:hover,
.language-menu button.active {
  color: var(--pc-primary);
  background: var(--pc-surface-soft);
}

.pc-layout {
  height: calc(100% - 120px);
  display: block;
}

.pc-content {
  min-width: 0;
  height: 100%;
  padding: 0 22px 0;
  background: #1c1c1c;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.pc-content.is-source-hall {
  padding: 0;
  background: #efefef;
}

.pc-embedded-vip {
  margin-top: 18px;
}

.hero-grid {
  display: block;
  min-height: 0;
  scroll-margin-top: 18px;
}

.hero-primary {
  position: relative;
  min-width: 0;
  width: 100%;
  /* 与 PC 轮播图素材规格 1920x400 保持同比例，避免宽屏/窄屏下左右或上下被裁切 */
  aspect-ratio: 1920 / 400;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  padding: 0;
  background: var(--pc-surface-soft);
  cursor: pointer;
}

.hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.hero-empty {
  cursor: default;
}

.hero-dots {
  position: absolute;
  z-index: 3;
  left: 50%;
  bottom: 14px;
  display: flex;
  gap: 5px;
  transform: translateX(-50%);
}

.hero-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
}

.hero-dots span.active {
  width: 20px;
  border-radius: 4px;
  background: #fff;
}

.hero-side {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
}

.side-promo {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 22px 18px 28px;
  overflow: hidden;
  border: 0;
  border-radius: 7px;
  text-align: left;
  cursor: pointer;
}

.side-promo.daily {
  color: #135a93;
  background: #dcebfa;
}

.side-promo.invite {
  color: #7b4b11;
  background: #f8ebcf;
}

.side-promo span,
.side-promo strong {
  display: block;
}

.side-promo span {
  margin-bottom: 8px;
  font-size: 14px;
}

.side-promo strong {
  font-size: 25px;
}

.side-promo img {
  width: 96px;
  height: 96px;
  object-fit: contain;
}

.notice-bar {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 0;
  padding: 0;
  color: #999;
  background: #161616;
  border: 0;
  border-radius: 0;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.notice-label {
  height: 40px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 8px 0 18px;
  box-sizing: border-box;
  color: #fbe59c;
  font-size: 14px;
  white-space: nowrap;
}

/* 图标随公告条一起排布：早前用绝对定位且没有定位祖先，滚动时会脱离公告条 */
.notice-label i {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  background: url('/assets/img/speaker.png') center/contain no-repeat;
}

.notice-marquee.is-clickable {
  cursor: pointer;
}

.notice-marquee {
  min-width: 0;
  flex: 1;
  height: 40px;
  display: flex;
  align-items: center;
  overflow: hidden;
  cursor: pointer;
}

.notice-marquee span {
  display: block;
  min-width: max-content;
  color: #666;
  font-size: 14px;
  line-height: 40px;
  animation: notice-marquee 26s linear infinite;
}

.notice-bar button {
  flex: 0 0 auto;
  height: 40px;
  padding: 0 12px 0 18px;
  border: 0;
  color: var(--pc-primary);
  font-size: 13px;
  background: transparent;
  cursor: pointer;
}

@keyframes notice-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

@media (prefers-reduced-motion: reduce) {
  .notice-marquee span { animation: none; }
}

.notice-bar > span:not(.notice-label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.game-section,
.game-catalog {
  margin-top: 32px;
  scroll-margin-top: 18px;
}

.section-heading {
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 10px;
}

.game-section .provider-tabs {
  margin-bottom: 16px;
}

.section-heading > div {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-heading h2 {
  margin: 0;
  color: #e7cb84;
  font-size: 20px;
}

.section-heading span {
  color: var(--pc-muted);
  font-size: 13px;
}

.section-heading img {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.game-catalog {
  min-width: 0;
}

.source-game-hall {
  --source-gold: #fbe59c;
  min-width: 1200px;
  min-height: 100%;
  margin-top: 0;
  padding: 270px 0 50px;
  box-sizing: border-box;
  background-color: #efefef;
  background-image: var(--source-hall-bg);
  background-repeat: no-repeat;
  background-position: center top;
  background-size: 100% auto;
}

.source-hall-fish {
  background-position-y: -3px;
  background-size: 101% auto;
}

.source-hall-chess {
  padding-top: 223px;
}

.source-hall-lottery {
  padding-top: 417px;
  background-color: #1a1a1a;
  background-size: 100% auto;
}

.source-hall-lottery .source-game-art > img {
  object-fit: contain;
}

.source-hall-lottery .source-hall-panel {
  min-height: 420px;
  padding-top: 34px;
  background: rgba(0, 0, 0, .94);
}

.source-hall-lottery .source-catalog-toolbar {
  margin-bottom: 28px;
}

.source-lottery-games {
  display: grid;
  grid-template-columns: repeat(2, 270px);
  gap: 20px;
  align-items: start;
  min-height: 260px;
}

.source-lottery-card {
  position: relative;
  width: 270px;
  overflow: hidden;
  border: 1px solid var(--source-gold);
  background: #171717;
  cursor: pointer;
}

.source-lottery-card-art {
  height: 150px;
  overflow: hidden;
}

.source-lottery-card-art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .25s ease;
}

.source-lottery-card:hover .source-lottery-card-art img {
  transform: scale(1.04);
}

.source-lottery-card-name {
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  color: #161616;
  background: var(--source-gold);
  font-size: 15px;
}

.source-lottery-card-name button {
  width: 23px;
  height: 23px;
  border: 0;
  background: transparent;
}

.source-hall-panel {
  width: 1200px;
  min-height: 500px;
  margin: 0 auto;
  padding: 0 70px 50px;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 35px;
  color: #fff;
  background: #000;
}

.source-provider-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 30px 25px;
  padding: 35px 15px 30px;
  border-bottom: 1px solid #e5e5e5;
}

.source-provider-tabs button {
  width: 90px;
  height: 30px;
  flex: 0 0 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 8px;
  overflow: hidden;
  border: 0;
  border-radius: 15px;
  color: var(--source-gold);
  font-size: 14px;
  white-space: nowrap;
  text-overflow: ellipsis;
  background: #000;
  box-shadow: 0 5px 10px #fff1c5;
  cursor: pointer;
}

.source-provider-tabs button:hover,
.source-provider-tabs button.active {
  color: #000;
  background: var(--source-gold);
}

.source-provider-tabs:not(.is-logo-bar) button img,
.source-provider-tabs:not(.is-logo-bar) button .provider-mark {
  display: none;
}

.source-provider-name {
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.source-provider-all {
  display: none;
}

.source-catalog-toolbar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 15px 0;
  box-sizing: border-box;
}

.source-catalog-tabs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.source-catalog-tabs button {
  width: 142px;
  height: 48px;
  padding: 0;
  border: 0;
  color: var(--source-gold);
  font-size: 16px;
  background: url('/assets/img/source-hall/tab-default.png') center/100% 100% no-repeat;
  cursor: pointer;
}

.source-catalog-tabs button:hover,
.source-catalog-tabs button.active {
  color: #000;
  background-image: url('/assets/img/source-hall/tab-active.png');
}

.source-search-box {
  width: 240px;
  height: 48px;
  flex: 0 0 240px;
  display: flex;
  align-items: center;
  border-radius: 5px;
  overflow: hidden;
  background: var(--source-gold);
}

.source-search-box input {
  min-width: 0;
  height: 48px;
  flex: 1;
  padding: 0 12px;
  border: 0;
  outline: 0;
  color: #555;
  font-size: 14px;
  background: transparent;
}

.source-search-box input::-webkit-search-cancel-button {
  display: none;
}

.source-search-box span {
  width: 52px;
  height: 48px;
  flex: 0 0 52px;
  background: #000 url('/assets/img/source-hall/search.png') center/24px 32px no-repeat;
}

.source-game-grid {
  display: grid;
  grid-template-columns: repeat(6, 167px);
  column-gap: 11px;
  row-gap: 10px;
  align-items: start;
  min-height: 398px;
}

.source-game-card {
  position: relative;
  width: 167px;
  height: 187px;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid var(--source-gold);
  border-bottom: 0;
  outline: 0;
  background: #000;
  cursor: pointer;
}

.source-game-card:focus-visible {
  box-shadow: 0 0 0 2px #fff;
}

.source-game-art {
  position: relative;
  width: 155px;
  height: 155px;
  margin: 5px;
  overflow: hidden;
  background: #161616;
}

.source-game-art > img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.source-game-enter {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #fff;
  font-size: 14px;
  opacity: 0;
  background: rgba(0, 0, 0, 0.65);
  transition: opacity 0.2s ease;
}

.source-game-enter img {
  width: 40px;
  height: 38px;
  object-fit: contain;
}

.source-game-card:hover .source-game-enter,
.source-game-card:focus-visible .source-game-enter {
  opacity: 1;
}

.source-game-card:hover .source-game-art > img {
  transform: scale(1.04);
}

.source-game-name {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 0 7px 0 9px;
  box-sizing: border-box;
  color: #000;
  font-size: 14px;
  background: var(--source-gold);
}

.source-game-name > span {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.source-game-name button {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  padding: 0;
  border: 0;
  background: url('/assets/img/source-hall/favorite.png') center/contain no-repeat;
  cursor: pointer;
}

.source-game-name button.active {
  background-image: url('/assets/img/source-hall/favorite-active.png');
}

.source-catalog-loading,
.source-empty-state {
  min-height: 398px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--source-gold);
}

.source-catalog-loading {
  flex-direction: column;
}

.source-hall-chess .source-hall-panel {
  width: 100%;
  padding: 0 0 50px;
  border-radius: 0;
}

.source-hall-chess .source-provider-tabs.is-logo-bar {
  height: 95px;
  flex-wrap: nowrap;
  gap: 0;
  padding: 0;
  overflow-x: auto;
  border: 0;
  background: rgba(5, 5, 5, 0.96);
}

.source-hall-chess .source-provider-tabs.is-logo-bar button {
  width: 150px;
  height: 95px;
  flex: 0 0 150px;
  flex-direction: column;
  gap: 3px;
  border-right: 1px solid #222;
  border-radius: 0;
  color: #ddd;
  font-size: 12px;
  background: transparent;
  box-shadow: none;
}

.source-hall-chess .source-provider-tabs.is-logo-bar button:hover,
.source-hall-chess .source-provider-tabs.is-logo-bar button.active {
  color: var(--source-gold);
  background: #151515;
}

.source-hall-chess .source-provider-tabs.is-logo-bar button img {
  width: 75px;
  height: 48px;
  object-fit: contain;
}

.source-hall-chess .source-provider-tabs.is-logo-bar .provider-mark {
  min-width: 0;
  color: var(--source-gold);
  font-size: 20px;
}

.source-hall-chess .source-provider-tabs.is-logo-bar .source-provider-all {
  display: inline;
  color: var(--source-gold);
  font-size: 18px;
}

.source-hall-chess .source-provider-tabs.is-logo-bar .source-provider-all + .source-provider-name {
  display: none;
}

.source-hall-chess .source-catalog-toolbar,
.source-hall-chess .source-game-grid,
.source-hall-chess .source-catalog-loading,
.source-hall-chess .source-empty-state {
  width: 1060px;
  margin-right: auto;
  margin-left: auto;
}

.source-hall-chess .source-game-art > img {
  object-fit: contain;
}

.source-live-hall-page {
  min-width: 1200px;
  min-height: 835px;
  margin-top: 0;
  color: #fff;
  background: #050505;
}

.source-live-hall {
  position: relative;
  width: 100%;
  height: 835px;
  overflow: hidden;
  background: #030303 url('/assets/img/source-hall/live-bg.png') center top/cover no-repeat;
}

.source-live-stage {
  position: relative;
  width: 1200px;
  height: 835px;
  margin: 0 auto;
}

.source-live-person {
  position: absolute;
  inset: 0 auto 0 0;
  width: 50%;
  height: 100%;
}

.source-live-person > img {
  position: absolute;
  bottom: 0;
  left: 50%;
  display: block;
  width: auto;
  height: auto;
  transform: translateX(-50%);
}

.source-live-copy {
  position: absolute;
  inset: 0 0 0 auto;
  width: 50%;
  height: 100%;
}

.source-live-copy h1 {
  position: absolute;
  top: 166px;
  right: 0;
  margin: 0;
  color: #6d6d6d;
  font-size: 104px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  text-shadow: 3px 3px 0 #fff, 7px 7px 0 rgba(0, 0, 0, 0.82);
  white-space: nowrap;
}

.source-live-copy h1.is-long {
  font-size: 82px;
}

.source-live-copy h1.is-extra-long {
  max-width: 660px;
  font-size: 64px;
  line-height: 1.08;
  text-align: right;
  white-space: normal;
}

.source-live-copy > p {
  position: absolute;
  top: 286px;
  right: 0;
  margin: 0;
  color: #777;
  font-size: 24px;
  line-height: 1.2;
  white-space: nowrap;
}

.source-live-categories {
  position: absolute;
  right: 0;
  bottom: 72px;
  width: 600px;
  height: 88px;
  opacity: 0.68;
}

.source-live-categories img {
  display: block;
  width: 600px;
  height: auto;
}

.source-live-copy button {
  position: absolute;
  bottom: 340px;
  left: 50%;
  width: 232px;
  height: 61px;
  transform: translateX(-50%);
  border: 0;
  border-radius: 31px;
  color: #191919;
  font-size: 24px;
  background: linear-gradient(90deg, #fff1c5, #e9d481);
  box-shadow: 0 5px 18px rgba(255, 241, 197, 0.35);
  cursor: pointer;
}

.source-live-copy button:hover {
  filter: brightness(1.06);
  transform: translate(-50%, -1px);
}

.source-live-tabs {
  position: absolute;
  z-index: 3;
  top: 526px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 16px;
  transform: translateX(-50%);
}

.source-live-tabs button {
  min-width: 96px;
  height: 44px;
  padding: 0 18px;
  border: 0;
  color: #fff;
  font-size: 16px;
  background: linear-gradient(#fff, #000);
  cursor: pointer;
}

.source-live-tabs button.active,
.source-live-tabs button:hover {
  color: #1b1b1b;
  background: linear-gradient(#fff1c5, #e9d481);
}

.source-sport-hall-page,
.source-esport-hall-page {
  min-width: 1200px;
  min-height: 634px;
  margin-top: 0;
  overflow: hidden;
}

.source-sport-hall {
  position: relative;
  width: 100%;
  height: 700px;
  background: #f4f4f4 url('/assets/img/source-hall/sport-bg.png') center top/100% auto no-repeat;
}

.source-sport-hero {
  position: absolute;
  top: 20px;
  left: calc(50% - 600px);
  width: 609px;
  height: 679px;
  object-fit: contain;
}

.source-sport-copy {
  position: absolute;
  top: 105px;
  left: calc(50% + 44px);
  width: 500px;
  color: #777;
}

.source-sport-brand {
  width: 232px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin: 0 auto 18px;
}

.source-sport-brand-lockup {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter:
    drop-shadow(0 1px 1px rgba(76, 49, 8, 0.55))
    drop-shadow(0 0 2px rgba(121, 78, 10, 0.25));
}

.source-sport-copy > p {
  margin: 0;
  font-size: 15px;
  line-height: 2;
}

.source-sport-balls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 11px;
  height: 110px;
  margin-top: 20px;
}

.source-sport-balls img {
  width: 75px;
  height: 75px;
  object-fit: contain;
}

.source-sport-platforms {
  display: grid;
  grid-template-columns: repeat(2, 182px);
  gap: 18px 58px;
  justify-content: center;
  margin-top: 6px;
}

.source-sport-platforms button {
  width: 182px;
  height: 55px;
  border: 0;
  border-radius: 28px;
  color: #fbe59c;
  font-size: 25px;
  background: #181818;
  box-shadow: 0 5px 9px rgba(0, 0, 0, 0.45);
  cursor: pointer;
}

.source-sport-platforms button:hover {
  color: #181818;
  background: #fbe59c;
}

.source-esport-hall {
  position: relative;
  width: 100%;
  height: 669px;
  background: #f5f5f5 url('/assets/img/source-hall/esport-bg.png') center top/cover no-repeat;
}

.source-esport-copy {
  position: absolute;
  z-index: 2;
  top: 60px;
  left: calc(50% - 590px);
  width: 464px;
  text-align: center;
}

.source-esport-copy p {
  margin: 0 0 34px;
  color: #777;
  font-size: 14px;
  line-height: 2;
  text-align: left;
}

.source-esport-platforms {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin: 0 0 28px;
}

.source-esport-platforms button {
  width: 132px;
  height: 76px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 8px;
  border: 1px solid #d6b75c;
  border-radius: 8px;
  color: #2e2e2e;
  font-size: 13px;
  background: rgba(255, 255, 255, .86);
  box-shadow: 0 3px 8px rgba(0, 0, 0, .2);
}

.source-esport-platforms button:hover {
  color: #fff;
  background: #161616;
}

.source-esport-platforms img {
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  object-fit: contain;
  border-radius: 5px;
}

.source-esport-games {
  width: 464px;
  height: 158px;
  object-fit: contain;
}

.source-esport-hero {
  position: absolute;
  top: 0;
  left: calc(50% - 170px);
  width: 809px;
  height: 634px;
  object-fit: contain;
  object-position: left top;
}

.catalog-breadcrumb {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 14px;
  color: var(--pc-muted);
  font-size: 14px;
}

.catalog-breadcrumb strong {
  color: var(--pc-text);
}

.catalog-heading {
  display: flex;
  align-items: center;
  margin: 16px 0 12px;
}

.catalog-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.catalog-title img {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.catalog-title h2,
.catalog-title span {
  margin: 0;
  white-space: nowrap;
}

.catalog-title h2 {
  font-size: 20px;
}

.catalog-title span {
  display: block;
  margin-top: 2px;
  color: var(--pc-muted);
  font-size: 12px;
}

.provider-tabs {
  min-width: 0;
  display: flex;
  gap: 14px;
  padding-bottom: 5px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.provider-tabs button {
  width: 216px;
  height: 68px;
  flex: 0 0 216px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 0 14px;
  border: 1px solid var(--pc-border);
  border-radius: 10px;
  background: var(--pc-surface);
  cursor: pointer;
}

.provider-tabs button img {
  width: 96px;
  height: 44px;
  object-fit: contain;
}

.provider-tabs button span {
  max-width: 94px;
  overflow: hidden;
  font-size: 14px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.provider-tabs button img + span {
  display: none;
}

.provider-mark {
  min-width: 96px;
  color: var(--pc-blue);
  font-size: 22px;
  font-weight: 700;
  text-align: center;
}

.provider-tabs button:hover,
.provider-tabs button.active {
  color: var(--pc-blue);
  border-color: var(--pc-blue);
  background: #edf4ff;
}

.catalog-loading {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--pc-muted);
  background: var(--pc-surface);
  border: 1px solid var(--pc-border);
  border-radius: 6px;
}

.game-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(200px, 1fr));
  gap: 14px;
}

.live-hall-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 960px;
}

.live-hall-card {
  display: block;
  width: 100%;
  min-width: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
}

.live-hall-card:hover {
  transform: translateY(-1px);
  filter: brightness(1.03);
}

.live-hall-cover {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 466 / 211;
  object-fit: contain;
  object-position: center;
  background: transparent;
  vertical-align: top;
}

.game-row-wrap {
  grid-template-columns: repeat(4, minmax(200px, 1fr));
}

.game-card {
  min-width: 0;
  height: 125px;
  display: grid;
  grid-template-columns: 1fr 112px;
  grid-template-rows: 1fr 22px;
  align-items: center;
  padding: 0 0 0 30px;
  overflow: visible;
  border: 0;
  border-radius: 15px;
  text-align: left;
  background: #2b2b2b;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
}

.game-card:hover {
  background: #303030;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
  transform: translateY(-3px);
}

.game-image {
  position: relative;
  width: 110px;
  height: 110px;
  grid-column: 2;
  grid-row: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-right: -1px;
  border-radius: 50%;
  background: transparent;
  transform: translateX(1px);
  z-index: 1;
}

.game-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.22s ease, filter 0.22s ease;
}

.game-image.is-fallback img {
  width: 72%;
  height: 72%;
  object-fit: contain;
}

.game-card:hover .game-image img {
  transform: scale(1.08);
  filter: brightness(1.06);
}

.game-card strong,
.game-card > span {
  display: block;
  grid-column: 1;
  padding: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.game-card strong {
  margin-top: 0;
  align-self: end;
  color: #d7d7d7;
  font-family: Arial, "Microsoft YaHei", sans-serif;
  font-size: 22px;
  font-weight: 400;
  line-height: 40px;
}

.game-card > span {
  margin-top: 2px;
  align-self: start;
  color: var(--pc-muted);
  font-size: 12px;
}

.game-badge {
  position: absolute;
  top: 7px;
  left: 7px;
  padding: 3px 6px;
  color: #fff;
  font-size: 10px;
  background: var(--pc-red);
  border-radius: 3px;
}

.hot-game-card {
  grid-template-columns: 1fr 110px;
  grid-template-rows: 1fr;
  align-items: center;
  padding-left: 30px;
}

.hot-game-card strong {
  grid-row: 1;
  align-self: center;
  margin: 0;
  padding: 0;
}

.hot-game-card .game-image {
  grid-row: 1;
}

.hot-game-card > span {
  display: none;
}

.empty-state {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--pc-muted);
  background: var(--pc-surface);
  border: 1px dashed var(--pc-border);
  border-radius: 6px;
}

.win-heading-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--pc-primary);
  box-shadow: 0 0 0 3px rgba(21, 159, 134, 0.18);
}

.win-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.win-nav-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--pc-border);
  border-radius: 50%;
  color: var(--pc-muted);
  background: var(--pc-surface);
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.win-nav-btn:hover {
  color: var(--pc-primary);
  border-color: var(--pc-primary);
  background: rgba(21, 159, 134, 0.06);
}

.winning-track {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 2px 2px 8px;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.winning-track::-webkit-scrollbar {
  display: none;
}

.win-card {
  flex: 0 0 112px;
  width: 112px;
  padding: 0 0 10px;
  overflow: hidden;
  border: 1px solid var(--pc-border);
  border-radius: 8px;
  background: var(--pc-surface);
  text-align: center;
  transition: transform 0.35s ease, opacity 0.35s ease, box-shadow 0.2s ease;
}

.win-card.is-enter {
  opacity: 0;
  transform: translateX(-18px) scale(0.96);
}

.win-card:hover {
  box-shadow: var(--pc-shadow);
}

.win-card-cover {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: #e9f1f8;
}

.win-card-cover.tone-red { background: #f7e3e1; }
.win-card-cover.tone-teal { background: #dff3ee; }
.win-card-cover.tone-blue { background: #e1edf8; }
.win-card-cover.tone-gold { background: #f5eddc; }
.win-card-cover.tone-violet { background: #eee7f4; }

.win-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.win-card-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
  line-height: 1.3;
  background: linear-gradient(135deg, #ff7a45, #ed534f);
}

.win-card-player {
  display: block;
  margin-top: 8px;
  padding: 0 8px;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.win-card-amount {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 4px;
  padding: 0 6px;
  color: #1aa8d0;
}

.win-amount-icon {
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-size: 9px;
  font-style: normal;
  font-weight: 700;
  background: #1aa8d0;
}

.win-card-amount em {
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.pc-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 34px -20px 0;
  padding: 0 0 24px;
  color: #999;
  background: #0f0f0f;
  border-top: 1px solid #2d2d2d;
}

.pc-content.is-source-hall .pc-footer {
  margin-right: 0;
  margin-left: 0;
}
.footer-partners { width: 100%; height: 184px; display: flex; align-items: center; justify-content: center; padding: 20px 24px; box-sizing: border-box; background: #101010; border-bottom: 1px solid #292929; }
.footer-partners img { display: block; width: min(991px, 100%); height: auto; max-height: 120px; object-fit: contain; filter: none; }
.footer-cookie { max-width: 760px; margin: 24px auto 20px; padding: 0 18px; color: #777; font-size: 12px; line-height: 1.8; text-align: center; }

.footer-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 26px;
}

.footer-brand-icon {
  width: 46px;
  height: 46px;
  object-fit: contain;
  mix-blend-mode: screen;
}

.footer-brand-wordmark {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: .86;
  text-shadow: 0 0 8px rgba(187, 224, 218, .18);
}

.footer-brand-wordmark strong {
  color: #d5e3df;
  font-size: 26px;
  font-style: italic;
  letter-spacing: 2px;
}

.footer-brand-wordmark em {
  color: #b9cbc7;
  font-size: 15px;
  font-style: italic;
  font-weight: 700;
  letter-spacing: 1px;
}

.footer-brand strong {
  color: var(--pc-text);
  font-size: 18px;
}

.footer-brand p,
.copyright {
  margin: 0;
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.footer-links i { color: #8c7437; font-style: normal; }

.footer-links button {
  padding: 0;
  border: 0;
  color: var(--pc-muted);
  background: transparent;
  cursor: pointer;
}

.footer-links button:hover {
  color: var(--pc-primary);
}

.copyright {
  margin: 5px 0 0;
  text-align: center;
  color: #777;
}

@media (max-width: 900px) {
  .footer-partners { height: 140px; padding: 16px; }
}

@media (max-width: 560px) {
  .footer-partners { height: 100px; padding: 10px; }
}

.floating-service {
  position: fixed;
  right: 22px;
  bottom: 24px;
  z-index: 50;
  width: 58px;
  height: 58px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: var(--pc-primary);
  box-shadow: 0 8px 22px rgba(21, 159, 134, 0.32);
  cursor: pointer;
}

.floating-service span {
  font-size: 11px;
}

@media (max-width: 1180px) {
  .game-row,
  .game-row-wrap {
    grid-template-columns: repeat(4, minmax(128px, 1fr));
  }

  .header-auth-input {
    width: 112px;
  }

  .header-auth-login,
  .header-auth-register {
    min-width: 60px;
    padding: 0 11px;
  }

}

.home-hot-section { margin-top: 26px; }

.home-hot-section .hot-heading {
  position: relative;
  min-height: 78px;
  justify-content: center;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 10px;
}

.home-hot-section .hot-heading > div { justify-content: center; }
.home-hot-section .hot-heading h2 {
  color: #f2d26c;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.home-hot-section .hot-heading h2::after {
  content: 'Hot game recommendations';
  display: block;
  margin-top: 3px;
  color: #d5ab55;
  font-size: 11px;
  font-weight: 400;
  text-align: center;
}

.home-hot-section .hot-heading > div::before,
.home-hot-section .hot-heading > div::after {
  content: '';
  width: 126px;
  height: 1px;
  margin: 14px 16px 0;
  background: linear-gradient(90deg, transparent, #554829);
}

.home-hot-section .hot-heading > div::after {
  background: linear-gradient(90deg, #554829, transparent);
}

.home-hot-section .hot-heading > div > img,
.home-hot-section .hot-heading > div > span { display: none; }

.home-hot-section .hot-heading .view-all-button {
  position: absolute;
  right: 24px;
  bottom: 12px;
  color: #b89854;
}

.home-hot-section .game-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px 13px;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.platform-showcase {
  width: min(1200px, 100%);
  margin: 58px auto 34px;
}

.platform-showcase-heading { text-align: center; margin-bottom: 28px; }
.platform-showcase-heading h2 { margin: 0; color: #fbe59c; font-size: 34px; font-weight: 500; }
.platform-showcase-heading p { margin: 5px 0 0; color: #fbe59c; font-size: 10px; }

.platform-feature-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.platform-feature-card { overflow: hidden; border-radius: 24px; background: #2b2b2b; box-shadow: 0 10px 22px rgba(0,0,0,.24); }
.platform-feature-art { position: relative; display: block; width: 100%; height: 200px; padding: 0; overflow: hidden; border: 0; background: #252525; cursor: pointer; text-align: left; }
.platform-feature-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.platform-feature-character { position: absolute; right: 7%; bottom: 0; max-width: 58%; max-height: 110%; object-fit: contain; transition: transform .45s ease; }
.platform-feature-art:hover .platform-feature-character { transform: translateY(-6px) scale(1.03); }
.platform-feature-body { display: flex; align-items: center; justify-content: space-between; gap: 18px; min-height: 95px; padding: 16px 16px 16px 18px; box-sizing: border-box; }
.platform-feature-body p { margin: 0; color: #d7d7d7; font-size: 13px; line-height: 25px; }
.platform-play-button { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 156px; height: 56px; gap: 8px; border: 3px solid #fbe59c; border-radius: 28px; color: #fbe59c; background: transparent; font-size: 20px; font-weight: 700; cursor: pointer; transition: background .25s ease, color .25s ease; }
.platform-play-button:hover { color: #222; background: #fbe59c; }

.platform-small-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; margin-top: 35px; }
.platform-small-card { position: relative; height: 200px; overflow: hidden; padding: 0; border: 0; border-radius: 24px; background: #2b2b2b; cursor: pointer; text-align: left; box-shadow: 0 10px 22px rgba(0,0,0,.24); }
.platform-small-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.platform-small-character { position: absolute; right: 2%; bottom: 0; max-width: 64%; max-height: 110%; object-fit: contain; transition: transform .45s ease; }
.platform-small-card:hover .platform-small-character { transform: translateY(-7px) scale(1.03); }

@media (max-width: 920px) {
  .home-hot-section .game-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .platform-feature-grid { grid-template-columns: 1fr; }
  .platform-small-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 680px) {
  .home-hot-section .game-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hot-game-card strong { font-size: 17px; }
  .hot-game-card { padding-left: 16px; }
  .hot-game-card .game-image { width: 84px; height: 84px; }
  .home-hot-section .game-row { gap: 12px; }
  .platform-showcase { margin-top: 36px; }
  .platform-showcase-heading h2 { font-size: 25px; }
  .platform-small-grid { grid-template-columns: 1fr; }
  .platform-feature-body { align-items: flex-start; flex-direction: column; }
  .platform-play-button { flex-basis: 48px; width: 100%; }
}

.pc-quick-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 13px;
  width: min(1200px, 100%);
  margin: 35px auto 0;
}

.quick-action {
  position: relative;
  min-width: 0;
  height: 80px;
  display: flex;
  align-items: center;
  gap: 0;
  overflow: hidden;
  border: 0;
  border-left: 10px solid #e7c65d;
  border-radius: 0 40px 40px 0;
  color: #f1d57d;
  background: #2b2b2b;
  text-align: left;
  cursor: pointer;
  isolation: isolate;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.quick-action::before {
  position: absolute;
  inset: 0 auto 0 0;
  z-index: 0;
  width: 10px;
  content: '';
  background: #fbe59c;
  transition: width 0.5s ease;
}

.quick-action:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.quick-action:hover::before { width: 100%; }
.quick-action-icon {
  width: 52px;
  height: 52px;
  margin-left: 25px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  z-index: 1;
}
.quick-action-icon img { width: 100%; height: 100%; display: block; }
.quick-action > span:nth-child(2) { position: relative; z-index: 1; min-width: 0; display: flex; flex-direction: column; padding-left: 15px; }
.quick-action strong { color: #fbe59c; font-size: 22px; font-weight: 500; line-height: 38px; white-space: nowrap; transition: color 0.5s ease; }
.quick-action small { color: #7b797a; font-size: 12px; white-space: nowrap; transition: color 0.5s ease; }
.quick-action > i {
  position: absolute;
  right: 10px;
  top: 50%;
  width: 64px;
  height: 64px;
  transform: translateY(-50%);
  background: url('/assets/img/pic5.png') center/contain no-repeat;
  z-index: 1;
  transition: transform 0.8s ease, background-image 0s 0.15s;
}
.quick-action:hover strong,
.quick-action:hover small { color: #fff; }
.quick-action:hover > i { transform: translateY(-50%) rotate(360deg); background-image: url('/assets/img/pic6.png'); }
.quick-action-deposit { border-left-color: #3ea8ff; }
.quick-action-deposit::before { background: #3ea8ff; }
.quick-action-promotion { border-left-color: #fedb41; }
.quick-action-promotion::before { background: #fedb41; }
.quick-action-app { border-left-color: #ff523e; }
.quick-action-app::before { background: #ff523e; }

@media (max-width: 820px) {
  .pc-topbar {
    height: 104px;
    padding: 35px 12px 0;
  }

  .pc-nav-row {
    display: flex;
    height: 69px;
    justify-content: flex-start;
    gap: 12px;
    overflow-x: auto;
    padding: 0 12px;
  }

  .pc-nav-group {
    gap: 14px;
  }

  .pc-nav-group button {
    font-size: 13px;
  }

  .pc-quick-actions { gap: 8px; margin-top: 24px; }
  .quick-action { height: 72px; border-radius: 0 36px 36px 0; }
  .quick-action-icon { width: 44px; height: 44px; margin-left: 14px; }
  .quick-action > span:nth-child(2) { padding-left: 9px; }
  .quick-action strong { font-size: 16px; line-height: 28px; }
  .quick-action small { font-size: 9px; }
  .quick-action > i { right: 5px; width: 56px; height: 56px; }

  .brand {
    position: relative;
    left: auto;
    bottom: auto;
    left: auto;
    flex: 0 0 auto;
    order: 0;
    width: 154px;
    height: 56px;
  }

  .brand-icon {
    width: 44px;
    height: 44px;
  }

  .brand-wordmark {
    width: 78px;
    height: 36px;
  }

  .language-control {
    display: none;
  }

  .top-actions {
    right: 12px;
  }

  .header-auth-input {
    width: 112px;
    height: 34px;
  }

  .header-auth-login,
  .header-auth-register {
    height: 34px;
  }

  .pc-layout {
    height: calc(100% - 104px);
  }

  .pc-content {
    padding: 12px 12px 0;
  }

  .hero-grid {
    grid-template-columns: 1fr;
  }

  .hero-side {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 128px;
  }

  .game-row,
  .game-row-wrap {
    grid-template-columns: repeat(2, minmax(130px, 1fr));
  }

  .pc-footer {
    grid-template-columns: 1fr;
    margin: 28px -12px 0;
    padding: 26px 20px 18px;
  }

  .footer-links {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 520px) {
  .register-button {
    display: none;
  }

  .text-button {
    padding: 0 12px;
  }

  .header-auth {
    gap: 4px;
  }

  .header-auth-input {
    width: 92px;
    height: 34px;
    padding: 0 8px;
  }

  .header-auth-login,
  .header-auth-register {
    height: 34px;
    min-width: 46px;
    padding: 0 8px;
    font-size: 12px;
  }

  .hero-side {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(2, 112px);
  }

  .side-promo {
    padding: 14px 18px;
  }

  .side-promo strong {
    font-size: 20px;
  }

  .side-promo img {
    width: 76px;
    height: 76px;
  }

  .win-card {
    flex-basis: 102px;
    width: 102px;
  }
}
</style>
