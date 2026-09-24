<template>
  <div class="tab-record">
    <div class="filter-bar">
      <div class="filter-left">
        <AppSelect v-model="timeFilter" :options="timeOptions" @change="loadRecords" />
        <AppSelect v-model="statusFilter" :options="statusOptions" />
      </div>
      <div class="total-amount">
        <span class="label">奖金</span>
        <span class="amount">{{ totalAmount.toFixed(2) }}</span>
      </div>
    </div>
    
    <div class="scroll-content">
      <van-loading v-if="loading" type="spinner" size="24" style="margin: 40px auto;">加载中...</van-loading>
      
      <div class="record-empty" v-else-if="filteredList.length === 0">
        <img src="/assets/img/img_none_sj.avif" class="empty-img" alt="暂无记录" />
        <p>{{ currentTimeText }}暂无记录，可<span class="link" @click="viewMore">查看更多</span></p>
      </div>
      
      <div class="record-list" v-else>
      <div 
        class="record-item" 
        v-for="item in filteredList" 
        :key="item.id"
        :class="{ clickable: item.hasDetail || item.rewardType !== 'rebate' }"
        @click="handleItemClick(item)"
      >
        <div class="item-left">
          <div class="item-title-row">
            <span class="item-title">{{ item.activityTitle || getRewardTypeName(item.rewardType) }}</span>
            <span class="item-count" v-if="item.rebateCount">共{{ item.rebateCount }}笔</span>
          </div>
          <span class="item-time">{{ formatTime(item.applyTime) }}</span>
        </div>
        <div class="item-right">
          <span class="item-amount" :class="getStatusClass(item.status)">{{ item.status === 1 ? '+' : '' }}¥ {{ item.rewardAmount }}</span>
          <div class="item-status-row">
            <span class="item-status" :class="getStatusClass(item.status)">{{ getStatusText(item.status) }}</span>
            <span class="item-arrow" v-if="item.hasDetail">▶</span>
          </div>
        </div>
      </div>
    </div>
    </div>

    <div class="detail-overlay" v-if="showDetail" @click="closeDetail">
      <div class="detail-modal" @click.stop>
        <div class="detail-header">
          <div class="detail-title">{{ detailData.title || '详情' }}</div>
          <div class="detail-summary" v-if="detailData.type === 'rebate'">
            {{ detailData.date }} · 共{{ detailData.count }}笔 · {{ detailData.totalAmount }}元
          </div>
        </div>
        <div class="detail-body">
          <van-loading v-if="detailLoading" type="spinner" size="20" style="margin: 20px auto;">加载中...</van-loading>
          
          <div class="detail-list" v-else-if="detailData.type === 'rebate'">
            <div class="detail-item" v-for="item in detailData.list" :key="item.id">
              <div class="detail-item-left">
                <span class="detail-item-title">{{ item.title }}</span>
                <span class="detail-item-time">{{ item.time }}</span>
              </div>
              <div class="detail-item-right">
                <span class="detail-item-amount">+{{ item.amount }}</span>
              </div>
            </div>
          </div>
          
          <div class="activity-detail" v-else-if="detailData.type === 'activity'">
            <div class="activity-detail-row">
              <span class="label">奖励金额</span>
              <span class="value amount">+¥ {{ detailData.totalAmount }}</span>
            </div>
            <div class="activity-detail-row">
              <span class="label">领取时间</span>
              <span class="value">{{ detailData.date }}</span>
            </div>
            <div class="activity-detail-row">
              <span class="label">状态</span>
              <span class="value" :class="detailData.status === 1 ? 'success' : ''">{{ detailData.statusText }}</span>
            </div>
            <div class="activity-detail-row" v-if="detailData.conditionValue">
              <span class="label">关联订单</span>
              <span class="value order-no">{{ detailData.conditionValue }}</span>
            </div>
            <div class="activity-detail-row" v-if="detailData.remark">
              <span class="label">备注</span>
              <span class="value">{{ detailData.remark }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="close-btn" @click="closeDetail">✕</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { showToast } from 'vant'
import { activityApi } from '@/api/activity'
import { AppSelect } from '@/components/common'

const loading = ref(false)
const refreshing = ref(false)
const recordList = ref([])
const timeFilter = ref('today')
const statusFilter = ref('all')
const totalAmount = ref(0)

const showDetail = ref(false)
const detailLoading = ref(false)
const detailData = ref({ date: '', count: 0, totalAmount: '0.00', list: [] })

const timeOptions = [
  { label: '今日', value: 'today' },
  { label: '昨日', value: 'yesterday' },
  { label: '本周', value: 'week' },
  { label: '上周', value: 'last_week' },
  { label: '本月', value: 'month' },
  { label: '上月', value: 'last_month' }
]

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '已派发', value: 'granted' },
  { label: '已领取', value: 'claimed' }
]

const currentTimeText = computed(() => {
  const item = timeOptions.find(o => o.value === timeFilter.value)
  return item ? item.label : '今日'
})

const filteredList = computed(() => {
  if (statusFilter.value === 'all') return recordList.value
  if (statusFilter.value === 'granted') return recordList.value.filter(r => r.status === 0 || r.status === 2)
  if (statusFilter.value === 'claimed') return recordList.value.filter(r => r.status === 1)
  return recordList.value
})

const viewMore = () => {
  if (timeFilter.value === 'today' || timeFilter.value === 'yesterday') {
    timeFilter.value = 'week'
  } else if (timeFilter.value === 'week' || timeFilter.value === 'last_week') {
    timeFilter.value = 'month'
  }
}

const loadRecords = async () => {
  loading.value = true
  try {
    const params = { 
      page: 1, 
      pageSize: 50,
      date_range: timeFilter.value
    }
    
    const res = await activityApi.getParticipationHistory(params)
    if (res.code === 0 && res.data) {
      recordList.value = res.data.list || []
      totalAmount.value = parseFloat(res.data.totalAmount) || recordList.value.reduce((sum, r) => sum + (r.status === 1 ? parseFloat(r.rewardAmount) || 0 : 0), 0)
    }
  } catch (e) {
    showToast('加载失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const onRefresh = () => {
  loadRecords()
}

const handleItemClick = async (item) => {
  if (item.hasDetail && item.rebateDate) {
    showDetail.value = true
    detailLoading.value = true
    detailData.value = { 
      type: 'rebate',
      title: '反水明细',
      date: item.rebateDate, 
      count: item.rebateCount, 
      totalAmount: item.rewardAmount, 
      list: [] 
    }
    
    try {
      const res = await activityApi.getRebateDetail(item.rebateDate)
      if (res.code === 0 && res.data) {
        detailData.value = { ...detailData.value, ...res.data }
      }
    } catch (e) {
      showToast('加载明细失败')
    } finally {
      detailLoading.value = false
    }
  } else if (item.rewardType === 'activity' || item.rewardType === 'vip_upgrade' || item.rewardType === 'signin' || item.rewardType === 'lucky_order' || item.rewardType === 'weekly_salary' || item.rewardType === 'pg_betting_king' || item.rewardType === 'loss_rescue') {
    showDetail.value = true
    detailLoading.value = false
    detailData.value = {
      type: 'activity',
      title: item.activityTitle || '活动奖励',
      date: formatTime(item.applyTime),
      totalAmount: item.rewardAmount,
      status: item.status,
      statusText: getStatusText(item.status),
      remark: item.auditRemark || '',
      conditionValue: item.conditionValue || ''
    }
  }
}

const closeDetail = () => {
  showDetail.value = false
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const d = new Date(timestamp * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const getRewardTypeName = (type) => {
  const map = {
    'lucky_order': '幸运注单',
    'loss_rescue': '亏损救援',
    'weekly_salary': '周俸禄',
    'monthly_salary': '月俸禄',
    'pg_betting_king': '打码王',
    'deposit_bonus': '充值奖励',
    'rebate': '反水奖励',
    'vip_upgrade': 'VIP晋级奖励',
    'activity': '活动奖励',
    'signin': '签到奖励'
  }
  return map[type] || '奖励'
}

const getStatusText = (status) => {
  if (status === 1) return '已领取'
  if (status === 2) return '已拒绝'
  return '已派发'
}

const getStatusClass = (status) => {
  return status === 1 ? 'success' : status === 2 ? 'rejected' : 'pending'
}

watch(timeFilter, () => {
  loadRecords()
})

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.tab-record {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;
  min-height: 300px;
  position: relative;
  overflow: hidden;
}

.filter-bar {
  flex-shrink: 0;
  padding: 10px 15px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.filter-left {
  display: flex;
  gap: 10px;
}

.filter-bar :deep(.select-trigger) {
  min-width: 89.72px;
  width: 89.72px;
  height: 26.66px;
  padding: 0 8px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #999;
}

.total-amount {
  display: flex;
  align-items: center;
  gap: 6px;
}

.total-amount .label {
  font-size: 13px;
  color: #666;
}

.total-amount .amount {
  font-size: 16px;
  font-weight: 600;
  color: #f5a623;
}

.record-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #999;
}

.record-empty .empty-img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  opacity: 0.9;
}

.record-empty p { 
  margin-top: 10px; 
  font-size: 14px; 
  color: #999;
}

.record-empty .link {
  color: #26A17B;
  cursor: pointer;
}

.record-list { 
  background: #fff; 
  margin: 10px 15px; 
  margin-bottom: 40px;
  border-radius: 12px; 
  overflow: hidden; 
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.record-item.clickable {
  cursor: pointer;
}

.record-item.clickable:active {
  background: #f5f5f5;
}

.record-item:last-child { 
  border-bottom: none; 
}

.item-left { 
  display: flex; 
  flex-direction: column; 
  gap: 4px; 
}

.item-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-title { 
  font-size: 14px; 
  color: #333; 
}

.item-count {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.item-time { 
  font-size: 12px; 
  color: #999; 
}

.item-right { 
  display: flex; 
  flex-direction: column; 
  align-items: flex-end; 
  gap: 4px; 
}

.item-amount { 
  font-size: 16px; 
  font-weight: bold; 
}

.item-amount.success { 
  color: #52c41a; 
}

.item-amount.rejected { 
  color: #999; 
  text-decoration: line-through; 
}

.item-amount.pending { 
  color: #26A17B; 
}

.item-status-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-status { 
  font-size: 12px; 
}

.item-status.success { 
  color: #52c41a; 
}

.item-status.rejected { 
  color: #f44336; 
}

.item-status.pending { 
  color: #26A17B; 
}

.item-arrow {
  font-size: 10px;
  color: #999;
}

.detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 15vh;
  z-index: 1000;
}

.detail-modal {
  width: 85%;
  max-width: 360px;
  max-height: 60vh;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-header {
  padding: 16px;
  background: #fff;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
}

.detail-summary {
  font-size: 12px;
  color: #999;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.detail-list {
  padding: 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-item-title {
  font-size: 14px;
  color: #333;
}

.detail-item-time {
  font-size: 12px;
  color: #999;
}

.detail-item-right {
  display: flex;
  align-items: center;
}

.detail-item-amount {
  font-size: 14px;
  font-weight: 600;
  color: #52c41a;
}

.close-btn {
  width: 40px;
  height: 40px;
  margin-top: 20px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  cursor: pointer;
}

.close-btn:active {
  background: rgba(255, 255, 255, 0.1);
}

.activity-detail {
  padding: 16px;
}

.activity-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.activity-detail-row:last-child {
  border-bottom: none;
}

.activity-detail-row .label {
  font-size: 14px;
  color: #666;
}

.activity-detail-row .value {
  font-size: 14px;
  color: #333;
}

.activity-detail-row .value.amount {
  font-size: 18px;
  font-weight: bold;
  color: #52c41a;
}

.activity-detail-row .value.success {
  color: #52c41a;
}

.activity-detail-row .value.order-no {
  font-size: 12px;
  color: #999;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
