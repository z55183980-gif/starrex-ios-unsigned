/** 大厅动态段，排除 play/search，避免抢走游戏页与搜索页 */
const GAME_HALL_TYPE_PATTERN =
  'hot|slot|live|chess|fish|fishing|lottery|sport|esport|blockchain|mini|special'

export default [
  {
    path: '/game/play',
    name: 'GamePlay',
    component: () => import('@/views/game/GameWrapper.vue'),
    meta: { title: '游戏', requiresAuth: true, standalone: true }
  },
  {
    path: '/game/search',
    name: 'GameSearch',
    component: () => import('@/views/game/SearchGame.vue'),
    meta: { title: '搜索游戏' }
  },
  {
    path: `/pc/game/:type(${GAME_HALL_TYPE_PATTERN})`,
    name: 'PcGameHall',
    component: () => import('@/views/game/SlotHall.vue'),
    meta: { title: '游戏大厅', standalone: true, pc: true }
  },
  {
    path: '/game/slot',
    name: 'GameSlot',
    component: () => import('@/views/game/SlotHall.vue'),
    meta: { title: '电子', type: 'slot' }
  },
  {
    path: '/game/chess',
    name: 'GameChess',
    component: () => import('@/views/game/SlotHall.vue'),
    meta: { title: '棋牌', type: 'chess' }
  },
  {
    path: '/game/live',
    name: 'GameLive',
    component: () => import('@/views/game/SlotHall.vue'),
    meta: { title: '真人', type: 'live' }
  },
  {
    path: '/game/fish',
    name: 'GameFish',
    component: () => import('@/views/game/SlotHall.vue'),
    meta: { title: '捕鱼', type: 'fish' }
  },
  {
    path: '/game/lottery',
    name: 'GameLottery',
    component: () => import('@/views/game/SlotHall.vue'),
    meta: { title: '彩票', type: 'lottery' }
  },
  {
    path: '/game/sport',
    name: 'GameSport',
    component: () => import('@/views/game/SlotHall.vue'),
    meta: { title: '体育', type: 'sport' }
  },
  {
    path: '/game/esport',
    name: 'GameEsport',
    component: () => import('@/views/game/SlotHall.vue'),
    meta: { title: '电竞', type: 'esport' }
  },
  {
    path: '/game/blockchain',
    name: 'GameBlockchain',
    component: () => import('@/views/game/SlotHall.vue'),
    meta: { title: '区块链', type: 'blockchain' }
  },
  {
    path: '/game/mini',
    name: 'GameMini',
    component: () => import('@/views/game/SlotHall.vue'),
    meta: { title: '小游戏', type: 'mini' }
  },
  {
    path: '/game/special',
    name: 'GameSpecial',
    component: () => import('@/views/game/SlotHall.vue'),
    meta: { title: '特色游戏', type: 'special' }
  },
  {
    // 移动端动态大厅（含热门），与 /pc/game/:type 对齐；放在固定路由之后
    path: `/game/:type(${GAME_HALL_TYPE_PATTERN})`,
    name: 'GameHall',
    component: () => import('@/views/game/SlotHall.vue'),
    meta: { title: '游戏大厅' }
  }
]
