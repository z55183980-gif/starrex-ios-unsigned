<template>
  <div class="message-center">
    <div class="nav-header">
      <div class="nav-back" @click="goBack">
        <van-icon name="arrow-left" />
      </div>
      <div class="nav-title">{{ t('msgCenter.title') }}</div>
      <div class="nav-right"></div>
    </div>

    <div class="tabs-wrapper">
      <div class="tabs-scroll">
        <div 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
        </div>
      </div>
    </div>

    <div class="filter-row" v-if="activeTab === 'notice'">
      <div class="filter-item" @click="showStatusDropdown = !showStatusDropdown">
        <span>{{ currentStatusLabel }}</span>
        <van-icon :name="showStatusDropdown ? 'arrow-up' : 'arrow-down'" />
        <div class="dropdown-list" v-show="showStatusDropdown">
          <div 
            v-for="item in statusOptions" 
            :key="item.value"
            class="dropdown-item"
            :class="{ active: currentStatus === item.value }"
            @click.stop="selectStatus(item.value)"
          >
            {{ item.label }}
          </div>
        </div>
      </div>

      <div class="search-box">
        <van-field 
          v-model="searchKeyword" 
          :placeholder="t('msgCenter.search')"
          :border="false"
        >
          <template #right-icon>
            <van-icon name="search" class="search-icon" @click="handleSearch" />
          </template>
        </van-field>
      </div>
    </div>

    <div class="content-area">
      <div v-if="activeTab === 'service'" class="tab-content service-tab">
        <!-- 7×24在线客服 -->
        <div class="service-card online-service">
          <div class="service-avatar">
            <img src="/assets/img/img_kf_kf01.avif" alt="客服" />
          </div>
          <div class="service-info">
            <div class="service-title">{{ t('msgCenter.onlineServiceTitle') }}</div>
            <div class="service-desc">{{ t('msgCenter.onlineServiceDesc') }}</div>
            <div class="service-btn" @click="goOnlineService">
              <img src="/assets/img/img_kf_kf01.avif" alt="" class="btn-icon" />
              <span>{{ t('msgCenter.onlineServiceBtn') }}</span>
            </div>
          </div>
        </div>

        <!-- Telegram客服 -->
        <div class="service-card telegram-section">
          <div class="section-header">
            <img src="/assets/img/telegram.avif" alt="Telegram" class="tg-logo" />
            <span class="section-title">{{ t('msgCenter.telegramService') }}</span>
          </div>
          <div class="tg-list">
            <div class="tg-item" v-for="(item, index) in telegramList" :key="index">
              <img src="/assets/img/telegram.avif" alt="" class="tg-avatar" />
              <div class="tg-info">
                <div class="tg-name">{{ item.name }}</div>
                <div class="tg-id">{{ item.id }}</div>
              </div>
              <div class="tg-btn" @click="openTelegram(item.url)">{{ t('msgCenter.contactNow') }}</div>
            </div>
          </div>
        </div>

      </div>

      <div v-else-if="activeTab === 'announcement'" class="tab-content">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          :immediate-check="false"
          finished-text=""
          @load="loadAnnouncements"
        >
          <div v-if="announcements.length > 0" class="message-list">
            <div 
              v-for="item in announcements" 
              :key="item.id" 
              class="message-card"
              @click="openDetail(item)"
            >
              <div class="message-title">{{ item.title }}</div>
              <div class="message-summary">{{ item.summary }}</div>
              <div class="message-time">{{ formatTime(item.createdAt) }}</div>
            </div>
          </div>
          <div v-else-if="!loading" class="empty-state">
            <img src="/assets/img/img_none_sj.avif" class="empty-icon" />
            <p>{{ t('msgCenter.noMessage') }}</p>
          </div>
        </van-list>
      </div>

      <div v-else-if="activeTab === 'notice'" class="tab-content">
        <van-list
          v-model:loading="messageLoading"
          :finished="messageFinished"
          :immediate-check="false"
          finished-text=""
          @load="loadMessages"
        >
          <div v-if="messages.length > 0" class="message-list">
            <div 
              v-for="item in messages" 
              :key="item.id" 
              class="message-card"
              :class="{ unread: !item.isRead }"
              @click="openMessageDetail(item)"
            >
              <div class="message-title">
                <span class="unread-dot" v-if="!item.isRead"></span>
                {{ item.title }}
              </div>
              <div class="message-summary">{{ item.summary }}</div>
              <div class="message-time">{{ formatTime(item.sentTime) }}</div>
            </div>
          </div>
          <div v-else-if="!messageLoading" class="empty-state">
            <img src="/assets/img/img_none_sj.avif" class="empty-icon" />
            <p>{{ t('msgCenter.noMessage') }}</p>
          </div>
        </van-list>
      </div>

      <div v-else-if="activeTab === 'feedback'" class="tab-content">
        <div class="sub-tabs-row">
          <div class="sub-tabs">
            <div 
              class="sub-tab-item" 
              :class="{ active: feedbackSubTab === 'create' }"
              @click="feedbackSubTab = 'create'"
            >
              {{ t('msgCenter.createFeedback') }}
            </div>
            <div 
              class="sub-tab-item" 
              :class="{ active: feedbackSubTab === 'my' }"
              @click="feedbackSubTab = 'my'"
            >
              {{ t('msgCenter.myFeedback') }}
            </div>
          </div>
          <div class="reward-claim">
            <div class="pending-amount">
              <span class="label">{{ t('msgCenter.pending') }}</span>
              <span class="amount">{{ pendingReward.toFixed(2) }}</span>
            </div>
            <button 
              class="claim-btn" 
              :class="{ disabled: pendingReward <= 0 }"
              @click="claimReward"
            >
              {{ t('msgCenter.claimAll') }}
            </button>
          </div>
        </div>

        <div v-if="feedbackSubTab === 'create'" class="feedback-form">
          <div class="form-item">
            <div class="form-label">{{ t('msgCenter.feedbackType') }}<span class="required">*</span></div>
            <div class="form-select-wrap">
              <div class="form-select" @click="showFeedbackType = !showFeedbackType">
                <span :class="{ placeholder: !feedbackForm.type }">
                  {{ feedbackForm.type || t('msgCenter.selectType') }}
                </span>
                <van-icon :name="showFeedbackType ? 'arrow-up' : 'arrow-down'" />
              </div>
              <div class="dropdown-list feedback-dropdown" v-show="showFeedbackType">
                <div 
                  v-for="item in feedbackTypes" 
                  :key="item.key"
                  class="dropdown-item"
                  :class="{ active: feedbackForm.type === item.name }"
                  @click="selectFeedbackType(item)"
                >
                  {{ item.name }}
                </div>
              </div>
            </div>
          </div>

          <div class="form-item">
            <div class="form-label">{{ t('msgCenter.feedbackContent') }}<span class="required">*</span></div>
            <div class="form-textarea">
              <textarea 
                v-model="feedbackForm.content" 
                :placeholder="t('msgCenter.feedbackPlaceholder')"
                maxlength="1000"
              ></textarea>
              <div class="textarea-count">{{ feedbackForm.content.length }}/1000</div>
            </div>
          </div>

          <div class="form-item">
            <div class="form-label">{{ t('msgCenter.uploadImage') }}<span class="tip">{{ t('msgCenter.uploadTip') }}</span></div>
            <div class="upload-area">
              <div class="upload-box" v-for="(img, idx) in feedbackForm.images" :key="idx">
                <img :src="img" class="preview-img" />
                <van-icon name="cross" class="remove-btn" @click="removeImage(idx)" />
              </div>
              <div class="upload-box add" v-if="feedbackForm.images.length < 3" @click="triggerUpload">
                <van-icon name="plus" />
              </div>
              <input 
                type="file" 
                ref="feedbackImageInput" 
                accept="image/*" 
                style="display: none" 
                @change="handleFeedbackImage"
              />
            </div>
            <div class="upload-tip">{{ t('msgCenter.uploadLimit') }}</div>
          </div>

          <div class="reward-rules">
            <div class="rules-title">{{ t('msgCenter.rewardRules') }}</div>
            <div class="rules-content">
              {{ t('msgCenter.rewardRulesContent') }}
            </div>
          </div>

          <div class="submit-area">
            <button class="submit-btn" @click="submitFeedback">{{ t('msgCenter.submit') }}</button>
          </div>
        </div>

        <div v-else class="my-feedback">
          <div v-if="myFeedbacks.length > 0" class="feedback-list">
            <div v-for="item in myFeedbacks" :key="item.id" class="feedback-card">
              <div class="feedback-type">{{ item.type }}</div>
              <div class="feedback-content">{{ item.content }}</div>
              <div class="feedback-footer">
                <span class="feedback-time">{{ formatTime(item.createdAt) }}</span>
                <span class="feedback-status" :class="item.status">{{ getStatusText(item.status) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <img src="/assets/img/img_none_sj.avif" class="empty-icon" />
            <p>{{ t('msgCenter.noFeedback') }}</p>
          </div>
        </div>
      </div>
    </div>

    <van-popup
      v-model:show="showMessagePopup"
      position="center"
      round
      :style="{ width: '90%', maxHeight: '70%' }"
    >
      <div class="message-detail-popup" v-if="currentMessage">
        <div class="popup-header">
          <span class="popup-title">{{ t('msgCenter.messageDetail') }}</span>
          <van-icon name="cross" @click="showMessagePopup = false" />
        </div>
        <div class="popup-body">
          <h3 class="detail-title">{{ currentMessage.title }}</h3>
          <div class="detail-meta">
            <span class="detail-time">{{ formatTime(currentMessage.sentTime) }}</span>
          </div>
          <div class="detail-content" v-safe-html="currentMessage.content || currentMessage.summary"></div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useI18n } from 'vue-i18n'
import { noticeApi } from '@/api/notice'
import { messageApi } from '@/api/message'
import { useConfigStore } from '@/stores/config'
import { openOnlineCustomerService } from '@/utils/customerService'
import { navigatePcBack } from '@/utils/deviceRoutes'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const configStore = useConfigStore()

const goBack = () => {
  if (navigatePcBack(router, route, '/member')) return
  router.back()
}

const tabKeys = ['service', 'announcement', 'notice', 'feedback']

const tabs = computed(() => [
  { key: 'service', label: t('msgCenter.service') },
  { key: 'announcement', label: t('msgCenter.announcement') },
  { key: 'notice', label: t('msgCenter.notice') },
  { key: 'feedback', label: t('msgCenter.feedback') }
])

const getInitialTab = () => {
  const urlTab = route.query.tab
  if (urlTab && tabKeys.includes(urlTab)) {
    return urlTab
  }
  return 'announcement'
}

const activeTab = ref(getInitialTab())

const statusOptions = computed(() => [
  { label: t('msgCenter.all'), value: 'all' },
  { label: t('msgCenter.unread'), value: 'unread' },
  { label: t('msgCenter.read'), value: 'read' }
])

const currentStatus = ref('all')
const showStatusDropdown = ref(false)
const searchKeyword = ref('')

const currentStatusLabel = computed(() => {
  return statusOptions.value.find(o => o.value === currentStatus.value)?.label || t('msgCenter.all')
})

const announcements = ref([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)

const messages = ref([])
const messageLoading = ref(false)
const messageFinished = ref(false)
const messagePage = ref(1)
const showMessagePopup = ref(false)
const currentMessage = ref(null)

const feedbackSubTab = ref('create')
const showFeedbackType = ref(false)
const feedbackForm = ref({
  type: '',
  content: '',
  images: []
})
const feedbackTypes = computed(() => [
  { key: 'game', name: t('msgCenter.fbTypeGame') },
  { key: 'login', name: t('msgCenter.fbTypeLogin') },
  { key: 'activity', name: t('msgCenter.fbTypeActivity') },
  { key: 'agent', name: t('msgCenter.fbTypeAgent') },
  { key: 'recharge', name: t('msgCenter.fbTypeRecharge') },
  { key: 'withdraw', name: t('msgCenter.fbTypeWithdraw') },
  { key: 'suggestion', name: t('msgCenter.fbTypeSuggestion') }
])
const myFeedbacks = ref([])
const feedbackImageInput = ref(null)
const pendingReward = ref(0)

const telegramList = computed(() => {
  return configStore.tgServiceList || []
})

const goOnlineService = () => {
  openOnlineCustomerService()
}

const openTelegram = (link) => {
  window.open(link, '_blank', 'noopener,noreferrer')
}

const switchTab = (key) => {
  activeTab.value = key
  router.replace({ query: { tab: key } })
}

const selectStatus = (value) => {
  currentStatus.value = value
  showStatusDropdown.value = false
  resetAndLoad()
}

const handleSearch = () => {
  resetAndLoad()
}

const resetAndLoad = () => {
  messagePage.value = 1
  messages.value = []
  messageFinished.value = false
  loadMessages()
}

const announcementLoadingLock = ref(false)

const loadAnnouncements = async () => {
  if (finished.value || announcementLoadingLock.value) {
    loading.value = false
    return
  }
  
  announcementLoadingLock.value = true
  
  try {
    const res = await noticeApi.getNoticeList({
      page: page.value,
      pageSize: 20
    })
    
    if (res.code === 0 && res.data) {
      const list = res.data.list || []
      const total = res.data.total || 0
      
      if (list.length > 0) {
        const existingIds = new Set(announcements.value.map(a => a.id))
        const newItems = list.filter(item => !existingIds.has(item.id))
        if (newItems.length > 0) {
          announcements.value.push(...newItems)
        }
        page.value++
      }
      
      if (list.length === 0 || announcements.value.length >= total) {
        finished.value = true
      }
    } else {
      finished.value = true
    }
  } catch (e) {
    finished.value = true
  } finally {
    loading.value = false
    announcementLoadingLock.value = false
  }
}

const messageLoadingLock = ref(false)

const loadMessages = async () => {
  if (messageFinished.value || messageLoadingLock.value) {
    messageLoading.value = false
    return
  }
  
  messageLoadingLock.value = true
  
  try {
    const params = {
      page: messagePage.value,
      pageSize: 20
    }
    
    if (currentStatus.value === 'unread') {
      params.unreadOnly = true
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    const res = await messageApi.getMessageList(params)
    
    if (res && res.code === 0 && res.data) {
      const list = res.data.list || []
      const total = res.data.total || 0
      
      if (list.length > 0) {
        const existingIds = new Set(messages.value.map(m => m.id))
        const newItems = list.filter(item => !existingIds.has(item.id))
        if (newItems.length > 0) {
          messages.value.push(...newItems)
        }
        messagePage.value++
      }
      
      if (list.length === 0 || messages.value.length >= total) {
        messageFinished.value = true
      }
    } else {
      messageFinished.value = true
    }
  } catch (e) {
    messageFinished.value = true
  } finally {
    messageLoading.value = false
    messageLoadingLock.value = false
  }
}

const stripHtml = (html) => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

const openDetail = async (item) => {
  if (!item.isRead) {
    try {
      await noticeApi.markRead({ id: item.id })
      item.isRead = true
    } catch (e) {}
  }
  router.push(`/notice/${item.id}`)
}

const openMessageDetail = async (item) => {
  if (!item.isRead) {
    try {
      await messageApi.markRead([item.id])
      item.isRead = true
    } catch (e) {}
  }
  currentMessage.value = item
  showMessagePopup.value = true
}

const selectFeedbackType = (action) => {
  feedbackForm.value.type = action.name
  showFeedbackType.value = false
}

const triggerUpload = () => {
  feedbackImageInput.value?.click()
}

const handleFeedbackImage = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    showToast(t('msgCenter.pleaseSelectImage'))
    return
  }
  
  if (file.size > 2 * 1024 * 1024) {
    showToast(t('msgCenter.imageTooLarge'))
    return
  }
  
  const reader = new FileReader()
  reader.onload = (event) => {
    feedbackForm.value.images.push(event.target.result)
  }
  reader.readAsDataURL(file)
  
  e.target.value = ''
}

const removeImage = (idx) => {
  feedbackForm.value.images.splice(idx, 1)
}

const submitFeedback = () => {
  if (!feedbackForm.value.type) {
    showToast(t('msgCenter.pleaseSelectType'))
    return
  }
  if (!feedbackForm.value.content.trim()) {
    showToast(t('msgCenter.pleaseInputContent'))
    return
  }
  
  showToast(t('msgCenter.submitSuccess'))
  feedbackForm.value = { type: '', content: '', images: [] }
}

const getStatusText = (status) => {
  const map = {
    pending: t('msgCenter.statusPending'),
    processing: t('msgCenter.statusProcessing'),
    resolved: t('msgCenter.statusResolved'),
    rejected: t('msgCenter.statusRejected')
  }
  return map[status] || status
}

const claimReward = () => {
  if (pendingReward.value <= 0) {
    showToast(t('msgCenter.noReward'))
    return
  }
  showToast(t('msgCenter.claimSuccess'))
  pendingReward.value = 0
}

const formatTime = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(async () => {
  await configStore.fetchConfig(true)
  const tab = route.query.tab
  if (tab && tabs.value.some(t => t.key === tab)) {
    activeTab.value = tab
  }
  if (activeTab.value === 'notice') {
    messageLoading.value = true
    loadMessages()
  } else if (activeTab.value === 'announcement') {
    loading.value = true
    loadAnnouncements()
  }
})

watch(activeTab, (newTab) => {
  if (newTab === 'announcement' && announcements.value.length === 0 && !loading.value && !finished.value) {
    loading.value = true
    loadAnnouncements()
  }
  if (newTab === 'notice' && messages.value.length === 0 && !messageLoading.value && !messageFinished.value) {
    messageLoading.value = true
    loadMessages()
  }
})
</script>

<style scoped>
/* 站点黑金皮肤：页面原为浅色绿色主题，统一改为与大厅一致的深色金色 */
.message-center {
  --mc-bg: #1c1c1c;
  --mc-surface: #252525;
  --mc-fill: #222;
  --mc-border: #3a3a3a;
  --mc-text: #e0e0e0;
  --mc-text-2: #bdbdbd;
  --mc-muted: #999;
  --mc-primary: #d5aa54;
  --mc-gold: #e8c978;
  --mc-disabled: #3a3a3a;
  --mc-on-primary: #241a06;
}

.message-center {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--mc-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav-header {
  flex-shrink: 0;
  height: 50px;
  background: var(--mc-surface);
  display: flex;
  align-items: center;
  padding: 0 15px;
  border-bottom: 1px solid var(--mc-border);
}

.nav-back {
  width: 40px;
  display: flex;
  align-items: center;
  font-size: 20px;
  color: var(--mc-text);
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  color: var(--mc-text);
}

.nav-right {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 20px;
  color: var(--mc-text-2);
}

.tabs-wrapper {
  flex-shrink: 0;
  background: var(--mc-surface);
  border-bottom: 1px solid var(--mc-border);
}

.tabs-scroll {
  display: flex;
  padding: 0 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tabs-scroll::-webkit-scrollbar {
  display: none;
}

.tab-item {
  flex-shrink: 0;
  padding: 15px 20px;
  font-size: 14px;
  color: var(--mc-text-2);
  position: relative;
}

.tab-item.active {
  color: var(--mc-primary);
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: var(--mc-primary);
  border-radius: 2px;
}

.filter-row {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: var(--mc-surface);
}

.filter-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background: var(--mc-surface);
  border: 1px solid var(--mc-border);
  border-radius: 20px;
  font-size: 13px;
  color: var(--mc-text);
}

.filter-item .van-icon {
  font-size: 12px;
  color: var(--mc-muted);
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: var(--mc-surface);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  z-index: 100;
  min-width: 100px;
  overflow: hidden;
}

.dropdown-item {
  padding: 12px 15px;
  font-size: 13px;
  color: var(--mc-text);
  border-bottom: 1px solid var(--mc-border);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item.active {
  color: var(--mc-primary);
}

.search-box {
  flex: 1;
  background: var(--mc-surface);
  border: 1px solid var(--mc-border);
  border-radius: 20px;
  overflow: hidden;
}

.search-box :deep(.van-field) {
  padding: 4px 12px;
}

.search-box :deep(.van-field__control) {
  font-size: 13px;
}

.search-icon {
  color: var(--mc-primary);
}

.content-area {
  padding: 10px;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
}

.tab-content {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message-card {
  background: var(--mc-surface);
  border-radius: 10px;
  padding: 15px;
}

.message-card.unread {
  border-left: 3px solid var(--mc-primary);
}

.message-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--mc-text);
  margin-bottom: 8px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: var(--mc-primary);
  border-radius: 50%;
}

.message-summary {
  font-size: 13px;
  color: var(--mc-text-2);
  line-height: 1.5;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.message-content {
  font-size: 14px;
  color: var(--mc-text);
  line-height: 1.6;
  margin-bottom: 10px;
}

.message-time {
  font-size: 12px;
  color: var(--mc-muted);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 20px;
  color: var(--mc-muted);
}

.empty-icon {
  width: 150px;
  height: auto;
  margin-bottom: 20px;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

.sub-tabs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.sub-tabs {
  display: flex;
  gap: 10px;
}

.reward-claim {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pending-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.pending-amount .label {
  font-size: 12px;
  color: var(--mc-muted);
}

.pending-amount .amount {
  font-size: 16px;
  font-weight: 600;
  color: #ff9800;
}

.claim-btn {
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 13px;
  border: none;
  background: var(--mc-primary);
  color: var(--mc-on-primary);
}

.claim-btn.disabled {
  background: var(--mc-disabled);
  color: var(--mc-muted);
}

.sub-tab-item {
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 13px;
  color: var(--mc-text-2);
  background: var(--mc-fill);
  border: 1px solid var(--mc-border);
}

.sub-tab-item.active {
  color: var(--mc-primary);
  background: rgba(38, 161, 123, 0.1);
  border-color: var(--mc-primary);
}

.feedback-form {
  background: var(--mc-surface);
  border-radius: 10px;
  padding: 15px;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  font-size: 14px;
  color: var(--mc-text);
  margin-bottom: 10px;
}

.form-label .required {
  color: #ff4d4f;
  margin-left: 2px;
}

.form-label .tip {
  color: var(--mc-muted);
  font-size: 12px;
}

.form-select-wrap {
  position: relative;
}

.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background: var(--mc-surface);
  border: 1px solid var(--mc-primary);
  border-radius: 8px;
  font-size: 14px;
}

.form-select .placeholder {
  color: var(--mc-muted);
}

.form-select .van-icon {
  color: var(--mc-muted);
}

.feedback-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--mc-surface);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
}

.feedback-dropdown .dropdown-item {
  padding: 15px;
  font-size: 14px;
  color: var(--mc-text);
  border-bottom: 1px solid var(--mc-border);
}

.feedback-dropdown .dropdown-item:last-child {
  border-bottom: none;
}

.feedback-dropdown .dropdown-item.active {
  color: var(--mc-primary);
}

.form-textarea {
  position: relative;
  background: var(--mc-fill);
  border-radius: 8px;
  padding: 12px 15px;
}

.form-textarea textarea {
  width: 100%;
  min-height: 150px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--mc-text);
  resize: none;
  outline: none;
}

.form-textarea textarea::placeholder {
  color: var(--mc-muted);
}

.textarea-count {
  text-align: right;
  font-size: 12px;
  color: var(--mc-muted);
  margin-top: 5px;
}

.upload-area {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.upload-box {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.upload-box.add {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--mc-border);
  background: var(--mc-fill);
}

.upload-box.add .van-icon {
  font-size: 24px;
  color: var(--mc-muted);
}

.upload-box .preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-box .remove-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-tip {
  font-size: 12px;
  color: var(--mc-muted);
  line-height: 1.5;
}

.reward-rules {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid var(--mc-border);
}

.rules-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--mc-text);
  margin-bottom: 10px;
}

.rules-content {
  font-size: 13px;
  color: var(--mc-text-2);
  line-height: 1.6;
}

.submit-area {
  margin-top: 30px;
  padding: 0 15px 20px;
}

.submit-btn {
  width: 100%;
  height: 50px;
  background: var(--mc-primary);
  border: none;
  border-radius: 25px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.my-feedback {
  padding-top: 10px;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feedback-card {
  background: var(--mc-surface);
  border-radius: 10px;
  padding: 15px;
}

.feedback-type {
  font-size: 14px;
  font-weight: 600;
  color: var(--mc-text);
  margin-bottom: 8px;
}

.feedback-content {
  font-size: 13px;
  color: var(--mc-text-2);
  line-height: 1.5;
  margin-bottom: 10px;
}

.feedback-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.feedback-time {
  font-size: 12px;
  color: var(--mc-muted);
}

.feedback-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.feedback-status.pending {
  color: #ff9800;
  background: rgba(255, 152, 0, 0.1);
}

.feedback-status.processing {
  color: #2196f3;
  background: rgba(33, 150, 243, 0.1);
}

.feedback-status.resolved {
  color: var(--mc-primary);
  background: rgba(38, 161, 123, 0.1);
}

.feedback-status.rejected {
  color: var(--mc-muted);
  background: var(--mc-fill);
}

.message-detail-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid var(--mc-border);
}

.popup-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--mc-text);
}

.popup-header .van-icon {
  font-size: 20px;
  color: var(--mc-muted);
}

.popup-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.popup-body .detail-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--mc-text);
  margin: 0 0 15px 0;
  line-height: 1.4;
}

.popup-body .detail-meta {
  margin-bottom: 20px;
}

.popup-body .detail-time {
  font-size: 13px;
  color: var(--mc-muted);
}

.popup-body .detail-content {
  font-size: 14px;
  color: var(--mc-text);
  line-height: 1.8;
}

.popup-body .detail-content :deep(img) {
  max-width: 100%;
  height: auto;
}

/* Service Tab Styles */
.service-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-card {
  background: var(--mc-surface);
  border-radius: 12px;
  padding: 16px;
}

.online-service {
  display: flex;
  gap: 12px;
}

.online-service .service-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.online-service .service-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.online-service .service-info {
  flex: 1;
}

.online-service .service-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--mc-text);
  margin-bottom: 6px;
}

.online-service .service-desc {
  font-size: 13px;
  color: var(--mc-muted);
  margin-bottom: 12px;
}

.online-service .service-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--mc-primary);
  border-radius: 6px;
  color: var(--mc-primary);
  font-size: 13px;
}

.online-service .service-btn .btn-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.tg-logo {
  width: 24px;
  height: 24px;
}

.section-header .section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--mc-primary);
  padding-bottom: 8px;
  border-bottom: 2px solid var(--mc-primary);
}

.tg-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tg-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--mc-fill);
  border-radius: 8px;
}

.tg-item .tg-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tg-item .tg-info {
  flex: 1;
}

.tg-item .tg-name {
  font-size: 14px;
  color: var(--mc-text);
  margin-bottom: 2px;
}

.tg-item .tg-id {
  font-size: 12px;
  color: var(--mc-muted);
}

.tg-item .tg-btn {
  padding: 6px 16px;
  background: var(--mc-primary);
  color: var(--mc-on-primary);
  border-radius: 6px;
  font-size: 13px;
}

</style>
