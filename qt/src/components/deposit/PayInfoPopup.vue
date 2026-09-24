<template>
  <van-popup
    v-model:show="visible"
    position="center"
    round
    :style="popupStyle"
    :z-index="zIndex"
    class="pay-info-popup" :class="theme ? `theme-${theme}` : ''"
    :overlay-style="{ background: 'rgba(0,0,0,0.5)' }"
  >
    <div class="pay-info-view">
      <div class="pay-info-header">
        <div class="pay-info-title">{{ order?.paytypeName || t('payment.recharge') }}</div>
      </div>

      <div class="pay-info-body">
        <div class="pay-amount-display">
          <div class="pay-amount-label">{{ t('payment.rechargeAmount') }}</div>
          <div class="pay-amount-value">
            <span class="currency">{{ order?.paytype === 'USDT' ? '₮' : '¥' }}</span>
            <span class="num">{{ order?.amount }}</span>
          </div>
          <div class="pay-status-tag">{{ t('payment.pendingPayment') }}</div>
        </div>

        <div class="info-cell-group">
          <div class="info-cell">
            <span class="cell-label">{{ t('payment.orderNo') }}</span>
            <div class="cell-value">
              {{ order?.trano }}
              <van-icon name="description-o" class="copy-icon" @click="copyText(order?.trano)" />
            </div>
          </div>
          <div class="info-cell" v-if="order?.fuyanma">
            <span class="cell-label">{{ t('payment.remarkCode') }}</span>
            <div class="cell-value highlight-red">
              {{ order?.fuyanma }}
              <van-icon name="description-o" class="copy-icon" @click="copyText(order?.fuyanma)" />
            </div>
          </div>
        </div>

        <div class="pay-content-area">
          <div class="chain-selector" v-if="order?.paytype === 'USDT'">
            <div 
              class="chain-option" 
              :class="{ active: selectedChain === 'TRC20' }"
              @click="selectedChain = 'TRC20'"
            >
              TRC20
            </div>
            <div 
              class="chain-option" 
              :class="{ active: selectedChain === 'ERC20' }"
              @click="selectedChain = 'ERC20'"
            >
              ERC20
            </div>
          </div>

          <div class="qr-container" v-if="currentPayQrCode">
            <div class="qr-wrapper">
              <img :src="currentPayQrCode" class="qr-image" />
            </div>
            <div class="qr-text">{{ t('payment.scanToPay') }}</div>
          </div>

          <div class="pay-details-box" v-if="order?.paytype === 'linepay' && order.bankInfo">
            <div class="bank-card">
              <div class="bank-row">
                <span class="bank-label">{{ t('payment.bank') }}</span>
                <span class="bank-val">{{ order.bankInfo.bankName }}</span>
                <span class="copy-btn-text" @click="copyText(order.bankInfo.bankName)">{{ t('common.copy') }}</span>
              </div>
              <div class="bank-row" v-if="order.bankInfo.bankBranch">
                <span class="bank-label">{{ t('payment.branch') }}</span>
                <span class="bank-val">{{ order.bankInfo.bankBranch }}</span>
                <span class="copy-btn-text" @click="copyText(order.bankInfo.bankBranch)">{{ t('common.copy') }}</span>
              </div>
              <div class="bank-row">
                <span class="bank-label">{{ t('payment.name') }}</span>
                <span class="bank-val">{{ order.bankInfo.accountName }}</span>
                <span class="copy-btn-text" @click="copyText(order.bankInfo.accountName)">{{ t('common.copy') }}</span>
              </div>
              <div class="bank-row">
                <span class="bank-label">{{ t('payment.cardNumber') }}</span>
                <span class="bank-val bank-code">{{ order.bankInfo.bankCode }}</span>
                <span class="copy-btn-text" @click="copyText(order.bankInfo.bankCode)">{{ t('common.copy') }}</span>
              </div>
            </div>
          </div>

          <div class="pay-details-box" v-else-if="currentPayAddress">
            <div class="address-display">
              <div class="address-label">
                {{ order?.paytype === 'USDT' ? t('payment.rechargeAddress') : t('payment.receivingAccount') }}
              </div>
              <div class="address-content">
                <div class="address-text">{{ currentPayAddress }}</div>
              </div>
              <div class="address-actions">
                <div class="action-btn" @click="copyAddress">
                  <van-icon name="description" /> {{ t('common.copy') }}
                </div>
              </div>
            </div>
            <div class="payee-name" v-if="order?.accountName">
              {{ t('payment.payee') }}：{{ order.accountName }}
            </div>
          </div>

          <div class="no-address-tip" v-else-if="order?.paytype === 'USDT' && !currentPayAddress">
            <van-icon name="warning-o" size="40" color="#ff976a" />
            <div class="tip-text">{{ t('payment.addressNotConfigured') }}</div>
            <div class="tip-sub">{{ t('payment.contactServiceForAddress') }}</div>
          </div>
        </div>

        <div class="pay-footer-section">
          <div class="warning-tips">
            <van-icon name="info-o" />
            <span v-if="order?.paytype === 'USDT'">{{ t('payment.networkTransferWarning', { chain: selectedChain }) }}</span>
            <span v-else>{{ t('payment.confirmPaymentInfo') }}</span>
          </div>
          
          <div class="confirm-check-row">
            <van-checkbox v-model="payConfirmed" checked-color="#04BE02" icon-size="16px">
              {{ t('payment.transferCompleted') }}
            </van-checkbox>
          </div>
          
          <div 
            class="submit-pay-btn" 
            :class="{ disabled: !payConfirmed }"
            @click="confirmPayment"
          >
            {{ t('payment.confirmSubmit') }}
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
import { showToast, showLoadingToast, closeToast } from 'vant'
import { rechargeApi } from '@/api/recharge'

const { t } = useI18n()

const props = defineProps({
  show: { type: Boolean, default: false },
  order: { type: Object, default: null },
  theme: { type: String, default: '' },
  usdtConfig: { type: Object, default: () => ({ trc20Address: '', erc20Address: '', rate: 7.2 }) },
  zIndex: { type: Number, default: 2000 }
})

const emit = defineEmits(['update:show', 'confirmed'])

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

// PC 端使用定宽居中弹窗，避免沿用移动端的全宽样式
const isPc = computed(() => props.theme === 'pc')

const popupStyle = computed(() => (isPc.value
  ? { width: '560px', maxWidth: '92vw', maxHeight: '85vh' }
  : { width: '92%', maxHeight: '85vh' }))

const selectedChain = ref('TRC20')
const payConfirmed = ref(false)

const currentPayAddress = computed(() => {
  if (!props.order) return ''
  const type = props.order.paytype
  
  if (type === 'USDT') {
    if (selectedChain.value === 'TRC20') {
      return props.usdtConfig.trc20Address || props.order.address || ''
    }
    return props.usdtConfig.erc20Address || ''
  }
  
  if (type === 'alipay' || type === 'weixin') {
    return props.order.account || ''
  }
  
  return ''
})

const currentPayQrCode = computed(() => {
  if (!props.order) return ''
  const type = props.order.paytype
  
  if (type === 'USDT') {
    const addr = currentPayAddress.value
    if (!addr) return ''
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${addr}&color=000000&bgcolor=ffffff`
  }
  
  if (type === 'alipay' || type === 'weixin') {
    return props.order.qrcode || ''
  }
  
  return ''
})

const copyText = async (text) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    showToast(t('payment.copied'))
  } catch (e) {
    showToast(t('common.copyFailed'))
  }
}

const copyAddress = async () => {
  await copyText(currentPayAddress.value)
  showToast(t('payment.addressCopied'))
}

const confirmPayment = async () => {
  if (!payConfirmed.value) {
    showToast(t('payment.pleaseConfirmTransfer'))
    return
  }
  
  if (!props.order?.trano) {
    showToast(t('payment.orderNotExist'))
    return
  }
  
  try {
    showLoadingToast({ message: t('payment.submitting'), forbidClick: true, duration: 0 })
    const res = await rechargeApi.confirm(props.order.trano)
    closeToast()
    
    if (res.code === 0) {
      showToast({ type: 'success', message: t('payment.confirmSuccess') })
      visible.value = false
      emit('confirmed')
    } else {
      showToast(res.message || t('payment.confirmFailed'))
    }
  } catch (e) {
    closeToast()
    showToast(t('payment.networkError'))
  }
}

watch(visible, (val) => {
  if (!val) {
    payConfirmed.value = false
  }
})
</script>

<style scoped>
/* 默认（移动端）与 PC 一致采用站点黑金皮肤，彩票聊天页保留浅色蓝色主题 */
.pay-info-popup {
  --dp-bg: #1c1c1c;
  --dp-soft: #252525;
  --dp-fill: #222;
  --dp-border: #3a3a3a;
  --dp-title: #e8c978;
  --dp-text: #e0e0e0;
  --dp-muted: #999;
  --dp-primary: #d5aa54;
  --dp-gold: #e8c978;
  --dp-accent-soft: rgba(213, 170, 84, 0.14);
  --dp-warn-bg: rgba(213, 170, 84, 0.1);
  --dp-warn-text: #e8c978;
  --dp-btn-bg: linear-gradient(90deg, #e8c978, #d5aa54);
  --dp-btn-text: #241a06;
  --dp-disabled-bg: #3a3a3a;
  --dp-disabled-text: #777;
}

.pay-info-popup.theme-lottery {
  --dp-bg: #f9f9f9;
  --dp-soft: #fff;
  --dp-fill: #f5f5f5;
  --dp-border: #e8e8e8;
  --dp-title: #333;
  --dp-text: #333;
  --dp-muted: #999;
  --dp-primary: #5691fe;
  --dp-gold: #5691fe;
  --dp-accent-soft: rgba(86, 145, 254, 0.08);
  --dp-warn-bg: #fffbe8;
  --dp-warn-text: #ed6a0c;
  --dp-btn-bg: linear-gradient(90deg, #5691fe, #4378e8);
  --dp-btn-text: #fff;
  --dp-disabled-bg: #ccc;
  --dp-disabled-text: #fff;
}

.pay-info-popup {
  overflow: visible !important;
  background: transparent !important;
}

.pay-info-view {
  background: var(--dp-bg);
  border: 1px solid var(--dp-border);
  color: var(--dp-text);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  overflow: hidden;
}

.pay-info-header {
  background: var(--dp-soft);
  padding: 15px;
  text-align: center;
  border-bottom: 1px solid var(--dp-border);
}

.pay-info-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--dp-title);
}

.pay-info-body {
  flex: 1;
  overflow-y: auto;
  max-height: calc(85vh - 50px);
  padding-bottom: 20px;
}

.pay-info-body::-webkit-scrollbar {
  width: 6px;
}

.pay-info-body::-webkit-scrollbar-thumb {
  background: var(--dp-border);
  border-radius: 3px;
}

.pay-amount-display {
  background: var(--dp-soft);
  padding: 25px 0 20px;
  text-align: center;
}

.pay-amount-label {
  font-size: 13px;
  color: var(--dp-muted);
  margin-bottom: 8px;
}

.pay-amount-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  color: var(--dp-gold);
  font-weight: 600;
}

.pay-amount-value .currency {
  font-size: 20px;
  margin-right: 4px;
}

.pay-amount-value .num {
  font-size: 32px;
  font-family: DIN Alternate, sans-serif;
}

.pay-status-tag {
  display: inline-block;
  margin-top: 8px;
  background: rgba(255, 149, 0, 0.1);
  color: #ff9500;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
}

.info-cell-group {
  background: var(--dp-soft);
  padding: 0 15px 15px;
  margin-bottom: 10px;
}

.info-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid var(--dp-border);
  font-size: 14px;
}

.cell-label {
  color: var(--dp-muted);
}

.cell-value {
  color: var(--dp-text);
  display: flex;
  align-items: center;
  gap: 5px;
}

.highlight-red {
  color: #ff4d4f;
  font-weight: 600;
}

.copy-icon {
  color: var(--dp-primary);
  font-size: 14px;
  cursor: pointer;
}

.pay-content-area {
  background: var(--dp-soft);
  border: 1px solid var(--dp-border);
  margin: 0 15px;
  border-radius: 12px;
  padding: 20px 15px;
}

.chain-selector {
  display: flex;
  background: var(--dp-fill);
  border: 1px solid var(--dp-border);
  padding: 4px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.chain-option {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  color: var(--dp-muted);
  border-radius: 6px;
  transition: all 0.3s;
  cursor: pointer;
}

.chain-option.active {
  background: var(--dp-accent-soft);
  color: var(--dp-gold);
  font-weight: 600;
}

.qr-container {
  text-align: center;
  margin-bottom: 20px;
}

.qr-wrapper {
  width: 160px;
  height: 160px;
  margin: 0 auto 10px;
  padding: 8px;
  background: #fff;
  border: 1px solid var(--dp-border);
  border-radius: 8px;
}

.qr-image {
  width: 100%;
  height: 100%;
}

.qr-text {
  font-size: 12px;
  color: var(--dp-muted);
}

.address-display {
  background: var(--dp-fill);
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.address-label {
  font-size: 12px;
  color: var(--dp-muted);
  margin-bottom: 8px;
}

.address-text {
  font-size: 13px;
  color: var(--dp-text);
  word-break: break-all;
  line-height: 1.4;
  font-weight: 500;
  margin-bottom: 12px;
}

.address-actions {
  display: flex;
  justify-content: center;
}

.action-btn {
  background: var(--dp-accent-soft);
  border: 1px solid var(--dp-primary);
  color: var(--dp-gold);
  font-size: 12px;
  padding: 6px 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.payee-name {
  margin-top: 10px;
  text-align: center;
  font-size: 13px;
  color: var(--dp-text);
}

.bank-card {
  background: var(--dp-fill);
  border: 1px solid var(--dp-border);
  border-radius: 10px;
  padding: 15px;
}

.bank-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
}

.bank-row:last-child {
  margin-bottom: 0;
}

.bank-label {
  color: var(--dp-muted);
  width: 50px;
}

.bank-val {
  color: var(--dp-text);
  font-weight: 500;
  flex: 1;
}

.bank-code {
  font-family: monospace;
  letter-spacing: 1px;
}

.copy-btn-text {
  color: var(--dp-primary);
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid var(--dp-primary);
  border-radius: 4px;
  cursor: pointer;
}

.no-address-tip {
  background: var(--dp-soft);
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  padding: 30px 15px;
  text-align: center;
}

.no-address-tip .tip-text {
  font-size: 15px;
  color: var(--dp-text);
  font-weight: 500;
  margin-top: 12px;
}

.no-address-tip .tip-sub {
  font-size: 13px;
  color: var(--dp-muted);
  margin-top: 6px;
}

.pay-footer-section {
  padding: 20px 15px;
}

.warning-tips {
  background: var(--dp-warn-bg);
  color: var(--dp-warn-text);
  font-size: 12px;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.4;
}

.confirm-check-row {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.submit-pay-btn {
  height: 44px;
  background: var(--dp-btn-bg);
  color: var(--dp-btn-text);
  font-size: 16px;
  font-weight: 600;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: filter 0.18s ease;
}

.submit-pay-btn:hover {
  filter: brightness(1.08);
}

.submit-pay-btn.disabled {
  background: var(--dp-disabled-bg);
  color: var(--dp-disabled-text);
  box-shadow: none;
  filter: none;
  cursor: not-allowed;
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

.pay-info-popup:not(.theme-lottery) .close-circle-outer {
  border-color: rgba(213, 170, 84, 0.55);
  color: var(--dp-gold);
}
</style>
