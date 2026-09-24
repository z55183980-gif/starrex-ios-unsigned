const GAME_HALL_PATHS = {
  hot: '/game/hot',
  slot: '/game/slot',
  live: '/game/live',
  fish: '/game/fish',
  fishing: '/game/fish',
  chess: '/game/chess',
  lottery: '/game/lottery',
  sport: '/game/sport',
  esport: '/game/esport',
  blockchain: '/game/blockchain',
  mini: '/game/mini',
  special: '/game/special'
}

const DIRECT_PLATFORM_TYPES = new Set(['live', 'sport', 'esport'])

export function getPlatformCode(platform = {}) {
  return String(platform.code || platform.platform || platform.platformCode || '').trim()
}

/** 去掉误配的 /pc 前缀，并丢弃 path 里内嵌的 query（应由 query 对象传递） */
function normalizeHallPath(path = '') {
  let value = String(path || '').trim()
  if (!value) return ''
  if (value.startsWith('/pc/game/')) value = value.replace(/^\/pc\/game\//, '/game/')
  else if (value.startsWith('/pc/')) value = value.slice(3) || '/'
  if (value.includes('?')) value = value.split('?')[0]
  return value
}

export function resolveAllPlatformsPath(category = {}, options = {}) {
  const type = String(category.code || category.type || '').trim()
  if (options.pc && type) {
    const pcType = type === 'fishing' ? 'fish' : type
    return `/pc/game/${pcType}`
  }
  if (GAME_HALL_PATHS[type]) return GAME_HALL_PATHS[type]
  const fromCategory = normalizeHallPath(category.path)
  if (fromCategory.startsWith('/game/')) return fromCategory
  return `/game/${type === 'fishing' ? 'fish' : type || 'slot'}`
}

export function resolvePlatformNavigation(platform = {}, type = '', options = {}) {
  const normalizedType = String(type || platform.type || '').trim()
  const platformCode = getPlatformCode(platform)
  const isLocalLottery =
    normalizedType === 'lottery' &&
    (platformCode === 'BYLOT' || platform.isLocal === true || platform.kind === 'local')

  if (isLocalLottery) {
    return { location: '/lotteryMore', requiresAuth: false }
  }

  if (normalizedType === 'lottery' || DIRECT_PLATFORM_TYPES.has(normalizedType)) {
    const lobbyGameId = String(
      platform.gameId || platform.game_id || platform.lobbyGameId || platform.lobby_game_id || 'lobby'
    ).trim()
    return {
      location: {
        path: '/game/play',
        query: {
          platform: platformCode,
          gameId: lobbyGameId || 'lobby'
        }
      },
      requiresAuth: true
    }
  }

  return {
    location: {
      path: resolveAllPlatformsPath({ code: normalizedType }, options),
      query: platformCode ? { platform: platformCode } : {}
    },
    requiresAuth: false
  }
}

export function resolveGamePlayLocation(game = {}) {
  const platform = String(game.platform || game.platformCode || '').trim()
  const gameId = String(game.gameId || game.game_id || game.code || '').trim()
  return {
    path: '/game/play',
    query: {
      ...(platform ? { platform } : {}),
      ...(gameId ? { gameId } : {})
    }
  }
}
