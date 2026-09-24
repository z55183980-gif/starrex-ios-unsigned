import { getLocale } from '@/locales'

const localeMap = {
  'zh-CN': 'zh-hans',
  'zh-TW': 'zh-hant',
  'en-US': 'en',
  'vi-VN': 'vi',
  'th-TH': 'th',
  'ja-JP': 'ja',
  'ko-KR': 'ko'
}

export function getGameName(game) {
  if (!game) return ''
  
  const gameName = game.gameName || game.game_name
  
  if (typeof gameName === 'string') {
    return gameName
  }
  
  if (typeof gameName === 'object' && gameName !== null) {
    const currentLocale = getLocale()
    const apiLocale = localeMap[currentLocale] || 'zh-hans'
    
    return gameName[apiLocale] || gameName['zh-hans'] || gameName['en'] || Object.values(gameName)[0] || ''
  }
  
  return game.name || game.title || ''
}

export function getLocalizedText(textObj, fallback = '') {
  if (!textObj) return fallback
  
  if (typeof textObj === 'string') {
    return textObj
  }
  
  if (typeof textObj === 'object' && textObj !== null) {
    const currentLocale = getLocale()
    const apiLocale = localeMap[currentLocale] || 'zh-hans'
    
    return textObj[apiLocale] || textObj['zh-hans'] || textObj['en'] || Object.values(textObj)[0] || fallback
  }
  
  return fallback
}

