<template>
  <van-popup
    v-model:show="visible"
    position="center"
    round
    :style="popupStyle"
    :z-index="zIndex"
    class="history-popup" :class="theme ? `theme-${theme}` : ''"
    :overlay-style="{ background: 'rgba(0,0,0,0.5)' }"
  >
    <div class="view-history">
      <div class="history-header">
        <div class="history-title">{{ t('payment.depositRecord') }}</div>
      </div>

      <div class="filter-bar">
        <AppSelect v-model="timeFilter" :options="timeOptions" />
        <AppSelect v-model="statusFilter" :options="statusOptions" class="status-select" />
      </div>

      
      <div class="record-list">
        <div 
          v-for="record in filteredRecords" 
          :key="record.id"
          class="record-item"
          @click="$emit('view-detail', record)"
        >
          <div class="record-left">
            <div class="record-icon-img">
              <div class="usdt-icon-css">T</div>
            </div>
            <div class="record-info">
              <div class="record-type">{{ getPayTypeName(record.paytype) }}</div>
              <div class="record-time">{{ record.createTime }}</div>
              <div class="record-order">
                <span class="order-no-text">{{ record.orderNo }}</span>
                <van-icon name="description-o" class="copy-mini" @click.stop="copyText(record.orderNo)" />
              </div>
            </div>
          </div>
          <div class="record-right">
            <div class="record-amount">{{ record.amount }}</div>
            <div class="record-status" :class="getStatusClass(record.status)">
              {{ getStatusText(record.status) }}
            </div>
          </div>
          <van-icon name="arrow" class="record-arrow" />
        </div>

        
        <div v-if="filteredRecords.length === 0" class="empty-state">
          <img src="/assets/img/img_none_sj.avif" class="empty-img" />
          <div class="empty-text">
            <span>{{ t('payment.noDepositRecord') }}</span>
            <span class="view-all" @click="loadAllRecords">{{ t('payment.viewMore') }}</span>
          </div>
        </div>
      </div>
    </div>
    
    
    <div class="close-circle-outer" @click="visible = false">
      <van-icon name="cross" size="18" />
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { showToast } from 'vant'
import { rechargeApi } from '@/api/recharge'
import { AppSelect } from '@/components/common'

const { t } = useI18n()

const props = defineProps({
  show: { type: Boolean, default: false },
  theme: { type: String, default: '' },
  zIndex: { type: Number, default: 2000 }
})

const emit = defineEmits(['update:show', 'view-detail'])

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

// PC 端使用与存款弹窗一致的定宽居中弹窗
const isPc = computed(() => props.theme === 'pc')

const popupStyle = computed(() => (isPc.value
  ? { width: '720px', maxWidth: '92vw', height: '62vh' }
  : { width: '92%', height: '60vh' }))

const timeFilter = ref('today')
const statusFilter = ref('all')
const records = ref([])
const loading = ref(false)

const timeOptions = computed(() => [
  { label: t('payment.today'), value: 'today' },
  { label: t('payment.yesterday'), value: 'yesterday' },
  { label: t('payment.last7Days'), value: 'week' },
  { label: t('payment.last30Days'), value: 'month' },
  { label: t('common.all'), value: 'all' }
])

const statusOptions = computed(() => [
  { label: t('payment.allStatus'), value: 'all' },
  { label: t('payment.confirming'), value: 'confirming' },
  { label: t('payment.waitingPayment'), value: 'pending' },
  { label: t('payment.depositTimeout'), value: 'timeout' },
  { label: t('payment.depositFailed'), value: 'failed' },
  { label: t('payment.depositCancelled'), value: 'cancelled' },
  { label: t('payment.depositSuccessStatus'), value: 'success' }
])

const stateToStatus = {
  '0': 'pending',
  '1': 'confirming',
  '2': 'success',
  '3': 'failed',
  '4': 'cancelled',
  '5': 'timeout'
}

const filteredRecords = computed(() => {
  let result = [...records.value]
  if (statusFilter.value !== 'all') {
    result = result.filter(r => {
      const status = stateToStatus[r.state] || r.status || r.state
      return status === statusFilter.value
    })
  }
  return result
})

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast(t('payment.copied'))
  } catch (e) {
    showToast(t('common.copyFailed'))
  }
}

const formatTime = (time) => {
  if (!time) return ''
  let date
  if (typeof time === 'number' && time > 1000000000000) {
    date = new Date(time)
  } else if (typeof time === 'number' && time > 1000000000) {
    date = new Date(time * 1000)
  } else if (typeof time === 'string' && time.includes('-')) {
    return time
  } else {
    date = new Date(time)
  }
  if (isNaN(date.getTime())) return time
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const getDateRange = (type) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (type) {
    case 'today':
      return { startTime: today.getTime(), endTime: now.getTime() }
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { startTime: yesterday.getTime(), endTime: today.getTime() - 1 }
    case 'week':
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return { startTime: weekAgo.getTime(), endTime: now.getTime() }
    case 'month':
      const monthAgo = new Date(today)
      monthAgo.setDate(monthAgo.getDate() - 30)
      return { startTime: monthAgo.getTime(), endTime: now.getTime() }
    case 'all':
      return {}
    default:
      return {}
  }
}

const loadRecords = async () => {
  try {
    loading.value = true
    const params = { page: 1, pageSize: 50 }
    const dateRange = getDateRange(timeFilter.value)
    if (dateRange.startTime) params.startTime = dateRange.startTime
    if (dateRange.endTime) params.endTime = dateRange.endTime
    
    if (statusFilter.value !== 'all') {
      const statusToState = {
        'pending': 0, 'confirming': 1, 'success': 2,
        'failed': 3, 'cancelled': 4, 'timeout': 5
      }
      if (statusToState[statusFilter.value] !== undefined) {
        params.state = statusToState[statusFilter.value]
      }
    }
    
    const res = await rechargeApi.getRecords(params)
    if (res.code === 0 && res.data) {
      const list = res.data.list || res.data || []
      records.value = list.map(item => ({
        id: item.id || item.trano,
        orderNo: item.trano || item.orderNo || item.order_no,
        amount: item.amount || item.money,
        status: stateToStatus[item.state] || item.status || item.state,
        state: item.state,
        createTime: formatTime(item.createTime || item.addtime || item.create_time),
        chain: item.chain || 'TRC-20',
        paytype: item.paytype || 'USDT',
        paytypeName: item.paytypeName || item.paytype_name || ''
      }))
    }
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const getStatusClass = (status) => {
  const map = {
    'pending': 'status-pending',
    'confirming': 'status-pending',
    'success': 'status-success',
    'failed': 'status-failed',
    'timeout': 'status-timeout',
    'cancelled': 'status-cancelled'
  }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = {
    'pending': t('payment.waitingPayment'),
    'confirming': t('payment.confirming'),
    'success': t('payment.depositSuccessStatus'),
    'failed': t('payment.depositFailed'),
    'timeout': t('payment.depositTimeout'),
    'cancelled': t('payment.depositCancelled')
  }
  return map[status] || status
}

const getPayTypeName = (type) => {
  const map = {
    'USDT': 'USDT',
    'EpUSDT': 'EpUSDT',
    'alipay': t('payment.alipay'),
    'weixin': t('payment.wechat'),
    'linepay': t('payment.bankTransfer')
  }
  return map[type] || type || 'USDT'
}

const loadAllRecords = () => {
  timeFilter.value = 'all'
}

watch([timeFilter, statusFilter], () => {
  if (props.show) loadRecords()
})

watch(() => props.show, (val) => {
  if (val) loadRecords()
})

defineExpose({ loadRecords })
</script>

<style scoped>
/* 默认（移动端）与 PC 一致采用站点黑金皮肤，彩票聊天页保留浅色蓝色主题 */
.history-popup {
  --dp-bg: #1c1c1c;
  --dp-soft: #252525;
  --dp-border: #3a3a3a;
  --dp-title: #e8c978;
  --dp-text: #e0e0e0;
  --dp-muted: #999;
  --dp-primary: #d5aa54;
  --dp-gold: #e8c978;
}

.history-popup.theme-lottery {
  --dp-bg: #fff;
  --dp-soft: #fff;
  --dp-border: #f5f6f7;
  --dp-title: #333;
  --dp-text: #323233;
  --dp-muted: #969799;
  --dp-primary: #5691fe;
  --dp-gold: #5691fe;
}

.history-popup {
  overflow: visible !important;
  background: transparent !important;
}

.view-history {
  background: var(--dp-bg);
  border: 1px solid var(--dp-border);
  color: var(--dp-text);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  position: relative;
  height: 100%;
  padding-bottom: 20px;
}

.history-header {
  padding: 24px 0 15px;
  text-align: center;
  border-bottom: 1px solid var(--dp-border);
  margin-bottom: 15px;
}

.history-title {
  font-size: 18px;
  font-weight: 500;
  color: var(--dp-title);
}

.filter-bar {
  padding: 0 20px 15px;
  display: flex;
  gap: 12px;
  position: relative;
  z-index: 10;
}

.filter-bar :deep(.status-select .select-trigger) {
  min-width: 80px;
}

.record-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--dp-border);
  cursor: pointer;
}

.record-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.record-icon-img {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.usdt-icon-css {
  width: 100%;
  height: 100%;
  background: #26A17B;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  font-weight: bold;
}

.record-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.record-type {
  font-size: 15px;
  color: var(--dp-text);
  font-weight: 600;
}

.record-time {
  font-size: 11px;
  color: var(--dp-muted);
}

.record-order {
  font-size: 11px;
  color: var(--dp-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}

.order-no-text {
  word-break: break-all;
}

.copy-mini {
  color: var(--dp-primary);
  font-size: 12px;
  cursor: pointer;
}

.record-right {
  text-align: right;
  margin-left: 10px;
}

.record-amount {
  font-size: 17px;
  color: var(--dp-text);
  font-weight: 600;
}

.record-status {
  font-size: 13px;
  margin-top: 6px;
}

.record-status.status-pending { color: #ff976a; }
.record-status.status-success { color: var(--dp-gold); }
.record-status.status-failed,
.record-status.status-cancelled,
.record-status.status-timeout { color: #ee0a24; }

.record-arrow {
  color: var(--dp-muted);
  font-size: 14px;
}

.close-circle-outer {
  position: absolute;
  bottom: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  z-index: 9999;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
}

.empty-img {
  width: 120px;
  opacity: 0.6;
}

.empty-text {
  margin-top: 15px;
  font-size: 14px;
  color: var(--dp-muted);
}

.view-all {
  color: var(--dp-primary);
  margin-left: 8px;
  cursor: pointer;
}

/* ===== 站点黑金皮肤（移动端 + PC）：下拉筛选与滚动条 ===== */
.history-popup:not(.theme-lottery) .record-item:hover {
  background: rgba(213, 170, 84, 0.06);
}

.history-popup:not(.theme-lottery) .empty-img {
  opacity: 0.45;
}

.history-popup:not(.theme-lottery) .close-circle-outer {
  border: 1px solid rgba(213, 170, 84, 0.45);
  background: rgba(0, 0, 0, 0.55);
  color: var(--dp-gold);
}

.history-popup:not(.theme-lottery) .record-list::-webkit-scrollbar {
  width: 6px;
}

.history-popup:not(.theme-lottery) .record-list::-webkit-scrollbar-thumb {
  background: var(--dp-border);
  border-radius: 3px;
}

.history-popup:not(.theme-lottery) :deep(.select-trigger) {
  background: var(--dp-soft);
  border-color: var(--dp-border);
  color: var(--dp-text);
}

.history-popup:not(.theme-lottery) :deep(.app-select.active .select-trigger) {
  border-color: var(--dp-primary);
}

.history-popup:not(.theme-lottery) :deep(.trigger-text) {
  color: var(--dp-text);
}

.history-popup:not(.theme-lottery) :deep(.app-select.active .trigger-text),
.history-popup:not(.theme-lottery) :deep(.app-select.active .trigger-arrow) {
  color: var(--dp-gold);
}

.history-popup:not(.theme-lottery) :deep(.panel-content) {
  background: var(--dp-soft);
  border: 1px solid var(--dp-border);
}

.history-popup:not(.theme-lottery) :deep(.panel-arrow) {
  background: var(--dp-soft);
  border-color: var(--dp-border);
}

.history-popup:not(.theme-lottery) :deep(.select-option) {
  color: var(--dp-text);
  border-bottom-color: var(--dp-border);
}

.history-popup:not(.theme-lottery) :deep(.select-option.selected),
.history-popup:not(.theme-lottery) :deep(.select-option.selected .option-text),
.history-popup:not(.theme-lottery) :deep(.option-check) {
  color: var(--dp-gold);
}
</style>
