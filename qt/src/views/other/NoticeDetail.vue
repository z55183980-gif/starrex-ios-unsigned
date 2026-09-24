<template>
  <div class="notice-detail-page">
    <div class="nav-header">
      <div class="nav-back" @click="$router.back()">
        <van-icon name="arrow-left" />
      </div>
      <div class="nav-title">{{ t('notice.noticeDetail') }}</div>
      <div class="nav-right"></div>
    </div>

    <div v-if="loading" class="loading-wrap">
      <van-loading size="24" />
    </div>

    <div v-else class="detail-content">
      <div class="detail-header">
        <h1 class="detail-title">{{ notice.title }}</h1>
        <div class="detail-meta">
          <span class="type-tag" :class="notice.type">{{ getTypeName(notice.type) }}</span>
          <span class="detail-time">{{ formatTime(notice.createdAt) }}</span>
        </div>
      </div>
      <div class="detail-body" v-safe-html="notice.content"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useI18n } from 'vue-i18n'
import { noticeApi } from '@/api/notice'

const { t } = useI18n()
const route = useRoute()
const loading = ref(true)
const notice = ref({
  title: '',
  content: '',
  type: '',
  createdAt: 0
})

const getTypeName = (type) => {
  const map = { 
    system: t('notice.typeSystem'), 
    activity: t('notice.typeActivity'), 
    update: t('notice.typeUpdate') 
  }
  return map[type] || t('notice.typeNotice')
}

const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  const id = route.params.id
  try {
    const res = await noticeApi.getNoticeList({ page: 1, pageSize: 100 })
    if (res.code === 0 && res.data?.list) {
      const found = res.data.list.find(item => String(item.id) === String(id))
      if (found) {
        notice.value = found
        loading.value = false
        return
      }
    }
  } catch (e) {
  }
  try {
    const res = await noticeApi.getNoticeDetail(id)
    if (res.code === 0 && res.data) {
      notice.value = res.data
    } else {
      showToast(res.msg || t('notice.loadFailed'))
    }
  } catch (error) {
    showToast(t('notice.loadFailed'))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* 站点黑金皮肤：与消息中心保持一致 */
.notice-detail-page,
.notice-detail {
  --nd-bg: #1c1c1c;
  --nd-surface: #252525;
  --nd-fill: #222;
  --nd-border: #3a3a3a;
  --nd-text: #e0e0e0;
  --nd-text-2: #bdbdbd;
  --nd-muted: #999;
  --nd-primary: #d5aa54;
}

.notice-detail-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--nd-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav-header {
  flex-shrink: 0;
  height: 50px;
  background: var(--nd-surface);
  display: flex;
  align-items: center;
  padding: 0 15px;
  border-bottom: 1px solid var(--nd-border);
}

.nav-back {
  width: 40px;
  display: flex;
  align-items: center;
  font-size: 20px;
  color: var(--nd-text);
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  color: var(--nd-text);
}

.nav-right {
  width: 40px;
}

.loading-wrap {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.detail-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.detail-header {
  background: var(--nd-surface);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 15px;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--nd-text);
  margin: 0 0 15px 0;
  line-height: 1.4;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.type-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--nd-fill);
  color: var(--nd-text-2);
}

.type-tag.system {
  background: rgba(33, 150, 243, 0.1);
  color: #2196f3;
}

.type-tag.activity {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.type-tag.update {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.detail-time {
  font-size: 12px;
  color: var(--nd-muted);
}

.detail-body {
  background: var(--nd-surface);
  border-radius: 10px;
  padding: 20px;
  font-size: 14px;
  color: var(--nd-text);
  line-height: 1.8;
}

.detail-body :deep(img) {
  max-width: 100%;
  height: auto;
}
</style>

