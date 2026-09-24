<template>
  <div class="v5-notice">
    <van-icon name="volume-o" class="vol-icon-van" size="16" color="#d0ad47" />
    <div class="notice-content" @click="handleClick">
      <div class="marquee-wrap" ref="wrapRef">
        <div class="marquee-text" ref="marqueeRef" :style="marqueeStyle" v-safe-html="noticeHtml"></div>
      </div>
    </div>
    <div class="mail-box" @click="router.push('/notice')">
      <div class="mail-icon-wrapper">
        <van-icon
          :name="unreadCount > 0 ? 'envelop' : 'envelop-o'"
          class="mail-icon-van"
          size="22"
          color="#d0ad47"
        />
        <div class="badge" v-if="unreadCount > 0">{{ unreadCount }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { homeApi } from '@/api/home'
import { noticeApi } from '@/api/notice'
import { messageApi } from '@/api/message'

const { t } = useI18n()
const router = useRouter()
const unreadCount = ref(0)
const noticeHtml = ref('')
const marqueeRef = ref(null)
const wrapRef = ref(null)

const position = ref(0)
const speed = 50
let animationId = null
let lastTime = 0
let textWidth = 0
let wrapWidth = 0

const marqueeStyle = computed(() => ({
  transform: `translateX(${position.value}px)`
}))

const savePosition = () => {
  sessionStorage.setItem('marquee_position', position.value.toString())
}

const restorePosition = () => {
  const saved = sessionStorage.getItem('marquee_position')
  if (saved !== null) {
    position.value = parseFloat(saved)
  }
}

const animate = (currentTime) => {
  if (!lastTime) lastTime = currentTime
  const delta = currentTime - lastTime
  lastTime = currentTime
  
  position.value -= (speed * delta) / 1000
  
  if (textWidth > 0 && position.value < -textWidth / 2) {
    position.value = position.value + textWidth / 2
  }
  
  animationId = requestAnimationFrame(animate)
}

const startAnimation = () => {
  if (animationId) return
  lastTime = 0
  animationId = requestAnimationFrame(animate)
}

const stopAnimation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

const initMarquee = async () => {
  await nextTick()
  if (marqueeRef.value && wrapRef.value) {
    textWidth = marqueeRef.value.scrollWidth
    wrapWidth = wrapRef.value.offsetWidth
    
    restorePosition()
    
    if (position.value === 0) {
      position.value = wrapWidth
    }
    
    startAnimation()
  }
}

const loadData = async () => {
  // 跑马灯设置已并入「公告管理」：滚动条展示最新公告标题
  try {
    const noticeRes = await homeApi.getNotices({ page: 1, limit: 5 })
    const titles = (Array.isArray(noticeRes.data) ? noticeRes.data : [])
      .map(n => escapeHtml(n.title))
      .filter(Boolean)
    if (noticeRes.code === 0 && titles.length > 0) {
      const text = titles.join('<span class="marquee-gap"></span>')
      noticeHtml.value = `${text}<span class="marquee-gap"></span>${text}`
    } else {
      noticeHtml.value = '温馨提示：请认准 StarRex 星恒官方平台，祝您游戏愉快！'
    }
    initMarquee()
  } catch (e) {
    noticeHtml.value = '温馨提示：请认准 StarRex 星恒官方平台，祝您游戏愉快！'
  }
  
  try {
    const [noticeRes, msgRes] = await Promise.all([
      noticeApi.getUnreadCount(),
      messageApi.getUnreadCount()
    ])
    const noticeUnread = noticeRes?.data?.unreadCount || 0
    const msgUnread = msgRes?.data?.unreadCount || 0
    unreadCount.value = noticeUnread + msgUnread
  } catch (e) {
    unreadCount.value = 0
  }
}

const handleClick = (e) => {
  const target = e.target
  if (target.tagName === 'A' && target.href) {
    e.preventDefault()
    const href = target.getAttribute('href')
    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.open(href, '_blank')
    } else {
      savePosition()
      router.push(href)
    }
    return
  }
  savePosition()
  router.push('/notice?tab=announcement')
}

function escapeHtml(text) {
  return String(text || '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  stopAnimation()
})
</script>

<style lang="scss" scoped>
.v5-notice {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 34px;
  color: #8e8674;
  background: #171717;
  border-bottom: 1px solid #242424;
}

.vol-icon-van {
  margin-right: 8px;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
  overflow: hidden;
  height: 36px;
  position: relative;
}

.marquee-wrap {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.marquee-text {
  position: absolute;
  white-space: nowrap;
  line-height: 36px;
  font-size: 13px;
  color: #8e8674;
  cursor: pointer;
  will-change: transform;
}

.marquee-text :deep(a) {
  color: #e13c39;
  text-decoration: underline;
  cursor: pointer;
  padding: 4px 0;
}

.marquee-text :deep(p) {
  display: inline;
  margin: 0;
}

.marquee-text :deep(.marquee-gap) {
  display: inline-block;
  width: 80px;
}

.marquee-text :deep(span) {
  display: inline;
}

.mail-box {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  flex-shrink: 0;
}

.mail-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.mail-icon-van {
  display: block;
}

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #E60012;
  color: #fff;
  font-size: 10px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
