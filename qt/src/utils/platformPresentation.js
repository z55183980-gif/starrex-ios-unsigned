const PROVIDER_SUFFIX_PATTERN = /\s*(?:电子(?:游艺|游戏)?|真人(?:视讯|娱乐)?|体育(?:赛事|游戏)?|棋牌(?:游戏)?|彩票(?:游戏)?|捕鱼(?:游戏)?|电竞(?:游戏)?|区块链(?:游戏)?|小游戏|特色游戏|精品)\s*$/iu

export function normalizeProviderCode(code) {
  return String(code || '')
    .trim()
    .replace(/^BGCTRL:/i, '')
    .toUpperCase()
}

export function normalizeProviderLabel(name, code = '') {
  const fallback = normalizeProviderCode(code)
  let label = String(name || fallback).trim()
  let previous = ''

  while (label && label !== previous) {
    previous = label
    label = label.replace(PROVIDER_SUFFIX_PATTERN, '').trim()
  }

  return label || fallback || String(name || '').trim()
}

export function createProviderMark(code, name = '') {
  const codeMark = normalizeProviderCode(code).replace(/[^A-Z0-9]/g, '')
  if (codeMark) return codeMark.slice(0, 6)

  const nameMark = normalizeProviderLabel(name)
    .toUpperCase()
    .match(/[A-Z0-9]+/g)
    ?.join('')

  return nameMark?.slice(0, 6) || 'GAME'
}
