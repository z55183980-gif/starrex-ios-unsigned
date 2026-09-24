
/**
 * 会员端 WebSocket 地址（Workerman WebSocketServer 18889）
 * - 配置了 VITE_WS_URL / VITE_IM_WS_URL 时优先使用
 * - IP 访问：直连 ws://<host>:18889
 * - 域名/localhost：经 Vite 管理 /member-ws -> 18889
 */
export function resolveMemberWsUrl(envUrl) {
  const fromEnv = envUrl?.trim()
  if (fromEnv) return fromEnv

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const hostname = window.location.hostname
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return `${protocol}//${hostname}:18889`
  }
  return `${protocol}//${window.location.host}/member-ws`
}

export function resolveLotteryWsUrl() {
  return resolveMemberWsUrl(import.meta.env.VITE_WS_URL)
}

export function resolveImWsUrl() {
  return resolveMemberWsUrl(import.meta.env.VITE_IM_WS_URL)
}
