const NETWORK_ERROR_PATTERNS = [
  /network error/i,
  /failed to fetch/i,
  /load failed/i,
  /timeout|timed out/i,
  /failed to connect|connection refused|could not resolve/i,
  /game api request failed/i,
  /请求被浏览器拦截|网络(?:错误|请求失败)/,
  /^request failed with status code \d+$/i
]

const MERCHANT_BALANCE_PATTERNS = [
  /merchant.*(?:balance|fund)/i,
  /(?:balance|fund).*merchant/i,
  /商户余额不足/
]

const PLAYER_BALANCE_PATTERNS = [
  /insufficient\s+(?:balance|funds?)/i,
  /(?:balance|funds?)\s+(?:is\s+)?(?:insufficient|not enough|too low)/i,
  /player.*(?:balance|fund).*(?:insufficient|not enough|too low)/i,
  /玩家余额不足|游戏余额不足|余额不足/
]

export function getGameEntryErrorMessage(error) {
  const message = (typeof error === 'string' ? error : error?.message || '').trim()

  if (!message || NETWORK_ERROR_PATTERNS.some(pattern => pattern.test(message))) {
    return '网络错误'
  }
  if (MERCHANT_BALANCE_PATTERNS.some(pattern => pattern.test(message))) {
    return '游戏平台余额不足，请联系客服'
  }
  if (PLAYER_BALANCE_PATTERNS.some(pattern => pattern.test(message))) {
    return '余额不足，请先充值'
  }

  return message
}
