<template>
  <div class="tab-interest">
    <div class="top-section">
      <div class="info-header">
        <div class="deposit-info">
          <div class="label">已存入</div>
          <div class="val">{{ deposited }}</div>
        </div>
        <div class="action-group-top">
          <button type="button" class="btn-transfer-in" @click="openTransferIn">转入</button>
          <button type="button" class="btn-transfer-out" @click="handleTransferOut">转出</button>
        </div>
      </div>
      
      <div class="info-cycle">活期可转出 {{ withdrawableAmount }} · 定期持有 {{ fixedAmount }}</div>

      <div class="info-reward">
        <div class="reward-text">
          待领取<span class="highlight">{{ pendingReward }}</span> <span class="gray-sub">(已领取{{ receivedReward }})</span>
          <button class="refresh-button" type="button" aria-label="刷新收益" @click="refreshData">
            <img src="/assets/img/comm_icon_sx.svg" class="refresh-icon" :class="{ spinning: isDataRefreshing }" alt="" />
          </button>
        </div>
        <button type="button" class="btn-claim" :class="{ active: canClaim }" :disabled="!canClaim" @click="handleClaim">领取</button>
      </div>
    </div>

    <div class="custom-tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'rules' }"
        @click="activeTab = 'rules'"
      >
        利息规则
        <div class="active-line" v-if="activeTab === 'rules'"></div>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'records' }"
        @click="activeTab = 'records'"
      >
        记录明细
        <div class="active-line" v-if="activeTab === 'records'"></div>
      </div>
    </div>

    <div v-if="activeTab === 'rules'" class="tab-content rules-content">
      <div class="rules-text">{{ interestConfig.rules_text }}</div>
    </div>

    <div v-else class="tab-content records-content">
      <div class="filter-bar">
        <div class="filter-btn-group">
          <AppSelect v-model="timeFilter" :options="timeOptions" @change="fetchRecords" />
          <AppSelect v-model="typeFilter" :options="typeOptions" @change="fetchRecords" />
        </div>
        <div class="total-income">累计收益 <span class="gold">{{ totalIncome }}</span></div>
      </div>

      <div class="list-header">
        <span class="col-time">时间</span>
        <span class="col-type">类型</span>
        <span class="col-amount">金额</span>
      </div>

      <div class="list-body">
        <van-loading v-if="loading" class="loading-spinner" color="#009688" />
        <div v-else-if="records.length === 0" class="empty-state">
          <van-icon name="orders-o" class="empty-icon" aria-hidden="true" />
          <div class="empty-text">暂无记录</div>
          <div class="empty-hint">当前筛选条件下没有收益或转入转出记录</div>
        </div>
        <div v-else class="record-list">
          <div v-for="item in records" :key="item.id" class="record-item">
            <span class="col-time">{{ item.create_time }}</span>
            <span class="col-type">{{ item.title || getTypeText(item.type) }}</span>
            <span class="col-amount" :class="{ 'positive': isPositiveType(item.type), 'negative': item.type === 'withdraw' }">
              {{ item.type === 'withdraw' ? '-' : '+' }}{{ item.amount }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <van-popup 
      v-model:show="showTransferIn" 
      round 
      position="center" 
      class="transfer-popup interest-transfer-popup interest-transfer-in"
      :style="{ width: '90%', padding: '20px' }"
    >
      <div class="popup-title">转入</div>
      <button type="button" class="popup-close-desktop" aria-label="关闭转入窗口" @click="showTransferIn = false">
        <van-icon name="cross" />
      </button>

      <div class="popup-label-row"><span>选择产品</span></div>
      <div v-if="products.length" class="product-list">
        <div
          v-for="product in products"
          :key="product.id"
          class="product-option"
          :class="{ active: Number(selectedProductId) === Number(product.id) }"
          @click="selectedProductId = product.id"
        >
          <div class="product-name">{{ product.name }}</div>
          <div class="product-rate">{{ formatProductRate(product) }}</div>
          <div class="product-type">{{ product.type === 'current' ? '随存随取' : `${product.duration_days}天定期` }}</div>
        </div>
      </div>
      <div v-else class="no-product">暂无可转入产品</div>

      <div v-if="selectedProduct" class="product-detail">
        <span>{{ selectedProduct.rate_desc || formatProductRate(selectedProduct) }}</span>
        <span>{{ productSettleText(selectedProduct) }}</span>
        <span>最低 {{ selectedProduct.min_amount }}</span>
        <span v-if="selectedProduct.type === 'current' && selectedProduct.auto_claim === 0">{{ Number(selectedProduct.max_interest) > 0 ? `待领取封顶 ${selectedProduct.max_interest}` : '待领取不封顶' }}</span>
        <span>{{ selectedProduct.auto_claim === 1 || selectedProduct.type === 'fixed' ? '自动发放' : '手动领取' }}</span>
        <span v-if="selectedProduct.type === 'current' && selectedProduct.auto_claim === 0 && Number(selectedProduct.audit_multiple) > 0">领取需 {{ selectedProduct.audit_multiple }} 倍流水</span>
      </div>
      
      <div class="popup-info-row">
        <span class="balance-row">账号余额&nbsp;&nbsp;<span class="gold balance-val" :class="{ 'balance-flash': isRefreshing }">{{ userBalance }}</span> <img src="/assets/img/comm_icon_sx.svg" class="refresh-svg" :class="{ spinning: isRefreshing }" @click="refreshBalance" /></span>
        <span>{{ selectedProduct ? productSettleText(selectedProduct) : '' }}</span>
      </div>

      <div class="transfer-fields">
        <div class="transfer-field">
          <div class="popup-label-row">
            <span>转入金额</span>
            <span class="gray-text">当前时间 {{ currentTime }}</span>
          </div>
          <div class="input-wrapper">
            <input type="number" v-model="transferAmount" :placeholder="`单笔最少转入${selectedProduct?.min_amount || 0}`" />
            <span class="suffix-btn" @click="transferAmount = Math.floor(userBalance)">全部</span>
          </div>
          <div class="popup-tip" :class="{ 'popup-tip-fixed': selectedProduct?.type === 'fixed' }">
            <span class="popup-tip-time">{{ selectedProduct?.type === 'fixed' ? '预计到期时间' : '首次产生利息时间' }}：{{ nextInterestTime }}</span>
            <span v-if="selectedProduct?.type === 'fixed'" class="expected-interest">
              预计到期利息 <strong>{{ expectedMaturityInterest }}</strong>
            </span>
          </div>
        </div>
        <div class="transfer-field">
          <div class="popup-label-row"><span>资金密码</span></div>
          <div class="input-wrapper">
            <input type="password" v-model="transferInPassword" placeholder="已设置资金密码时请输入" maxlength="20" />
          </div>
        </div>
      </div>

      <van-button block :color="canTransfer ? '#009688' : '#999'" class="confirm-btn" :disabled="!canTransfer" @click="handleTransferIn">确认转入</van-button>
      
      <div class="close-btn-wrapper" @click="showTransferIn = false">
        <van-icon name="cross" class="close-icon" />
      </div>
    </van-popup>

    <van-popup 
      v-model:show="showTransferOut" 
      round 
      position="center" 
      class="transfer-popup interest-transfer-popup interest-transfer-out"
      :style="{ width: '90%', padding: '20px' }"
    >
      <div class="popup-title">转出</div>
      <button type="button" class="popup-close-desktop" aria-label="关闭转出窗口" @click="showTransferOut = false">
        <van-icon name="cross" />
      </button>
      
      <div class="popup-info-row">
        <span>活期可转出 <span class="gold">{{ withdrawableAmount }}</span></span>
        <span>实时到账</span>
      </div>

      <div class="popup-label-row">
        <span>转出金额</span>
      </div>

      <div class="input-wrapper">
        <input type="number" v-model="transferOutAmount" placeholder="请输入转出金额" />
        <span class="suffix-btn" @click="transferOutAmount = withdrawableAmount">全部</span>
      </div>

      <div class="popup-label-row">
        <span>资金密码</span>
      </div>

      <div class="input-wrapper">
        <input type="password" v-model="fundPassword" placeholder="请输入资金密码" maxlength="20" />
      </div>

      <van-button block :color="canTransferOut ? '#009688' : '#999'" class="confirm-btn" :disabled="!canTransferOut" @click="confirmTransferOut">确认转出</van-button>
      
      <div class="close-btn-wrapper" @click="showTransferOut = false">
        <van-icon name="cross" class="close-icon" />
      </div>
    </van-popup>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { showToast, showLoadingToast, showSuccessToast } from 'vant'
import { yueBaoApi } from '@/api/yuebao'
import { authApi } from '@/api/auth'
import { lotteryWS, wsEvents } from '@/utils/websocket'
import { AppSelect } from '@/components/common'

const infoLoading = ref(true)
const deposited = ref('--')
const withdrawableAmount = ref('--')
const fixedAmount = ref('--')
const pendingReward = ref('--')
const receivedReward = ref('--')
const activeTab = ref('records')
const showTransferIn = ref(false)
const showTransferOut = ref(false)
const userBalance = ref('--')
const transferAmount = ref('')
const transferOutAmount = ref('')
const fundPassword = ref('')
const transferInPassword = ref('')
const products = ref([])
const selectedProductId = ref(null)
const currentTime = ref('')
const nextInterestTime = ref('')
const loading = ref(false)
const totalIncome = ref('--')
const isRefreshing = ref(false)
const isDataRefreshing = ref(false)

const DEFAULT_RULES_TEXT = `1、规则说明：
利息宝的具体收益规则由所选产品决定，请在转入前确认产品页面展示的利率、期限、结算周期及其他条件。
2、收益计算：
系统根据产品配置、实际转入金额和持有时间计算收益，最终金额以系统结算记录为准。
3、转入与转出：
不同产品的最低转入金额和可转出条件可能不同；定期产品需持有至到期，随存随取产品按产品规则办理转出。
4、收益发放：
产品设为自动发放时，收益直接转入余额；设为手动领取时，收益进入待领取金额，由会员主动领取。
5、注意事项：
产品配置可能调整，请以产品页面展示及系统实际结算结果为准。如有疑问，请联系客服。`

const interestConfig = ref({
  rules_text: DEFAULT_RULES_TEXT
})

const timeFilter = ref(0)
const typeFilter = ref(0)
const timeOptions = [
  { label: '今日', value: 0 },
  { label: '昨日', value: 1 },
  { label: '近7日', value: 7 }
]
const typeOptions = [
  { label: '全部', value: 0 },
  { label: '转入', value: 1 },
  { label: '转出', value: 2 },
  { label: '领取收益', value: 3 }
]

const records = ref([])
const selectedProduct = computed(() => products.value.find(p => Number(p.id) === Number(selectedProductId.value)) || null)
const expectedMaturityInterest = computed(() => {
  const amount = Number(transferAmount.value)
  const rate = Number(selectedProduct.value?.rate)
  if (!Number.isFinite(amount) || !Number.isFinite(rate) || amount <= 0 || rate <= 0) return '0.00'
  return (amount * rate).toFixed(2)
})

const canTransfer = computed(() => {
  const minAmount = Number(selectedProduct.value?.min_amount || 0)
  return !!selectedProduct.value && transferAmount.value && Number(transferAmount.value) >= minAmount && Number(transferAmount.value) <= Number(userBalance.value)
})

const canTransferOut = computed(() => {
  return transferOutAmount.value && Number(transferOutAmount.value) > 0 && Number(transferOutAmount.value) <= Number(withdrawableAmount.value) && fundPassword.value.length >= 4
})

const canClaim = computed(() => {
  return Number(pendingReward.value) > 0
})

const isApiSuccess = (res) => res && (res.code === 0 || res.code === 200)

const formatProductRate = (product) => {
  const percent = Number(product?.rate || 0) * 100
  const value = percent.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
  return product?.type === 'fixed' ? `到期收益率 ${value}%` : `日利率 ${value}%`
}

const productSettleText = (product) => product?.type === 'fixed'
  ? `${product.duration_days}天后到期结算`
  : `每${product.settle_cycle_hours || 1}小时结算`

const fetchProducts = async () => {
  try {
    const res = await yueBaoApi.getProducts()
    if (isApiSuccess(res)) {
      products.value = Array.isArray(res.data) ? res.data : []
      if (!selectedProduct.value && products.value.length) selectedProductId.value = products.value[0].id
      updateTime()
    }
  } catch (e) {
    products.value = []
  }
}

const openTransferIn = async () => {
  if (!products.value.length) await fetchProducts()
  if (!products.value.length) return showToast('暂无可转入产品')
  showTransferIn.value = true
  updateTime()
}

const isPositiveType = (type) => {
  return ['income', 'deposit', 'interest', 'claim', 'transfer_in'].includes(type)
}

const fetchConfig = async () => {
  try {
    const res = await yueBaoApi.getConfig()
    if (isApiSuccess(res) && res.data) {
      interestConfig.value = { ...interestConfig.value, ...res.data }
    }
  } catch (e) {
  }
}

const fetchData = async () => {
  try {
    const infoRes = await yueBaoApi.getDashboardInfo()
    if (isApiSuccess(infoRes)) {
      const d = infoRes.data
      deposited.value = d.total_amount || '0.00'
      withdrawableAmount.value = d.current_amount || '0.00'
      fixedAmount.value = d.fixed_amount || '0.00'
      receivedReward.value = d.total_interest || '0.00'
      pendingReward.value = d.pending_interest || '0.00'
      const received = Number(d.total_interest || 0)
      const pending = Number(d.pending_interest || 0)
      totalIncome.value = (received + pending).toFixed(2)
    }
    
    const profileRes = await authApi.getProfile()
    if (isApiSuccess(profileRes)) {
      const u = profileRes.data?.user || profileRes.data || {}
      userBalance.value = u.balance || '0.00'
    }
  } catch (e) {
    deposited.value = '0.00'
    pendingReward.value = '0.00'
    receivedReward.value = '0.00'
    totalIncome.value = '0.00'
    userBalance.value = '0.00'
  } finally {
    infoLoading.value = false
  }
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const params = {
      page: 1,
      page_size: 50
    }
    
    if (timeFilter.value === 0) params.date_range = 'today'
    else if (timeFilter.value === 1) params.date_range = 'yesterday'
    else if (timeFilter.value === 7) params.date_range = 'week'
    
    if (typeFilter.value === 1) params.type = 'deposit'
    else if (typeFilter.value === 2) params.type = 'withdraw'
    else if (typeFilter.value === 3) params.type = 'claim'
    
    const res = await yueBaoApi.getRecords(params)
    if (isApiSuccess(res)) {
      records.value = res.data?.list || []
    }
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const handleTransferIn = async () => {
  if (!canTransfer.value) return
  
  const toast = showLoadingToast({ message: '处理中...', forbidClick: true, duration: 0 })
  try {
    const res = await yueBaoApi.transferIn({
      product_id: selectedProduct.value.id,
      amount: Number(transferAmount.value),
      password: transferInPassword.value
    })
    
    toast.close()
    if (isApiSuccess(res)) {
      showSuccessToast('转入成功')
      showTransferIn.value = false
      transferAmount.value = ''
      transferInPassword.value = ''
      fetchData()
      fetchRecords()
    } else {
      showToast(res?.msg || res?.message || '转入失败')
    }
  } catch (e) {
    toast.close()
    showToast('网络错误')
  }
}

const handleTransferOut = () => {
  if (Number(withdrawableAmount.value) <= 0) {
    return showToast('暂无可转出金额')
  }
  showTransferOut.value = true
}

const confirmTransferOut = async () => {
  if (!canTransferOut.value) return
  
  const toast = showLoadingToast({ message: '处理中...', forbidClick: true, duration: 0 })
  try {
    const res = await yueBaoApi.transferOut({
      amount: Number(transferOutAmount.value),
      password: fundPassword.value
    })
    
    toast.close()
    if (isApiSuccess(res)) {
      showSuccessToast('转出成功')
      showTransferOut.value = false
      transferOutAmount.value = ''
      fundPassword.value = ''
      fetchData()
      fetchRecords()
    } else {
      showToast(res?.msg || res?.message || '转出失败')
    }
  } catch (e) {
    toast.close()
    showToast('网络错误')
  }
}

const handleClaim = async () => {
  if (!canClaim.value) return
  
  const toast = showLoadingToast({ message: '处理中...', forbidClick: true, duration: 0 })
  try {
    const res = await yueBaoApi.claimInterest()
    toast.close()
    if (isApiSuccess(res)) {
      showSuccessToast(`领取成功，+${res.data?.amount || 0}`)
      fetchData()
      fetchRecords()
    } else {
      showToast(res?.msg || res?.message || '领取失败')
    }
  } catch (e) {
    toast.close()
    showToast('网络错误')
  }
}

const getTypeText = (type) => {
  const map = {
    'deposit': '转入',
    'withdraw': '转出',
    'income': '收益',
    'interest': '利息',
    'claim': '领取收益',
    'transfer_in': '转入',
    'transfer_out': '转出'
  }
  return map[type] || type
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = `${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
  
  const product = selectedProduct.value
  const next = product?.type === 'fixed'
    ? new Date(now.getTime() + Number(product.duration_days || 0) * 24 * 60 * 60 * 1000)
    : new Date(now.getTime() + Number(product?.settle_cycle_hours || 1) * 60 * 60 * 1000)
  nextInterestTime.value = `${String(next.getMonth()+1).padStart(2,'0')}/${String(next.getDate()).padStart(2,'0')} ${String(next.getHours()).padStart(2,'0')}:${String(next.getMinutes()).padStart(2,'0')}:${String(next.getSeconds()).padStart(2,'0')}`
}

const refreshBalance = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    const profileRes = await authApi.getProfile()
    if (isApiSuccess(profileRes)) {
      const u = profileRes.data?.user || profileRes.data || {}
      userBalance.value = u.balance || '0.00'
      showToast('已刷新')
    }
  } catch (e) {
  } finally {
    setTimeout(() => { isRefreshing.value = false }, 500)
  }
}

const refreshData = async () => {
  if (isDataRefreshing.value) return
  isDataRefreshing.value = true
  try {
    await fetchData()
    showToast('已刷新')
  } finally {
    setTimeout(() => { isDataRefreshing.value = false }, 500)
  }
}

let unsubInterest = null
let unsubBalance = null
let timeInterval = null

onMounted(() => {
  fetchConfig()
  fetchProducts()
  fetchData()
  fetchRecords()
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  
  lotteryWS.connect().catch(() => {})
  
  unsubInterest = wsEvents.onYuebaoInterest((data) => {
    if (data.pendingInterest) {
      pendingReward.value = data.pendingInterest
    }
    if (data.totalInterest) {
      receivedReward.value = data.totalInterest
    }
    const received = Number(data.totalInterest || receivedReward.value || 0)
    const pending = Number(data.pendingInterest || pendingReward.value || 0)
    totalIncome.value = (received + pending).toFixed(2)
    if (data.nextSettleTime) {
      nextInterestTime.value = data.nextSettleTime
    }
    if (data.addedInterest && Number(data.addedInterest) > 0) {
      showToast(`利息+${data.addedInterest}`)
    }
  })
  
  unsubBalance = wsEvents.onYuebaoBalance((data) => {
    if (data.pendingInterest) {
      pendingReward.value = data.pendingInterest
    }
    if (data.totalInterest) {
      receivedReward.value = data.totalInterest
    }
    fetchData()
  })
})

onUnmounted(() => {
  if (unsubInterest) unsubInterest()
  if (unsubBalance) unsubBalance()
  if (timeInterval) clearInterval(timeInterval)
})
</script>

<style scoped>
.tab-interest {
  flex: 1;
  background: #1c1c1c;
  color: #e6e6e6;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.top-section {
  padding: 18px 16px 8px;
  background: #272727;
}
.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.deposit-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.deposit-info .label {
  font-size: 12px;
  color: #b8b8b8;
}
.deposit-info .val {
  font-size: 25px;
  line-height: 1.1;
  color: #f2f2f2;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
}
.action-group-top {
  display: flex;
  gap: 8px;
  flex: 0 0 auto;
}
.btn-transfer-in, .btn-transfer-out {
  border-radius: 8px;
  height: 34px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
}
.btn-transfer-in {
  border: 1px solid #e8ba56;
  background: #e8ba56;
  color: #241b0b;
}
.btn-transfer-out {
  border: 1px solid #686868;
  background: #303030;
  color: #e6e6e6;
}

.info-cycle {
  font-size: 12px;
  color: #b8b8b8;
  margin-bottom: 16px;
}

.info-reward {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #414141;
}
.reward-text {
  font-size: 13px;
  color: #d5d5d5;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.reward-text .highlight {
  color: #FFAA09;
  font-weight: bold;
  margin: 0 4px;
  font-size: 18px;
}
.reward-text .gray-sub {
  color: #aaa;
  font-size: 12px;
}
.refresh-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-left: 2px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.refresh-icon {
  width: 17px;
  height: 17px;
  filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(130deg) brightness(90%) contrast(85%);
  transition: transform 0.3s ease;
}
.refresh-icon.spinning {
  animation: spin 0.5s linear infinite;
}
.btn-claim {
  background: #363636;
  color: #b8b8b8;
  border: 1px solid #505050;
  border-radius: 8px;
  height: 34px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
}
.btn-claim.active {
  background: #26A17B;
  border-color: #26A17B;
  color: #fff;
}
.btn-claim:disabled {
  opacity: 1;
}

.custom-tabs {
  display: flex;
  border-bottom: 1px solid #454545;
  background: #272727;
  padding: 0 16px;
  gap: 26px;
}
.tab-item {
  margin-right: 0;
  text-align: center;
  padding: 10px 0;
  font-size: 15px;
  color: #ddd;
  position: relative;
  cursor: pointer;
  font-weight: 500;
}
.tab-item:first-child {
  margin-left: 0;
}
.tab-item.active {
  color: #009688;
  font-weight: bold;
}
.active-line {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px; 
  height: 3px;
  background: #009688;
  border-radius: 2px;
}

.rules-content {
  flex: 1;
  padding: 8px 15px 24px;
  overflow-y: auto;
}

.rules-text {
  color: #bbb;
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.records-content {
  position: relative;
}
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #272727;
  padding: 12px 16px;
  gap: 10px;
}

.filter-btn-group {
  display: flex;
  gap: 10px;
}

.filter-btn-group :deep(.select-trigger) {
  min-width: 89.72px;
  width: 89.72px;
  height: 26.66px;
  padding: 0 8px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #ddd;
  background: #303030;
  border-color: #454545;
}

.filter-btn-group :deep(.trigger-text),
.filter-btn-group :deep(.option-text) {
  color: #ddd;
}

.filter-btn-group :deep(.panel-content) {
  background: #303030;
  border-color: #454545;
}

.filter-btn-group :deep(.select-option) {
  border-color: #454545;
}

.filter-btn-group :deep(.select-option:hover),
.filter-btn-group :deep(.select-option:active),
.filter-btn-group :deep(.select-option.selected) {
  background: #3a3a3a;
}

.total-income {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}
.total-income .gold {
  color: #FFAA09;
}

.list-header {
  display: flex;
  background: #272727;
  padding: 12px 15px;
  font-size: 13px;
  color: #ddd;
  border-top: 1px solid #454545;
  border-bottom: 1px solid #454545;
}

.col-time { width: 40%; text-align: left; }
.col-type { width: 30%; text-align: center; }
.col-amount { width: 30%; text-align: right; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px 30px;
}
.empty-icon {
  color: #6f6f6f;
  font-size: 42px;
  margin-bottom: 12px;
}
.empty-text {
  font-size: 13px;
  color: #c5c5c5;
  font-weight: 600;
}
.empty-hint {
  margin-top: 6px;
  color: #858585;
  font-size: 12px;
  text-align: center;
}
.green-link {
  color: #009688;
  margin-left: 2px;
  text-decoration: underline;
  cursor: pointer;
}

.record-list {
  padding: 0 15px;
}
.record-item {
  display: flex;
  padding: 12px 0;
  font-size: 13px;
  border-bottom: 1px solid #454545;
}
.record-item .col-time {
  width: 40%;
  text-align: left;
  color: #aaa;
}
.record-item .col-type {
  width: 30%;
  text-align: center;
  color: #ddd;
}
.record-item .col-amount {
  width: 30%;
  text-align: right;
  font-weight: 500;
}
.record-item .col-amount.positive {
  color: #009688;
}
.record-item .col-amount.negative {
  color: #f44336;
}

.loading-spinner {
  display: flex;
  justify-content: center;
  padding: 30px 0;
}

.transfer-popup {
  padding-bottom: 30px !important;
  background: #272727;
  color: #e6e6e6;
}
.popup-title {
  text-align: center;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
}
.popup-info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #aaa;
  margin-bottom: 15px;
}
.product-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
  max-height: 180px;
  overflow-y: auto;
}
.product-option {
  border: 1px solid #454545;
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
  background: #303030;
}
.product-option.active {
  border-color: #009688;
  background: #193832;
}
.product-name {
  color: #ddd;
  font-size: 14px;
  font-weight: 600;
}
.product-rate {
  color: #ffaa09;
  font-size: 13px;
  margin: 5px 0;
}
.product-type,
.no-product {
  color: #999;
  font-size: 12px;
}
.product-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
  background: #303030;
  border: 1px solid #454545;
  color: #bbb;
  font-size: 12px;
}
.balance-row {
  display: flex;
  align-items: center;
}
.balance-val {
  font-size: 18px;
  font-weight: 500;
  transition: opacity 0.2s ease;
}
.balance-flash {
  animation: flash 0.5s ease-in-out;
}
@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.refresh-svg {
  width: 16px;
  height: 16px;
  margin-left: 8px;
  cursor: pointer;
  filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(130deg) brightness(90%) contrast(85%);
  transition: transform 0.3s ease;
}
.refresh-svg.spinning {
  animation: spin 0.5s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.gold { color: #FFAA09; }

.popup-label-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #ddd;
  margin-bottom: 10px;
}
.gray-text { color: #999; font-size: 12px; }

.input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #5a4a30;
  border-radius: 4px;
  padding: 0 10px;
  height: 44px;
  margin-bottom: 15px;
  background: #303030;
}
.input-wrapper input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  font-size: 14px;
  color: #f0f0f0;
  background: transparent;
}
.input-wrapper input::placeholder {
  color: #999;
}
.suffix-btn {
  color: #009688;
  font-size: 13px;
  cursor: pointer;
}

.popup-tip {
  font-size: 12px;
  color: #999;
  margin-bottom: 25px;
}
.popup-tip-fixed {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 12px;
}
.popup-tip-time {
  white-space: nowrap;
}
.expected-interest {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 9px;
  border: 1px solid #78602f;
  border-radius: 6px;
  background: #3a301d;
  color: #f1cf86;
  white-space: nowrap;
}
.expected-interest strong {
  font-size: 15px;
  font-weight: 700;
  color: #ffd271;
}

.confirm-btn {
  border-radius: 4px;
  font-size: 15px;
}

.close-btn-wrapper {
  margin-top: 20px;
  text-align: center;
}
.close-icon {
  font-size: 24px;
  color: #ccc;
  border: 1px solid #ccc;
  border-radius: 50%;
  padding: 4px;
}

.popup-close-desktop {
  display: none;
}
</style>

<style>
html.device-pc .interest-transfer-popup {
  width: min(760px, calc(100vw - 48px)) !important;
  max-height: calc(100vh - 64px);
  overflow-y: auto;
  padding: 28px 32px 30px !important;
  box-sizing: border-box;
  border: 1px solid #444;
  border-radius: 12px;
  box-shadow: 0 24px 72px rgb(0 0 0 / 55%);
}

html.device-pc .interest-transfer-out {
  width: min(520px, calc(100vw - 48px)) !important;
}

html.device-pc .interest-transfer-popup .popup-title {
  text-align: left;
  font-size: 20px;
  margin-bottom: 26px;
  padding-right: 40px;
}

html.device-pc .interest-transfer-popup .popup-close-desktop {
  position: absolute;
  top: 24px;
  right: 26px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #aaa;
  font-size: 20px;
  cursor: pointer;
}

html.device-pc .interest-transfer-popup .popup-close-desktop:hover {
  background: #383838;
  color: #fff;
}

html.device-pc .interest-transfer-popup .product-list {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  max-height: 240px;
  margin-bottom: 14px;
}

html.device-pc .interest-transfer-popup .product-option {
  min-height: 88px;
  padding: 13px 14px;
  border-radius: 8px;
  box-sizing: border-box;
  transition: border-color .15s, background-color .15s;
}

html.device-pc .interest-transfer-popup .product-option:hover {
  border-color: #0a9e91;
}

html.device-pc .interest-transfer-popup .product-name {
  font-size: 15px;
}

html.device-pc .interest-transfer-popup .product-rate {
  font-size: 14px;
}

html.device-pc .interest-transfer-popup .product-detail {
  gap: 8px 16px;
  padding: 12px 14px;
  margin-bottom: 18px;
  border-radius: 8px;
  font-size: 13px;
}

html.device-pc .interest-transfer-popup .popup-info-row {
  align-items: center;
  padding: 13px 16px;
  margin-bottom: 24px;
  border: 1px solid #454545;
  border-radius: 8px;
  background: #303030;
  font-size: 14px;
}

html.device-pc .interest-transfer-popup .popup-label-row {
  font-size: 14px;
}

html.device-pc .interest-transfer-popup .input-wrapper {
  height: 46px;
  margin-bottom: 18px;
  border-radius: 7px;
}

html.device-pc .interest-transfer-in .transfer-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 20px;
}

html.device-pc .interest-transfer-in .transfer-field {
  display: contents;
}

html.device-pc .interest-transfer-in .transfer-field:first-child .popup-label-row {
  grid-column: 1;
  grid-row: 1;
}

html.device-pc .interest-transfer-in .transfer-field:first-child .input-wrapper {
  grid-column: 1;
  grid-row: 2;
}

html.device-pc .interest-transfer-in .transfer-field:last-child .popup-label-row {
  grid-column: 2;
  grid-row: 1;
}

html.device-pc .interest-transfer-in .transfer-field:last-child .input-wrapper {
  grid-column: 2;
  grid-row: 2;
}

html.device-pc .interest-transfer-in .popup-tip {
  grid-column: 1 / -1;
  grid-row: 3;
  margin-bottom: 24px;
  font-size: 13px;
}

html.device-pc .interest-transfer-popup .confirm-btn {
  display: block;
  width: 180px;
  margin-left: auto;
  border-radius: 7px;
}

html.device-pc .interest-transfer-popup .close-btn-wrapper {
  display: none;
}

@media (max-width: 720px) {
  html.device-pc .interest-transfer-popup {
    padding: 24px !important;
  }

  html.device-pc .interest-transfer-popup .product-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  html.device-pc .interest-transfer-in .transfer-fields,
  html.device-pc .interest-transfer-in .transfer-field {
    display: block;
  }
}
</style>
