<template>
  <teleport to="body">
    <van-popup
      v-model:show="showPopup"
      :position="isPc ? 'center' : 'bottom'"
      round
      :style="popupStyle"
      :z-index="10000"
      :overlay-style="{ zIndex: 9999 }"
      class="deposit-popup" :class="theme ? `theme-${theme}` : ''"
      @close="handleClose"
    >
    <div class="view-main">
      
      <div class="popup-header">
        <div class="header-left" @click="handleClose">
          <van-icon :name="isPc ? 'cross' : 'arrow-left'" size="20" />
        </div>
        <div class="header-title">{{ t('payment.depositTitle') }}</div>
        <div class="header-right">
          <img src="/assets/img/comm_icon_cz_kf.svg" class="header-icon kf-icon" @click="toService" />
          <div class="divider-line"></div>
          <div class="history-icon-wrapper" @click="showHistory = true">
            <img src="/assets/img/comm_icon_cz_jl.svg" class="header-icon kf-icon" />
            <div class="red-dot" v-if="hasPendingOrder"></div>
          </div>
        </div>
      </div>


      <div class="popup-body">

        <div class="section-row">
          <span class="section-label">{{ t('payment.paymentMethod') }}</span>
          <div class="balance-info">
            <img src="/assets/img/CNY.avif" class="cny-icon-small" />
            <span class="balance-val" :class="{ updating: isRefreshing }">{{ balance }}</span>
            <img src="/assets/img/comm_icon_sx.svg" class="refresh-icon" :class="{ spinning: isRefreshing }" @click="refreshBalance" />
          </div>
        </div>


        <div class="pay-method-list">
          <div
            v-for="method in payMethods"
            :key="method.type"
            class="pay-method-item"
            :class="{ active: selectedMethod === method.type }"
            @click="selectMethod(method)"
          >
            <div class="method-icon" :class="getMethodIconClass(method.type)">
              {{ getMethodIconText(method.type) }}
            </div>
            <span class="method-name">{{ method.title }}</span>
            <div class="hot-tag" v-if="method.badgeText" :title="method.badgeText">{{ method.badgeText }}</div>
          </div>
        </div>

        <div
          v-if="selectedMethod === 'weixin' || selectedMethod === 'alipay'"
          class="payment-risk-warning"
          role="alert"
        >
          微信支付宝充值，电诈款一律不出款。
        </div>

        <!-- 存款金额 -->
        <div class="amount-section">
          <div class="section-label">{{ t('payment.depositAmount') }}</div>

          <div class="custom-input-box">
            <span class="input-prefix">{{ selectedMethod === 'USDT' ? 'U' : '¥' }}</span>
            <input
              type="number"
              v-model="customAmount"
              :placeholder="`${t('payment.minAmount')}${minAmount}~${t('payment.maxAmount')}${formatAmount(maxAmount)}`"
              class="custom-input"
              @input="handleCustomInput"
            />
            <van-icon
              v-if="customAmount"
              name="clear"
              class="clear-icon"
              @click="clearAmount"
            />
          </div>
        </div>

        <div class="tip-text" v-if="(selectedMethod === 'USDT' || selectedMethod === 'linepay') && currentMethodConfig?.remark">
          {{ currentMethodConfig.remark }}
        </div>
      </div>

      <!-- 固定在底部的提交按钮 -->
      <div class="popup-footer">
        <div class="submit-btn" :class="{ disabled: !canSubmit }" @click="handleSubmit">
          {{ t('payment.depositNow') }}
        </div>
      </div>
    </div>
  </van-popup>

  <DepositHistory
    ref="historyRef"
    v-model:show="showHistory"
    :theme="theme"
    :z-index="10001"
    @view-detail="viewDetail"
  />

  <DepositDetail
    v-model:show="showDetail"
    :record="currentRecord"
    :theme="theme"
    :z-index="10002"
    @continue-pay="continuePay"
  />

  <PayInfoPopup
    v-model:show="showPayInfo"
    :order="currentOrder"
    :usdt-config="usdtConfig"
    :theme="theme"
    :z-index="10003"
    @confirmed="onPayConfirmed"
  />
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { rechargeApi } from '@/api/recharge'
import { authApi } from '@/api/auth'
import { isLoggedIn } from '@/utils/auth'
import { openOnlineCustomerService } from '@/utils/customerService'
import DepositHistory from './DepositHistory.vue'
import DepositDetail from './DepositDetail.vue'
import PayInfoPopup from './PayInfoPopup.vue'

const { t } = useI18n()

const props = defineProps({
  show: { type: Boolean, default: false },
  theme: { type: String, default: '' }
})

const emit = defineEmits(['update:show'])
const router = useRouter()

const showPopup = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

// PC 端以居中弹窗呈现，避免沿用移动端的底部全屏样式
const isPc = computed(() => props.theme === 'pc')

const popupStyle = computed(() => (isPc.value
  ? { width: '720px', maxWidth: '92vw', height: 'auto', maxHeight: '84vh' }
  : { height: '90%' }))

const showHistory = ref(false)
const showDetail = ref(false)
const showPayInfo = ref(false)
const historyRef = ref(null)

const selectedMethod = ref('USDT')
const selectedAmount = ref(null)
const customAmount = ref('')
const balance = ref('0.00')
const hasPendingOrder = ref(false)
const isRefreshing = ref(false)
const minAmount = ref(20)
const maxAmount = ref(1000000)
const amountOptions = ref([108, 518, 1008, 3168, 5068, 10018, 51688, 99999])

const payMethods = ref([])
const currentMethodConfig = ref(null)

const usdtConfig = ref({
  trc20Address: '',
  erc20Address: '',
  rate: 7.2
})

const currentOrder = ref(null)
const currentRecord = ref(null)

const finalAmount = computed(() => {
  if (customAmount.value) return Number(customAmount.value)
  return selectedAmount.value || 0
})

const canSubmit = computed(() => {
  return finalAmount.value >= minAmount.value && finalAmount.value <= maxAmount.value
})

const handleClose = () => { showPopup.value = false }
const toService = () => {
  openOnlineCustomerService()
}

const formatAmount = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const selectAmount = (amt) => {
  selectedAmount.value = amt
  customAmount.value = amt
}

const handleCustomInput = () => {
  if (customAmount.value) selectedAmount.value = null
}

const clearAmount = () => {
  customAmount.value = ''
  selectedAmount.value = null
}

const getMethodIconClass = (type) => {
  const map = { 'USDT': 'usdt', 'EpUSDT': 'usdt', 'alipay': 'alipay', 'weixin': 'weixin', 'linepay': 'bank' }
  return map[type] || 'default'
}

const getMethodIconText = (type) => {
  const map = { 'USDT': '₮', 'EpUSDT': '₮', 'alipay': '支', 'weixin': '微', 'linepay': '银' }
  return map[type] || '付'
}

const selectMethod = async (method) => {
  selectedMethod.value = method.type
  clearAmount()
  await loadMethodConfig(method.type)
}

const refreshBalance = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    const res = await authApi.getProfile()
    if (res.code === 0 && res.data?.user) {
      balance.value = parseFloat(res.data.user.balance || 0).toFixed(2)
      showToast(t('common.refreshSuccess'))
    }
  } catch (e) {
    showToast(t('common.refreshFailed'))
  } finally {
    setTimeout(() => { isRefreshing.value = false }, 500)
  }
}

const loadBalance = async () => {
  try {
    const res = await authApi.getProfile()
    if (res.code === 0 && res.data?.user) {
      balance.value = parseFloat(res.data.user.balance || 0).toFixed(2)
    }
  } catch (e) {
  }
}

const loadMethods = async () => {
  try {
    const res = await rechargeApi.getMethods()
    if (res.code === 0 && res.data) {
      payMethods.value = res.data
      if (payMethods.value.length > 0 && !selectedMethod.value) {
        selectedMethod.value = payMethods.value[0].type
      }
      if (selectedMethod.value) {
        await loadMethodConfig(selectedMethod.value)
      }
    }
  } catch (e) {
  }
}

const loadMethodConfig = async (type) => {
  try {
    const res = await rechargeApi.getConfig(type)
    if (res.code === 0 && res.data) {
      currentMethodConfig.value = res.data
      if (res.data.minAmount) minAmount.value = res.data.minAmount
      if (res.data.maxAmount) maxAmount.value = res.data.maxAmount
      
      if (type === 'USDT') {
        if (res.data.trc20Address) usdtConfig.value.trc20Address = res.data.trc20Address
        if (res.data.erc20Address) usdtConfig.value.erc20Address = res.data.erc20Address
        if (res.data.rate) usdtConfig.value.rate = res.data.rate
      }
    }
  } catch (e) {
  }
}


const handleSubmit = async () => {
  if (!canSubmit.value) {
    showToast(t('payment.amountRange', { min: minAmount.value, max: formatAmount(maxAmount.value) }))
    return
  }

  try {
    showLoadingToast({ message: t('payment.submitting'), forbidClick: true, duration: 0 })

    const params = {
      paytype: selectedMethod.value,
      amount: finalAmount.value,
      chain: selectedMethod.value === 'USDT' ? 'TRC20' : ''
    }

    const res = await rechargeApi.submit(params)

    closeToast()

    if (res.code === 0 && res.data) {
      const data = res.data
      if (data?.pay_url) {
        window.location.href = data.pay_url
        return
      }
      currentOrder.value = {
        trano: data.trano,
        amount: data.amount,
        paytype: data.paytype,
        paytypeName: currentMethodConfig.value?.title || t('payment.recharge'),
        fuyanma: data.fuyanma,
        address: data.address || usdtConfig.value.trc20Address,
        qrcode: data.qrcode,
        account: currentMethodConfig.value?.account,
        accountName: currentMethodConfig.value?.accountName,
        bankInfo: data.paytype === 'linepay' ? {
          bankName: data.bankName,
          bankCode: data.bankCode,
          accountName: data.accountName,
          bankBranch: data.bankBranch
        } : null
      }
      showPayInfo.value = true
      selectedAmount.value = null
      customAmount.value = ''
      hasPendingOrder.value = true
    } else {
      showToast(res.message || t('payment.submitFailed'))
    }
  } catch (e) {
    console.error('提交存款请求出错：', e)
    closeToast()
    showToast(t('payment.networkError'))
  }
}

const viewDetail = (record) => {
  currentRecord.value = record
  showDetail.value = true
}

const continuePay = (record) => {
  showDetail.value = false
  currentOrder.value = {
    trano: record.orderNo,
    amount: record.amount,
    paytype: record.paytype,
    paytypeName: record.paytype,
    address: usdtConfig.value.trc20Address
  }
  if (record.paytype) loadMethodConfig(record.paytype)
  showPayInfo.value = true
}

const onPayConfirmed = () => {
  loadBalance()
  hasPendingOrder.value = false
  if (historyRef.value) {
    historyRef.value.loadRecords()
  }
}

// 未登录时不展示存款弹窗，统一提示并唤起登录框
const ensureLogin = () => {
  if (isLoggedIn()) return true
  showPopup.value = false
  showToast(t('game.pleaseLogin'))
  window.dispatchEvent(new CustomEvent('open-auth', { detail: { tab: 'login' } }))
  return false
}

watch(() => props.show, (val) => {
  if (val) {
    if (!ensureLogin()) return
    loadMethods()
    loadBalance()
  }
})

onMounted(() => {
  if (props.show) {
    if (!ensureLogin()) return
    loadMethods()
    loadBalance()
  }
})
</script>

<style>
/* 全局样式，确保存款弹窗层级高于底部导航 */
.van-popup.deposit-popup {
  z-index: 10000 !important;
}
</style>

<style scoped>
/* 默认（移动端）与 PC 一致采用站点黑金皮肤，彩票聊天页保留浅色蓝色主题 */
.deposit-popup {
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
  --dp-btn-bg: linear-gradient(90deg, #e8c978, #d5aa54);
  --dp-btn-text: #241a06;
  --dp-disabled-bg: #3a3a3a;
  --dp-disabled-text: #777;
  --dp-icon-filter: invert(72%) sepia(35%) saturate(571%) hue-rotate(2deg) brightness(93%) contrast(88%);
}

.deposit-popup.theme-lottery {
  --dp-bg: #fff;
  --dp-soft: #fff;
  --dp-fill: #f5f5f5;
  --dp-border: #e8e8e8;
  --dp-title: #333;
  --dp-text: #333;
  --dp-muted: #999;
  --dp-primary: #5691fe;
  --dp-gold: #5691fe;
  --dp-accent-soft: rgba(86, 145, 254, 0.08);
  --dp-btn-bg: linear-gradient(90deg, #5691fe, #4378e8);
  --dp-btn-text: #fff;
  --dp-disabled-bg: #ccc;
  --dp-disabled-text: #fff;
  --dp-icon-filter: invert(42%) sepia(93%) saturate(1352%) hue-rotate(200deg) brightness(100%) contrast(95%);
}

.deposit-popup {
  background: transparent;
}

.view-main {
  background: var(--dp-bg);
  color: var(--dp-text);
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px 12px 0 0;
}

.popup-header {
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
  gap: 8px;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--dp-title);
}

.header-icon {
  width: 22px;
  height: 22px;
}

.kf-icon {
  filter: var(--dp-icon-filter);
}

.header-icon-van {
  color: var(--dp-text);
}

.divider-line {
  width: 1px;
  height: 16px;
  background: var(--dp-border);
}

.history-icon-wrapper {
  position: relative;
}

.red-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #ff4d4f;
  border-radius: 50%;
}

.popup-body {
  flex: 1;
  padding: 15px;
  padding-bottom: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.popup-body::-webkit-scrollbar {
  width: 0;
  display: none;
}

.popup-footer {
  padding: 15px;
  padding-top: 10px;
  background: var(--dp-soft);
  border-top: 1px solid var(--dp-border);
  flex-shrink: 0;
}

.section-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-label {
  font-size: 14px;
  color: var(--dp-text);
  font-weight: 500;
}

.balance-info {
  display: flex;
  align-items: center;
  gap: 5px;
}

.usdt-icon-small {
  width: 20px;
  height: 20px;
  background: #26A17B;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}

.cny-icon-small {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.balance-val {
  color: var(--dp-gold);
  font-weight: 600;
  text-decoration: underline;
  transition: opacity 0.3s, transform 0.3s;
}

.balance-val.updating {
  opacity: 0.5;
  transform: scale(0.95);
}

.refresh-icon {
  width: 16px;
  height: 16px;
  cursor: pointer;
  filter: var(--dp-icon-filter);
  transition: transform 0.3s;
}

.refresh-icon.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.pay-method-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 20px;
}

.payment-risk-warning {
  margin: -6px 0 18px;
  padding: 9px 12px;
  color: #ff6b6b;
  background: rgba(255, 77, 79, 0.09);
  border: 1px solid rgba(255, 107, 107, 0.42);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  text-align: center;
}

.pay-method-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 4px;
  background: var(--dp-soft);
  border: 1px solid var(--dp-border);
  border-radius: 8px;
  position: relative;
  cursor: pointer;
  min-height: 74px;
  transition: all 0.2s;
}

.pay-method-item.active {
  border-color: var(--dp-primary);
  background: var(--dp-accent-soft);
}

.method-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
}

.method-icon.usdt { background: #26A17B; }
.method-icon.alipay { background: #1677FF; }
.method-icon.weixin { background: #07C160; }
.method-icon.bank { background: #FF6B35; }
.method-icon.default { background: #999; }

.method-name {
  font-size: 12px;
  color: var(--dp-text);
  font-weight: 500;
  text-align: center;
}

.hot-tag {
  position: absolute;
  top: -8px;
  right: -5px;
  max-width: calc(100% + 10px);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
}

.amount-section {
  margin-bottom: 15px;
}

.amount-section .section-label {
  margin-bottom: 12px;
  font-weight: 600;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.amount-item {
  height: 40px;
  background: var(--dp-fill);
  border: 1px solid var(--dp-border);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--dp-text);
  cursor: pointer;
  transition: all 0.2s;
}

.amount-item.active {
  background: var(--dp-accent-soft);
  color: var(--dp-gold);
  border: 1px solid var(--dp-primary);
}

.custom-input-box {
  display: flex;
  align-items: center;
  background: var(--dp-fill);
  border: 1px solid var(--dp-border);
  border-radius: 6px;
  padding: 0 12px;
  height: 44px;
}

.custom-input-box:focus-within {
  border-color: var(--dp-primary);
}

.input-prefix {
  font-size: 16px;
  color: var(--dp-gold);
  margin-right: 10px;
}

.custom-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--dp-text);
}

.custom-input::placeholder {
  color: var(--dp-muted);
}

.clear-icon {
  color: var(--dp-muted);
  font-size: 18px;
  cursor: pointer;
}

.tip-text {
  font-size: 12px;
  color: var(--dp-muted);
  margin-bottom: 15px;
}

.submit-btn {
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
}

/* 移动端全局皮肤对 .submit-btn 使用了 !important，禁用态需同级覆盖 */
.submit-btn.disabled {
  background: var(--dp-disabled-bg) !important;
  border-color: var(--dp-disabled-bg) !important;
  color: var(--dp-disabled-text) !important;
  cursor: not-allowed;
}

.theme-lottery :deep(.balance-val) {
  color: #f5222d;
}

.theme-lottery .hot-tag {
  background: #5691fe;
}

/* ===== PC 端主题：居中弹窗尺寸与交互态 ===== */
.theme-pc .view-main {
  height: auto;
  max-height: 84vh;
  border: 1px solid var(--dp-border);
  border-radius: 12px;
  overflow: hidden;
}

.theme-pc .popup-header {
  height: 56px;
  padding: 0 20px;
}

.theme-pc .header-title {
  font-size: 16px;
}

.theme-pc .header-left:hover {
  color: var(--dp-gold);
}

.theme-pc .popup-body {
  padding: 20px 20px 0;
  max-height: calc(84vh - 56px - 76px);
}

.theme-pc .popup-body::-webkit-scrollbar {
  width: 6px;
  display: block;
}

.theme-pc .popup-body::-webkit-scrollbar-thumb {
  background: var(--dp-border);
  border-radius: 3px;
}

.theme-pc .pay-method-list {
  gap: 12px;
}

.theme-pc .pay-method-item {
  min-height: 82px;
}

.theme-pc .pay-method-item:hover {
  border-color: var(--dp-primary);
}

.theme-pc .method-name {
  font-size: 13px;
}

.theme-pc .hot-tag {
  background: linear-gradient(135deg, var(--dp-gold), var(--dp-primary));
  color: #241a06;
}

.theme-pc .amount-grid {
  gap: 12px;
}

.theme-pc .amount-item {
  height: 44px;
}

.theme-pc .amount-item:hover {
  border-color: var(--dp-primary);
}

/* 输入框不使用填充背景，仅保留下边框 */
.theme-pc .custom-input-box {
  height: 48px;
  padding: 0 2px;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--dp-border);
  border-radius: 0;
}

.theme-pc .custom-input-box:focus-within {
  border-bottom-color: var(--dp-primary);
}

.theme-pc .custom-input {
  font-size: 15px;
}

.theme-pc .popup-footer {
  padding: 14px 20px 18px;
}

.theme-pc .submit-btn {
  height: 46px;
  transition: filter 0.18s ease;
}

.theme-pc .submit-btn:hover {
  filter: brightness(1.08);
}

.theme-pc .submit-btn.disabled {
  filter: none;
}
</style>
