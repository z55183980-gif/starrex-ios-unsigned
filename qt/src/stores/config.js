
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { homeApi } from '@/api/home'
import { resolveMediaUrl } from '@/utils/mediaUrl'

const DEFAULT_SITE_NAME = 'StarRex 星恒'

/** 后台 webtitle 可能仍是换品牌前的旧站名，统一显示为新品牌 */
const LEGACY_BRAND_KEYWORDS = ['星际传奇', '博悦', '万利']

const isLegacyBrandName = (name) => {
  const text = String(name || '').trim()
  if (!text) return true
  return LEGACY_BRAND_KEYWORDS.some((keyword) => text.includes(keyword))
}

export const useConfigStore = defineStore('config', () => {

  const siteName = ref(DEFAULT_SITE_NAME)

  const siteLogo = ref('/assets/img/starrex-logo.png')

  const serviceUrl = ref('')

  const floatIcon = ref('')

  const floatIconLink = ref('')

  const tgServiceList = ref([])

  const csWelcomeEnabled = ref(false)

  const csWelcomeText = ref('')

  const csAutoReplyEnabled = ref(false)

  /** 首句回复（历史字段名 cs_auto_reply_welcome） */
  const csAutoReplyWelcome = ref('')

  /** 预设问题独立开关 */
  const csPresetEnabled = ref(false)

  const csAutoReplyPresets = ref([])

  const loaded = ref(false)

  const loading = ref(false)

  const normalizeTelegramServices = (value) => {
    let items = value
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items)
      } catch {
        return []
      }
    }
    if (!Array.isArray(items)) return []

    return items
      .map((item) => ({
        name: String(item?.name || '').trim(),
        username: String(item?.username || item?.id || '').trim().replace(/^@+/, ''),
        url: String(item?.url || item?.link || '').trim()
      }))
      .filter((item) => item.name && item.url)
  }

  const normalizeAutoReplyPresets = (value) => {
    let items = value
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items)
      } catch {
        return []
      }
    }
    if (!Array.isArray(items)) return []

    return items
      .map((item) => ({
        question: String(item?.question || item?.title || '').trim(),
        answer: String(item?.answer || item?.reply || item?.content || '').trim()
      }))
      .filter((item) => item.question && item.answer)
  }

  const fetchConfig = async (force = false) => {

    if (loaded.value && !force) return

    if (loading.value) return
    loading.value = true

    try {

      if (!force) {
        const cached = localStorage.getItem('siteConfig')
        if (cached) {
          const cachedData = JSON.parse(cached)
          applySiteConfig(cachedData)
        }
      }

      const res = await homeApi.getConfig()
      if (res.code === 0 && res.data) {
        applySiteConfig(res.data)
        localStorage.setItem('siteConfig', JSON.stringify(res.data))
        loaded.value = true
      } else {
        console.warn('站点配置接口异常:', res?.message || res)
        loaded.value = true
      }
    } catch (e) {
      const cached = localStorage.getItem('siteConfig')
      if (cached) {
        console.warn('站点配置使用缓存（接口失败）:', e.message)
      } else {
        console.warn('获取站点配置失败，使用默认配置:', e.message)
      }
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  const applySiteConfig = (data) => {

    if (data.webtitle || data.siteName || data.site_name || data.name) {
      const resolvedName = data.webtitle || data.siteName || data.site_name || data.name
      siteName.value = isLegacyBrandName(resolvedName) ? DEFAULT_SITE_NAME : resolvedName
    }
    if (data.siteLogo || data.site_logo || data.logo) {
      siteLogo.value = resolveMediaUrl(data.siteLogo || data.site_logo || data.logo)
    }
    if (data.kefuthree || data.kefuqq || data.serviceUrl || data.service_url) {
      serviceUrl.value = data.kefuthree || data.kefuqq || data.serviceUrl || data.service_url
    }
    if (data.float_icon || data.floatIcon) {
      floatIcon.value = resolveMediaUrl(data.float_icon || data.floatIcon)
    }
    if (data.float_icon_link || data.floatIconLink) {
      floatIconLink.value = data.float_icon_link || data.floatIconLink
    }
    if (Object.prototype.hasOwnProperty.call(data, 'tg_service_list')) {
      tgServiceList.value = normalizeTelegramServices(data.tg_service_list)
    }
    if (Object.prototype.hasOwnProperty.call(data, 'cs_welcome_enabled')) {
      csWelcomeEnabled.value = String(data.cs_welcome_enabled) === '1' || data.cs_welcome_enabled === 1
    }
    if (Object.prototype.hasOwnProperty.call(data, 'cs_welcome_text')) {
      csWelcomeText.value = String(data.cs_welcome_text || '').trim()
    }
    if (Object.prototype.hasOwnProperty.call(data, 'cs_auto_reply_enabled')) {
      csAutoReplyEnabled.value = String(data.cs_auto_reply_enabled) === '1' || data.cs_auto_reply_enabled === 1
    }
    if (Object.prototype.hasOwnProperty.call(data, 'cs_auto_reply_welcome')) {
      csAutoReplyWelcome.value = String(data.cs_auto_reply_welcome || '').trim()
    }
    if (Object.prototype.hasOwnProperty.call(data, 'cs_preset_enabled')) {
      csPresetEnabled.value = String(data.cs_preset_enabled) === '1' || data.cs_preset_enabled === 1
    } else if (Object.prototype.hasOwnProperty.call(data, 'cs_auto_reply_enabled')) {
      // 无新字段时兼容：预设跟随旧总开关
      csPresetEnabled.value = csAutoReplyEnabled.value
    }
    if (Object.prototype.hasOwnProperty.call(data, 'cs_auto_reply_presets')) {
      csAutoReplyPresets.value = normalizeAutoReplyPresets(data.cs_auto_reply_presets)
    }
  }

  return {
    siteName,
    siteLogo,
    serviceUrl,
    floatIcon,
    floatIconLink,
    tgServiceList,
    csWelcomeEnabled,
    csWelcomeText,
    csAutoReplyEnabled,
    csAutoReplyWelcome,
    csPresetEnabled,
    csAutoReplyPresets,
    loaded,
    loading,
    fetchConfig
  }
})


