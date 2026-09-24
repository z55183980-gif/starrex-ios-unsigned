<template>
  <div
    class="slot-page"
    :class="{
      'pc-hall': isPcHall,
      'source-mobile-hall': !isPcHall,
      'mobile-showcase-hall-page': isMobileShowcaseHall
    }"
  >
    <header class="slot-header">
      <button type="button" class="back" :aria-label="t('common.back')" @click="goBack">
        <van-icon name="arrow-left" size="20" />
      </button>
      <div class="slot-brand" @click="router.push('/home-new')">
        <img src="/assets/img/starrex-logo.png" alt="" @error="hideBrokenImg" />
        <div>
          <strong>StarRex</strong>
          <span>{{ typeName }}</span>
        </div>
      </div>
      <h1 v-if="isMobileShowcaseHall || isLotteryHall || isMobileEsportHall" class="mobile-live-title">
        {{ mobileHallTitle }}
      </h1>
    </header>

    <div v-if="!isLiveHall && (!isSportHall || isPcHall)" class="search-bar">
      <div class="search-input-box">
        <input 
          v-model="keyword" 
          type="text" 
          :placeholder="t('game.searchGame')"
          class="search-input"
          @input="onSearchInput"
        >
        <div class="search-btn" @click="onSearchInput">
          <van-icon name="search" color="#26A17B" size="18" />
        </div>
      </div>
    </div>

    <div class="slot-layout" :class="{ 'no-platform-sidebar': hidePlatformSidebar }">
      <aside v-if="!hidePlatformSidebar" class="platform-sidebar custom-scrollbar">
        <div 
          class="platform-item" 
          :class="{ active: activePlatform === 'ALL' }"
          @click="switchPlatform('ALL')"
        >
          <div class="p-icon">
            <img 
              :src="typeIcon" 
              class="dz-icon"
              :class="{ 'dz-icon-active': activePlatform === 'ALL' }"
            />
          </div>
          <span class="p-name">{{ activePlatform === 'ALL' ? t('game.hot') : typeName }}</span>
        </div>

        <div
          v-for="p in platforms"
          :key="p.code"
          class="platform-item"
          :class="{ active: activePlatform === p.code }"
          @click="switchPlatform(p.code)"
        >
          <div class="p-icon">
            <img v-if="getPlatformIcon(p.code)" :src="getPlatformIcon(p.code)" class="p-img" />
            <span v-else class="p-mark">{{ getPlatformMark(p.code) }}</span>
          </div>
          <span class="p-name">{{ p.name }}</span>
        </div>
      </aside>

      <main class="slot-main">
        <div class="filter-tabs" v-if="!isLiveHall && (!isSportHall || isPcHall)">
          <div 
            v-for="tab in tabs" 
            :key="tab.key"
            :class="['tab-item', { active: activeTab === tab.key }]"
            @click="switchTab(tab.key)"
          >
            {{ tab.name }}
          </div>
        </div>

        <div
          class="game-scroll-area custom-scrollbar"
          :class="{ 'mobile-showcase-scroll': isMobileShowcaseHall }"
          ref="scrollRef"
          @scroll.passive="onScroll"
        >
          <van-skeleton title :row="10" :loading="initialLoading" animate style="margin-top: 20px;">
            <div v-if="isMobileEsportHall" class="mobile-esport-hall">
              <div class="mobile-esport-platforms" role="tablist" :aria-label="t('game.esportPlatform')">
                <button
                  v-for="platform in mobileEsportPlatforms"
                  :key="platform.code"
                  type="button"
                  role="tab"
                  :aria-selected="activeEsportPlatform === platform.code"
                  :class="{ active: activeEsportPlatform === platform.code }"
                  @click="enterEsportPlatform(platform.code)"
                >
                  <img :src="platform.logo" :alt="platform.name" @error="hideBrokenImg" />
                  <span>{{ platform.name }}</span>
                </button>
              </div>
              <section class="mobile-esport-stage">
                <img
                  src="/assets/img/mobile-halls/esport-im-stage.png"
                  alt="IM Esports"
                  @error="hideBrokenImg"
                />
              </section>
            </div>
            <div v-else-if="isMobileShowcaseHall && mobileShowcaseEntries.length > 0" class="mobile-live-hall">
              <div class="mobile-live-platforms" role="tablist" :aria-label="isSportHall ? t('game.sportPlatform') : t('game.livePlatform')">
                <button
                  v-for="entry in mobileShowcaseEntries"
                  :key="entry.uniqueId"
                  type="button"
                  role="tab"
                  :aria-selected="activeShowcasePlatform === entry.platformCode"
                  :class="{ active: activeShowcasePlatform === entry.platformCode }"
                  @click="activeShowcasePlatform = entry.platformCode"
                >
                  <img :src="entry.mobileTab" alt="" @error="hideBrokenImg" />
                  <span>{{ entry.name }}</span>
                </button>
              </div>
              <section v-if="activeShowcaseEntry" class="mobile-live-stage">
                <button type="button" class="mobile-live-banner" @click="enter(activeShowcaseEntry)">
                  <img
                    :src="activeShowcaseEntry.mobileStage"
                    :alt="activeShowcaseEntry.name"
                    @error="hideBrokenImg"
                  />
                  <div
                    v-if="activeShowcasePlatform === 'WL'"
                    class="mobile-live-wl-correction"
                    aria-hidden="true"
                  >
                    <img src="/assets/img/imgi_12_52_N_WL_LOGO.avif" alt="" />
                    <strong>WL {{ t('game.live') }}</strong>
                    <span>{{ t('home.liveIntro') }}</span>
                  </div>
                </button>
                <div class="mobile-live-dots" aria-hidden="true">
                  <span
                    v-for="entry in mobileShowcaseEntries"
                    :key="`dot-${entry.uniqueId}`"
                    :class="{ active: activeShowcasePlatform === entry.platformCode }"
                  />
                </div>
              </section>
            </div>
            <div v-else-if="isSportHall && visibleGames.length > 0" class="source-banner-grid">
              <button
                v-for="g in visibleGames"
                :key="g.uniqueId"
                type="button"
                class="source-banner-card"
                @click="enter(g)"
              >
                <img :src="resolveSportHallCover(g)" :alt="resolveSportHallTitle(g)" @error="onImgError($event)" />
                <span>{{ resolveSportHallTitle(g) }}</span>
              </button>
            </div>
            <div v-else-if="isLotteryHall && visibleGames.length > 0" class="source-banner-grid">
              <button
                v-for="g in visibleGames"
                :key="g.uniqueId"
                type="button"
                class="source-banner-card"
                @click="enter(g)"
              >
                <img :src="resolveLotteryHallCover(g)" :alt="resolveLotteryHallTitle(g)" @error="onImgError($event)" />
                <span>{{ resolveLotteryHallTitle(g) }}</span>
              </button>
            </div>
            <div v-else-if="visibleGames.length > 0" class="game-grid">
              <div
                v-for="g in visibleGames"
                :key="g.uniqueId"
                class="game-card"
                @click="enter(g)"
              >
                <div class="game-cover-box">
                  <img 
                    v-if="g.cover"
                    :src="g.cover" 
                    class="game-img"
                    loading="lazy"
                    @error="onImgError($event)"
                  />
                  <div v-else class="game-img-placeholder">{{ g.name?.[0] || '?' }}</div>
                  
                  <div class="badge-fav" @click.stop="toggleFav(g)">
                    <img :src="isFav(g) ? '/assets/img/btn_sc_on_2.avif' : '/assets/img/btn_sc_off_2.avif'" class="fav-img" />
                  </div>

                  <div class="badge-platform">
                    <img v-if="getPlatformIcon(g.platformCode)" :src="getPlatformIcon(g.platformCode)" class="badge-platform-icon" />
                    <span v-else class="badge-platform-mark">{{ getPlatformMark(g.platformCode) }}</span>
                  </div>
                </div>
                <div class="game-name">{{ g.name }}</div>
              </div>
            </div>
            
            <div v-else class="empty-box">
              <van-empty :description="t('game.noRelatedGames')" image="search" />
            </div>
          </van-skeleton>
          <div v-if="loading && !initialLoading" class="switch-loading" aria-live="polite">
            <van-loading size="18px" color="#d7b56d" />
            <span>{{ t('game.switchLoading') }}</span>
          </div>
        </div>
        
        <div v-if="!isLiveHall && activeTab === 'all' && (loadingMore || hasMore)" class="load-more-status">
          <van-loading v-if="loadingMore" size="16px" />
          <span>{{ loadingMore ? `${t('common.loading')}…` : t('game.scrollForMore') }}</span>
        </div>
        <div class="pagination-fixed" v-if="!isLiveHall && activeTab !== 'all' && totalPages > 1">
          <div class="page-item" :class="{ disabled: currentPage === 1 }" @click="goPage(currentPage - 1)">
            <van-icon name="arrow-left" />
          </div>
          <template v-for="p in pageNumbers" :key="p">
            <div v-if="p === '...'" class="page-dots">...</div>
            <div v-else class="page-item" :class="{ active: currentPage === p }" @click="goPage(p)">{{ p }}</div>
          </template>
          <div class="page-item" :class="{ disabled: currentPage === totalPages }" @click="goPage(currentPage + 1)">
            <van-icon name="arrow" />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast } from 'vant'
import { gameApi } from '@/api/game'
import { resolveGamePlayLocation } from '@/utils/gameNavigation'
import { SLOT_PROVIDER_CATEGORIES } from '@/constants/slotProviders'
import { createProviderMark, normalizeProviderLabel } from '@/utils/platformPresentation'
import { resolveLiveHallCover } from '@/utils/liveHallCovers'
import { hideBrokenImg } from '@/utils/staticAssets'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import { loadSlotProviderStats, hasSlotProviderGames } from '@/utils/slotProviderStats'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const SCROLL_KEY = 'slot_hall_scroll'
const STATE_KEY = 'slot_hall_state'

const isPcHall = computed(() => route.meta?.pc === true)
const urlPlatform = computed(() => route.query.platform || '')
const urlType = computed(() => route.meta?.type || route.params.type || route.query.type || 'slot')
const isHotCategory = computed(() => urlType.value === 'hot')
// 彩票/体育游戏少，不展示厂商分类侧栏（与首页目录一致）
const hidePlatformSidebar = computed(() => ['lottery', 'sport', 'live', 'esport'].includes(urlType.value))
const isLiveHall = computed(() => urlType.value === 'live')
const isSportHall = computed(() => urlType.value === 'sport')
const isLotteryHall = computed(() => urlType.value === 'lottery')
const isMobileShowcaseHall = computed(() => !isPcHall.value && (isLiveHall.value || isSportHall.value))
const isMobileEsportHall = computed(() => !isPcHall.value && urlType.value === 'esport')

const SPORT_HALL_COVERS = {
  FB: '/assets/img/sport/sport_hall_boeing.png',
  IM: '/assets/img/sport/sport_hall_pandasports.png',
  SS: '/assets/img/sport/sport_hall_sabasports.png'
}

const SPORT_HALL_TITLES = computed(() => ({ FB: `FB ${t('game.sportSuffix')}`, IM: `IM ${t('game.sportSuffix')}`, SS: `SS ${t('game.sportSuffix')}` }))
const LOTTERY_HALL_COVERS = {
  SGWIN: '/assets/img/lottery/sgwin-reference.webp',
  VR: '/assets/img/lottery/vr-reference.webp'
}
const LOTTERY_HALL_TITLES = computed(() => ({ SGWIN: `SGWIN ${t('game.lotterySuffix')}`, VR: `VR ${t('game.lotterySuffix')}` }))

const LIVE_PLATFORM_ALIASES = {
  DB: 'WL',
  DBR: 'WL',
  OBG: 'WL',
  IGZR: 'WL'
}

function normalizeLivePlatformCode(value) {
  const code = String(value || '').trim().toUpperCase()
  return LIVE_PLATFORM_ALIASES[code] || code
}

const resolveSportHallCover = (game) => {
  const platform = String(game?.platformCode || '').trim().toUpperCase()
  return SPORT_HALL_COVERS[platform] || (game?.cover ? resolveMediaUrl(game.cover) : '/assets/img/icon_dtfl_ty_1.avif')
}

const resolveSportHallTitle = (game) => {
  const platform = String(game?.platformCode || '').trim().toUpperCase()
  return SPORT_HALL_TITLES.value[platform] || String(game?.name || platform || t('game.sport')).replace(/大厅$/u, '')
}

const resolveLotteryHallCover = (game) => {
  const platform = String(game?.platformCode || '').trim().toUpperCase()
  return LOTTERY_HALL_COVERS[platform] || (game?.cover ? resolveMediaUrl(game.cover) : '/assets/img/icon_dtfl_cp_1.avif')
}

const resolveLotteryHallTitle = (game) => {
  const platform = String(game?.platformCode || '').trim().toUpperCase()
  return LOTTERY_HALL_TITLES.value[platform] || String(game?.name || platform || t('game.lottery')).replace(/大厅$/u, '')
}

const mobileEsportPlatforms = computed(() => [
  { code: 'FB', name: `FB ${t('game.esportSuffix')}`, logo: '/assets/img/mobile-halls/sport-fb-tab.png' },
  { code: 'IM', name: `IM ${t('game.esportSuffix')}`, logo: '/assets/img/mobile-halls/sport-im-tab.png' },
  { code: 'SS', name: `SS ${t('game.esportSuffix')}`, logo: '/assets/img/mobile-halls/sport-ss-tab.png' }
])

// 电子竞技页与体育页共用同一组大厅入口。兼容历史平台码，但最终都要
// 落到体育页使用的 FB / IM / SS 三个平台上。
const SPORT_PLATFORM_ALIASES = {
  FB: 'FB',
  FBTY: 'FB',
  IM: 'IM',
  IMSB: 'IM',
  IMDJ: 'IM',
  SS: 'SS',
  OB: 'SS'
}

function normalizeSportPlatformCode(value) {
  const code = String(value || '').trim().toUpperCase()
  return SPORT_PLATFORM_ALIASES[code] || code
}

const mobileEsportGames = computed(() => {
  return mobileEsportPlatforms.value
    .map((platform) => {
      const candidates = allGamesCache.value.filter(
        (item) => normalizeSportPlatformCode(item?.platformCode) === platform.code
      )
      const game = candidates.find((item) => {
        const gameId = String(item?.gameId || '').trim().toLowerCase()
        return gameId === 'lobby' || gameId.endsWith('_lobby')
      }) || candidates[0]
      return game ? { ...game, uniqueId: `mobile-esport-${platform.code}` } : null
    })
    .filter(Boolean)
})

const activeEsportPlatform = ref('IM')
const activeEsportGame = computed(() => mobileEsportGames.value.find((game) => game.uniqueId.endsWith(activeEsportPlatform.value)) || mobileEsportGames.value[0] || null)

function selectEsportPlatform(code) {
  activeEsportPlatform.value = code
}

function enterEsportPlatform(code) {
  selectEsportPlatform(code)
  const game = mobileEsportGames.value.find((item) => item.uniqueId.endsWith(code))
  if (game) enter(game)
}

/** 导航分类码 → 游戏 type；hot 不是真实 type，fish 需映射为 fishing */
function resolveApiType(type = urlType.value) {
  const value = String(type || '').trim()
  if (!value || value === 'hot') return ''
  if (value === 'fish') return 'fishing'
  return value
}

function withApiType(params = {}) {
  const type = resolveApiType()
  return type ? { ...params, type } : { ...params }
}

const typeNameMap = computed(() => ({
  hot: t('game.hotGames'), slot: t('game.slot'), live: t('game.live'), chess: t('game.chess'),
  fish: t('game.fish'), fishing: t('game.fish'), sport: t('game.sport'), lottery: t('game.lottery'),
  esport: t('game.esport'), blockchain: t('game.blockchain'), mini: t('game.mini'), special: t('game.special')
}))

const typeIconMap = {
  slot: '/assets/img/icon_dtfl_dz_0.svg',
  live: '/assets/img/icon_dtfl_zr_0.svg',
  chess: '/assets/img/icon_dtfl_qp_0.svg',
  fish: '/assets/img/icon_dtfl_by_0.svg',
  fishing: '/assets/img/icon_dtfl_by_0.svg',
  sport: '/assets/img/icon_dtfl_ty_0.svg',
  lottery: '/assets/img/icon_dtfl_cp_0.svg',
  esport: '/assets/img/icon_dtfl_dj_0.svg',
  blockchain: '/assets/img/icon_dtfl_qkl_0.avif',
  mini: '/assets/img/icon_dtfl_dz_0.svg',
  special: '/assets/img/icon_dtfl_dz_0.svg'
}

const typeName = computed(() => typeNameMap.value[urlType.value] || t('game.slot'))
const mobileHallTitle = computed(() => isSportHall.value ? t('game.sportGame') : isLotteryHall.value ? t('game.lotteryGame') : isMobileEsportHall.value ? t('game.esportGame') : t('game.liveGame'))
const typeIcon = computed(() => typeIconMap[urlType.value] || '/assets/img/icon_dtfl_dz_0.svg')

const keyword = ref('')
const activePlatform = ref('ALL')
const activeTab = ref('hot')
const loading = ref(false)
const loadingMore = ref(false)
const hasLoadedOnce = ref(false)

const pageSize = 30
const apiPageSize = 100
const currentPage = ref(1)
const apiPage = ref(0)
const apiTotal = ref(0)
const hasMore = ref(false)
const scrollRef = ref(null)
const initialLoading = computed(() => loading.value && !hasLoadedOnce.value)

const platforms = ref([])
const allGamesCache = ref([])
const displayList = ref([])
const selectedProvider = computed(() => platforms.value.find(p => p.code === activePlatform.value))

const activeLivePlatform = ref('')
const liveLobbyEntries = computed(() => {
  const preferred = ['AG', 'WL', 'BGCTRL', 'BBIN']
  const grouped = new Map()
  allGamesCache.value.forEach((game) => {
    const platform = normalizeLivePlatformCode(game.platformCode)
    if (!platform) return
    const id = String(game.gameId || '').trim().toLowerCase()
    const existing = grouped.get(platform)
    if (!existing || id === 'lobby' || id.endsWith('_lobby')) grouped.set(platform, game)
  })
  return [...grouped.entries()]
    .filter(([platform]) => preferred.includes(platform))
    .sort(([a], [b]) => preferred.indexOf(a) - preferred.indexOf(b))
    .map(([platform, game]) => ({
      ...game,
      uniqueId: `live-lobby-${platform}`,
      platformCode: platform,
      gameId: String(game.gameId || '').toLowerCase().endsWith('_lobby') ? game.gameId : 'lobby',
      name: platform === 'AG' ? `Choice ${t('game.live')}` : platform === 'WL' ? `WL ${t('game.live')}` : `${platform} ${t('game.live')}`
    }))
})
const activeLiveEntry = computed(() =>
  liveLobbyEntries.value.find((entry) => entry.platformCode === activeLivePlatform.value) || liveLobbyEntries.value[0] || null
)

const MOBILE_LIVE_ARTWORKS = {
  AG: { tab: 'live-ag-tab.png', stage: 'live-ag-stage.png' },
  WL: { tab: '/assets/img/imgi_12_52_N_WL_LOGO.avif', stage: 'live-wl-stage.png' },
  BGCTRL: { tab: 'live-bg-tab.png', stage: 'live-bg-stage.png' },
  BBIN: { tab: 'live-bbin-tab.png', stage: 'live-bbin-stage.png' }
}

const MOBILE_SPORT_ARTWORKS = computed(() => ({
  IM: { tab: 'sport-im-tab.png', stage: 'sport-im-stage.png', name: `IM ${t('game.sportSuffix')}` },
  FB: { tab: 'sport-fb-tab.png', stage: 'sport-fb-stage.png', name: `FB ${t('game.sportSuffix')}` },
  SS: { tab: 'sport-ss-tab.png', stage: 'sport-ss-stage.png', name: `SS ${t('game.sportSuffix')}` }
}))

const activeShowcasePlatform = ref('')
const mobileShowcaseEntries = computed(() => {
  const preferredSportPlatforms = ['IM', 'FB', 'SS']
  const entries = isLiveHall.value ? liveLobbyEntries.value : (() => {
    const grouped = new Map()
    allGamesCache.value.forEach((game) => {
      const platform = String(game.platformCode || '').trim().toUpperCase()
      if (!platform || !MOBILE_SPORT_ARTWORKS.value[platform]) return
      const id = String(game.gameId || '').trim().toLowerCase()
      const existing = grouped.get(platform)
      if (!existing || id === 'lobby' || id.endsWith('_lobby')) grouped.set(platform, game)
    })
    return [...grouped.entries()]
      .sort(([a], [b]) => preferredSportPlatforms.indexOf(a) - preferredSportPlatforms.indexOf(b))
      .map(([platform, game]) => ({
        ...game,
        uniqueId: `sport-lobby-${platform}`,
        platformCode: platform,
        name: MOBILE_SPORT_ARTWORKS.value[platform].name
      }))
  })()

  return entries.map((entry) => {
    const assets = (isLiveHall.value ? MOBILE_LIVE_ARTWORKS : MOBILE_SPORT_ARTWORKS.value)[entry.platformCode]
    return {
      ...entry,
      mobileTab: assets.tab.startsWith('/') ? assets.tab : `/assets/img/mobile-halls/${assets.tab}`,
      mobileStage: `/assets/img/mobile-halls/${assets.stage}`
    }
  })
})

const activeShowcaseEntry = computed(() =>
  mobileShowcaseEntries.value.find((entry) => entry.platformCode === activeShowcasePlatform.value) || mobileShowcaseEntries.value[0] || null
)

watch(liveLobbyEntries, (entries) => {
  if (!entries.some((entry) => entry.platformCode === activeLivePlatform.value)) {
    activeLivePlatform.value = entries[0]?.platformCode || ''
  }
}, { immediate: true })

watch(mobileShowcaseEntries, (entries) => {
  if (!entries.some((entry) => entry.platformCode === activeShowcasePlatform.value)) {
    activeShowcasePlatform.value = entries[0]?.platformCode || ''
  }
}, { immediate: true })

// PC 与移动端共用大厅组件。缓存原始列表，切换厂商/返回大厅时只重新筛选，
// 避免同一页面生命周期内反复请求数千条游戏数据。
const gameListCache = new Map()
const platformListCache = new Map()
const auxiliaryListCache = new Map()
const pagedMetaCache = new Map()
const CACHE_TTL = 60 * 1000

function readCache(cache, key) {
  const entry = cache.get(key)
  if (!entry || Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.value
}

function writeCache(cache, key, value) {
  cache.set(key, { timestamp: Date.now(), value })
  return value
}

const gameCacheKey = computed(() => {
  if (isHotCategory.value) return `${urlType.value}:hot:${activePlatform.value}`
  if (activePlatform.value === 'ALL' || selectedProvider.value?.gameProvider) return `${urlType.value}:all:${activePlatform.value}`
  return `${urlType.value}:platform:${activePlatform.value}`
})

function pagedGameCacheKey(platform = activePlatform.value) {
  const scope = platform === 'ALL' ? 'all' : `platform:${platform}`
  return `${urlType.value}:paged:${scope}`
}

function cachedPagedGames(platform = activePlatform.value) {
  return readCache(gameListCache, pagedGameCacheKey(platform)) || []
}

function writePagedGames(platform, list, total) {
  const existing = cachedPagedGames(platform)
  const merged = [...existing]
  const seen = new Set(merged.map((game) => game.uniqueId))
  list.forEach((game) => {
    if (!seen.has(game.uniqueId)) {
      seen.add(game.uniqueId)
      merged.push(game)
    }
  })
  writeCache(gameListCache, pagedGameCacheKey(platform), merged)
  apiTotal.value = Number(total || merged.length)
  pagedMetaCache.set(pagedGameCacheKey(platform), { total: apiTotal.value, page: apiPage.value })
  return merged
}

function matchesActivePlatform(game) {
  if (activePlatform.value === 'ALL') return true
  const selected = selectedProvider.value
  if (selected?.gameProvider) {
    return String(game.platformCode || '').toUpperCase() === String(selected.platform || '').toUpperCase() &&
      String(game.gameProvider || '').toUpperCase() === String(selected.gameProvider).toUpperCase()
  }
  return String(game.platformCode || '').toUpperCase() === activePlatform.value.toUpperCase()
}

const tabs = computed(() => {
  if (isPcHall.value && (isSportHall.value || isLotteryHall.value)) {
    return [
      { key: 'all', name: t('game.all') },
      { key: 'hot', name: t('game.hot') },
      { key: 'recent', name: t('game.recent') },
      { key: 'fav', name: t('game.favorite') }
    ]
  }
  if (activePlatform.value === 'ALL') {
    return [
      { key: 'hot', name: t('game.hot') },
      { key: 'recent', name: t('game.recent') },
      { key: 'fav', name: t('game.favorite') }
    ]
  } else {
    return [
      { key: 'all', name: t('game.all') },
      { key: 'hot', name: t('game.hot') },
      { key: 'recent', name: t('game.recent') },
      { key: 'fav', name: t('game.favorite') }
    ]
  }
})

const USE_MOCK = false

const GAME_NAMES = Array.from({ length: 25 }, (_, index) => `Game ${index + 1}`)

onMounted(async () => {
  await Promise.all([
    loadPlatforms(),
    loadFavorites(),
    loadRecentGames()
  ])
  
  const restored = restoreScrollState()
  
  if (!restored) {
    if (urlPlatform.value) {
      activePlatform.value = urlPlatform.value
      activeTab.value = 'all'
    } else {
      activeTab.value = (isLiveHall.value || isSportHall.value || isLotteryHall.value) ? 'all' : 'hot'
    }
  }
  
  await loadGames()
})

watch(() => route.path, async (newPath) => {
  if (newPath.startsWith('/game/') && newPath !== '/game/search') {
    await Promise.all([
      loadFavorites(),
      loadRecentGames()
    ])
    if (activeTab.value === 'fav' || activeTab.value === 'recent') {
      filterAndSort()
    }
  }
}, { immediate: false })

function saveScrollState() {
  const scrollEl = document.querySelector('.slot-main')
  const scrollTop = scrollEl ? scrollEl.scrollTop : 0
  
  const state = {
    scrollTop,
    activePlatform: activePlatform.value,
    activeTab: activeTab.value,
    currentPage: currentPage.value,
    timestamp: Date.now()
  }
  sessionStorage.setItem(STATE_KEY, JSON.stringify(state))
}

function restoreScrollState() {
  const stateStr = sessionStorage.getItem(STATE_KEY)
  if (!stateStr) return false
  
  try {
    const state = JSON.parse(stateStr)

    if (Date.now() - state.timestamp > 5 * 60 * 1000) {
      sessionStorage.removeItem(STATE_KEY)
      return false
    }
    

    if (state.activePlatform) activePlatform.value = state.activePlatform
    if (state.activeTab) activeTab.value = state.activeTab
    if (state.currentPage) currentPage.value = state.currentPage
    

    nextTick(() => {
      setTimeout(() => {
        const scrollEl = document.querySelector('.slot-main')
        if (scrollEl && state.scrollTop) {
          scrollEl.scrollTop = state.scrollTop
        }
      }, 300)
    })
    

    sessionStorage.removeItem(STATE_KEY)
    return true
  } catch (e) {
    return false
  }
}

watch(activeTab, (newVal) => {
  filterAndSort()
})

async function loadPlatforms() {
  const cacheKey = String(urlType.value || 'all')
  const cached = readCache(platformListCache, cacheKey)
  if (cached) {
    platforms.value = cached
    return
  }
  try {
    if (urlType.value === 'lottery' || urlType.value === 'sport' || urlType.value === 'live') {
      platforms.value = []
      return
    }
    const res = await gameApi.getPlatforms(withApiType())
    const list = res?.data?.list || res?.data || []
    if (urlType.value === 'slot') {
      await loadSlotProviderStats()
      platforms.value = SLOT_PROVIDER_CATEGORIES.filter(hasSlotProviderGames).map(provider => ({
        code: provider.value,
        name: provider.label,
        icon: provider.icon || '',
        mark: provider.mark,
        platform: provider.platform,
        gameProvider: provider.gameProvider
      }))
    } else {
      platforms.value = list.map(x => ({
        code: x.code,
        name: normalizeProviderLabel(x.name, x.code),
        icon: x.icon || x.mobile_icon || '',
        mark: createProviderMark(x.code, x.name)
      }))
    }
    writeCache(platformListCache, cacheKey, platforms.value)
  } catch (e) {
    platforms.value = []
  }
}

function mapGameItem(g) {
  return {
    id: g.id || 0,
    uniqueId: g.gameId || g.game_id || `game_${g.id}`,
    gameId: g.gameId || g.game_id,
    name: g.name || g.game_name,
    platformCode: g.platform,
    gameProvider: String(g.gameProvider || g.providerCategory || '').trim().toUpperCase(),
    cover: g.cover || g.icon || '',
    hot: g.hot ? 1 : 0,
    type: g.type || resolveApiType() || ''
  }
}

// 热门标记可能因供应商同步短暂缺失，接口为空时使用当前分类中的热门标记兜底。
async function requestHotGames() {
  try {
    const hotRes = await gameApi.getHotGames(withApiType({ limit: 500 }))
    const payload = hotRes?.data
    const list = Array.isArray(payload) ? payload : (payload?.list || [])
    if (list.length) return list.map(mapGameItem).filter(matchesActivePlatform)
  } catch (e) {
    // 使用分类列表兜底
  }

  const localHot = allGamesCache.value.filter((game) => game.hot && matchesActivePlatform(game))
  if (localHot.length) return localHot.map((game) => ({ ...game, hot: 1 }))

  try {
    const fallback = await gameApi.getGameList(withApiType({ page: 1, limit: 500 }))
    const list = fallback?.data?.list || fallback?.list || []
    return list.map(mapGameItem).filter((game) => game.hot && matchesActivePlatform(game))
  } catch (e) {
    return []
  }
}

async function loadGames() {
  if (isMobileEsportHall.value) {
    activeTab.value = 'all'
    loading.value = true
    try {
      // 电竞入口复用体育大厅数据，只需平台入口记录，避免拉取过大的目录。
      const res = await gameApi.getGameList({ type: 'sport', page: 1, limit: 100 })
      const list = res?.data?.list || res?.list || []
      allGamesCache.value = list.map(mapGameItem)
      displayList.value = allGamesCache.value
    } catch (e) {
      allGamesCache.value = []
      displayList.value = []
    } finally {
      loading.value = false
      hasLoadedOnce.value = true
    }
    return
  }
  if (isLiveHall.value || isSportHall.value || isLotteryHall.value) {
    activeTab.value = 'all'
    loading.value = true
    try {
      // 体育/真人/彩票大厅展示的是平台入口，不需要一次拉取完整游戏目录。
      const res = await gameApi.getGameList(withApiType({ page: 1, limit: 100 }))
      const list = res?.data?.list || res?.list || []
      allGamesCache.value = list.map(mapGameItem)
      displayList.value = allGamesCache.value
    } catch (e) {
      allGamesCache.value = []
      displayList.value = []
    } finally {
      loading.value = false
      hasLoadedOnce.value = true
    }
    return
  }
  if (activeTab.value === 'all' && !isHotCategory.value) {
    await loadGamePage(1, false)
    filterAndSort()
    return
  }
  const fallbackCacheKey = isHotCategory.value
    ? `${urlType.value}:hot:ALL`
    : `${urlType.value}:all:ALL`
  const exactCached = readCache(gameListCache, gameCacheKey.value)
  const fallbackCached = exactCached || (activePlatform.value !== 'ALL' ? readCache(gameListCache, fallbackCacheKey) : null)
  const cached = fallbackCached
  if (cached) {
    const filtered = activePlatform.value === 'ALL' ? cached : cached.filter(matchesActivePlatform)
    allGamesCache.value = writeCache(gameListCache, gameCacheKey.value, filtered)
    filterAndSort()
    loading.value = false
    hasLoadedOnce.value = true
    return
  }
  loading.value = true
  displayList.value = []
  
  let rawList = []
  let requestSucceeded = false
  
  try {
    if (isHotCategory.value) {
      rawList = await requestHotGames()
      requestSucceeded = true
      // 热门大厅平台列表从热门游戏推导（无 category_code=hot）
      if (!platforms.value.length && rawList.length) {
        const seen = new Set()
        platforms.value = rawList
          .map((g) => g.platformCode)
          .filter((code) => code && !seen.has(code.toUpperCase()) && seen.add(code.toUpperCase()))
          .map((code) => ({ code, name: code, icon: '' }))
      }
    } else if (activePlatform.value === 'ALL' || selectedProvider.value?.gameProvider) {
      const res = await gameApi.getGameList(withApiType({
        page: 1, 
        limit: resolveApiType() === 'slot' ? 5000 : 500
      }))
      const list = res?.data?.list || res?.list || []
      rawList = list.map(mapGameItem)
      rawList = rawList.filter(matchesActivePlatform)
      requestSucceeded = true
    } else {
      const res = await gameApi.getGameList(withApiType({
        platform: activePlatform.value,
        page: 1, 
        limit: 200 
      }))
      const list = res?.data?.list || res?.list || []
      rawList = list.map(mapGameItem)
      requestSucceeded = true
    }
  } catch (e) {
    rawList = []
  }

  // 请求失败时不要把空数组写入缓存，否则重复进入大厅会命中空缓存而不再重试。
  allGamesCache.value = requestSucceeded
    ? writeCache(gameListCache, gameCacheKey.value, rawList)
    : rawList
  filterAndSort()
  loading.value = false
  hasLoadedOnce.value = true
}

async function loadGamePage(page = 1, append = true) {
  if (loadingMore.value || (append && !hasMore.value)) return
  const cacheKey = pagedGameCacheKey(activePlatform.value)
  if (page === 1) {
    const cached = cachedPagedGames(activePlatform.value)
    const meta = pagedMetaCache.get(cacheKey)
    if (cached.length && meta) {
      allGamesCache.value = cached
      apiTotal.value = meta.total
      apiPage.value = meta.page
      hasMore.value = cached.length < apiTotal.value
      return
    }
  }
  if (page === 1) {
    loading.value = true
    loadingMore.value = false
    apiPage.value = 0
    apiTotal.value = 0
    hasMore.value = true
    allGamesCache.value = []
  } else {
    loadingMore.value = true
  }

  try {
    // 厂商游戏混在平台目录里，不能只取默认首页 100 条再在前端筛选，
    // 否则某个厂商可能恰好不在这一页（PP 等厂商会直接显示为空）。
    // 选择任意具体平台/厂商时请求完整目录，再执行前端筛选。
    const isPlatformSelection = activePlatform.value !== 'ALL'
    const params = withApiType({
      page,
      limit: isPlatformSelection ? 5000 : apiPageSize
    })
    if (activePlatform.value !== 'ALL' && !selectedProvider.value?.gameProvider) {
      params.platform = activePlatform.value
    } else if (selectedProvider.value?.gameProvider) {
      params.platform = selectedProvider.value.platform
    }
    const res = await gameApi.getGameList(params)
    const payload = res?.data || res || {}
    const list = Array.isArray(payload.list) ? payload.list.map(mapGameItem) : []
    const filtered = isPlatformSelection ? list.filter(matchesActivePlatform) : list
    apiPage.value = page
    allGamesCache.value = writePagedGames(activePlatform.value, filtered, payload.total)
    // 具体平台/厂商已请求完整目录，不再基于“过滤后数量 < 原始总数”
    // 错误地显示继续加载。
    hasMore.value = !isPlatformSelection && allGamesCache.value.length < apiTotal.value && list.length >= apiPageSize
    if (!apiTotal.value) hasMore.value = !isPlatformSelection && list.length >= apiPageSize
  } catch (e) {
    if (page === 1) allGamesCache.value = []
    hasMore.value = false
  } finally {
    loading.value = false
    loadingMore.value = false
    hasLoadedOnce.value = true
  }
}

async function loadMoreGames() {
  if (activeTab.value !== 'all' || isHotCategory.value || loadingMore.value || !hasMore.value) return
  await loadGamePage(apiPage.value + 1, true)
  filterAndSort()
}

function onScroll(event) {
  const el = event?.target
  if (!el || activeTab.value !== 'all' || loadingMore.value || !hasMore.value) return
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 360) loadMoreGames()
}

const totalPages = computed(() => Math.ceil(displayList.value.length / pageSize))

const totalGames = computed(() => displayList.value.length)

const visibleGames = computed(() => {
  if (isLiveHall.value || isSportHall.value || isLotteryHall.value) return displayList.value
  if (activeTab.value === 'all') return displayList.value
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return displayList.value.slice(start, end)
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = []
  
  if (total <= 5) {

    for (let i = 1; i <= total; i++) pages.push(i)
  } else {

    pages.push(1)
    
    if (current > 3) pages.push('...')
    

    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    
    if (current < total - 2) pages.push('...')
    

    pages.push(total)
  }
  
  return pages
})

function goPage(page) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
}

async function filterAndSort() {
  let res = [...allGamesCache.value]
  

  if (keyword.value) {
    const k = keyword.value.toLowerCase()
    res = res.filter(g => g.name.includes(k) || g.platformCode.toLowerCase().includes(k))
  }

  const currentTab = activeTab.value
  
  if (currentTab === 'all') {
    // 热门大厅「全部」即全部热门游戏，已在 loadGames 中加载
  } else if (currentTab === 'fav') {
    const cacheKey = `${urlType.value}:favorites`
    const cachedFavorites = readCache(auxiliaryListCache, cacheKey)
    if (cachedFavorites) {
      res = cachedFavorites.filter(matchesActivePlatform)
      displayList.value = res
      currentPage.value = 1
      return
    }
    try {
      const favRes = await gameApi.getFavorites(withApiType())
      if (favRes.code === 0 && favRes.data) {
        let list = Array.isArray(favRes.data) ? favRes.data : (favRes.data.list || [])
        

        list = list.map(mapGameItem).filter(matchesActivePlatform)
        
        res = list
        writeCache(auxiliaryListCache, cacheKey, list)
      } else {
        res = []
      }
    } catch (e) {
      res = []
    }
    displayList.value = res
    currentPage.value = 1
    return
  } else if (currentTab === 'recent') {
    const cacheKey = `${urlType.value}:recent`
    const cachedRecent = readCache(auxiliaryListCache, cacheKey)
    if (cachedRecent) {
      res = cachedRecent.filter(matchesActivePlatform)
      displayList.value = res
      currentPage.value = 1
      return
    }
    try {
      const recentRes = await gameApi.getRecent(withApiType({ limit: 50 }))
      if (recentRes.code === 0 && recentRes.data) {
        let list = Array.isArray(recentRes.data) ? recentRes.data : (recentRes.data.list || [])
        

        list = list.map(mapGameItem).filter(matchesActivePlatform)
        
        res = list
        writeCache(auxiliaryListCache, cacheKey, list)
      } else {
        res = []
      }
    } catch (e) {
      res = []
    }
    displayList.value = res
    currentPage.value = 1
    return
  } else if (currentTab === 'hot') {
    // 热门大厅：缓存已是热门列表，按平台筛选即可，避免再传 type=hot
    if (isHotCategory.value) {
      res = res.filter(matchesActivePlatform)
      displayList.value = res
      currentPage.value = 1
      return
    }
    const hotCacheKey = `${urlType.value}:hot:${activePlatform.value}`
    const cachedHot = readCache(gameListCache, hotCacheKey)
    if (cachedHot) {
      displayList.value = cachedHot.filter(matchesActivePlatform).map((g) => ({ ...g, hot: 1 }))
      currentPage.value = 1
      return
    }
    const list = await requestHotGames()
    res = list.map((g) => ({ ...g, hot: 1 }))
    writeCache(gameListCache, hotCacheKey, res)
    displayList.value = res
    currentPage.value = 1
    return
  }
  
  displayList.value = [...res] // 强制创建新数组触发响应式
  currentPage.value = 1 // 重置分页
}

function generateMockGames(platformCode, count) {
  return Array.from({ length: count }, (_, i) => {
    const nameIdx = Math.floor(Math.random() * GAME_NAMES.length)
    return {
      uniqueId: `${platformCode}_${i}`,
      gameId: `${platformCode}_g${i}`,
      name: GAME_NAMES[nameIdx] + (i > 0 ? ` ${i}` : ''),
      platformCode: platformCode,
      cover: `https://picsum.photos/seed/${platformCode}${i}/200/200`, // 随机图
      hot: Math.floor(Math.random() * 1000),
      isFav: false
    }
  })
}

function getPlatformIcon(code) {
  const platform = platforms.value.find(p => p.code === code)
  if (platform?.icon) {
    return platform.icon
  }
  return ''
}

function getPlatformMark(code) {
  const platform = platforms.value.find(p => p.code === code)
  return platform?.mark || createProviderMark(code, platform?.name)
}

async function switchPlatform(code) {
  if (activePlatform.value === code) return
  activePlatform.value = code

  activeTab.value = code === 'ALL' ? 'hot' : 'all'
  keyword.value = ''
  currentPage.value = 1
  apiPage.value = 0
  hasMore.value = false
  await loadGames()
  await nextTick()
  document.querySelector('.source-mobile-hall .game-scroll-area')?.scrollTo({ top: 0 })
}

function switchTab(key) {
  if (activeTab.value === key) return
  activeTab.value = key
  if (key === 'all') loadGames()
}

function onSearchInput() {
  filterAndSort()
}

function onImgError(e) {
  e.target.style.display = 'none'  // 隐藏加载失败的图片
}

const favSet = ref(new Set())

async function loadFavorites() {
  const cacheKey = `${urlType.value}:favorites`
  const cached = readCache(auxiliaryListCache, cacheKey)
  if (cached) {
    favSet.value = new Set(cached.map(g => g.gameId))
    return
  }
  try {

    const res = await gameApi.getFavorites(withApiType())
    if (res.code === 0 && res.data) {
      let list = Array.isArray(res.data) ? res.data : (res.data.list || [])

      const normalized = list.map(mapGameItem)
      writeCache(auxiliaryListCache, cacheKey, normalized)
      favSet.value = new Set(normalized.map(g => g.gameId))
    }
  } catch (e) {
  }
}

function isFav(g) {

  return favSet.value.has(g.gameId)
}

async function toggleFav(g) {
  const isFavorited = favSet.value.has(g.gameId)
  
  try {
    if (isFavorited) {
      await gameApi.removeFavorite({
        platform: g.platformCode,
        gameId: g.gameId
      })
      favSet.value.delete(g.gameId)
      showToast(t('game.unfavoriteSuccess'))
    } else {
      await gameApi.addFavorite({
        platform: g.platformCode,
        gameId: g.gameId,
        type: g.type || resolveApiType() || undefined
      })
      favSet.value.add(g.gameId)
      showToast(t('game.favoriteSuccess'))
    }
    

    if (activeTab.value === 'fav') {
      filterAndSort()
    }
  } catch (err) {
    showToast(t('game.operateFailed'))
  }
}

const recentGames = ref(new Set())

async function loadRecentGames() {
  const cacheKey = `${urlType.value}:recent`
  const cached = readCache(auxiliaryListCache, cacheKey)
  if (cached) {
    recentGames.value = new Set(cached.map(g => g.gameId))
    return
  }
  try {
    const res = await gameApi.getRecent(withApiType({ limit: 50 }))
    if (res.code === 0 && res.data) {
      let list = Array.isArray(res.data) ? res.data : (res.data.list || [])
      const normalized = list.map(mapGameItem)
      writeCache(auxiliaryListCache, cacheKey, normalized)
      recentGames.value = new Set(normalized.map(g => g.gameId))
    }
  } catch (e) {
  }
}

async function saveRecentGame(platform, gameId, gameType = '') {
  try {
    const type = gameType || resolveApiType() || undefined
    const res = await gameApi.addRecent({ 
      platform, 
      gameId,
      ...(type ? { type } : {})
    })
    if (res.code === 0) {
      recentGames.value.add(gameId)
    }
  } catch (e) {
  }
}

async function enter(g) {
  const token = localStorage.getItem('token')
  if (!token) {
    showToast(t('game.pleaseLogin'))
    setTimeout(() => router.push(isPcHall.value ? '/pc?auth=login' : '/home-new?auth=login'), 1500)
    return
  }
  
  console.log('SlotHall enterGame', g)
  console.log('传递参数: platform=', g.platformCode, 'gameId=', g.gameId || g.uniqueId)
  
  saveRecentGame(g.platformCode, g.gameId, g.type).catch(() => {})
  saveScrollState()
  
  router.push(resolveGamePlayLocation({
    platform: g.platformCode,
    gameId: g.gameId || g.uniqueId
  }))
}

function goBack() {
  if (isPcHall.value) {
    router.push('/pc')
    return
  }
  router.back()
}

function focusSearch() {
  document.querySelector('.source-mobile-hall .search-input')?.focus()
}

</script>

<style scoped>

.slot-page {
  --primary-color: #26A17B; 
  --bg-color: #f5f5f5;
  --sidebar-bg: #ffffff;
  --text-main: #333333;
  --text-sub: #999999;
  --border-color: #eeeeee;
  
  height: 100vh;
  width: 100%;
  max-width: 100vw; 
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color) !important;
  overflow: hidden; 
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
}

.slot-header {
  width: 100%;
  height: 50.59px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 18px;
  font-weight: 500;
  color: #000;
  position: relative;
  z-index: 10;
  border-radius: 0; 
}
.back { width: 40px; height: 100%; display: flex; align-items: center; justify-content: flex-start; padding-left: 4px; color: #333; }
.right-action { width: 40px; }

.search-bar {
  background: #f5f5f5; 
  padding: 8px 12px;
  margin-top: 2px; 
}
.search-input-box {
  background: #fff; 
  border-radius: 14px;
  max-width: 407.09px;
  height: 28.66px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid #eee;
}
.search-btn { 
  width: 30px; 
  height: 100%; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  cursor: pointer;
}
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #333;
}
.search-input::placeholder { color: #ccc; }

.slot-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: transparent;
  min-height: 0;
}

.slot-layout.no-platform-sidebar .slot-main {
  width: 100%;
}

.platform-sidebar {
  width: 96px;
  background: transparent;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  padding-top: 5px; 
  padding-bottom: 10px;
  align-items: center;
  flex-shrink: 0;
  -webkit-overflow-scrolling: touch;
}

.platform-item {
  width: 86px !important;
  height: 40px !important;
  min-height: 40px !important;
  margin: 4px 0;
  display: flex;
  flex-direction: row; 
  align-items: center;
  justify-content: flex-start;
  padding-left: 2px;
  padding-right: 2px;
  transition: all 0.2s;
  
  
  background-image: url('/assets/img/btn_zc1_2.avif');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-color: transparent; 
  border: none;
}

.platform-item.active {
  background-image: url('/assets/img/btn_zc1_1.avif');
  color: #fff;
  box-shadow: none; 
}

.platform-item.active .p-name { color: #fff; font-weight: bold; margin-top: 0; }

.platform-item .p-name { 
  font-size: 13.76px; 
  margin-top: 0; 
  margin-left: 10px;
  color: #666;
  flex: 1;
  line-height: 1.2;
  word-break: break-all;
}

.p-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.p-img { width: 27.52px; height: 27.52px; object-fit: contain; }
.p-mark { color: #247fd1; font-size: 15px; font-weight: 700; line-height: 28px; }
.dz-icon { width: 27.52px; height: 20.91px; transition: filter 0.2s; }
.dz-icon-active { filter: brightness(0) invert(1); }
.p-text-icon { font-weight: bold; color: #20bd81; font-size: 14px; } 

.slot-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
  margin-left: 2px;
  overflow: hidden;
  min-width: 0;
}

.filter-tabs {
  display: flex;
  padding: 10px 12px;
  gap: 8px;
  background: #f5f5f5;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; 
}
.filter-tabs::-webkit-scrollbar {
  display: none; 
}
.tab-item {
  min-width: 60px;
  flex-shrink: 0; 
  height: 29.53px !important;
  flex: none; 
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 13px;
  border: 1px solid #ddd;
  color: #666;
  background: #fff;
  transition: all 0.2s;
}
.tab-item.active {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
  font-weight: 500;
}

.game-scroll-area {
  flex: 1;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 12px 12px;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px 10px;  
  justify-items: center;
}

.game-card {
  width: 74px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-cover-box {
  width: 74px;
  height: 74px;
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  margin-bottom: 6px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
}

.game-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.img-placeholder { width: 100%; height: 100%; background: #f0f0f0; }
.game-img-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
  font-weight: bold;
}

.badge-fav {
  position: absolute;
  top: 2px;
  right: 2px;
}

.live-hall-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 4px 2px 16px;
}

.live-hall-card {
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
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

.pc-hall .live-hall-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  max-width: 960px;
}

.pc-hall .live-hall-card {
  border-radius: 12px;
  min-width: 0;
}

.pc-hall .live-hall-card:hover {
  transform: translateY(-1px);
  filter: brightness(1.03);
}
.badge-fav .fav-img {
  width: 18px;
  height: 18px;
  display: block;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
}

.badge-platform {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: transparent;
}
.badge-platform-icon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  display: block;
}
.badge-platform-mark {
  min-width: 28px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  border-radius: 3px;
  color: #247fd1;
  background: rgba(255, 255, 255, 0.9);
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
}

.badge-hot {
  position: absolute;
  top: 2px;
  left: 2px;
  background: #ff4d4f;
  color: #fff;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.game-name {
  font-size: 12px;
  color: #333;
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.empty-box {
  padding-top: 60px;
  display: flex;
  justify-content: center;
}

.pagination-fixed {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 16px 0 20px;
  margin-top: 12px;
  background: #f5f5f5;
}
.page-item {
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}
.page-item:active {
  transform: scale(0.95);
}
.page-item.active {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}
.page-item.disabled {
  color: #ccc;
  cursor: not-allowed;
  pointer-events: none;
}
.page-dots {
  color: #999;
  font-size: 14px;
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 2px; }

/* Mobile hall styling follows the source site's black-gold catalogue. */
.source-mobile-hall {
  --source-gold: #fbe59c;
  --source-gold-strong: #e2bd4f;
  --source-muted: #9a917c;
  background: #000 !important;
  color: #fbe59c;
}

.load-more-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 8px 0 22px;
  color: #8f8f8f;
  font-size: 12px;
}

.switch-loading {
  position: absolute;
  z-index: 4;
  top: 12px;
  left: 50%;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 30px;
  padding: 0 12px;
  border: 1px solid rgba(215, 181, 109, .35);
  border-radius: 16px;
  background: rgba(20, 20, 20, .88);
  color: #d7b56d;
  font-size: 12px;
  transform: translateX(-50%);
  pointer-events: none;
}

.source-mobile-hall :deep(.van-skeleton) {
  padding: 8px 10px 0;
  background: #000;
}

.source-mobile-hall :deep(.van-skeleton__title),
.source-mobile-hall :deep(.van-skeleton__row) {
  height: 12px;
  margin-top: 12px;
  border-radius: 3px;
  background: linear-gradient(90deg, #1d1d1d 25%, #34302a 37%, #1d1d1d 63%);
  background-size: 400% 100%;
}

.source-mobile-hall :deep(.van-skeleton__title) {
  width: 38%;
  margin-bottom: 18px;
}

.source-mobile-hall :deep(.van-skeleton__row) {
  width: 100%;
}

.source-mobile-hall .slot-header {
  position: relative;
  height: calc(52px + env(safe-area-inset-top, 0px));
  box-sizing: border-box;
  padding: env(safe-area-inset-top, 0px) 10px 0;
  background: #050505;
  border-bottom: 1px solid rgba(251, 229, 156, 0.2);
  color: var(--source-gold);
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 42px;
  align-items: center;
}

.source-mobile-hall .back,
.source-mobile-hall .right-action {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  color: var(--source-gold);
  background: transparent;
}

.source-mobile-hall .right-action { display: none; }

.source-mobile-hall .mobile-live-title {
  grid-column: 2;
  margin: 0;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
}

.source-mobile-hall .slot-brand {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  cursor: pointer;
  display: none;
}

.source-mobile-hall .slot-brand img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.source-mobile-hall .slot-brand div {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.1;
}

.source-mobile-hall .slot-brand strong { font-size: 14px; color: #f2d77a; }
.source-mobile-hall .slot-brand span { margin-top: 3px; color: #8d846e; font-size: 11px; }

.source-mobile-hall .search-bar {
  position: absolute;
  top: env(safe-area-inset-top, 0px);
  left: 42px;
  right: 42px;
  height: 52px;
  box-sizing: border-box;
  margin: 0;
  padding: 10px 8px;
  background: transparent;
  z-index: 2;
}

.source-mobile-hall .search-input-box:focus-within {
  outline: 1px solid rgba(251, 229, 156, 0.28);
}

.source-mobile-hall .search-input-box {
  height: 32px;
  max-width: none;
  border: 0;
  border-radius: 0;
  background: #171717;
}

.source-mobile-hall .search-input { color: #f3e5ad; }
.source-mobile-hall .search-input::placeholder { color: #756d5d; }
.source-mobile-hall .search-btn { color: var(--source-gold); }

.source-mobile-hall .slot-layout {
  display: block;
  overflow: hidden;
  background: #000;
}

.source-mobile-hall .platform-sidebar {
  width: 83px;
  height: calc(100vh - 52px);
  float: left;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  padding: 0;
  overflow-x: hidden;
  overflow-y: auto;
  background: #070707;
  border-right: 1px solid #1e1e1e;
}

.source-mobile-hall .platform-item {
  flex: 0 0 56px;
  width: 100% !important;
  min-width: 0 !important;
  height: 56px !important;
  min-height: 56px !important;
  margin: 0;
  padding: 0 5px;
  justify-content: center;
  border: 0;
  border-bottom: 1px solid #1e1e1e;
  border-left: 2px solid transparent;
  border-radius: 0;
  background: #101010;
  background-image: none;
}

.source-mobile-hall .platform-item.active {
  border-left-color: var(--source-gold-strong);
  background: #171717;
}

.source-mobile-hall .platform-item .p-icon { display: none; }
.source-mobile-hall .platform-item .p-name { margin: 0; color: #c9bc9d; font-size: 12px; text-align: center; }
.source-mobile-hall .platform-item.active .p-name { color: var(--source-gold-strong); }

.source-mobile-hall .slot-main {
  display: block;
  width: calc(100% - 83px);
  margin-left: 83px;
  overflow: hidden;
  background: #000;
}

.source-mobile-hall .slot-layout.no-platform-sidebar .slot-main {
  width: 100%;
  margin-left: 0;
}

.source-mobile-hall .filter-tabs {
  display: none;
}

.source-mobile-hall .tab-item {
  min-width: 58px;
  height: 30px !important;
  border: 1px solid #4a4027;
  border-radius: 3px;
  color: #b7aa8d;
  background: #17130b;
  font-size: 12px;
}

.source-mobile-hall .tab-item.active {
  border-color: var(--source-gold);
  color: #000;
  background: var(--source-gold);
}

.source-mobile-hall .game-scroll-area {
  min-height: calc(100vh - 52px);
  padding: 10px 8px 26px;
  background: #000;
}

.source-mobile-hall .game-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 9px;
  justify-items: stretch;
}

.source-mobile-hall .game-card {
  width: 100%;
  height: auto;
  min-width: 0;
  display: flex;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.source-mobile-hall .game-cover-box {
  width: 100%;
  height: auto;
  aspect-ratio: 1.12;
  margin: 0;
  border: 0;
  border-radius: 0;
  background: #101010;
  box-shadow: none;
}

.source-mobile-hall .game-img {
  /* 源站图标比例不完全一致，contain 避免顶部/底部被 cover 裁掉；留出内边距让图标更完整。 */
  object-fit: contain;
  padding: 5px 8px 2px;
}
.source-mobile-hall .game-name {
  box-sizing: border-box;
  min-height: 31px;
  padding: 7px 8px 6px;
  color: #dedede;
  background: #202020;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
}

@media (max-width: 699px) {
  .source-mobile-hall .game-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 9px; }
}

.source-mobile-hall .badge-fav,
.source-mobile-hall .badge-platform { display: none; }

.source-mobile-hall .live-hall-list {
  gap: 10px;
  padding: 0 0 18px;
}

.source-mobile-hall .live-hall-card {
  border: 1px solid #3d321b;
  border-radius: 4px;
  background: #080808;
}

.source-mobile-hall .mobile-live-hall {
  min-height: calc(100vh - 52px);
  background: #151515;
}

.source-mobile-hall .mobile-live-platforms {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  min-height: 92px;
  padding: 10px 0;
  scrollbar-width: none;
}

.source-mobile-hall .mobile-esport-hall {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 52px);
  padding: 10px 0 24px;
  background: #151515;
}

.source-mobile-hall .mobile-esport-platforms {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 0 10px 10px;
  scrollbar-width: none;
}

.source-mobile-hall .mobile-esport-platforms::-webkit-scrollbar { display: none; }

.source-mobile-hall .mobile-esport-platforms button {
  flex: 0 0 78px;
  min-width: 78px;
  height: 78px;
  padding: 5px 4px 7px;
  overflow: hidden;
  border: 1px solid #3b372d;
  border-radius: 11px;
  background: linear-gradient(145deg, #262626, #101010);
  color: #c5b88d;
  font-size: 11px;
}

.source-mobile-hall .mobile-esport-platforms button.active {
  border-color: #f2dc88;
  color: #f8e9ad;
  box-shadow: inset 0 0 14px rgba(239, 204, 99, .18);
}

.source-mobile-hall .mobile-esport-platforms img {
  display: block;
  width: 100%;
  height: 42px;
  margin-bottom: 3px;
  object-fit: contain;
}

.source-mobile-hall .mobile-esport-stage {
  position: relative;
  min-height: calc(100vh - 154px);
  overflow: hidden;
  background: #151515;
}

.source-mobile-hall .mobile-esport-stage > img {
  display: block;
  width: 100%;
  height: auto;
  min-height: 500px;
  object-fit: cover;
  object-position: top center;
}

.source-mobile-hall .mobile-live-platforms::-webkit-scrollbar { display: none; }

.source-mobile-hall .mobile-live-platforms button {
  flex: 0 0 78px;
  min-width: 78px;
  height: 78px;
  padding: 5px 4px 7px;
  overflow: hidden;
  border: 1px solid #3b372d;
  border-radius: 11px;
  background: linear-gradient(145deg, #262626, #101010);
  color: #c5b88d;
  font-size: 11px;
}

.source-mobile-hall .mobile-live-platforms button.active {
  border-color: #f2dc88;
  color: #f8e9ad;
  box-shadow: inset 0 0 14px rgba(239, 204, 99, .18);
}

.source-mobile-hall .mobile-live-platforms img {
  display: block;
  width: 100%;
  height: 42px;
  margin-bottom: 3px;
  object-fit: contain;
}

.source-mobile-hall .mobile-live-stage {
  position: relative;
  min-height: calc(100vh - 144px);
  padding: 0 0 42px;
  text-align: center;
  background: #151515;
}

.source-mobile-hall .mobile-live-banner {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  -webkit-tap-highlight-color: transparent;
}

.source-mobile-hall .mobile-live-banner img {
  display: block;
  width: 100%;
  height: auto;
  min-height: 400px;
  max-height: none;
  object-fit: contain;
  object-position: top center;
}

.source-mobile-hall .mobile-live-wl-correction {
  position: absolute;
  z-index: 2;
  top: 4.8%;
  left: 2.4%;
  width: 52%;
  min-height: 0;
  padding: 1% 0 3.5%;
  background: linear-gradient(90deg, #151515 0%, #151515 86%, rgba(21, 21, 21, 0) 100%);
  color: #dfc487;
  text-align: left;
  pointer-events: none;
}

.source-mobile-hall .mobile-live-wl-correction img {
  width: 18%;
  min-height: 0;
  margin: 0 0 3%;
  object-fit: contain;
}

.source-mobile-hall .mobile-live-wl-correction strong {
  display: block;
  margin-bottom: 9%;
  font-size: clamp(22px, 7vw, 32px);
  font-weight: 600;
  line-height: 1;
  text-shadow: 1px 2px 2px #000;
}

.source-mobile-hall .mobile-live-wl-correction span {
  display: block;
  font-size: clamp(12px, 3.7vw, 17px);
  line-height: 1.55;
}

.source-mobile-hall .mobile-live-dots {
  position: absolute;
  right: 0;
  bottom: 18px;
  left: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
}

.source-mobile-hall .mobile-live-dots span {
  width: 8px;
  height: 8px;
  border: 1px solid #c79855;
  border-radius: 50%;
  background: #735632;
}

.source-mobile-hall .mobile-live-dots span.active {
  border-color: #fff0bd;
  background: #fff0bd;
}

.source-mobile-hall.mobile-showcase-hall-page .back {
  color: #fff;
}

.source-mobile-hall .game-scroll-area.mobile-showcase-scroll {
  padding-right: 0;
  padding-left: 0;
}

.source-mobile-hall .mobile-live-enter {
  min-width: 148px;
  height: 42px;
  margin-top: 20px;
  border: 1px solid #efb444;
  border-radius: 8px;
  background: linear-gradient(#714123, #25140d);
  box-shadow: inset 0 0 7px rgba(255, 195, 67, .55);
  color: #fff;
  font-size: 20px;
}

.source-mobile-hall .source-banner-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  padding-bottom: 18px;
}

.source-mobile-hall .source-banner-card {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: 1px solid #3d321b;
  border-radius: 4px;
  background: #080808;
  color: #1b1609;
  text-align: left;
}

.source-mobile-hall .source-banner-card img {
  display: block;
  width: 100%;
  aspect-ratio: 466 / 211;
  object-fit: cover;
}

.source-mobile-hall .source-banner-card span {
  display: block;
  padding: 7px 10px;
  color: #1b1609;
  background: var(--source-gold);
  font-size: 13px;
  font-weight: 600;
}

.source-mobile-hall .pagination-fixed { display: none; }
.source-mobile-hall .empty-box { padding: 60px 0; color: #9a917c; }

@media (min-width: 700px) {
  .source-mobile-hall .game-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

.slot-page.pc-hall {
  position: absolute;
  background: #f3f5f7 !important;
}

.pc-hall .slot-header {
  height: 64px;
  padding: 0 32px;
  border-bottom: 1px solid #e5e9ee;
  box-shadow: 0 2px 8px rgba(25, 35, 45, 0.05);
}

.pc-hall .back {
  width: 48px;
  cursor: pointer;
}

.pc-hall .title {
  font-size: 20px;
  font-weight: 600;
}

.pc-hall .search-bar {
  padding: 16px 32px 12px;
  margin: 0;
  background: #f3f5f7;
}

.pc-hall .search-input-box {
  max-width: 720px;
  height: 40px;
  margin: 0 auto;
  border-radius: 6px;
  border-color: #dfe4ea;
}

.pc-hall .slot-layout {
  width: calc(100% - 64px);
  max-width: 1440px;
  margin: 0 auto 24px;
  background: #fff;
  border: 1px solid #e5e9ee;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(25, 35, 45, 0.06);
}

.pc-hall .platform-sidebar {
  width: 220px;
  padding: 14px 12px;
  align-items: stretch;
  background: #f8fafb;
  border-right: 1px solid #e5e9ee;
}

.pc-hall .platform-item {
  width: 100% !important;
  height: 48px !important;
  min-height: 48px !important;
  margin: 3px 0;
  padding: 0 14px;
  border-radius: 4px;
  border: 1px solid #e5e9ee;
  background: #fff;
  background-image: none;
  cursor: pointer;
}

.pc-hall .platform-item.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  background-image: none;
}

.pc-hall .platform-item .p-name {
  margin-left: 14px;
  font-size: 14px;
  word-break: normal;
}

.pc-hall .filter-tabs {
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #eef1f4;
}

.pc-hall .tab-item {
  min-width: 88px;
  height: 36px !important;
  cursor: pointer;
}

.pc-hall .game-scroll-area {
  padding: 20px 24px 28px;
}

.pc-hall .source-banner-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 392px));
  align-content: start;
  justify-content: center;
  gap: 28px 24px;
}

.pc-hall .source-banner-card {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: 1px solid #e0e5ea;
  border-radius: 8px;
  background: #0b0b0b;
  box-shadow: 0 5px 16px rgba(28, 36, 44, .12);
  color: #fff;
  text-align: left;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease;
}

.pc-hall .source-banner-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(28, 36, 44, .18);
}

.pc-hall .source-banner-card img {
  display: block;
  width: 100%;
  aspect-ratio: 392 / 138;
  object-fit: cover;
}

.pc-hall .source-banner-card span {
  display: block;
  padding: 11px 14px;
  overflow: hidden;
  border-top: 1px solid rgba(255, 255, 255, .08);
  background: linear-gradient(90deg, #171717, #29231a);
  color: #f0d58b;
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-hall .game-grid {
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 28px 22px;
  justify-items: stretch;
}

.pc-hall .game-card {
  width: 100%;
  min-width: 0;
  cursor: pointer;
}

.pc-hall .game-cover-box {
  width: min(100%, 160px);
  height: auto;
  aspect-ratio: 1;
  margin: 0 auto 10px;
  border-radius: 8px;
}

.pc-hall .game-name {
  font-size: 14px;
}

.pc-hall .pagination-fixed {
  margin: 0;
  padding: 14px 0 18px;
  background: #fff;
  border-top: 1px solid #eef1f4;
}

@media (max-width: 900px) {
  .pc-hall .slot-layout {
    width: calc(100% - 32px);
  }

  .pc-hall .platform-sidebar {
    width: 170px;
  }

  .pc-hall .game-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  }
}
</style>
