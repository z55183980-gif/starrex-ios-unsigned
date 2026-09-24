<template>
  <div class="share-earn-page">
    <div class="nav-header">
      <div class="nav-back" @click="goBack">
        <van-icon name="arrow-left" />
      </div>
      <div class="nav-title">分享赚钱</div>
      <div class="nav-right"></div>
    </div>

    <div class="tabs-wrapper">
      <div class="tabs-scroll" ref="tabsScrollRef">
        <div 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
          :ref="el => setTabRef(tab.key, el)"
        >
          {{ tab.label }}
        </div>
      </div>
    </div>

    <div v-show="activeTab === 'myData'" class="time-filter-fixed">
      <div 
        v-for="item in timeOptions" 
        :key="item.value"
        class="filter-btn"
        :class="{ active: currentTime === item.value }"
        @click="changeTime(item.value)"
      >
        {{ item.label }}
      </div>
    </div>

    <div class="tab-content">
      <transition :name="tabTransition">
        <div :key="activeTab" class="tab-pane">
          <HomeTab 
            v-if="activeTab === 'home'"
            :agentInfo="agentInfo"
            :inviteInfo="inviteInfo"
            :overview="overview"
            @copy="handleCopy"
            @claim="handleClaim"
            @goTab="switchTab"
          />
          <ShareTab 
            v-else-if="activeTab === 'share'"
            :inviteInfo="inviteInfo"
            @copy="handleCopy"
            @saveQrcode="handleSaveQrcode"
          />
          <MyDataTab 
            v-else-if="activeTab === 'myData'"
            ref="myDataTabRef" 
          />
          <MyPerformanceTab v-else-if="activeTab === 'myPerformance'" />
          <MyCommissionTab v-else-if="activeTab === 'myCommission'" @claim="handleClaim" />
          <SubordinateTab v-else-if="activeTab === 'subInfo'" type="info" />
          <SubordinateTab v-else-if="activeTab === 'subBets'" type="bets" />
          <SubordinateTab v-else-if="activeTab === 'subFinance'" type="finance" />
          <SubordinateTab v-else-if="activeTab === 'subClaims'" type="claims" />
          <CreateAccountTab v-else-if="activeTab === 'createAccount'" />
          <RebateRatioTab v-else-if="activeTab === 'rebateRatio'" />
        </div>
      </transition>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { agentApi } from '@/api/agent'
import { timeOptions } from './useInvite'

import HomeTab from './components/HomeTab.vue'
import ShareTab from './components/ShareTab.vue'
import MyDataTab from './components/MyDataTab.vue'
import MyPerformanceTab from './components/MyPerformanceTab.vue'
import MyCommissionTab from './components/MyCommissionTab.vue'
import SubordinateTab from './components/SubordinateTab.vue'
import CreateAccountTab from './components/CreateAccountTab.vue'
import RebateRatioTab from './components/RebateRatioTab.vue'
import { navigatePcBack } from '@/utils/deviceRoutes'

const router = useRouter()
const route = useRoute()

const goBack = () => {
  if (navigatePcBack(router, route, '/member')) return
  router.back()
}

const myDataTabRef = ref(null)

const currentTime = ref('today')

const changeTime = (value) => {
  currentTime.value = value
  if (myDataTabRef.value?.changeTime) {
    myDataTabRef.value.changeTime(value)
  }
}

const tabs = [
  { key: 'home', label: '首页' },
  { key: 'share', label: '推广分享' },
  { key: 'myData', label: '我的数据' },
  { key: 'myPerformance', label: '我的业绩' },
  { key: 'myCommission', label: '我的佣金' },
  { key: 'subInfo', label: '下级信息' },
  { key: 'subBets', label: '下级投注' },
  { key: 'subFinance', label: '下级财务' },
  { key: 'subClaims', label: '下级领取' },
  { key: 'createAccount', label: '直属开户' },
  { key: 'rebateRatio', label: '返佣比例' }
]

const getInitialTab = () => {
  const urlTab = route.query.active
  if (urlTab && tabs.some(t => t.key === urlTab)) {
    return urlTab
  }
  return sessionStorage.getItem('inviteActiveTab') || 'home'
}
const activeTab = ref(getInitialTab())
const tabsScrollRef = ref(null)
const tabRefs = {}
const tabTransition = ref('tab-slide-left')
const prevTabIndex = ref(0)

const tabIndexMap = {
  'home': 0, 'share': 1, 'myData': 2, 'myPerformance': 3, 'myCommission': 4,
  'subInfo': 5, 'subBets': 6, 'subFinance': 7, 'subClaims': 8,
  'createAccount': 9, 'rebateRatio': 10
}

watch(activeTab, (val, oldVal) => {
  sessionStorage.setItem('inviteActiveTab', val)
  const newIndex = tabIndexMap[val] || 0
  const oldIndex = tabIndexMap[oldVal] || 0
  tabTransition.value = newIndex > oldIndex ? 'tab-slide-left' : 'tab-slide-right'
})

const agentInfo = ref({
  agentId: '',
  agentMode: '一级净盈利',
  auditMultiple: 0,
  settlementDate: ''
})

const inviteInfo = ref({
  inviteCode: '',
  inviteLink: '',
  qrcodeUrl: ''
})

const overview = ref({
  totalEarned: 0,
  totalInvited: 0,
  nextSettlement: '',
  yesterdayPerformance: 0,
  totalCommission: 0,
  claimed: 0,
  pending: 0
})

const setTabRef = (key, el) => {
  if (el) tabRefs[key] = el
}

const switchTab = (key) => {
  activeTab.value = key
  router.replace({ query: { active: key } })
  nextTick(() => {
    scrollTabIntoView(key)
  })
}

const scrollTabIntoView = (key) => {
  const tabEl = tabRefs[key]
  const scrollEl = tabsScrollRef.value
  if (tabEl && scrollEl) {
    const tabRect = tabEl.getBoundingClientRect()
    const scrollRect = scrollEl.getBoundingClientRect()
    const scrollLeft = tabEl.offsetLeft - (scrollRect.width / 2) + (tabRect.width / 2)
    scrollEl.scrollTo({ left: scrollLeft, behavior: 'smooth' })
  }
}

const handleCopy = async (text) => {
  if (!text) {
    showToast('暂无内容')
    return
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    showSuccessToast('复制成功')
  } catch (e) {
    showToast('复制失败，请手动复制')
  }
}

const handleSaveQrcode = () => {
  showToast('长按二维码保存图片')
}

const handleClaim = async () => {
  try {
    const res = await agentApi.claimCommission()
    if (res.code === 0) {
      showSuccessToast('领取成功')
      fetchOverview()
    } else {
      showToast(res.msg || '领取失败')
    }
  } catch {
    showToast('领取失败')
  }
}

const fetchAgentInfo = async () => {
  try {
    const res = await agentApi.getAgentInfo()
    if (res.code === 0 && res.data) {
      agentInfo.value = res.data
    }
  } catch (e) {
    showToast('获取失败')
  }
}

const fetchInviteInfo = async () => {
  try {
    const res = await agentApi.getInviteInfo()
    if (res.code === 0 && res.data) {
      inviteInfo.value = res.data
    }
  } catch (e) {
    showToast('获取失败')
  }
}

const fetchOverview = async () => {
  try {
    const res = await agentApi.getOverview()
    if (res.code === 0 && res.data) {
      overview.value = res.data
    }
  } catch (e) {
    showToast('获取失败')
  }
}

onMounted(() => {
  fetchAgentInfo()
  fetchInviteInfo()
  fetchOverview()
})
</script>

<style scoped>
.share-earn-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #F8F8F8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 50px;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 15px;
  border-bottom: 1px solid #eee;
}

/* 与右侧 .nav-right 同宽，标题才能居中 */
.nav-back {
  width: 100px;
  display: flex;
  align-items: center;
  font-size: 20px;
  color: #333;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.nav-right {
  width: 100px;
  text-align: right;
}

.tabs-wrapper {
  position: sticky;
  top: 50px;
  z-index: 99;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.time-filter-fixed {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  background: #fff;
  padding: 12px;
  overflow-x: auto;
  border-bottom: 1px solid #eee;
}

.time-filter-fixed .filter-btn {
  width: 58px;
  height: 29px;
  border-radius: 15px;
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.time-filter-fixed .filter-btn.active {
  background: #26A17B;
  color: #fff;
  border-color: #26A17B;
}

.tabs-scroll {
  display: flex;
  overflow-x: auto;
  padding: 0 10px;
  -webkit-overflow-scrolling: touch;
}

.tabs-scroll::-webkit-scrollbar {
  display: none;
}

.tab-item {
  flex-shrink: 0;
  padding: 12px 15px;
  font-size: 14px;
  color: #666;
  position: relative;
  white-space: nowrap;
}

.tab-item.active {
  color: #26A17B;
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
  background: #26A17B;
  border-radius: 2px;
}

.tab-content {
  flex: 1;
  position: relative;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-pane {
  padding: 12px;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-slide-left-enter-active,
.tab-slide-left-leave-active {
  transition: transform 0.3s ease-out;
}

.tab-slide-left-enter-from {
  transform: translateX(100%);
}

.tab-slide-left-leave-to {
  transform: translateX(-100%);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.tab-slide-right-enter-active,
.tab-slide-right-leave-active {
  transition: transform 0.3s ease-out;
}

.tab-slide-right-enter-from {
  transform: translateX(-100%);
}

.tab-slide-right-leave-to {
  transform: translateX(100%);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

</style>
