<template>
  <div class="tab-pending">
    <div class="header-bar">
      <div class="total-amount">
        <img src="/assets/img/CNY.avif" class="currency-icon" alt="" />
        <span class="amount-value">{{ totalAmount }}</span>
        <img 
          src="/assets/img/comm_icon_sx1.svg" 
          class="refresh-icon" 
          :class="{ rotating: refreshing }"
          @click="onRefresh" 
          alt="" 
        />
      </div>
    </div>
    
    <van-loading v-if="loading" type="spinner" size="24" style="margin: 40px auto;">加载中...</van-loading>
    
    <div class="pending-empty" v-else-if="pendingList.length === 0">
      <van-icon name="gift-o" size="60" color="#ccc" />
      <p>暂无待领取奖励</p>
    </div>
    
    <div class="pending-list" v-else>
      <div class="pending-item" v-for="item in pendingList" :key="item.id">
        <div class="item-info">
          <span class="item-title">{{ item.activityTitle || item.rewardType }}</span>
          <span class="item-time">{{ formatTime(item.applyTime) }}</span>
        </div>
        <div class="item-right">
          <span class="item-amount">¥ {{ item.rewardAmount }}</span>
          <van-button 
            v-if="item.canClaim" 
            class="claim-btn" 
            size="small" 
            :loading="item.claiming"
            @click="handleClaim(item)"
          >
            领取
          </van-button>
          <span v-else class="item-status pending">{{ item.statusText || '待审核' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { activityApi } from '@/api/activity'

const loading = ref(false)
const refreshing = ref(false)
const pendingList = ref([])
const totalAmount = ref('0.00')

const loadPendingRewards = async () => {
  loading.value = true
  try {
    const res = await activityApi.getPendingRewards()
    if (res.code === 0 && res.data) {
      pendingList.value = (res.data.list || []).map(item => ({
        ...item,
        claiming: false
      }))
      totalAmount.value = res.data.totalAmount || '0.00'
    }
  } catch (e) {
    showToast('加载失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const handleClaim = async (item) => {
  if (item.claiming) return
  item.claiming = true
  
  try {
    const data = {
      activity_id: item.activityId,
      reward_id: item.rewardId,
      condition_value: item.conditionValue || ''
    }
    
    const res = await activityApi.claimReward(data)
    if (res.code === 0) {
      showToast(`领取成功，获得 ${res.data.amount} 元`)
      setTimeout(() => loadPendingRewards(), 500)
    } else {
      showToast(res.message || '领取失败')
    }
  } catch (e) {
    showToast(e.message || '领取失败')
  } finally {
    item.claiming = false
  }
}

const onRefresh = () => {
  refreshing.value = true
  loadPendingRewards()
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const d = new Date(timestamp * 1000)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  onRefresh()
})
</script>

<style scoped>
.tab-pending {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  background: #f7f8fa;
  min-height: 300px;
}
.header-bar {
  margin-bottom: 15px;
}
.total-amount {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.currency-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
.amount-value {
  font-size: 18px;
  font-weight: bold;
  color: #26A17B;
}
.refresh-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  cursor: pointer;
}
.refresh-icon:active {
  transform: scale(0.9);
}
.rotating {
  animation: rotate 1s linear infinite;
}
@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.pending-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #999;
}
.pending-empty p { margin-top: 15px; font-size: 14px; }
.pending-list { background: #fff; border-radius: 12px; overflow: hidden; }
.pending-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}
.pending-item:last-child { border-bottom: none; }
.item-info { display: flex; flex-direction: column; gap: 4px; }
.item-title { font-size: 14px; color: #333; }
.item-time { font-size: 12px; color: #999; }
.item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.item-amount { font-size: 16px; font-weight: bold; color: #ff6b00; }
.item-status { font-size: 12px; padding: 2px 8px; border-radius: 10px; }
.item-status.pending { background: #fff3e0; color: #ff9800; }
.claim-btn { background: #26A17B; color: #fff; border: none; border-radius: 4px; font-size: 12px; padding: 0 12px; height: 28px; }
</style>
