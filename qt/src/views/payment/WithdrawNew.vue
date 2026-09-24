<template>
  <div class="withdraw-new">
    <div class="nav-header">
      <div class="nav-left" @click="goBack">
        <van-icon name="arrow-left" size="22" />
      </div>
      <div class="nav-tabs">
        <div 
          v-for="(tab, index) in tabs" 
          :key="index"
          class="tab-item"
          :class="{ active: activeTab === index }"
          @click="switchTab(index)"
        >
          {{ tab }}
          <div class="active-line" v-if="activeTab === index"></div>
        </div>
      </div>
      <div class="nav-right" @click="toService">
        <img src="/assets/img/icon_sys_menu_service.svg" class="service-icon" />
      </div>
    </div>

    <div class="page-content">
      <WithdrawApplyTab
        v-if="activeTab === 0" 
        ref="applyTabRef"
        @go-accounts="goToAccountsTab"
        @show-keyboard="showWithdrawKeyboard = true"
        @add-account="handleAddAccount"
      />

      <WithdrawAccountsTab
        v-if="activeTab === 1"
        @add-crypto="openAddCrypto"
        @add-bank="openAddBank"
        @add-alipay="openAddAlipay"
        @add-wechat="openAddWechat"
        @select-account="onSelectAccount"
      />

      <WithdrawRecordsTab
        v-if="activeTab === 2"
        @show-detail="showRecordDetail"
      />
    </div>

    <AddCryptoPopup
      v-model="showAddCrypto" 
      :fund-password="verifiedFundPassword"
      @success="onAccountAdded"
    />
    
    <AddWechatPopup 
      v-model="showAddWechatPopup" 
      :fund-password="verifiedFundPassword"
      @success="onAccountAdded"
    />
    
    <AddAlipayPopup 
      v-model="showAddAlipayPopup" 
      :fund-password="verifiedFundPassword"
      @success="onAccountAdded"
    />
    
    <AddBankPopup 
      v-model="showAddBankPopup" 
      :fund-password="verifiedFundPassword"
      :real-name="realName"
      @success="onAccountAdded"
    />
    
    <FundPasswordPopup 
      v-model="showFundPwdPopup"
      @confirm="onFundPwdConfirm"
    />
    
    <RecordDetailPopup 
      v-model="showDetailPopup"
      :record="currentRecord"
      @cancel="onCancelFromDetail"
    />
    
    <van-number-keyboard
      :show="showWithdrawKeyboard"
      @input="onWithdrawKeyboardInput"
      @delete="onWithdrawKeyboardDelete"
      @blur="showWithdrawKeyboard = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'

import WithdrawApplyTab from '@/components/withdraw/WithdrawApplyTab.vue'
import WithdrawAccountsTab from '@/components/withdraw/WithdrawAccountsTab.vue'
import WithdrawRecordsTab from '@/components/withdraw/WithdrawRecordsTab.vue'
import AddCryptoPopup from '@/components/withdraw/AddCryptoPopup.vue'
import AddWechatPopup from '@/components/withdraw/AddWechatPopup.vue'
import AddAlipayPopup from '@/components/withdraw/AddAlipayPopup.vue'
import AddBankPopup from '@/components/withdraw/AddBankPopup.vue'
import FundPasswordPopup from '@/components/withdraw/FundPasswordPopup.vue'
import RecordDetailPopup from '@/components/withdraw/RecordDetailPopup.vue'

import { useWithdraw } from '@/components/withdraw/useWithdraw'
import { openOnlineCustomerService } from '@/utils/customerService'
import { navigatePcBack } from '@/utils/deviceRoutes'

const router = useRouter()
const route = useRoute()

const goBack = () => {
  if (navigatePcBack(router, route, '/member')) return
  router.back()
}

const {
  loadConfig,
  loadSecurityInfo,
  loadAccounts,
  refreshRecords,
  handleBalanceRefresh,
  handleRefresh,
  cancelWithdraw,
  checkHasFundPassword,
  realName
} = useWithdraw()

const activeTab = ref(0)
const tabs = ['申请提现', '收款账户', '提现记录']

const showAddCrypto = ref(false)
const showAddWechatPopup = ref(false)
const showAddAlipayPopup = ref(false)
const showAddBankPopup = ref(false)
const showFundPwdPopup = ref(false)
const showDetailPopup = ref(false)
const currentRecord = ref(null)
const verifiedFundPassword = ref('')
const pendingAccountType = ref('')

const showWithdrawKeyboard = ref(false)
const applyTabRef = ref(null)

const switchTab = (index) => {
  activeTab.value = index
  router.replace({ query: { ...route.query, active: index } })
  if (index === 0) {
    handleBalanceRefresh()
  } else if (index === 1) {
    handleRefresh()
  } else if (index === 2) {
    refreshRecords()
  }
}

const goToAccountsTab = () => {
  activeTab.value = 1
  handleRefresh()
}

const toService = () => {
  openOnlineCustomerService()
}

const handleAddAccount = (type) => {
  switch (type) {
    case 'usdt':
      openAddCrypto()
      break
    case 'bank':
      openAddBank()
      break
    case 'alipay':
      openAddAlipay()
      break
    case 'wechat':
      openAddWechat()
      break
  }
}

const openAddCrypto = () => {
  if (!checkHasFundPassword()) return
  pendingAccountType.value = 'usdt'
  showFundPwdPopup.value = true
}

const openAddBank = () => {
  if (!checkHasFundPassword()) return
  pendingAccountType.value = 'bank'
  showFundPwdPopup.value = true
}

const openAddAlipay = () => {
  if (!checkHasFundPassword()) return
  pendingAccountType.value = 'alipay'
  showFundPwdPopup.value = true
}

const openAddWechat = () => {
  if (!checkHasFundPassword()) return
  pendingAccountType.value = 'wechat'
  showFundPwdPopup.value = true
}

const onFundPwdConfirm = (pwd) => {
  verifiedFundPassword.value = pwd
  if (pendingAccountType.value === 'usdt') {
    showAddCrypto.value = true
  } else if (pendingAccountType.value === 'alipay') {
    showAddAlipayPopup.value = true
  } else if (pendingAccountType.value === 'wechat') {
    showAddWechatPopup.value = true
  } else if (pendingAccountType.value === 'bank') {
    showAddBankPopup.value = true
  }
  pendingAccountType.value = ''
}

const onAccountAdded = () => {
  verifiedFundPassword.value = ''
  loadAccounts()
}

const onSelectAccount = (acc) => {
  activeTab.value = 0
}

const showRecordDetail = (item) => {
  currentRecord.value = item
  showDetailPopup.value = true
}

const onCancelFromDetail = async (item) => {
  await cancelWithdraw(item)
}

const onWithdrawKeyboardInput = (key) => {
  if (applyTabRef.value) {
    applyTabRef.value.appendPassword(key)
  }
}

const onWithdrawKeyboardDelete = () => {
  if (applyTabRef.value) {
    applyTabRef.value.deletePassword()
  }
}

onMounted(() => {
  const tabParam = route.query.active
  if (tabParam !== undefined) {
    const tabIndex = parseInt(tabParam, 10)
    if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex < tabs.length) {
      activeTab.value = tabIndex
    }
  }
  
  loadConfig()
  loadSecurityInfo()
  loadAccounts()
  if (activeTab.value === 2) {
    refreshRecords()
  }
})
</script>

<style scoped>
.withdraw-new {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  touch-action: none;
  overscroll-behavior: none;
}

.nav-header {
  height: 44px;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 10px;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid #f5f5f5;
}
.nav-left {
  width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  color: #e4bd64;
  border: 1px solid #655026;
  border-radius: 6px;
  background: rgba(228, 189, 100, 0.08);
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}
.nav-left:hover {
  color: #f5d988;
  border-color: #9c7431;
  background: rgba(228, 189, 100, 0.15);
}
.nav-left:active {
  background: rgba(228, 189, 100, 0.22);
}
.nav-tabs {
  display: flex;
  gap: 30px;
}
.tab-item {
  font-size: 15px;
  color: #666;
  position: relative;
  padding: 12px 0;
  cursor: pointer;
  font-weight: 400;
}
.tab-item.active {
  color: #26A17B;
  font-weight: 500;
  font-size: 16px;
}
.active-line {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background: #26A17B;
  border-radius: 1px;
}

.service-icon {
  width: 28.66px;
  height: 28.66px;
  filter: invert(48%) sepia(79%) saturate(374%) hue-rotate(115deg) brightness(93%) contrast(88%);
}

.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>

<style>
.cancel-withdraw-dialog {
  width: 340px !important;
  border-radius: 12px;
  overflow: hidden;
}
.cancel-withdraw-dialog .van-dialog__header {
  padding-top: 24px;
  padding-bottom: 12px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
.cancel-withdraw-dialog .van-dialog__message {
  padding: 12px 24px 28px;
  font-size: 15px;
  color: #666;
}
.cancel-withdraw-dialog .van-dialog__footer {
  padding: 0 20px 20px;
  gap: 16px;
}
.cancel-withdraw-dialog .van-dialog__cancel,
.cancel-withdraw-dialog .van-dialog__confirm {
  width: 147px !important;
  height: 38px !important;
  flex: none !important;
  border-radius: 6px !important;
  font-size: 15px !important;
}
.cancel-withdraw-dialog .van-dialog__cancel {
  background: #fff !important;
  border: 1px solid #26A17B !important;
  color: #26A17B !important;
}
.cancel-withdraw-dialog .van-dialog__confirm {
  background: #26A17B !important;
  border: none !important;
  color: #fff !important;
}
</style>
