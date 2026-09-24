<template>
  <div class="v5-game-container">
    <div class="mobile-category-grid" :aria-label="t('home.categories')">
      <button
        class="side-item"
        v-for="entry in mobileCategoryEntries"
        :key="entry.code"
        type="button"
        :class="{ active: entry.code !== 'activity' && activeCategory === entry.code }"
        @click="handleMobileCategoryClick(entry)"
      >
        <span class="side-icon-box">
          <img :src="resolveStaticAsset(entry.iconImg)" class="side-icon-img" @error="hideBrokenImg" />
        </span>
        <span class="side-text">{{ entry.name }}</span>
      </button>
    </div>

    <div class="content-area" ref="contentRef" @scroll="onContentScroll">
      <!-- 首页纵向预览：各分类统一热门网格样式，默认前 15 个；滚动切分类 -->
      <template v-if="showsLegacyLobby">
        <div 
          v-for="(tab, index) in homeSections"
          :key="tab.code"
          :id="`cat-${index}`"
          :class="['category-section', { 'hot-category-section': tab.code === 'hot' }]"
        >
          <div class="category-header" v-if="tab.code !== 'hot'">
            <img :src="resolveStaticAsset(tab.iconImg)" class="cat-icon" @error="hideBrokenImg" />
            <span class="cat-title">{{ getCategoryTitle(tab) }}</span>
            <span class="cat-all" v-if="tab.code !== 'esport'" @click="goToAllPlatforms(tab)">{{ $t('game.all') }}</span>
          </div>
          
          <div class="mobile-hot-heading" v-else>
            <span class="hot-badge">HOT</span>
            <strong>{{ t('game.hotGames') }}</strong>
            <button type="button" v-if="hotPageCount > 1" @click="nextHotPage">{{ t('home.swipeForMore') }}</button>
          </div>

          <div
            class="provider-tabs"
            v-if="tab.code !== 'hot' && tab.code !== 'lottery' && tab.code !== 'sport' && tab.code !== 'live' && getProviderOptions(tab.code).length > 1"
          >
            <button
              v-for="provider in getProviderOptions(tab.code)"
              :key="`${tab.code}-${provider.value}`"
              type="button"
              class="provider-tab"
              :class="{ active: getLobbyProvider(tab.code) === provider.value }"
              :aria-label="provider.label"
              @click="setLobbyProvider(tab.code, provider.value)"
            >
              <img v-if="provider.icon" :src="provider.icon" class="provider-icon" @error="hideBrokenImg" />
              <span v-else-if="provider.mark" class="provider-mark">{{ provider.mark }}</span>
              <span v-if="provider.value === 'all' || (!provider.icon && !provider.mark)">{{ provider.label }}</span>
            </button>
          </div>

          <div class="section-content">
            <div class="platform-loading" v-if="getCategoryState(tab.code).loading">
              <van-loading type="spinner" color="#009688" size="24px" />
              <span style="margin-top:8px;font-size:12px">{{ $t('common.loading') }}...</span>
            </div>

            <template v-else-if="tab.code === 'hot'">
              <div
                class="hot-swipe-viewport"
                @touchstart="onHotTouchStart"
                @touchend="onHotTouchEnd"
              >
                <transition :name="'tab-' + slideDirection">
                <div class="game-grid hot-page" :key="`${hotSubTab}-${hotPage}`">
                <div 
                  class="game-card" 
                  v-for="(game, idx) in getHotVisibleItems()" 
                  :key="game.id || idx" 
                  @click="enterGame(game)"
                >
                  <div class="img-box">
                    <van-image :src="resolveMediaUrl(game.image)" class="g-img" fit="cover" loading="lazy" v-if="game.image" />
                    <div class="g-placeholder" v-else :style="{background: game.color}">{{ game.name[0] }}</div>
                  </div>
                  <div class="g-name">{{ game.name }}</div>
                  <div class="like-icon" @click.stop="toggleFavorite(game)">
                    <van-icon
                      :name="isFavorited(game) ? 'like' : 'like-o'"
                      class="fav-icon"
                      color="#e60012"
                      size="18"
                    />
                  </div>
                </div>
                </div>
                </transition>
              </div>
            </template>

            <template v-else-if="tab.code === 'lottery'">
              <div class="lottery-hall-list" v-if="getVisibleItems(tab.code).length">
                <button
                  v-for="(game, idx) in getVisibleItems(tab.code)"
                  :key="game.id || idx"
                  type="button"
                  class="lottery-hall-card"
                  :aria-label="game.name"
                  @click="enterGame(game)"
                >
                  <van-image
                    :src="resolveLotteryHallCover(game)"
                    class="lottery-hall-cover"
                    fit="cover"
                    loading="lazy"
                  />
                  <span class="lottery-hall-shade"></span>
                  <span class="lottery-hall-title">{{ game.name }}</span>
                  <van-icon name="arrow" class="lottery-hall-arrow" size="18" />
                </button>
              </div>
              <div class="platform-empty" v-else>
                <span style="font-size:12px;color:#ccc">{{ $t('common.noData') }}</span>
              </div>
            </template>

            <template v-else-if="tab.code === 'live'">
              <div class="live-hall-list" v-if="getVisibleItems(tab.code).length">
                <button
                  v-for="(game, idx) in getVisibleItems(tab.code)"
                  :key="game.id || idx"
                  type="button"
                  class="live-hall-card"
                  :aria-label="resolveLiveHallTitle(game)"
                  @click="enterGame(game)"
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
              <div class="platform-empty" v-else>
                <span style="font-size:12px;color:#ccc">{{ $t('common.noData') }}</span>
              </div>
            </template>

            <template v-else-if="tab.code === 'sport'">
              <div class="sport-hall-list" v-if="getVisibleItems(tab.code).length">
                <button
                  v-for="(game, idx) in getVisibleItems(tab.code)"
                  :key="game.id || idx"
                  type="button"
                  class="sport-hall-card"
                  :aria-label="resolveSportHallTitle(game)"
                  @click="enterGame(game)"
                >
                  <img
                    :src="resolveSportHallCover(game)"
                    class="sport-hall-cover"
                    alt=""
                    loading="lazy"
                    @error="hideBrokenImg"
                  />
                  <span class="sport-hall-title">{{ resolveSportHallTitle(game) }}</span>
                </button>
              </div>
              <div class="platform-empty" v-else>
                <span style="font-size:12px;color:#ccc">{{ $t('common.noData') }}</span>
              </div>
            </template>

            <template v-else>
              <div class="game-grid" v-if="getVisibleItems(tab.code).length">
                <div
                  class="game-card"
                  v-for="(game, idx) in getVisibleItems(tab.code)"
                  :key="game.id || idx"
                  @click="enterGame(game)"
                >
                  <div class="img-box">
                    <van-image :src="resolveMediaUrl(game.image)" class="g-img" fit="cover" loading="lazy" v-if="game.image" />
                    <div class="g-placeholder" v-else :style="{ background: game.color }">{{ (game.name || '?')[0] }}</div>
                  </div>
                  <div class="g-name">{{ game.name }}</div>
                  <div class="like-icon" @click.stop="toggleFavorite(game)">
                    <van-icon
                      :name="isFavorited(game) ? 'like' : 'like-o'"
                      class="fav-icon"
                      color="#e60012"
                      size="18"
                    />
                  </div>
                </div>
              </div>
              <div class="platform-empty" v-else>
                <span style="font-size:12px;color:#ccc">{{ $t('common.noData') }}</span>
              </div>
            </template>

            <div class="load-more" v-if="tab.code === 'hot'">
              <template v-if="getHotCurrentList().length > 0">
                <span v-if="getHotCurrentList().length > hotLimit">{{ $t('game.showing') }} {{ getHotCurrentList().length }} {{ $t('game.of') }}{{ getHotSubTabName() }}{{ $t('game.inTotal') }} {{ getHotVisibleItems().length }} {{ $t('game.of') }}</span>
                <span v-else>{{ $t('game.loadComplete') }}</span>
                <div class="more-btn" v-if="getHotCurrentList().length > hotLimit" @click="loadAllHot">{{ $t('game.loadAll') }} <van-icon name="arrow-down" /></div>
              </template>
              <template v-else>
                <span style="color:#999">{{ $t('common.noData') }}</span>
              </template>
            </div>
            <div class="load-more" v-else-if="tab.code !== 'sport' && tab.code !== 'live' && getFilteredCategoryList(tab.code).length > 0">
               <span v-if="hasMoreItems(tab.code)">{{ $t('game.showing') }} {{ getFilteredCategoryList(tab.code).length }} {{ $t('game.of') }}{{ getCategoryTitle(tab) }}{{ $t('game.inTotal') }} {{ getVisibleItems(tab.code).length }} {{ $t('game.of') }}</span>
               <span v-else>{{ $t('game.loadComplete') }}</span>
               <div class="more-btn" v-if="hasMoreItems(tab.code)" @click="loadAllCategory(tab.code)">{{ $t('game.loadAll') }} <van-icon name="arrow-down" /></div>
            </div>
          </div>
        </div>
      </template>

      <!-- 点击非热门：目录逻辑保持不变 -->
      <section v-else class="game-catalog" :aria-label="currentCatalogTab?.name">
        <div class="catalog-breadcrumb">
          <span class="crumb-home" @click="backToLobby">{{ t('game.hall') }}</span>
          <van-icon name="arrow" size="12" />
          <strong>{{ getCategoryTitle(currentCatalogTab || {}) }}</strong>
          <span class="cat-all catalog-all" @click="goToAllPlatforms(currentCatalogTab)">{{ $t('game.all') }}</span>
        </div>

        <div class="provider-tabs" v-if="activeCategory !== 'lottery' && activeCategory !== 'sport' && activeCategory !== 'live' && providerOptions.length > 1">
          <button
            v-for="provider in providerOptions"
            :key="provider.value"
            type="button"
            class="provider-tab"
            :class="{ active: activeProvider === provider.value }"
            :aria-label="provider.label"
            @click="selectCatalogProvider(provider.value)"
          >
            <img v-if="provider.icon" :src="provider.icon" class="provider-icon" @error="hideBrokenImg" />
            <span v-else-if="provider.mark" class="provider-mark">{{ provider.mark }}</span>
            <span v-if="provider.value === 'all' || (!provider.icon && !provider.mark)">{{ provider.label }}</span>
          </button>
        </div>

        <div class="catalog-heading" v-if="activeCategory !== 'sport' && activeCategory !== 'live'">
          <img :src="resolveStaticAsset(currentCatalogTab?.iconImg)" class="cat-icon" @error="hideBrokenImg" />
          <div>
            <div class="cat-title">{{ catalogHeadingTitle }}</div>
            <div class="catalog-count">{{ t('home.gameCount', { count: visibleCatalogGames.length }) }}</div>
          </div>
        </div>

        <div class="platform-loading" v-if="catalogLoading">
          <van-loading type="spinner" color="#009688" size="24px" />
          <span style="margin-top:8px;font-size:12px">{{ $t('common.loading') }}...</span>
        </div>
        <div class="sport-hall-list" v-else-if="activeCategory === 'sport' && visibleCatalogGames.length">
          <button
            v-for="(game, idx) in visibleCatalogGames"
            :key="game.id || idx"
            type="button"
            class="sport-hall-card"
            :aria-label="resolveSportHallTitle(game)"
            @click="enterGame(game)"
          >
            <img
              :src="resolveSportHallCover(game)"
              class="sport-hall-cover"
              alt=""
              loading="lazy"
              @error="hideBrokenImg"
            />
            <span class="sport-hall-title">{{ resolveSportHallTitle(game) }}</span>
          </button>
        </div>
        <div class="live-hall-list" v-else-if="activeCategory === 'live' && visibleCatalogGames.length">
          <button
            v-for="(game, idx) in visibleCatalogGames"
            :key="game.id || idx"
            type="button"
            class="live-hall-card"
            :aria-label="resolveLiveHallTitle(game)"
            @click="enterGame(game)"
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
        <div class="lottery-hall-list" v-else-if="activeCategory === 'lottery' && visibleCatalogGames.length">
          <button
            v-for="(game, idx) in visibleCatalogGames"
            :key="game.id || idx"
            type="button"
            class="lottery-hall-card"
            :aria-label="game.name"
            @click="enterGame(game)"
          >
            <van-image
              :src="resolveLotteryHallCover(game)"
              class="lottery-hall-cover"
              fit="cover"
              loading="lazy"
            />
            <span class="lottery-hall-shade"></span>
            <span class="lottery-hall-title">{{ game.name }}</span>
            <van-icon name="arrow" class="lottery-hall-arrow" size="18" />
          </button>
        </div>
        <div class="game-grid" v-else-if="visibleCatalogGames.length">
          <div
            class="game-card"
            v-for="(game, idx) in visibleCatalogGames"
            :key="game.id || idx"
            @click="enterGame(game)"
          >
            <div class="img-box">
              <van-image :src="resolveMediaUrl(game.image)" class="g-img" fit="cover" loading="lazy" v-if="game.image" />
              <div class="g-placeholder" v-else :style="{ background: game.color }">{{ (game.name || '?')[0] }}</div>
            </div>
            <div class="g-name">{{ game.name }}</div>
          </div>
        </div>
        <div class="platform-empty" v-else>
          <span style="font-size:12px;color:#ccc">{{ $t('common.noData') }}</span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast } from 'vant'
import { gameApi } from '@/api/game'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import { resolveStaticAsset, hideBrokenImg } from '@/utils/staticAssets'
import { SLOT_PROVIDER_CATEGORIES } from '@/constants/slotProviders'
import { loadSlotProviderStats, hasSlotProviderGames } from '@/utils/slotProviderStats'
import { createProviderMark, normalizeProviderLabel } from '@/utils/platformPresentation'
import { isLoggedIn } from '@/utils/auth'
import { getGameName } from '@/utils/i18nHelper'
import { resolveAllPlatformsPath, resolveGamePlayLocation } from '@/utils/gameNavigation'
import { resolveLiveHallCover, resolveLiveHallTitle } from '@/utils/liveHallCovers'

const { t } = useI18n()
const router = useRouter()
const activeSide = ref(0)
const contentRef = ref(null)
let isAutoScrolling = false

const PAGE_SIZE = 15
const HOT_PAGE_SIZE = 8

/** 移动端体育大厅横版入口图（按平台固定映射） */
const SPORT_HALL_COVERS = {
  FB: '/assets/img/sport/sport_hall_boeing.png',
  IM: '/assets/img/sport/sport_hall_pandasports.png',
  SS: '/assets/img/sport/sport_hall_sabasports.png'
}

const SPORT_HALL_TITLES = computed(() => ({
  FB: `FB ${t('game.sportSuffix')}`,
  IM: `IM ${t('game.sportSuffix')}`,
  SS: `SS ${t('game.sportSuffix')}`
}))

const LOTTERY_HALL_COVERS = {
  SGWIN: '/assets/img/lottery/sgwin-reference.webp',
  VR: '/assets/img/lottery/vr-reference.webp'
}

const resolveLotteryHallCover = (game) => {
  const platform = String(game?.platform || '').trim().toUpperCase()
  const cover = LOTTERY_HALL_COVERS[platform]
  if (cover) return resolveStaticAsset(cover)
  if (game?.image) return resolveMediaUrl(game.image)
  return resolveStaticAsset('/assets/img/icon_dtfl_cp_1.avif')
}

const resolveSportHallCover = (game) => {
  const platform = String(game?.platform || '').trim().toUpperCase()
  const cover = SPORT_HALL_COVERS[platform]
  if (cover) return resolveStaticAsset(cover)
  if (game?.image) return resolveMediaUrl(game.image)
  return resolveStaticAsset('/assets/img/icon_dtfl_ty_1.avif')
}

const resolveSportHallTitle = (game) => {
  const platform = String(game?.platform || '').trim().toUpperCase()
  if (SPORT_HALL_TITLES.value[platform]) return SPORT_HALL_TITLES.value[platform]
  const raw = String(game?.name || platform || '').trim()
  return raw.replace(/大厅$/u, '') || raw
}

/** 点击非热门仍进目录；首页纵向预览用热门同款游戏网格 */
const activeCategory = ref('lobby')
const showsLegacyLobby = computed(() => activeCategory.value === 'lobby')

const hotSubTab = ref('hot')
const hotLimit = ref(HOT_PAGE_SIZE)
const hotPage = ref(0)
const hotTouchStart = ref(null)

const fallbackHotGames = [
  { id: 'fallback-1', gameId: '830', code: '830', platform: 'KY', type: 'chess', image: '/assets/images/games/chess/h5-gamelist-Ky.png', color: '#b48624' },
  { id: 'fallback-2', gameId: '220', code: '220', platform: 'JILI', type: 'slot', image: '/assets/img/icon_dtfl_qp_1.avif', color: '#caa833' },
  { id: 'fallback-3', gameId: '920', code: '920', platform: 'VGQP', type: 'chess', image: '/assets/images/games/chess/h5-gamelist-VgQp.png', color: '#b48624' },
  { id: 'fallback-4', gameId: '221', code: '221', platform: 'JILI', type: 'slot', image: '/assets/images/lottery/icons/game-13.png', color: '#caa833' },
  { id: 'fallback-5', gameId: '230', code: '230', platform: 'LGQP', type: 'chess', image: '/assets/images/games/chess/h5-gamelist-LgQp.png', color: '#b48624' },
  { id: 'fallback-6', gameId: '610', code: '610', platform: 'LCQP', type: 'chess', image: '/assets/images/games/chess/h5-gamelist-LcQp.png', color: '#b48624' },
  { id: 'fallback-7', gameId: '700', code: '700', platform: 'JILI', type: 'fishing', image: '/assets/img/icon_dtfl_by_1.avif', color: '#caa833' },
  { id: 'fallback-8', gameId: '910', code: '910', platform: 'KY', type: 'chess', image: '/assets/img/icon_dtfl_qp_1.avif', color: '#b48624' }
]

const localizedFallbackHotGames = computed(() => fallbackHotGames.map((game, index) => ({
  ...game,
  name: t('game.gameNumber', { number: index + 1 })
})))

const hotSubTabIndex = computed(() => {
  const tabs = ['hot', 'recent', 'favorite']
  return tabs.indexOf(hotSubTab.value)
})

const slideDirection = ref('slide-left')
let prevTabIndex = 0
const recentGames = ref([])
const favoriteGames = ref([])
const favoriteIds = ref(new Set())

const catalogGames = ref([])
const catalogPlatforms = ref([])
const catalogLoading = ref(false)
const activeProvider = ref('all')
const lobbyProviderMap = reactive({})
const categoryPlatformMap = reactive({})
const catalogGameCache = new Map()
const catalogPlatformCache = new Map()
let catalogRequestId = 0

const getDefaultSidebarTabs = () =>
  [
    { code: 'hot', key: 'hot' },
    { code: 'slot', key: 'slot' },
    { code: 'live', key: 'live' },
    { code: 'fish', key: 'fish' },
    { code: 'chess', key: 'chess' },
    { code: 'lottery', key: 'lottery' },
    { code: 'blockchain', key: 'blockchain' }
  ].map(({ code, key }) => ({
    code,
    name: t(`sidebar.${code}`),
    iconImg: resolveStaticAsset(iconMap[key])
  }))

const categoryMap = reactive({})

const iconMap = {
  hot: '/assets/img/icon_dtfl_rm_1.avif',
  slot: '/assets/img/icon_dtfl_dz_1.avif',
  live: '/assets/img/icon_dtfl_zr_1.avif',
  fish: '/assets/img/icon_dtfl_by_1.avif',
  chess: '/assets/img/icon_dtfl_qp_1.avif',
  lottery: '/assets/img/icon_dtfl_cp_1.avif',
  sport: '/assets/img/icon_dtfl_ty_1.avif',
  esport: '/assets/img/icon_dtfl_dj_1.avif',
  blockchain: '/assets/img/icon_dtfl_qkl_1.avif',
  mini: '/assets/img/icon_dtfl_dz_1.avif',
  special: '/assets/img/icon_dtfl_dz_1.avif'
}

const mobileCategoryIconMap = {
  chess: '/assets/img/source-mobile-categories/chess.png',
  slot: '/assets/img/source-mobile-categories/slot.png',
  fish: '/assets/img/source-mobile-categories/fish.png',
  live: '/assets/img/source-mobile-categories/live.png',
  lottery: '/assets/img/source-mobile-categories/lottery.png',
  sport: '/assets/img/source-mobile-categories/sport.png',
  esport: '/assets/img/source-mobile-categories/esport.png',
  activity: '/assets/img/source-mobile-categories/activity.png'
}

const getCategoryNameMap = () => ({
  hot: t('game.hotGames'),
  slot: t('game.slot'),
  live: t('game.live'),
  fish: t('game.fish'),
  chess: t('game.chess'),
  lottery: t('game.lottery'),
  esport: t('game.esport'),
  sport: t('game.sport'),
  blockchain: t('game.blockchain'),
  mini: t('game.mini'),
  special: t('game.special')
})

const sidebarTabs = ref(getDefaultSidebarTabs())
const homeSections = computed(() => {
  const hot = sidebarTabs.value.find((tab) => tab.code === 'hot')
  return hot ? [hot] : []
})

const mobileCategoryEntries = computed(() => {
  const entries = sidebarTabs.value.filter((tab) => tab.code !== 'hot').map((tab) => ({
    ...tab,
    name: tab.name || getCategoryNameMap()[tab.code] || tab.code,
    iconImg: resolveStaticAsset(mobileCategoryIconMap[tab.code] || tab.iconImg || iconMap[tab.code])
  }))
  entries.push({
    code: 'activity',
    name: t('home.activityTasks'),
    iconImg: resolveStaticAsset(mobileCategoryIconMap.activity)
  })
  return entries
})

const currentCatalogTab = computed(
  () => sidebarTabs.value.find((tab) => tab.code === activeCategory.value) || null
)

const getLobbyProvider = (code) => {
  const value = lobbyProviderMap[code] || 'all'
  if (value === 'all') return 'all'
  return getProviderOptions(code).some((provider) => provider.value === value) ? value : 'all'
}

const setLobbyProvider = (code, value) => {
  lobbyProviderMap[code] = value
  const state = getCategoryState(code)
  state.limit = PAGE_SIZE
  if (activeCategory.value === code) {
    activeProvider.value = value
  }
}

const selectCatalogProvider = (value) => {
  activeProvider.value = value
  if (activeCategory.value && activeCategory.value !== 'lobby') {
    lobbyProviderMap[activeCategory.value] = value
  }
}

const buildProviderOptions = (code, platforms = []) => {
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

const matchesProvider = (game, provider) => {
  if (!provider || provider.value === 'all') return true
  const platform = String(game.platform || '').toUpperCase()
  if (provider.gameProvider) {
    return platform === String(provider.platform || '').toUpperCase() &&
      String(game.gameProvider || '').toUpperCase() === String(provider.gameProvider).toUpperCase()
  }
  return platform === String(provider.value || provider.code || '').toUpperCase()
}

const filterProvidersWithGames = (options, games = []) => {
  const list = Array.isArray(games) ? games : []
  return options.filter((provider) => {
    if (provider.value === 'all') return true
    return list.some((game) => matchesProvider(game, provider))
  })
}

const getProviderOptions = (code) => {
  let options
  if (code === 'slot') {
    options = buildProviderOptions(code)
  } else {
    const platforms = [...(categoryPlatformMap[code] || [])]
    const seen = new Set(platforms.map((platform) => String(platform.code || '').toUpperCase()))
    for (const game of getCategoryState(code).list || []) {
      const platform = String(game.platform || '').toUpperCase()
      if (!platform || seen.has(platform)) continue
      seen.add(platform)
      platforms.push({ code: platform, name: platform, icon: '' })
    }
    options = buildProviderOptions(code, platforms)
  }
  return filterProvidersWithGames(options, getCategoryState(code).list)
}

const catalogHeadingTitle = computed(() => {
  if (activeProvider.value === 'all') return getCategoryTitle(currentCatalogTab.value || {})
  const provider = providerOptions.value.find((item) => item.value === activeProvider.value)
  return provider?.label || activeProvider.value
})

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

const visibleCatalogGames = computed(() => {
  if (activeProvider.value === 'all') return catalogGames.value
  const selected = providerOptions.value.find((provider) => provider.value === activeProvider.value)
  if (!selected) return catalogGames.value
  return catalogGames.value.filter((game) => matchesProvider(game, selected))
})

const initCategoryState = (code) => {
  if (!categoryMap[code]) {
    categoryMap[code] = {
      list: [],
      loading: false,
      limit: PAGE_SIZE,
      loaded: false
    }
  }
}

const getCategoryState = (code) => {
  if (!categoryMap[code]) initCategoryState(code)
  return categoryMap[code]
}

const getFilteredCategoryList = (code) => {
  const state = getCategoryState(code)
  const selectedValue = getLobbyProvider(code)
  if (selectedValue === 'all') return state.list
  const selected = getProviderOptions(code).find((provider) => provider.value === selectedValue)
  return state.list.filter((game) => matchesProvider(game, selected))
}

const getVisibleItems = (code) => {
  const state = getCategoryState(code)
  return getFilteredCategoryList(code).slice(0, state.limit)
}

const hasMoreItems = (code) => {
  const state = getCategoryState(code)
  return getFilteredCategoryList(code).length > state.limit
}

const loadAllCategory = (code) => {
  const state = getCategoryState(code)
  state.limit = getFilteredCategoryList(code).length
}

const loadAllHot = () => {
  hotLimit.value = getHotCurrentList().length
}

const getCategoryTitle = (tab) => {
  const nameMap = getCategoryNameMap()
  return String(tab.name || nameMap[tab.code] || '').replace(/\s/g, '') || tab.code || ''
}

const getResponseList = (response) => {
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.list)) return response.data.list
  if (Array.isArray(response?.list)) return response.list
  return []
}

const loadCategories = async () => {
  try {
    const res = await gameApi.getCategories()
    if (res.code === 0 && res.data?.list?.length > 0) {
      const tabs = res.data.list.map(item => ({
        code: item.code,
        name: item.name || item.code,
        iconImg: resolveStaticAsset(iconMap[item.code] || '/assets/img/icon_dtfl_zh_0.svg'),
        path: item.path
      }))
      sidebarTabs.value = tabs
    }
  } catch (e) {}
}

const mapPlayableGame = (g, i = 0) => {
  const gameId = String(g.gameId || g.game_id || g.code || '').trim()
  const platform = String(g.platform || g.platformCode || '').trim()
  return {
    id: `${platform}-${gameId}-${i}`,
    name: getGameName(g) || g.name || g.title || g.game_name,
    gameId,
    code: gameId,
    platform,
    gameProvider: String(g.gameProvider || g.providerCategory || '').trim().toUpperCase(),
    type: g.type || '',
    image: g.icon || g.cover || g.image,
    color: ['#a18cd1', '#fbc2eb', '#84fab0', '#ff9a9e'][i % 4]
  }
}

const loadHotGames = async () => {
  const state = getCategoryState('hot')
  state.loading = true
  try {
    const res = await gameApi.getHotGames({ limit: 50 })
    if (res.code === 0 && res.data?.list?.length > 0) {
      state.list = res.data.list.map((g, i) => mapPlayableGame(g, i))
      state.loaded = true
    }
  } catch(e) {} finally {
    state.loading = false
  }
}

const loadCategoryGames = async (code) => {
  const state = getCategoryState(code)
  if (state.loaded) return
  state.loading = true
  try {
    const type = code === 'fish' ? 'fishing' : code
    const limit = code === 'slot' ? 5000 : 100
    const [gameResult, platformResult] = await Promise.allSettled([
      gameApi.getGameList({ type, page: 1, limit }),
      gameApi.getPlatforms({ type })
    ])
    const res = gameResult.status === 'fulfilled' ? gameResult.value : null
    const platformList = platformResult.status === 'fulfilled'
      ? getResponseList(platformResult.value)
      : []
    categoryPlatformMap[code] = platformList.map((platform) => ({
      code: String(platform.code || platform.platform || '').trim(),
      name: platform.name || platform.code || platform.platform,
      icon: platform.icon || platform.mobile_icon || ''
    })).filter((platform) => platform.code)
    const list = getResponseList(res)
    if (res?.code === 0 && list.length) {
      state.list = list.map((g, i) => mapPlayableGame({ ...g, type: g.type || code }, i))
      state.loaded = true
    }
  } catch (e) {
  } finally {
    state.loading = false
  }
}

const loadRecentGames = async () => {
  if (!isLoggedIn()) return
  try {
    const res = await gameApi.getRecent({ limit: 50 })
    if (res.code === 0 && res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data.list || [])
      recentGames.value = list.map((g, i) => mapPlayableGame(g, i))
    }
  } catch (e) {}
}

const loadFavoriteGames = async () => {
  if (!isLoggedIn()) return
  try {
    const res = await gameApi.getFavorites({ limit: 50 })
    if (res.code === 0 && res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data.list || [])
      favoriteGames.value = list.map((g, i) => mapPlayableGame(g, i))
      favoriteIds.value = new Set(list.map(g => `${g.platform}_${g.gameId || g.game_id || g.code}`))
    }
  } catch (e) {}
}

const switchHotSubTab = (tab) => {
  const tabs = ['hot', 'recent', 'favorite']
  const newIndex = tabs.indexOf(tab)
  
  slideDirection.value = newIndex > prevTabIndex ? 'slide-left' : 'slide-right'
  prevTabIndex = newIndex
  
  hotSubTab.value = tab
  hotLimit.value = HOT_PAGE_SIZE
  hotPage.value = 0
  if (tab === 'recent' && recentGames.value.length === 0) {
    loadRecentGames()
  } else if (tab === 'favorite' && favoriteGames.value.length === 0) {
    loadFavoriteGames()
  }
}

const getHotSubTabName = () => {
  const names = { hot: t('game.hotGames'), recent: t('game.recentGames'), favorite: t('game.favoriteGames') }
  return names[hotSubTab.value] || t('game.hotGames')
}

const getHotCurrentList = () => {
  if (hotSubTab.value === 'recent') return recentGames.value
  if (hotSubTab.value === 'favorite') return favoriteGames.value
  const list = getCategoryState('hot').list
  return list.length ? list : localizedFallbackHotGames.value
}

const hotPageCount = computed(() => Math.max(1, Math.ceil(getHotCurrentList().length / HOT_PAGE_SIZE)))

watch(
  () => getHotCurrentList().length,
  () => {
    if (hotPage.value >= hotPageCount.value) hotPage.value = 0
  }
)

const getHotVisibleItems = () => {
  const page = Math.min(hotPage.value, hotPageCount.value - 1)
  const start = page * HOT_PAGE_SIZE
  return getHotCurrentList().slice(start, start + HOT_PAGE_SIZE)
}

const setHotPage = (page) => {
  const count = hotPageCount.value
  hotPage.value = (page + count) % count
}

const nextHotPage = () => {
  if (hotPageCount.value > 1) setHotPage(hotPage.value + 1)
}

const onHotTouchStart = (event) => {
  const touch = event.changedTouches?.[0]
  if (!touch) return
  hotTouchStart.value = { x: touch.clientX, y: touch.clientY }
}

const onHotTouchEnd = (event) => {
  const start = hotTouchStart.value
  const touch = event.changedTouches?.[0]
  hotTouchStart.value = null
  if (!start || !touch) return

  const deltaX = touch.clientX - start.x
  const deltaY = touch.clientY - start.y
  if (Math.abs(deltaX) < 42 || Math.abs(deltaX) <= Math.abs(deltaY) || hotPageCount.value < 2) return
  setHotPage(hotPage.value + (deltaX < 0 ? 1 : -1))
}

const enterGame = (game) => {
  const gameId = game.gameId || game.code
  if (!isLoggedIn()) {
    showToast(t('game.pleaseLogin'))
    return
  }
  if (!game.platform || !gameId) {
    showToast(t('game.operateFailed'))
    return
  }

  gameApi.addRecent({
    platform: game.platform,
    gameId,
    type: game.type
  }).catch(() => {})

  router.push(resolveGamePlayLocation({ platform: game.platform, gameId }))
}

const isFavorited = (game) => {
  const id = `${game.platform}_${game.gameId || game.code}`
  return favoriteIds.value.has(id)
}

const toggleFavorite = async (game) => {
  if (!isLoggedIn()) {
    showToast(t('game.pleaseLogin'))
    return
  }
  const gameId = game.gameId || game.code
  const id = `${game.platform}_${gameId}`
  try {
    if (favoriteIds.value.has(id)) {
      await gameApi.removeFavorite({ platform: game.platform, gameId })
      favoriteIds.value.delete(id)
      favoriteGames.value = favoriteGames.value.filter(g => `${g.platform}_${g.gameId || g.code}` !== id)
      showToast(t('game.unfavoriteSuccess'))
    } else {
      await gameApi.addFavorite({ platform: game.platform, gameId, gameName: game.name, type: game.type, icon: game.image })
      favoriteIds.value.add(id)
      favoriteGames.value.unshift(game)
      showToast(t('game.favoriteSuccess'))
    }
  } catch (e) {
    showToast(t('game.operateFailed'))
  }
}

const derivePlatformsFromGames = (games, existing = []) => {
  const platforms = [...existing]
  games.forEach((game) => {
    if (!game.platform) return
    const exists = platforms.some((p) => p.code.toUpperCase() === game.platform.toUpperCase())
    if (!exists) {
      platforms.push({ code: game.platform, name: game.platform, icon: '' })
    }
  })
  return platforms
}

const requestCatalogGames = async (code) => {
  const type = code === 'fish' ? 'fishing' : code
  const limit = code === 'slot' ? 5000 : 500
  return getResponseList(await gameApi.getGameList({ type, page: 1, limit }))
}

const loadCatalog = async (code) => {
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
    const [gameResult, platformResult] = await Promise.allSettled([
      requestCatalogGames(code),
      gameApi.getPlatforms({ type: code })
    ])
    const rawGames = gameResult.status === 'fulfilled' ? gameResult.value : []
    const rawPlatforms =
      platformResult.status === 'fulfilled' ? getResponseList(platformResult.value) : []
    const platforms = rawPlatforms
      .map((p) => ({
        code: String(p.code || p.platform || '').trim(),
        name: p.name || p.code,
        icon: p.icon || p.mobile_icon || ''
      }))
      .filter((p) => p.code)
    const games = rawGames.map((g, i) => mapPlayableGame({ ...g, type: g.type || code }, i))
    const mergedPlatforms = derivePlatformsFromGames(games, platforms)

    catalogGameCache.set(code, games)
    catalogPlatformCache.set(code, mergedPlatforms)
    if (requestId === catalogRequestId) {
      catalogGames.value = games
      catalogPlatforms.value = mergedPlatforms
    }
  } catch (e) {
    if (requestId === catalogRequestId) {
      catalogGames.value = []
      catalogPlatforms.value = []
    }
  } finally {
    if (requestId === catalogRequestId) catalogLoading.value = false
  }
}

const initAllData = async () => {
  await loadSlotProviderStats()
  await loadCategories()
  
  sidebarTabs.value.forEach(tab => {
    initCategoryState(tab.code)
    if (tab.code === 'hot') {
      loadHotGames()
    } else {
      loadCategoryGames(tab.code)
    }
  })
  
  if (isLoggedIn()) {
    loadRecentGames()
    loadFavoriteGames()
  }
}

const isSideActive = (index) => {
  const tab = sidebarTabs.value[index]
  if (!tab) return false
  if (showsLegacyLobby.value) return activeSide.value === index
  return activeCategory.value === tab.code
}

const scrollToCategory = async (index) => {
  activeSide.value = index
  activeCategory.value = 'lobby'
  isAutoScrolling = true
  await nextTick()
  const el = document.getElementById(`cat-${index}`)
  const scrollContainer = document.querySelector('.main-scroll') || contentRef.value
  if (el && scrollContainer) {
    const containerRect = scrollContainer.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const currentScroll = scrollContainer.scrollTop
    const targetTop = currentScroll + elRect.top - containerRect.top - 10
    scrollContainer.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth'
    })
  }
  setTimeout(() => {
    isAutoScrolling = false
  }, 600)
}

const backToLobby = async () => {
  activeCategory.value = 'lobby'
  activeProvider.value = 'all'
  await nextTick()
  const scrollContainer = document.querySelector('.main-scroll') || contentRef.value
  scrollContainer?.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSideClick = async (index) => {
  const tab = sidebarTabs.value[index]
  if (!tab) return

  // 热门：首页滚动定位
  if (tab.code === 'hot') {
    await scrollToCategory(index)
    return
  }

  // 非热门点击：目录逻辑不变
  if (activeCategory.value === tab.code) return
  activeSide.value = index
  activeCategory.value = tab.code
  activeProvider.value = getLobbyProvider(tab.code)
  await loadCatalog(tab.code)
  await nextTick()
  const scrollContainer = document.querySelector('.main-scroll') || contentRef.value
  scrollContainer?.scrollTo({ top: 0 })
}

const handleMobileCategoryClick = async (entry) => {
  if (entry.code === 'activity') {
    router.push('/activity')
    return
  }
  router.push(resolveAllPlatformsPath(entry))
}

const onContentScroll = (e) => {
  if (isAutoScrolling || !showsLegacyLobby.value) return
  
  const scrollContainer = document.querySelector('.main-scroll') || e.target
  const containerRect = scrollContainer.getBoundingClientRect()
  
  const categoryEls = sidebarTabs.value.map((_, i) => document.getElementById(`cat-${i}`))
  
  for (let i = 0; i < categoryEls.length; i++) {
    const el = categoryEls[i]
    if (el) {
      const elRect = el.getBoundingClientRect()
      if (elRect.top <= containerRect.top + 100 && elRect.bottom > containerRect.top + 50) {
        activeSide.value = i
        break
      }
    }
  }
}

onMounted(() => {
  initAllData()
  
  nextTick(() => {
    const mainScroll = document.querySelector('.main-scroll')
    if (mainScroll) {
      mainScroll.addEventListener('scroll', onContentScroll)
    }
  })
})

onUnmounted(() => {
  const mainScroll = document.querySelector('.main-scroll')
  if (mainScroll) {
    mainScroll.removeEventListener('scroll', onContentScroll)
  }
})

const goToAllPlatforms = (tab) => {
  if (!tab) return
  router.push(resolveAllPlatformsPath(tab))
}

</script>

<style lang="scss" scoped>
.v5-game-container {
  display: flex;
  min-height: 500px;
  background: transparent;
  position: relative;
}

.sidebar {
  width: 86px;
  background: transparent;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: calc(100vh - 50px - 76px);
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.sidebar::-webkit-scrollbar {
  display: none;
}

.side-item {
  width: 86px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 4px;
  border-radius: 0 12px 12px 0;
  transition: all 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.side-item.active {
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.side-item.active .side-text {
  color: #26A17B;
  font-weight: 700;
}

.side-icon-box {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.side-icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.side-text {
  font-size: 12px;
  color: #666;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50px;
  text-align: center;
  line-height: 1.2;
}

.content-area {
  flex: 1;
  padding: 0 12px 60px;
  overflow-y: auto;
  background: transparent;
  min-height: 100vh;
  scroll-behavior: smooth;
}

.category-section {
  margin-bottom: 15px;
  padding-top: 12px;
}

.section-content {
  overflow: hidden;
  position: relative;
  min-height: 200px;
}

.section-content .game-grid {
  width: 100%;
}

.tab-slide-left-leave-active,
.tab-slide-right-leave-active {
  position: absolute !important;
  top: 0;
  left: 0;
  width: 100%;
}

.sub-tabs-wrapper {
  padding-top: 4px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.sub-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding-bottom: 8px;
  position: relative;
}

.sub-tab {
  font-size: 16px;
  color: #666;
  position: relative;
  padding-bottom: 4px;
  text-align: center;
  display: flex;
  justify-content: center;
  cursor: pointer;
  transition: color 0.2s ease;
}

.sub-tab.active {
  color: #26A17B;
  font-weight: 700;
}

.sub-tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: calc(100% / 3);
  height: 3px;
  display: flex;
  justify-content: center;
  transition: transform 0.2s ease;
}

.sub-tab-indicator::after {
  content: '';
  width: 20px;
  height: 3px;
  background: #26A17B;
  border-radius: 2px;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px 8px;
  justify-items: center;
}

.game-card {
  width: 100%;
  max-width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  background: transparent;
}

.img-box {
  width: 74px;
  height: 74px;
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
  background: #fff;
}

.g-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.g-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
}

.g-name {
  font-size: 12px;
  color: #333;
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.like-icon {
  position: absolute;
  top: 4px;
  right: 16px;
}

.load-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin: 20px 0 12px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f5f5f5;
  color: #999;
  font-size: 12px;
}

.more-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  cursor: pointer;
}

.category-header {
  display: flex;
  align-items: center;
  padding: 5px;
  margin-bottom: 12px;
}

.cat-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  object-fit: contain;
}

.cat-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  flex: 1;
}

.cat-all {
  font-size: 14px;
  color: #999;
  cursor: pointer;
}

.game-catalog {
  padding-top: 12px;
}

.catalog-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

.catalog-breadcrumb .crumb-home {
  color: #26A17B;
  cursor: pointer;
}

.catalog-breadcrumb strong {
  color: #333;
  font-weight: 600;
}

.catalog-all {
  margin-left: auto;
}

.provider-tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 10px;
  margin-bottom: 8px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.provider-tabs::-webkit-scrollbar {
  display: none;
}

.provider-tab {
  flex-shrink: 0;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 40px;
  gap: 0;
  border: 1px solid #e8e8e8;
  background: #fff;
  border-radius: 20px;
  padding: 0 6px;
  font-size: 13px;
  color: #666;
}

.provider-tab.active {
  border-color: #26A17B;
  color: #26A17B;
  font-weight: 600;
}

.provider-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.provider-mark {
  min-width: 0;
  color: #247fd1;
  font-size: 15px;
  font-weight: 700;
  text-align: center;
  line-height: 1;
}

.catalog-heading {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.catalog-count {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.lottery-hall-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 0 2px 8px;
}

.lottery-hall-card {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1.9 / 1;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 6px;
  background: #171717;
  color: #fff;
  text-align: left;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  font: inherit;
  -webkit-tap-highlight-color: transparent;
}

.lottery-hall-cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.lottery-hall-cover :deep(.van-image__img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lottery-hall-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.64) 0%, rgba(0, 0, 0, 0.24) 48%, rgba(0, 0, 0, 0) 78%);
  pointer-events: none;
}

.lottery-hall-title {
  position: absolute;
  top: 13px;
  left: 14px;
  z-index: 1;
  max-width: calc(100% - 52px);
  overflow: hidden;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.72);
  white-space: nowrap;
}

.lottery-hall-arrow {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 1;
  color: #fff;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.65));
}

.live-hall-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 0 2px 8px;
}

.live-hall-card {
  position: relative;
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

.sport-hall-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 2px 8px;
}

.sport-hall-card {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: 14px;
  overflow: hidden;
  background: #111;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.sport-hall-card::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 0;
  z-index: 1;
  width: 58%;
  height: 58%;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.22) 42%, rgba(0, 0, 0, 0) 72%);
  pointer-events: none;
}

.sport-hall-cover {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 5.5;
  object-fit: cover;
  vertical-align: top;
}

.sport-hall-title {
  position: absolute;
  top: 12px;
  left: 14px;
  z-index: 2;
  max-width: calc(100% - 28px);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.platform-loading,
.platform-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  color: #999;
}

/* Target-site mobile layout: category grid + compact two-column game rows. */
.v5-game-container {
  display: block;
  min-height: 500px;
  background: #0d0d0d;
}

.mobile-category-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px 6px;
  padding: 15px 10px 14px;
  background: #0d0d0d;
  border-bottom: 10px solid #080808;
}

.mobile-category-grid .side-item {
  width: auto;
  min-width: 0;
  height: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0;
  margin: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  transition: transform 0.16s ease;
}

.mobile-category-grid .side-item:active {
  transform: scale(0.96);
}

.mobile-category-grid .side-icon-box {
  width: 46px;
  height: 46px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  box-shadow: none;
}

.mobile-category-grid .side-icon-img {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  object-fit: contain;
}

.mobile-category-grid .side-text,
.mobile-category-grid .side-item.active .side-text {
  max-width: 100%;
  color: #f1f1f1;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
}

.content-area {
  width: 100%;
  box-sizing: border-box;
  /* 首页列表下面紧跟快捷入口，无需为底栏预留大片空白 */
  padding: 0 12px 16px;
  overflow: visible;
  min-height: 0;
}

.content-area .load-more {
  display: none;
}

.category-section {
  margin-bottom: 12px;
  padding-top: 8px;
}

.mobile-hot-heading {
  height: 24px;
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
  color: #e8cb70;
}

.hot-badge {
  height: 18px;
  display: inline-flex;
  align-items: center;
  padding: 0 3px;
  border-radius: 4px;
  color: #1b1505;
  background: #d7b950;
  font-size: 8px;
  font-weight: 800;
}

.mobile-hot-heading strong {
  font-size: 17px;
}

.mobile-hot-heading button {
  margin-left: auto;
  padding: 0;
  border: 0;
  color: #756d5d;
  background: transparent;
  font-size: 11px;
}

.section-content .game-grid,
.game-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 9px;
}

.game-card {
  width: 100%;
  max-width: none;
  height: auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  padding: 0;
  overflow: hidden;
  border: 1px solid #312a19;
  border-radius: 3px;
  background: #0c0c0c;
  transition: transform 0.16s ease, background 0.16s ease;
}

.game-card:active {
  background: #17130b;
  transform: scale(0.98);
}

.game-card .img-box {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  margin: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: #090909;
  box-shadow: none;
}

.game-card .g-name {
  width: 100%;
  min-height: 31px;
  box-sizing: border-box;
  padding: 7px 5px 6px;
  overflow: hidden;
  color: #1b1609;
  background: #fbe59c;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-card .like-icon {
  display: none;
}

.hot-swipe-viewport {
  width: 100%;
  overflow: hidden;
  touch-action: pan-y;
}

.hot-category-section .game-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 9px;
}

.hot-category-section .game-card {
  height: 76px;
  min-width: 0;
  flex-direction: row;
  align-items: center;
  padding: 0 9px;
  border: 0;
  border-radius: 4px;
  background: #191919;
}

.hot-category-section .game-card .img-box {
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  aspect-ratio: auto;
  margin: 0 8px 0 0;
  border-radius: 50%;
  border: 1px solid #6f5c2b;
  background: #111;
}

.hot-category-section .game-card .g-placeholder {
  border-radius: 50%;
  font-size: 19px;
}

.hot-category-section .game-card .g-name {
  min-width: 0;
  min-height: 0;
  padding: 0;
  color: #f5f5f5;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  text-align: left;
}

.category-header {
  padding: 5px 0;
}

.cat-title,
.catalog-breadcrumb strong {
  color: #e8cb70;
}

.cat-all,
.catalog-breadcrumb,
.catalog-count {
  color: #756d5d;
}

.provider-tab {
  color: #bfb69e;
  border-color: #3f3a2c;
  background: #171717;
}

.provider-tab.active {
  color: #f1d477;
  border-color: #d3b656;
  background: #211d12;
}

.load-more {
  border-bottom-color: #292929;
}
</style>
