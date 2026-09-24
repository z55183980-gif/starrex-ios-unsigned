import { resolveStaticAsset } from '@/utils/staticAssets'
import { resolveMediaUrl } from '@/utils/mediaUrl'

/** 真人大厅横幅入口图（移动端 / PC 共用） */
export const LIVE_HALL_COVERS = {
  AG: '/assets/images/games/live/h5-gamelist-Choice.png',
  WL: '/assets/images/games/live/h5-gamelist-Wl-v2.png',
  WM: '/assets/images/games/live/h5-gamelist-Wml.png',
  AB: '/assets/images/games/live/h5-gamelist-Ab.png',
  ALLBET: '/assets/images/games/live/h5-gamelist-Ab.png',
  EBET: '/assets/images/games/live/h5-gamelist-Ebet.png'
}

export const LIVE_HALL_TITLES = {
  AG: 'Choice视讯',
  WL: 'WL视讯',
  WM: '完美真人',
  AB: '欧博真人',
  ALLBET: '欧博真人',
  EBET: 'EBET真人'
}

export function resolveLiveHallPlatform(game) {
  return String(game?.platform || game?.platformCode || '').trim().toUpperCase()
}

export function resolveLiveHallCover(game) {
  const platform = resolveLiveHallPlatform(game)
  const cover = LIVE_HALL_COVERS[platform]
  if (cover) return resolveStaticAsset(cover)
  if (game?.image) return resolveMediaUrl(game.image)
  if (game?.cover) return resolveMediaUrl(game.cover)
  return resolveStaticAsset('/assets/images/games/live/h5-gamelist-Choice.png')
}

export function resolveLiveHallTitle(game) {
  const platform = resolveLiveHallPlatform(game)
  if (LIVE_HALL_TITLES[platform]) return LIVE_HALL_TITLES[platform]
  const raw = String(game?.name || platform || '').trim()
  return raw.replace(/大厅$/u, '') || raw
}
