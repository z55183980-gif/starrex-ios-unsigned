import { computed, nextTick, ref } from 'vue'

/** 本项目用户头像素材池 */
export const WIN_AVATAR_POOL = [
  '/assets/img/img_ntx4.avif',
  '/assets/img/cat.jpeg',
  '/assets/images/user/avatars/default.png',
  '/assets/images/user/avatars/logo.png',
  '/assets/images/common/rui-face.png'
]

const WIN_NAME_PREFIX_POOL = [
  '星河',
  '好运',
  '清风',
  '稳赢',
  '远方',
  '不吃鸡',
  '本顽',
  '财神到',
  '夜未央',
  '小满满',
  '海阔',
  '春风',
  '金玉',
  '一发',
  '只为你',
  '阿强',
  '小美',
  '老王',
  '阿杰',
  '静静'
]

const WIN_BADGE_POOL = ['88倍', '188倍', '500倍', '888倍', '1000倍', '3000倍']
const WIN_RECORD_LIMIT = 20
const FALLBACK_GAME_ICONS = [
  { image: '/assets/img/icon_dtfl_rm_1.avif', tone: 'red', name: '热门游戏' },
  { image: '/assets/img/icon_dtfl_dz_1.avif', tone: 'red', name: '电子游艺' },
  { image: '/assets/img/icon_dtfl_zr_1.avif', tone: 'teal', name: '真人视讯' },
  { image: '/assets/img/icon_dtfl_by_1.avif', tone: 'blue', name: '捕鱼' },
  { image: '/assets/img/icon_dtfl_qp_1.avif', tone: 'violet', name: '棋牌游戏' },
  { image: '/assets/img/icon_dtfl_cp_1.avif', tone: 'gold', name: '彩票' }
]

const winningRecords = ref([])
const monthlyPrizeTotal = ref(66465813.38)
const winGamePool = ref([])

let winningRecordSeq = 0
let winningInjectTimer = null
let dynamicsUsers = 0
let winningMotionPaused = false

export const formatWinAmount = (value) =>
  Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)]

const createWinAmountValue = () => {
  const base = 800 + Math.random() * 28000
  const boost = Math.random() > 0.82 ? Math.random() * 40000 : 0
  return base + boost
}

export const createMaskedPlayerName = () => {
  if (Math.random() < 0.3) {
    const prefix = `user${Math.floor(Math.random() * 90 + 10)}`
    const suffix = String(Math.floor(Math.random() * 90 + 10))
    return `${prefix}****${suffix}`
  }
  return `${pickRandom(WIN_NAME_PREFIX_POOL)}***`
}

const resolveGamePool = () => (winGamePool.value.length ? winGamePool.value : FALLBACK_GAME_ICONS)

export const setWinGamePool = (games = []) => {
  const normalized = (games || [])
    .map((item) => ({
      image: item.image || item.cover || item.icon || item.banner,
      tone: item.tone || 'teal',
      name: item.name || item.label || ''
    }))
    .filter((item) => item.image)
  if (normalized.length) winGamePool.value = normalized
}

export const createWinningRecord = (seed = {}) => {
  winningRecordSeq += 1
  const pool = resolveGamePool()
  const game = seed.game || pickRandom(pool)
  const amountValue = seed.amountValue ?? createWinAmountValue()
  const showBadge = seed.badge !== undefined ? Boolean(seed.badge) : Math.random() > 0.72

  return {
    id: seed.id || `win-${Date.now()}-${winningRecordSeq}`,
    player: seed.player || createMaskedPlayerName(),
    amount: seed.amount || formatWinAmount(amountValue),
    amountValue,
    image: seed.image || game.image,
    avatar: seed.avatar || pickRandom(WIN_AVATAR_POOL),
    tone: seed.tone || game.tone || 'teal',
    badge: showBadge ? seed.badge || pickRandom(WIN_BADGE_POOL) : '',
    isEnter: Boolean(seed.isEnter)
  }
}

export const seedWinningRecords = (games) => {
  if (games?.length) setWinGamePool(games)
  const pool = resolveGamePool()
  const count = Math.min(WIN_RECORD_LIMIT, Math.max(10, pool.length || 10))
  winningRecords.value = Array.from({ length: count }, (_, index) =>
    createWinningRecord({
      id: `win-seed-${index + 1}`,
      game: pool[index % pool.length],
      avatar: WIN_AVATAR_POOL[index % WIN_AVATAR_POOL.length],
      badge: index % 4 === 3 ? pickRandom(WIN_BADGE_POOL) : ''
    })
  )
}

export const injectWinningRecord = async () => {
  if (winningMotionPaused || document.hidden) return null
  const amountValue = createWinAmountValue()
  const next = createWinningRecord({ isEnter: true, amountValue })
  winningRecords.value = [next, ...winningRecords.value].slice(0, WIN_RECORD_LIMIT)
  monthlyPrizeTotal.value += amountValue
  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const target = winningRecords.value.find((item) => item.id === next.id)
      if (target) target.isEnter = false
    })
  })
  return next
}

export const pauseWinningMotion = () => {
  winningMotionPaused = true
}

export const resumeWinningMotion = () => {
  winningMotionPaused = false
}

export const startWinningDynamics = (options = {}) => {
  if (!winningRecords.value.length) seedWinningRecords(options.games)
  dynamicsUsers += 1
  if (winningInjectTimer) return

  winningInjectTimer = window.setInterval(() => {
    injectWinningRecord()
  }, options.injectInterval || 5200)
}

export const stopWinningDynamics = () => {
  dynamicsUsers = Math.max(0, dynamicsUsers - 1)
  if (dynamicsUsers > 0) return
  if (winningInjectTimer) {
    window.clearInterval(winningInjectTimer)
    winningInjectTimer = null
  }
}

export function useWinningRecords() {
  const monthlyPrizeText = computed(() => formatWinAmount(monthlyPrizeTotal.value))

  return {
    winningRecords,
    monthlyPrizeTotal,
    monthlyPrizeText,
    WIN_RECORD_LIMIT,
    setWinGamePool,
    seedWinningRecords,
    createWinningRecord,
    injectWinningRecord,
    pauseWinningMotion,
    resumeWinningMotion,
    startWinningDynamics,
    stopWinningDynamics
  }
}
