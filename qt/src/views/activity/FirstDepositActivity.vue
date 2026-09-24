<template>
  <div class="first-deposit-activity">
    <van-nav-bar
      :title="activityTitle"
      left-arrow
      fixed
      placeholder
      @click-left="goBack"
      class="custom-nav"
    >
      <template #right>
        <span class="nav-right-link" @click="goToRecords">领取记录</span>
      </template>
    </van-nav-bar>

    <div class="main-container">
      <div class="status-card">
        <div class="status-row">
          <div class="status-item">
            首存金额 <span class="amount-gold">{{ firstDepositAmount }}</span>
          </div>
          <div class="status-item right">
            可领彩金 <span class="amount-gold">{{ claimableAmount }}</span>
            <van-icon name="replay" class="refresh-icon" :class="{ 'rotating': isRefreshing }" @click="refreshData" />
          </div>
        </div>
        
        <div class="reward-table">
          <div class="table-header">
            <div class="th">首存金额</div>
            <div class="th">赠送彩金</div>
            <div class="th action-col"></div>
          </div>
          <div class="table-body">
            <div 
              v-for="(item, index) in rewards" 
              :key="index"
              class="table-row"
              :class="{ 'row-light': index % 2 !== 0 }"
            >
              <div class="td condition-text">≥{{ formatNumber(item.conditionValue) }}</div>
              <div class="td reward-text">{{ item.rewardAmount }}</div>
              <div class="td action-col">
                <div 
                  class="action-btn"
                  :class="{ 'btn-gray': !item.canClaim, 'btn-claim': item.canClaim }"
                  @click="handleClaim(item)"
                >
                  {{ item.statusText || '领取' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="info-card">
        <div class="ribbon-title">
          <span>活动时间 (UTC+8)</span>
        </div>
        <div class="time-content">{{ activityTime }}</div>
      </div>

      <div class="info-card">
        <div class="ribbon-title">
          <span>活动说明</span>
        </div>
        <div class="rules-content" v-safe-html="activityContent"></div>
      </div>

      <div class="related-section" v-if="relatedActivities.length > 0">
        <div 
          v-for="(act, index) in relatedActivities" 
          :key="index"
          class="related-card"
          :class="{ 'active': act.id === Number(route.params.id) }"
          @click="goToActivity(act)"
        >
          <img :src="resolveMediaUrl(act.banner)" class="related-img" />
          <div class="related-title" :class="{ 'title-active': act.id === Number(route.params.id) }">{{ act.title }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { activityApi } from '@/api/activity'
import { navigateActivityList, navigateToActivity } from '@/utils/activityRoutes'
import { resolveMediaUrl, prepareActivityHtml } from '@/utils/mediaUrl'

const router = useRouter()
const route = useRoute()
const isRefreshing = ref(false)
const activityTitle = ref('加载中...')
const activityContent = ref('<p>加载中...</p>')
const activityTime = ref('长期有效')
const firstDepositAmount = ref('0.00')
const claimableAmount = ref('0.00')
const activityId = computed(() => Number(route.params.id) || 0)

const rewards = ref([])
const relatedActivities = ref([])

const loadRelatedActivities = async () => {
  try {
    const res = await activityApi.getActivityList()
    if (res.code === 0 && res.data && res.data.list) {
      relatedActivities.value = res.data.list
        .sort((a, b) => (b.sort || 0) - (a.sort || 0))
        .map(item => ({
          id: item.id,
          title: item.title,
          banner: item.banner,
          type: item.type_code || item.type,
          category: item.category
        }))
    }
  } catch (error) {
  }
}

const loadData = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  
  try {
    const detailRes = await activityApi.getActivityDetail(activityId.value)
    if (detailRes.code === 0 && detailRes.data) {
      activityTitle.value = detailRes.data.title || '活动详情'
      activityContent.value = prepareActivityHtml(detailRes.data.content)
      
      const startTime = detailRes.data.start_time ? new Date(detailRes.data.start_time * 1000).toLocaleDateString() : ''
      const endTime = detailRes.data.end_time ? new Date(detailRes.data.end_time * 1000).toLocaleDateString() : '长期有效'
      activityTime.value = startTime ? `${startTime} - ${endTime}` : '长期有效'
    }
    
    const res = await activityApi.checkReward(activityId.value)
    if (res.code === 0 && res.data) {
      firstDepositAmount.value = res.data.firstDepositAmount || '0.00'
      
      if (res.data.matchedReward && res.data.canClaim) {
        claimableAmount.value = res.data.matchedReward.rewardAmount || '0.00'
      } else {
        claimableAmount.value = '0.00'
      }
      
      if (res.data.allLevels && res.data.allLevels.length > 0) {
        rewards.value = res.data.allLevels.map(item => ({
          rewardId: item.rewardId,
          conditionValue: item.conditionMin || 0,
          rewardAmount: item.rewardAmount || '0.00',
          canClaim: item.canClaim === true,
          statusText: item.isClaimed ? '已领取' : (item.canClaim ? '领取' : '领取')
        }))
      }
    }
  } catch (error) {
  } finally {
    setTimeout(() => {
      isRefreshing.value = false
    }, 500)
  }
}

onMounted(async () => {
  await loadData()
  await loadRelatedActivities()
})

const goBack = () => navigateActivityList(router, route)

const goToRecords = () => {
  router.push('/reward-record')
}

const refreshData = async () => {
  await loadData()
  showToast('刷新成功')
}

const formatNumber = (num) => {
  return Number(num).toLocaleString()
}

const handleClaim = async (item) => {
  if (!item.canClaim) return
  
  try {
    const data = {
      activity_id: activityId.value,
      reward_id: item.rewardId,
      condition_value: ''
    }
    
    const res = await activityApi.claimReward(data)
    if (res.code === 0) {
      showToast('领取成功')
      item.canClaim = false
      item.statusText = '已领取'
      setTimeout(() => loadData(), 1000)
    } else {
      showToast(res.message || '领取失败')
    }
  } catch (error) {
    showToast('领取失败，请稍后重试')
  }
}

const goToActivity = (activity) => {
  navigateToActivity(router, route, activity, { replace: true })
}
</script>

<style scoped>
.first-deposit-activity {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #f7f8fa;
  padding-bottom: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
}

:deep(.van-nav-bar__title) {
  font-weight: 500;
  color: #333;
}

.nav-right-link {
  color: #26A17B;
  font-size: 14px;
}

.main-container {
  padding: 10px 15px;
}

.status-card {
  background: #fff;
  border-radius: 8px;
  padding: 0;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  overflow: hidden;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 15px;
  font-size: 14px;
  color: #666;
}

.status-item {
  display: flex;
  align-items: center;
}

.status-item.right {
  justify-content: flex-end;
}

.amount-gold {
  color: #f59e0b;
  margin-left: 4px;
  font-weight: 500;
  margin-right: 6px;
}

.refresh-icon {
  color: #26A17B;
  font-size: 16px;
  cursor: pointer;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.reward-table {
  width: 100%;
}

.table-header {
  display: flex;
  background: #f9fafb;
  padding: 12px 0;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.table-row {
  display: flex;
  padding: 12px 0;
  align-items: center;
  background: #fff;
}

.row-light {
  background: #fcfcfc;
}

.th, .td {
  flex: 1;
  text-align: center;
}

.condition-text {
  font-size: 13px;
  color: #999;
}

.reward-text {
  font-size: 14px;
  color: #f59e0b;
  font-weight: 500;
}

.action-col {
  display: flex;
  justify-content: center;
  align-items: center;
}

.action-btn {
  width: 70px;
  height: 28px;
  line-height: 28px;
  text-align: center;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  cursor: pointer;
}

.btn-gray {
  background: #9ca3af;
}

.btn-claim {
  background: #26A17B;
}

.info-card {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  overflow: visible;
}

.ribbon-title {
  display: inline-flex;
  align-items: center;
  background: #26A17B;
  color: #fff;
  padding: 4px 12px;
  font-size: 14px;
  border-top-right-radius: 100px;
  border-bottom-right-radius: 100px;
  margin-bottom: 15px;
  position: relative;
  left: -15px;
  box-shadow: 2px 2px 5px rgba(38, 161, 123, 0.2);
}

.time-content {
  font-size: 13px;
  color: #666;
  padding-left: 5px;
}

.rules-content {
  padding-left: 5px;
}

.rules-content p {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 8px;
}

.related-section {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  padding-bottom: 10px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.related-section::-webkit-scrollbar {
  display: none;
}

.related-card {
  flex-shrink: 0;
  width: 150px;
  position: relative;
  cursor: pointer;
}

.related-img {
  width: 100%;
  height: 90px;
  object-fit: contain;
  border-radius: 8px;
  display: block;
  background: #f5f5f5;
  border: 2px solid transparent;
  box-sizing: border-box;
  transition: all 0.2s;
}

.related-badge {
  position: absolute;
  top: 0;
  left: 0;
  background: #ff4d4f;
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-top-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.related-card:active .related-img {
  transform: scale(0.98);
}

.related-card.active .related-img {
  border-color: #26A17B;
}

.related-title {
  font-size: 13px;
  color: #333;
  margin-top: 8px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.related-title.title-active {
  color: #26A17B;
  font-weight: 600;
}
</style>
