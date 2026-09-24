import { ref } from 'vue'

export const transitionDirection = ref('none')

let isInitialized = false

let isPopState = false

const tabOrder = {
  '/': 0,
  '/home-new': 0,
  '/activity': 1,
  '/vip': 1,
  '/cashback': 1,
  '/pending': 1,
  '/interest': 1,
  '/reward-record': 1,
  '/member': 2
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    isPopState = true

    setTimeout(() => {
      isPopState = false
    }, 0)
  })
}

export function setTransitionDirection(fromPath, toPath) {

  if (!isInitialized) {

    setTimeout(() => {
      isInitialized = true
    }, 100)
    return
  }
  

  if (isPopState) {
    // 浏览器/手势返回到会员中心时不做整页滑入，避免“又刷新一遍”的观感
    if (toPath === '/member' || toPath === '/pc/member') {
      transitionDirection.value = 'none'
      return
    }
    transitionDirection.value = 'slide-right'
    return
  }
  

  const fromIdx = tabOrder[fromPath]
  const toIdx = tabOrder[toPath]
  
  if (fromIdx !== undefined && toIdx !== undefined) {

    if (fromIdx === toIdx) {
      transitionDirection.value = 'none'
      return
    }
    transitionDirection.value = toIdx > fromIdx ? 'slide-left' : 'slide-right'
    return
  }
  

  if (fromIdx !== undefined && toIdx === undefined) {
    transitionDirection.value = 'slide-left'
    return
  }

  if (fromIdx === undefined && toIdx !== undefined) {
    // 会员中心子页返回会员中心：避免再播一遍整页滑入造成“刷新感”
    if (toPath === '/member' || toPath === '/pc/member') {
      const from = fromPath || ''
      if (
        from.includes('/member/') ||
        from.includes('/security') ||
        from.includes('/payment/withdraw') ||
        from.includes('/help') ||
        from.includes('/notice') ||
        from.includes('/invite')
      ) {
        transitionDirection.value = 'none'
        return
      }
    }
    transitionDirection.value = 'slide-right'
    return
  }
  

  transitionDirection.value = 'slide-left'
}
