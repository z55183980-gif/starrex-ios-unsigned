import { ref } from 'vue'
import { gameApi } from '@/api/game'

// Shared per-tab cache: PC 首页、移动首页和独立大厅不会重复请求统计数据。
export const slotProviderCounts = ref({})
let loaded = false
let pending = null

export function loadSlotProviderStats() {
  if (loaded) return Promise.resolve(slotProviderCounts.value)
  if (pending) return pending
  pending = gameApi.getProviderStats({ type: 'slot' })
    .then((response) => {
      slotProviderCounts.value = response?.data?.counts || {}
      loaded = true
      return slotProviderCounts.value
    })
    .catch(() => slotProviderCounts.value)
    .finally(() => {
      pending = null
    })
  return pending
}

export function hasSlotProviderGames(provider) {
  return Number(slotProviderCounts.value?.[provider?.value] || 0) > 0
}
