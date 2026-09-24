<template>
  <van-popup
    v-model:show="visible"
    position="center"
    round
    :style="popupStyle"
    :z-index="zIndex"
    class="detail-popup" :class="theme ? `theme-${theme}` : ''"
  >
    <div class="view-detail">
      <div class="detail-header">
        <div class="header-left" @click="visible = false">
          <van-icon :name="isPc ? 'cross' : 'arrow-left'" size="20" />
        </div>
        <div class="header-title">{{ t('payment.depositDetail') }}</div>
        <div class="header-right">
          <img src="/assets/img/style_3_icon_top_kf.svg" class="header-icon" @click="toService" />
        </div>
      </div>

      <div class="detail-body" v-if="record">
        <div class="status-section">
          <div class="status-icon" :class="getStatusClass(record.status)">
            <van-icon :name="getStatusIcon(record.status)" size="40" />
          </div>
          <div class="status-text" :class="getStatusClass(record.status)">
            {{ getStatusText(record.status) }}
          </div>
        </div>

        <div class="amount-display">
          <span class="amount-value">{{ record.amount }}</span>
          <span class="amount-unit">{{ isUsdtRecord ? 'USDT' : 'CNY' }}</span>
          <van-icon name="description-o" class="copy-icon" @click="copyAmount" />
        </div>

        <div class="divider-dashed"></div>

        <div class="detail-info-list">
          <div class="info-row">
            <span class="info-label">{{ t('payment.transactionType') }}</span>
            <span class="info-value">{{ t('payment.recharge') }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">{{ t('payment.depositMethod') }}</span>
            <span class="info-value">
              <div class="usdt-icon-tiny">{{ isUsdtRecord || isEpusdtRecord ? '₮' : '¥' }}</div>
              {{ record.paytypeName || record.paytype || 'USDT' }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">{{ t('payment.depositChannel') }}</span>
            <span class="info-value">{{ depositChannel }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">{{ t('payment.createTime') }}</span>
            <span class="info-value">{{ record.createTime }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">{{ t('payment.orderNumber') }}</span>
            <span class="info-value order-no">
              {{ record.orderNo }}
              <van-icon name="description-o" class="copy-icon-small" @click="copyOrderNo" />
            </span>
          </div>
        </div>
      </div>

      <div
        class="detail-footer"
        v-if="record && record.paytype !== 'EpUSDT' && (record.status === 'pending' || record.status === 'confirming')"
      >
        <div class="continue-btn" @click="$emit('continue-pay', record)">{{ t('payment.continuePay') }}</div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast } from 'vant'
import { openOnlineCustomerService } from '@/utils/customerService'

const { t } = useI18n()

const props = defineProps({
  show: { type: Boolean, default: false },
  record: { type: Object, default: null },
  theme: { type: String, default: '' },
  zIndex: { type: Number, default: 2000 }
})

const emit = defineEmits(['update:show', 'continue-pay'])
const router = useRouter()

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

// PC 端使用定宽居中弹窗，避免沿用移动端的全宽样式
const isPc = computed(() => props.theme === 'pc')

const popupStyle = computed(() => (isPc.value
  ? { width: '560px', maxWidth: '92vw', maxHeight: '84vh' }
  : { width: '90%', maxHeight: '80%' }))

const isUsdtRecord = computed(() => props.record?.paytype === 'USDT')
const isEpusdtRecord = computed(() => props.record?.paytype === 'EpUSDT')
const depositChannel = computed(() => {
  if (isUsdtRecord.value) return `USDT—${props.record?.chain || 'TRC-20'}`
  if (isEpusdtRecord.value) return 'EpUSDT—TRC-20'
  return props.record?.paytypeName || props.record?.paytype || ''
})

const toService = () => {
  openOnlineCustomerService()
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

const getStatusIcon = (status) => {
  const map = {
    pending: 'clock-o',
    confirming: 'clock-o',
    success: 'checked',
    failed: 'cross',
    timeout: 'clock-o',
    cancelled: 'cross'
  }
  return map[status] || 'info-o'
}

const copyAmount = async () => {
  if (props.record) {
    try {
      await navigator.clipboard.writeText(String(props.record.amount))
      showToast(t('payment.amountCopied'))
    } catch (e) {
      showToast(t('common.copyFailed'))
    }
  }
}

const copyOrderNo = async () => {
  if (props.record) {
    try {
      await navigator.clipboard.writeText(props.record.orderNo)
      showToast(t('payment.orderCopied'))
    } catch (e) {
      showToast(t('common.copyFailed'))
    }
  }
}
</script>

<style scoped>
/* 默认（移动端）与 PC 一致采用站点黑金皮肤，彩票聊天页保留浅色蓝色主题 */
.detail-popup {
  --dp-bg: #1c1c1c;
  --dp-soft: #252525;
  --dp-border: #3a3a3a;
  --dp-title: #e8c978;
  --dp-text: #e0e0e0;
  --dp-muted: #999;
  --dp-primary: #d5aa54;
  --dp-gold: #e8c978;
  --dp-btn-bg: linear-gradient(90deg, #e8c978, #d5aa54);
  --dp-btn-text: #241a06;
  --dp-icon-filter: invert(72%) sepia(35%) saturate(571%) hue-rotate(2deg) brightness(93%) contrast(88%);
}

.detail-popup.theme-lottery {
  --dp-bg: #fff;
  --dp-soft: #f9f9f9;
  --dp-border: #e8e8e8;
  --dp-title: #333;
  --dp-text: #333;
  --dp-muted: #999;
  --dp-primary: #5691fe;
  --dp-gold: #5691fe;
  --dp-btn-bg: linear-gradient(90deg, #5691fe, #4378e8);
  --dp-btn-text: #fff;
  --dp-icon-filter: invert(42%) sepia(93%) saturate(1352%) hue-rotate(200deg) brightness(100%) contrast(95%);
}

.detail-popup {
  overflow: visible;
}

.view-detail {
  background: var(--dp-bg);
  border: 1px solid var(--dp-border);
  color: var(--dp-text);
  border-radius: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  height: 50px;
  background: var(--dp-soft);
  border-bottom: 1px solid var(--dp-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  border-radius: 12px 12px 0 0;
}

.header-left,
.header-right {
  width: 60px;
  display: flex;
  align-items: center;
}

.header-left {
  color: var(--dp-muted);
  cursor: pointer;
}

.header-right {
  justify-content: flex-end;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--dp-title);
}

.header-icon {
  width: 22px;
  height: 22px;
  filter: var(--dp-icon-filter);
}

.detail-body {
  flex: 1;
  padding: 30px 20px;
  overflow-y: auto;
}

.status-section {
  text-align: center;
  margin-bottom: 20px;
}

.status-icon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.status-icon.status-pending {
  background: rgba(255, 149, 0, 0.1);
  color: #ff9500;
}

.status-icon.status-success {
  background: rgba(4, 190, 2, 0.1);
  color: #04BE02;
}

.status-icon.status-failed,
.status-icon.status-cancelled,
.status-icon.status-timeout {
  background: rgba(238, 10, 36, 0.1);
  color: #ee0a24;
}

.status-text {
  font-size: 16px;
  font-weight: 500;
}

.status-text.status-pending { color: #ff9500; }
.status-text.status-success { color: #04BE02; }
.status-text.status-failed,
.status-text.status-cancelled,
.status-text.status-timeout { color: #ee0a24; }

.amount-display {
  text-align: center;
  margin-bottom: 25px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 5px;
}

.amount-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--dp-gold);
}

.amount-unit {
  font-size: 16px;
  color: var(--dp-muted);
}

.copy-icon {
  color: var(--dp-primary);
  margin-left: 8px;
  cursor: pointer;
}

.divider-dashed {
  border-top: 1px dashed var(--dp-border);
  margin-bottom: 20px;
}

.detail-info-list {
  background: var(--dp-soft);
  border: 1px solid var(--dp-border);
  border-radius: 10px;
  padding: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--dp-border);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: var(--dp-muted);
}

.info-value {
  font-size: 14px;
  color: var(--dp-text);
  display: flex;
  align-items: center;
  gap: 5px;
}

.usdt-icon-tiny {
  width: 18px;
  height: 18px;
  background: #26A17B;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
}

.order-no {
  font-family: monospace;
}

.copy-icon-small {
  color: var(--dp-primary);
  font-size: 14px;
  cursor: pointer;
}

.detail-footer {
  padding: 15px 20px 30px;
}

.continue-btn {
  height: 48px;
  background: var(--dp-btn-bg);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dp-btn-text);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.18s ease;
}

.continue-btn:hover {
  filter: brightness(1.08);
}

/* 黑金皮肤下成功态沿用金色，避免绿色与站点主题冲突 */
.detail-popup:not(.theme-lottery) .status-icon.status-success {
  background: rgba(213, 170, 84, 0.14);
  color: var(--dp-gold);
}

.detail-popup:not(.theme-lottery) .status-text.status-success {
  color: var(--dp-gold);
}

.detail-popup:not(.theme-lottery) .detail-body::-webkit-scrollbar {
  width: 6px;
}

.detail-popup:not(.theme-lottery) .detail-body::-webkit-scrollbar-thumb {
  background: var(--dp-border);
  border-radius: 3px;
}

/* ===== PC 端主题：尺寸与交互态 ===== */
.theme-pc .detail-header {
  height: 56px;
}

.theme-pc .header-title {
  font-size: 16px;
}

.theme-pc .header-left:hover {
  color: var(--dp-gold);
}
</style>
