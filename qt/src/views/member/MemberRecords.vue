<template>
  <div class="member-records">
    <div class="header">
      <van-icon name="arrow-left" class="back-icon" @click="goBack" />
      <div class="header-tabs">
        <div 
          v-for="(tab, index) in tabs" 
          :key="index"
          class="header-tab-item"
          :class="{ active: activeTab === index }"
          @click="activeTab = index"
        >
          {{ tab }}
        </div>
      </div>
    </div>

    <div class="content-area">
      <transition :name="tabTransition">
        <div v-if="activeTab === 0" key="tab0" class="tab-panel">
        <div class="filter-bar">
          <AppSelect 
            v-model="accountDateSelectValue"
            :options="dateSelectOptions"
            placeholder="今日"
            @change="onAccountDateChange"
          />
          <AppSelect 
            v-model="accountFilter.type"
            :options="accountTypeSelectOptions"
            placeholder="全部类型"
            class="type-select"
            @change="onAccountTypeChange"
          />
          <AppSelect 
            v-model="accountFilter.detail"
            :options="accountDetailSelectOptions"
            placeholder="小类明细"
            class="detail-select"
          />
          
          <div class="date-picker-dropdown" v-if="showDatePicker && currentDatePickerType === 'account'" @click.stop>
            <div class="date-picker-header">
              <div class="date-picker-title">
                <span class="col-title">开始日期</span>
                <span class="col-title">结束日期</span>
              </div>
            </div>
            <div class="date-picker-content">
              <van-date-picker v-model="startDateValue" :min-date="minDate" :max-date="maxDate" :show-toolbar="false" :formatter="dateFormatter" />
              <div class="picker-divider"></div>
              <van-date-picker v-model="endDateValue" :min-date="minDate" :max-date="maxDate" :show-toolbar="false" :formatter="dateFormatter" />
            </div>
            <div class="date-picker-footer">
              <van-button plain @click="showDatePicker = false">取消</van-button>
              <van-button type="primary" color="#009688" @click="onDateConfirm">确认</van-button>
            </div>
          </div>
        </div>
        
        <div class="list-container" @scroll="handleScroll">
          <van-loading v-if="accountLoading" size="24px" vertical>加载中...</van-loading>
          <template v-else-if="accountList.length > 0">
            <div class="record-item" v-for="item in accountList" :key="item.id" @click="showRecordDetail(item)">
              <div class="record-left">
                <div class="record-title">{{ item.typeName || item.typename }}</div>
                <div class="record-time">{{ item.createdAt || item.time }}</div>
              </div>
              <div class="record-right">
                <div class="record-amount" :class="{ plus: parseFloat(item.amount) > 0 }">
                  {{ item.amountDisplay || (parseFloat(item.amount) > 0 ? '+' : '') + item.amount }}
                </div>
                <div class="record-balance">余额: {{ item.balance || item.after }}</div>
              </div>
            </div>
            <van-loading v-if="accountLoadMore" size="20px">加载更多...</van-loading>
            <div v-if="accountFinished" class="no-more">没有更多了</div>
          </template>
          <div v-else class="empty-state">
<img src="/assets/img/img_none_sj.avif" class="empty-image" />
            <div class="empty-text">
              <span>暂无记录</span>
              <span class="view-all" @click="loadAllAccountRecords">查看全部</span>
            </div>
          </div>
        </div>

        <div class="footer-stats">
          <div class="stat-item">
            <span class="label">累计充值</span>
            <span class="value green">{{ accountStats.recharge }}元</span>
          </div>
          <div class="stat-item">
            <span class="label">累计提现</span>
            <span class="value red">{{ accountStats.withdraw }}元</span>
          </div>
          <div class="stat-item">
            <span class="label">累计领取</span>
            <span class="value gold">{{ accountStats.receive }}元</span>
          </div>
        </div>
        </div>
      </transition>

      <transition :name="tabTransition">
        <div v-if="activeTab === 1" key="tab1" class="tab-panel">
        <div class="filter-bar filter-bar-scroll">
          <AppSelect 
            v-model="betDateSelectValue"
            :options="dateSelectOptions"
            placeholder="今日"
            @change="onBetDateChange"
          />
          <AppSelect 
            v-model="betFilter.status"
            :options="betStatusSelectOptions"
            placeholder="全部状态"
            class="wide-select"
          />
          <AppSelect 
            v-model="betFilter.category"
            :options="betCategorySelectOptions"
            placeholder="全部类型"
            class="wide-select"
            @change="onBetCategoryChange"
          />
          <AppSelect 
            v-model="betFilter.platform"
            :options="betPlatformSelectOptions"
            placeholder="全部平台"
            class="wide-select"
            @change="onBetPlatformChange"
          />
          <AppSelect 
            v-model="betFilter.game"
            :options="betGameSelectOptions"
            placeholder="全部游戏"
            class="wide-select"
          />
          
          <div class="date-picker-dropdown" v-if="showDatePicker && currentDatePickerType === 'bet'" @click.stop>
            <div class="date-picker-header">
              <div class="date-picker-title">
                <span class="col-title">开始日期</span>
                <span class="col-title">结束日期</span>
              </div>
            </div>
            <div class="date-picker-content">
              <van-date-picker v-model="startDateValue" :min-date="minDate" :max-date="maxDate" :show-toolbar="false" :formatter="dateFormatter" />
              <div class="picker-divider"></div>
              <van-date-picker v-model="endDateValue" :min-date="minDate" :max-date="maxDate" :show-toolbar="false" :formatter="dateFormatter" />
            </div>
            <div class="date-picker-footer">
              <van-button plain @click="showDatePicker = false">取消</van-button>
              <van-button type="primary" color="#009688" @click="onDateConfirm">确认</van-button>
            </div>
          </div>
        </div>

        <div class="list-container" @scroll="handleScroll">
          <van-loading v-if="betLoading" size="24px" vertical>加载中...</van-loading>
          <template v-else-if="betList.length > 0">
            <div class="bet-item" v-for="item in betList" :key="item.id" @click="showBetDetail(item)">
              <div class="bet-header">
                <span class="bet-game">{{ item.cptitle || item.cpname }}</span>
                <span class="bet-status" :class="item.status_color">{{ item.status }}</span>
              </div>
              <div class="bet-info">
                <div class="bet-row">
                  <span>期号: {{ item.expect }}</span>
                  <span>倍数: {{ item.beishu }}</span>
                </div>
                <div class="bet-row">
                  <span>投注: {{ item.amount }}</span>
                  <span class="bet-win" :class="{ plus: parseFloat(item.profit) > 0, minus: parseFloat(item.profit) < 0 }">盈亏: {{ item.profit }}</span>
                </div>
              </div>
              <div class="bet-time">{{ item.oddtime }}</div>
            </div>
            <van-loading v-if="betLoadMore" size="20px">加载更多...</van-loading>
            <div v-if="betFinished" class="no-more">没有更多了</div>
          </template>
          <div v-else class="empty-state">
<img src="/assets/img/img_none_sj.avif" class="empty-image" />
            <div class="empty-text">
              <span>暂无投注记录</span>
              <span class="view-all" @click="loadAllBetRecords">查看全部</span>
            </div>
          </div>
        </div>

        <div class="footer-stats">
          <div class="stat-item">
            <span class="label">累计注单数</span>
            <span class="value">{{ betStats.count }}</span>
          </div>
          <div class="stat-item">
            <span class="label">累计有效投注</span>
            <span class="value">{{ betStats.amount }}元</span>
          </div>
          <div class="stat-item">
            <span class="label">累计输赢</span>
            <span class="value" :class="parseFloat(betStats.profit) >= 0 ? 'green' : 'red'">{{ betStats.profit }}元</span>
          </div>
        </div>
        </div>
      </transition>

      <transition :name="tabTransition">
        <div v-if="activeTab === 2" key="tab2" class="tab-panel">
        <div class="filter-bar">
          <AppSelect 
            v-model="reportDateSelectValue"
            :options="dateSelectOptions"
            placeholder="今日"
            @change="onReportDateChange"
          />
          <AppSelect 
            v-model="reportFilter.type"
            :options="reportTypeSelectOptions"
            placeholder="全部类型"
            class="wide-select"
            @change="onReportTypeChange"
          />
          <AppSelect 
            v-model="reportFilter.platform"
            :options="reportPlatformSelectOptions"
            placeholder="全部平台"
            class="wide-select"
          />
          
          <div class="date-picker-dropdown" v-if="showDatePicker && currentDatePickerType === 'report'" @click.stop>
            <div class="date-picker-header">
              <div class="date-picker-title">
                <span class="col-title">开始日期</span>
                <span class="col-title">结束日期</span>
              </div>
            </div>
            <div class="date-picker-content">
              <van-date-picker v-model="startDateValue" :min-date="minDate" :max-date="maxDate" :show-toolbar="false" :formatter="dateFormatter" />
              <div class="picker-divider"></div>
              <van-date-picker v-model="endDateValue" :min-date="minDate" :max-date="maxDate" :show-toolbar="false" :formatter="dateFormatter" />
            </div>
            <div class="date-picker-footer">
              <van-button plain @click="showDatePicker = false">取消</van-button>
              <van-button type="primary" color="#009688" @click="onDateConfirm">确认</van-button>
            </div>
          </div>
        </div>
        
        <div class="list-container report-container">
          <van-loading v-if="reportLoading" size="24px" vertical>加载中...</van-loading>
          <template v-else>
            <div class="report-section">
              <div class="section-title">汇总统计</div>
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="summary-label">总投注</span>
                  <span class="summary-value">{{ reportData.summary?.total_bet || '0.00' }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">总中奖</span>
                  <span class="summary-value green">{{ reportData.summary?.total_win || '0.00' }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">返水/优惠</span>
                  <span class="summary-value blue">{{ reportData.summary?.total_rebate || '0.00' }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">总盈亏</span>
                  <span class="summary-value" :class="parseFloat(reportData.summary?.total_profit || 0) >= 0 ? 'green' : 'red'">
                    {{ reportData.summary?.total_profit || '0.00' }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="report-section" v-if="reportData.category_list?.length > 0">
              <div class="section-title">分类明细</div>
              <div class="category-list">
                <div class="category-item" v-for="(item, index) in reportData.category_list" :key="index">
                  <div class="category-header">
                    <span class="category-name">{{ item.game_name }}</span>
                    <span class="category-platform">{{ item.platform_name }}</span>
                  </div>
                  <div class="category-stats">
                    <span>投注: {{ item.bet_amount }}</span>
                    <span>中奖: {{ item.win_amount }}</span>
                    <span :class="parseFloat(item.profit) >= 0 ? 'green' : 'red'">盈亏: {{ item.profit }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="report-section" v-if="reportData.daily_list?.length > 0">
              <div class="section-title">每日明细</div>
              <div class="daily-list">
                <div class="daily-header">
                  <span>日期</span>
                  <span>投注</span>
                  <span>中奖</span>
                  <span>盈亏</span>
                </div>
                <div class="daily-item" v-for="(item, index) in reportData.daily_list" :key="index">
                  <span>{{ item.date.slice(5) }}</span>
                  <span>{{ item.bet_amount }}</span>
                  <span>{{ item.win_amount }}</span>
                  <span :class="parseFloat(item.profit) >= 0 ? 'green' : 'red'">{{ item.profit }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="!reportData.category_list?.length && !reportData.daily_list?.length" class="empty-state">
<img src="/assets/img/img_none_sj.avif" class="empty-image" />
              <div class="empty-text">
                <span>暂无数据</span>
                <span class="view-all" @click="loadAllReportData">查看全部</span>
              </div>
            </div>
          </template>
        </div>
        </div>
      </transition>
    </div>

    <van-overlay :show="detailVisible" @click="detailVisible = false" class="detail-overlay">
      <div class="detail-wrapper">
        <div class="detail-modal" @click.stop>
          <div class="detail-header">
            <span class="detail-title">账变详情</span>
          </div>
          <div class="detail-body" v-if="currentDetail">
            <div class="detail-row">
              <span class="detail-label">账变类型</span>
              <span class="detail-value">{{ currentDetail.typeName || currentDetail.typename }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">变动金额</span>
              <span class="detail-value" :class="parseFloat(currentDetail.amount) > 0 ? 'green' : 'red'">
                {{ currentDetail.amountDisplay || currentDetail.amount }} 元
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">变动前余额</span>
              <span class="detail-value">{{ currentDetail.balanceBefore }} 元</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">变动后余额</span>
              <span class="detail-value">{{ currentDetail.balance }} 元</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">订单号</span>
              <div class="detail-value-wrap" @click="copyOrderNo(currentDetail.orderNo)">
                <span class="detail-value order-no">{{ currentDetail.orderNo || '-' }}</span>
                <van-icon v-if="currentDetail.orderNo" name="description" class="copy-icon" />
              </div>
            </div>
            <div class="detail-row">
              <span class="detail-label">时间</span>
              <span class="detail-value">{{ currentDetail.createdAt }}</span>
            </div>
            <div class="detail-row" v-if="currentDetail.remark">
              <span class="detail-label">备注</span>
              <span class="detail-value">{{ currentDetail.remark }}</span>
            </div>
          </div>
        </div>
        <div class="close-btn-wrap">
          <van-icon name="close" class="bottom-close-icon" @click="detailVisible = false" />
        </div>
      </div>
    </van-overlay>

    <van-overlay :show="betDetailVisible" @click="betDetailVisible = false" class="detail-overlay">
      <div class="detail-wrapper">
        <div class="detail-modal" @click.stop>
          <div class="detail-header">
            <span class="detail-title">投注详情</span>
          </div>
          <div class="detail-body" v-if="currentBetDetail">
            <div class="detail-row">
              <span class="detail-label">{{ currentBetDetail._source === 'game' ? '游戏' : '彩种' }}</span>
              <span class="detail-value">{{ currentBetDetail.cptitle || currentBetDetail.cpname }}</span>
            </div>
            <div class="detail-row" v-if="currentBetDetail._source !== 'game' && currentBetDetail.expect">
              <span class="detail-label">期号</span>
              <span class="detail-value">{{ currentBetDetail.expect }}</span>
            </div>
            <div class="detail-row" v-if="currentBetDetail._source !== 'game'">
              <span class="detail-label">玩法</span>
              <span class="detail-value">{{ getPlaytitleDisplay(currentBetDetail) }}</span>
            </div>
            <div class="detail-row" v-if="currentBetDetail._source !== 'game' && currentBetDetail.tzcode">
              <span class="detail-label">投注内容</span>
              <span class="detail-value">{{ getBetContentDisplay(currentBetDetail) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">投注金额</span>
              <span class="detail-value">{{ currentBetDetail.amount }} 元</span>
            </div>
            <div class="detail-row" v-if="currentBetDetail._source !== 'game'">
              <span class="detail-label">倍数</span>
              <span class="detail-value">{{ currentBetDetail.beishu }}</span>
            </div>
            <div class="detail-row" v-if="currentBetDetail._source !== 'game' && currentBetDetail.opencode">
              <span class="detail-label">开奖号码</span>
              <span class="detail-value">{{ currentBetDetail.opencode }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ currentBetDetail._source === 'game' ? '派彩金额' : '中奖金额' }}</span>
              <span class="detail-value green">{{ currentBetDetail.okamount }} 元</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">盈亏</span>
              <span class="detail-value" :class="parseFloat(currentBetDetail.profit) >= 0 ? 'green' : 'red'">
                {{ currentBetDetail.profit }} 元
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">状态</span>
              <span class="detail-value" :class="currentBetDetail.status_color">{{ currentBetDetail.status }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">订单号</span>
              <div class="detail-value-wrap" @click="copyOrderNo(currentBetDetail.trano)">
                <span class="detail-value order-no">{{ currentBetDetail.trano || '-' }}</span>
                <van-icon v-if="currentBetDetail.trano" name="description" class="copy-icon" />
              </div>
            </div>
            <div class="detail-row">
              <span class="detail-label">投注时间</span>
              <span class="detail-value">{{ currentBetDetail.oddtime }}</span>
            </div>
          </div>
        </div>
        <div class="close-btn-wrap">
          <van-icon name="close" class="bottom-close-icon" @click="betDetailVisible = false" />
        </div>
      </div>
    </van-overlay>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { accountApi } from '@/api/account'
import { authApi } from '@/api/auth'
import { gameApi } from '@/api/game'
import { AppSelect } from '@/components/common'
import { navigatePcBack } from '@/utils/deviceRoutes'

const router = useRouter()
const route = useRoute()

const goBack = () => {
  if (navigatePcBack(router, route, '/member')) return
  router.back()
}
const activeTab = ref(0)
const prevTab = ref(0)
const tabs = ['账户明细', '投注记录', '个人报表']
const tabTransition = ref('tab-slide-left')

watch(activeTab, (newVal, oldVal) => {
  prevTab.value = oldVal
  tabTransition.value = newVal > oldVal ? 'tab-slide-left' : 'tab-slide-right'
})

const dateOptions = [
  { text: '今日', value: 0 },
  { text: '昨日', value: 1 },
  { text: '近7天', value: 3 },
  { text: '自定义', value: 2 }
]

const dateSelectOptions = computed(() => dateOptions.map(o => ({ label: o.text, value: o.value })))

const accountTypeOptions = ref([{ text: '全部类型', value: '' }])
const accountDetailOptionsMap = ref({ '': [{ text: '小类明细', value: '' }] })
const betStatusOptions = ref([{ text: '全部状态', value: '' }])
const betCategoryOptions = ref([{ text: '全部类型', value: '' }])
const platformConfigMap = ref({ '': [{ text: '全部平台', value: '' }] })

const lotteryGamesCache = ref(null)

const betPlatformOptions = ref([
  { text: '全部平台', value: '' }
])

const betGameOptions = ref([
  { text: '全部游戏', value: '' }
])

const reportPlatformOptions = ref([
  { text: '全部平台', value: '' }
])

const accountFilter = ref({ date: 0, type: '', detail: '' })
const betFilter = ref({ date: 0, status: '', category: '', platform: '', game: '' })
const reportFilter = ref({ date: 0, type: '', platform: '' })

const accountDateSelectValue = ref(0)
const betDateSelectValue = ref(0)
const reportDateSelectValue = ref(0)

const accountTypeSelectOptions = computed(() => accountTypeOptions.value.map(o => ({ label: o.text, value: o.value })))
const accountDetailSelectOptions = computed(() => {
  const type = accountFilter.value.type
  const opts = accountDetailOptionsMap.value[type] || accountDetailOptionsMap.value['']
  return opts.map(o => ({ label: o.text, value: o.value }))
})

const betStatusSelectOptions = computed(() => betStatusOptions.value.map(o => ({ label: o.text, value: o.value })))
const betCategorySelectOptions = computed(() => betCategoryOptions.value.map(o => ({ label: o.text, value: o.value })))
const betPlatformSelectOptions = computed(() => betPlatformOptions.value.map(o => ({ label: o.text, value: o.value })))
const betGameSelectOptions = computed(() => betGameOptions.value.map(o => ({ label: o.text, value: o.value })))

const reportTypeSelectOptions = computed(() => betCategoryOptions.value.map(o => ({ label: o.text, value: o.value })))
const reportPlatformSelectOptions = computed(() => reportPlatformOptions.value.map(o => ({ label: o.text, value: o.value })))

const onAccountDateChange = (item) => {
  if (item.value === 2) {
    currentDatePickerType.value = 'account'
    initDatePickerValues('account')
    showDatePicker.value = true
    accountDateSelectValue.value = accountFilter.value.date
  } else {
    accountFilter.value.date = item.value
    accountDateSelectValue.value = item.value
  }
}

const onAccountTypeChange = () => {
  accountFilter.value.detail = ''
}

const onBetDateChange = (item) => {
  if (item.value === 2) {
    currentDatePickerType.value = 'bet'
    initDatePickerValues('bet')
    showDatePicker.value = true
    betDateSelectValue.value = betFilter.value.date
  } else {
    betFilter.value.date = item.value
    betDateSelectValue.value = item.value
  }
}

const onBetCategoryChange = () => {
  betFilter.value.platform = ''
  betFilter.value.game = ''
  const platforms = platformConfigMap.value[betFilter.value.category] || platformConfigMap.value['']
  betPlatformOptions.value = [...platforms]
  betGameOptions.value = [{ text: '全部游戏', value: '' }]
}

const onBetPlatformChange = async () => {
  betFilter.value.game = ''
  if (betFilter.value.category === 'lottery' && betFilter.value.platform) {
    await loadLotteryGames()
  } else {
    betGameOptions.value = [{ text: '全部游戏', value: '' }]
  }
}

const onReportDateChange = (item) => {
  if (item.value === 2) {
    currentDatePickerType.value = 'report'
    initDatePickerValues('report')
    showDatePicker.value = true
    reportDateSelectValue.value = reportFilter.value.date
  } else {
    reportFilter.value.date = item.value
    reportDateSelectValue.value = item.value
  }
}

const onReportTypeChange = () => {
  reportFilter.value.platform = ''
  const platforms = platformConfigMap.value[reportFilter.value.type] || platformConfigMap.value['']
  reportPlatformOptions.value = [...platforms]
}

const detailVisible = ref(false)
const currentDetail = ref(null)

const showRecordDetail = (item) => {
  currentDetail.value = item
  detailVisible.value = true
}

const betDetailVisible = ref(false)
const currentBetDetail = ref(null)

const showBetDetail = (item) => {
  currentBetDetail.value = item
  betDetailVisible.value = true
}

const copyOrderNo = async (text) => {
  if (!text || text === '-') return
  try {
    await navigator.clipboard.writeText(text)
    showToast('复制成功')
  } catch {
    showToast('复制失败')
  }
}

const isCombinedBet = (bet) => {
  if (!bet) return false
  if (bet.playid === 'xy28_combined') return true
  const tzcode = bet.tzcode || ''
  return tzcode.startsWith('[') && tzcode.includes('"playid"')
}

const getPlaytitleDisplay = (bet) => {
  if (!bet) return ''
  
  if (isCombinedBet(bet)) {
    const categories = []
    const tzcode = bet.tzcode || ''
    if (tzcode.startsWith('[')) {
      try {
        const items = JSON.parse(tzcode)
        if (Array.isArray(items)) {
          const playids = items.map(item => item.playid || '')
          if (playids.some(p => /^c_(big|small|odd|even|big_odd|big_even|small_odd|small_even)$/.test(p))) {
            categories.push('双面')
          }
          if (playids.some(p => /^c_(long|hu|bao)$/.test(p))) {
            categories.push('龙虎')
          }
          if (playids.some(p => /^c_(duizi|shunzi|baozi)$/.test(p))) {
            categories.push('趣味')
          }
          if (playids.some(p => /^c_(jida|jixiao)$/.test(p))) {
            categories.push('极值')
          }
          if (playids.some(p => /^hz_\d+$/.test(p))) {
            categories.push('和值')
          }
        }
      } catch (e) {
      }
    }
    
    if (categories.length === 0) {
      const playtitle = bet.playtitle || ''
      if (/[大小单双]/.test(playtitle)) categories.push('双面')
      if (/[龙虎]/.test(playtitle)) categories.push('龙虎')
      if (/[对顺豹]|对子|顺子|豹子/.test(playtitle)) categories.push('趣味')
      if (/极[大小]/.test(playtitle)) categories.push('极值')
      if (/\d+点|\b[0-9]{1,2}\b(?=\D|$)/.test(playtitle) && /^\d/.test(playtitle.split(/[\/,]/)[0])) categories.push('和值')
    }
    
    if (categories.length > 0) {
      return categories.join('/')
    }
    return '混合下注'
  }
  
  return bet.playtitle || ''
}

const getBetContentDisplay = (bet) => {
  if (!bet) return ''
  
  const tzcode = bet.tzcode || ''
  
  if (isCombinedBet(bet)) {
    if (bet.playtitle && !bet.playtitle.includes('"playid"')) {
      return bet.playtitle
    }
    if (tzcode.startsWith('[')) {
      try {
        const items = JSON.parse(tzcode)
        if (Array.isArray(items)) {
          return items.map(item => `${item.title || item.label || item.playid}${item.amount}`).join(' / ')
        }
      } catch (e) {
      }
    }
    return bet.playtitle || tzcode
  }
  
  return tzcode
}

const showDatePicker = ref(false)
const currentDatePickerType = ref('')
const customDateRange = ref({ account: null, bet: null, report: null })
const minDate = new Date(2020, 0, 1)
const maxDate = ref(new Date())

const SERVER_TIME_ZONE = 'Asia/Shanghai'
let serverEpochAtSync = null
let monotonicTimeAtSync = null

const getMonotonicTime = () => (
  typeof performance !== 'undefined' ? performance.now() : Date.now()
)

const getServerNow = () => {
  if (serverEpochAtSync !== null && monotonicTimeAtSync !== null) {
    return new Date(serverEpochAtSync + getMonotonicTime() - monotonicTimeAtSync)
  }

  const savedDiff = Number(localStorage.getItem('serverTimeDiff'))
  if (Number.isFinite(savedDiff)) {
    return new Date(Date.now() - savedDiff)
  }

  return new Date()
}

const getServerDateString = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SERVER_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(getServerNow())
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

const dateStringToPickerValue = (dateString) => dateString.split('-')

const dateStringToLocalDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const shiftDateString = (dateString, days) => {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

const initialServerDate = getServerDateString()
const startDateValue = ref(dateStringToPickerValue(initialServerDate))
const endDateValue = ref(dateStringToPickerValue(initialServerDate))

const syncServerClock = async () => {
  try {
    const res = await authApi.heartbeat()
    const serverTime = Number(res?.data?.serverTime)
    if ((res.code === 0 || res.code === 200) && Number.isFinite(serverTime) && serverTime > 0) {
      serverEpochAtSync = serverTime * 1000
      monotonicTimeAtSync = getMonotonicTime()
      localStorage.setItem('serverTimeDiff', String(Date.now() - serverEpochAtSync))
    }
  } catch {
    // 心跳失败时沿用最近一次服务器时差，确保筛选仍可正常使用。
  }

  const serverDate = getServerDateString()
  maxDate.value = dateStringToLocalDate(serverDate)
  startDateValue.value = dateStringToPickerValue(serverDate)
  endDateValue.value = dateStringToPickerValue(serverDate)
}

const dateFormatter = (type, option) => {
  if (type === 'year') {
    option.text = option.text.replace('年', '')
  } else if (type === 'month') {
    option.text = option.text.replace('月', '')
  } else if (type === 'day') {
    option.text = option.text.replace('日', '')
  }
  return option
}

const initDatePickerValues = (type) => {
  const range = customDateRange.value[type]
  if (range && range.start && range.end) {
    startDateValue.value = [
      range.start.getFullYear().toString(),
      (range.start.getMonth() + 1).toString().padStart(2, '0'),
      range.start.getDate().toString().padStart(2, '0')
    ]
    endDateValue.value = [
      range.end.getFullYear().toString(),
      (range.end.getMonth() + 1).toString().padStart(2, '0'),
      range.end.getDate().toString().padStart(2, '0')
    ]
  } else {
    const todayArr = dateStringToPickerValue(getServerDateString())
    startDateValue.value = [...todayArr]
    endDateValue.value = [...todayArr]
  }
}

const loadLotteryGames = async () => {
  if (lotteryGamesCache.value) {
    betGameOptions.value = [{ text: '全部游戏', value: '' }, ...lotteryGamesCache.value]
    return
  }
  
  try {
    const res = await gameApi.getLotteryCategories()
    
    if (res.code === 0 && res.data) {
      const games = []
      if (res.data.games) {
        Object.values(res.data.games).forEach(categoryGames => {
          categoryGames.forEach(game => {
            games.push({ text: game.title, value: game.name })
          })
        })
      }
      lotteryGamesCache.value = games
      betGameOptions.value = [{ text: '全部游戏', value: '' }, ...games]
    }
  } catch {
    betGameOptions.value = [{ text: '全部游戏', value: '' }]
  }
}

const onDateConfirm = () => {
  showDatePicker.value = false
  const start = new Date(parseInt(startDateValue.value[0]), parseInt(startDateValue.value[1]) - 1, parseInt(startDateValue.value[2]))
  const end = new Date(parseInt(endDateValue.value[0]), parseInt(endDateValue.value[1]) - 1, parseInt(endDateValue.value[2]))
  const range = { start, end }
  
  if (currentDatePickerType.value === 'account') {
    customDateRange.value.account = range
    accountDateSelectValue.value = 2
    if (accountFilter.value.date === 2) {
      loadAccountRecords(true)
    } else {
      accountFilter.value.date = 2
    }
  } else if (currentDatePickerType.value === 'bet') {
    customDateRange.value.bet = range
    betDateSelectValue.value = 2
    if (betFilter.value.date === 2) {
      loadBetRecords(true)
    } else {
      betFilter.value.date = 2
    }
  } else if (currentDatePickerType.value === 'report') {
    customDateRange.value.report = range
    reportDateSelectValue.value = 2
    if (reportFilter.value.date === 2) {
      loadProfitLoss()
    } else {
      reportFilter.value.date = 2
    }
  }
}

const accountList = ref([])
const accountLoading = ref(false)
const accountLoadMore = ref(false)
const accountFinished = ref(false)
const accountPage = ref(1)
const accountStats = ref({ recharge: '0.00', withdraw: '0.00', receive: '0.00' })

const betList = ref([])
const betLoading = ref(false)
const betLoadMore = ref(false)
const betFinished = ref(false)
const betPage = ref(1)
const betStats = ref({ count: 0, amount: '0.00', profit: '0.00' })

const reportLoading = ref(false)
const reportData = ref({
  summary: {
    total_bet: '0.00',
    total_win: '0.00',
    total_rebate: '0.00',
    total_profit: '0.00'
  },
  category_list: [],
  daily_list: []
})

const getDateRange = (dateValue, filterType = 'account') => {
  const today = getServerDateString()
  const formatDate = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  
  if (dateValue === 0) {
    return { startDate: today, endDate: today }
  } else if (dateValue === 1) {
    const yesterday = shiftDateString(today, -1)
    return { startDate: yesterday, endDate: yesterday }
  } else if (dateValue === 3) {
    return { startDate: shiftDateString(today, -6), endDate: today }
  } else if (dateValue === 2) {
    const range = customDateRange.value[filterType]
    if (range) {
      return { startDate: formatDate(range.start), endDate: formatDate(range.end) }
    }
  }
  return { startDate: '', endDate: '' }
}

const loadAccountRecords = async (reset = false) => {
  if (reset) {
    accountPage.value = 1
    accountList.value = []
    accountFinished.value = false
  }
  
  if (accountFinished.value) return
  
  accountPage.value === 1 ? (accountLoading.value = true) : (accountLoadMore.value = true)
  
  try {
    const { startDate, endDate } = getDateRange(accountFilter.value.date, 'account')
    const res = await accountApi.getTransactionRecords({
      page: accountPage.value,
      pageSize: 20,
      type: accountFilter.value.type || '',
      status: accountFilter.value.detail !== '' ? accountFilter.value.detail : '',
      startDate,
      endDate
    })
    
    if (res.code === 0) {
      const list = res.data?.list || res.data || []
      if (reset) {
        accountList.value = list
      } else {
        accountList.value.push(...list)
      }
      
      if (list.length < 20) {
        accountFinished.value = true
      } else {
        accountPage.value++
      }
    }
  } catch (e) {
    console.error('loadAccountRecords error:', e)
  } finally {
    accountLoading.value = false
    accountLoadMore.value = false
  }
}

const loadAccountStats = async () => {
  try {
    const [rechargeRes, withdrawRes, receiveRes] = await Promise.all([
      accountApi.getRechargeRecords({ page: 1, pageSize: 1 }),
      accountApi.getWithdrawRecords({ page: 1, pageSize: 1 }),
      accountApi.getReceiveStats()
    ])
    
    if (rechargeRes.code === 0 && rechargeRes.data?.summary) {
      accountStats.value.recharge = rechargeRes.data.summary.totalRecharge || '0.00'
    }
    if (withdrawRes.code === 0 && withdrawRes.data?.summary) {
      accountStats.value.withdraw = withdrawRes.data.summary.totalWithdraw || '0.00'
    }
    if (receiveRes.code === 0 && receiveRes.data) {
      accountStats.value.receive = receiveRes.data.totalReceive || '0.00'
    }
  } catch {
  }
}

const formatThirdPartyRecord = (item) => ({
  id: 'g_' + item.id,
  trano: item.orderNo || item.order_no || '',
  cpname: item.gameName || item.game_name || item.platform || '',
  cptitle: item.gameName || item.game_name || item.platformName || '',
  expect: item.gameId || item.round_id || '',
  playtitle: item.gameType || item.game_type || '电子游戏',
  amount: item.betAmount || item.bet_amount || '0.00',
  okamount: item.winAmount || item.win_amount || '0.00',
  profit: item.profit || '0.00',
  beishu: 1,
  tzcode: item.betContent || item.bet_detail || '',
  opencode: '',
  status: item.status === 'settled' ? '已结算' : (item.status === 'pending' ? '未结算' : '已取消'),
  status_color: parseFloat(item.profit || 0) > 0 ? 'green' : (parseFloat(item.profit || 0) < 0 ? 'red' : 'blue'),
  oddtime: item.betTime || item.bet_time_str || '',
  _timestamp: item.betTime ? new Date(item.betTime).getTime() / 1000 : 0,
  isdraw: item.status === 'settled' ? 1 : 0,
  _source: 'game'
})

let lastGameStatsCache = null

const loadBetRecords = async (reset = false, skipStats = false) => {
  if (reset) {
    betPage.value = 1
    betList.value = []
    betFinished.value = false
    lastGameStatsCache = null
  }
  
  if (betFinished.value) return
  
  betPage.value === 1 ? (betLoading.value = true) : (betLoadMore.value = true)
  
  try {
    const { startDate, endDate } = getDateRange(betFilter.value.date, 'bet')
    const category = betFilter.value.category || ''
    
    let allRecords = []
    let gameStatsData = null
    
    if (!category || category === 'lottery') {
      const lotteryRes = await accountApi.getBetRecords({
        page: betPage.value,
        pageSize: 20,
        status: betFilter.value.status || '',
        game: betFilter.value.game || '',
        startDate,
        endDate
      })
      if (lotteryRes.code === 0) {
        const list = lotteryRes.data || []
        list.forEach(item => {
          item._timestamp = new Date(item.oddtime).getTime() / 1000 || 0
          item._source = 'lottery'
        })
        allRecords.push(...list)
      }
    }
    
    if (!category || category !== 'lottery') {
      const gameRes = await gameApi.getRecords({
        page: betPage.value,
        pageSize: 20,
        type: category && category !== 'lottery' ? category : '',
        platform: betFilter.value.platform || '',
        startDate,
        endDate
      })
      if (gameRes.code === 0) {
        let gameList = gameRes.data || []
        if (gameRes.data?.list) gameList = gameRes.data.list
        const formatted = gameList.map(formatThirdPartyRecord)
        allRecords.push(...formatted)
        
        if (reset && gameRes.data) {
          gameStatsData = {
            total: parseInt(gameRes.data.total) || 0,
            totalBet: parseFloat(gameRes.data.summary?.totalBet) || 0,
            totalProfit: parseFloat(gameRes.data.summary?.totalProfit) || 0
          }
          lastGameStatsCache = gameStatsData
        }
      }
    }
    
    allRecords.sort((a, b) => (b._timestamp || 0) - (a._timestamp || 0))
    
    if (!category && allRecords.length > 20) {
      allRecords = allRecords.slice(0, 20)
    }
    
    if (reset) {
      betList.value = allRecords
    } else {
      betList.value.push(...allRecords)
    }
    
    if (allRecords.length < 20) {
      betFinished.value = true
    } else {
      betPage.value++
    }
    
    if (reset && !skipStats) {
      await loadBetStats(gameStatsData)
    }
  } catch {
  } finally {
    betLoading.value = false
    betLoadMore.value = false
  }
}

const loadBetStats = async (cachedGameStats = null) => {
  try {
    const { startDate, endDate } = getDateRange(betFilter.value.date, 'bet')
    const category = betFilter.value.category || ''
    
    let totalCount = 0
    let totalAmount = 0
    let totalProfit = 0
    
    if (!category || category === 'lottery') {
      const lotteryRes = await accountApi.getBetStats({
        status: betFilter.value.status || '',
        game: betFilter.value.game || '',
        startDate,
        endDate
      })
      if (lotteryRes.code === 0 && lotteryRes.data) {
        totalCount += parseInt(lotteryRes.data.count) || 0
        totalAmount += parseFloat(lotteryRes.data.amount) || 0
        totalProfit += parseFloat(lotteryRes.data.profit) || 0
      }
    }
    
    if (!category || category !== 'lottery') {
      const gameStats = cachedGameStats || lastGameStatsCache
      if (gameStats) {
        totalCount += gameStats.total || 0
        totalAmount += gameStats.totalBet || 0
        totalProfit += gameStats.totalProfit || 0
      } else {
        const gameRes = await gameApi.getRecords({
          page: 1,
          pageSize: 1,
          type: category && category !== 'lottery' ? category : '',
          platform: betFilter.value.platform || '',
          startDate,
          endDate
        })
        if (gameRes.code === 0 && gameRes.data) {
          const summary = gameRes.data.summary || {}
          totalCount += parseInt(gameRes.data.total) || 0
          totalAmount += parseFloat(summary.totalBet) || 0
          totalProfit += parseFloat(summary.totalProfit) || 0
        }
      }
    }
    
    betStats.value = {
      count: totalCount,
      amount: totalAmount.toFixed(2),
      profit: totalProfit.toFixed(2)
    }
  } catch {
  }
}

const loadProfitLoss = async () => {
  reportLoading.value = true
  
  try {
    const { startDate, endDate } = getDateRange(reportFilter.value.date, 'report')
    const res = await accountApi.getProfitLoss({
      start_date: startDate || new Date().toISOString().split('T')[0],
      end_date: endDate || new Date().toISOString().split('T')[0],
      category: reportFilter.value.type || '',
      platform: reportFilter.value.platform || ''
    })
    
    if (res.code === 0 && res.data) {
      reportData.value = res.data
    }
  } catch {
  } finally {
    reportLoading.value = false
  }
}

const loadAllAccountRecords = () => {
  const start = new Date(2020, 0, 1)
  const end = dateStringToLocalDate(getServerDateString())
  customDateRange.value.account = { start, end }
  accountFilter.value.date = 2
}

const loadAllBetRecords = () => {
  const start = new Date(2020, 0, 1)
  const end = dateStringToLocalDate(getServerDateString())
  customDateRange.value.bet = { start, end }
  betFilter.value.date = 2
}

const loadAllReportData = () => {
  const start = new Date(2020, 0, 1)
  const end = dateStringToLocalDate(getServerDateString())
  customDateRange.value.report = { start, end }
  reportFilter.value.date = 2
}

watch(activeTab, (val) => {
  if (val === 0 && accountList.value.length === 0) {
    loadAccountRecords(true)
  } else if (val === 1 && betList.value.length === 0) {
    loadBetRecords(true)
  } else if (val === 2) {
    loadProfitLoss()
  }
})

watch(() => [accountFilter.value.date, accountFilter.value.type, accountFilter.value.detail], () => {
  if (activeTab.value === 0) {
    loadAccountRecords(true)
  }
})

watch(() => [betFilter.value.date, betFilter.value.status, betFilter.value.category, betFilter.value.platform, betFilter.value.game], () => {
  if (activeTab.value === 1) {
    loadBetRecords(true)
  }
})

watch(() => [reportFilter.value.date, reportFilter.value.type, reportFilter.value.platform], () => {
  if (activeTab.value === 2) {
    loadProfitLoss()
  }
})

const handleScroll = (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollHeight - scrollTop - clientHeight < 50) {
    if (activeTab.value === 0 && !accountLoading.value && !accountLoadMore.value && !accountFinished.value) {
      loadAccountRecords(false)
    } else if (activeTab.value === 1 && !betLoading.value && !betLoadMore.value && !betFinished.value) {
      loadBetRecords(false)
    }
  }
}

const loadFilterOptions = async () => {
  try {
    const [typesRes, optionsRes] = await Promise.all([
      accountApi.getTransactionTypes(),
      accountApi.getRecordFilterOptions()
    ])
    if (typesRes.code === 0 && typesRes.data?.length > 0) {
      accountTypeOptions.value = typesRes.data.map(item => ({ text: item.label, value: item.value }))
    }
    if (optionsRes.code === 0 && optionsRes.data) {
      const d = optionsRes.data
      if (d.betStatusOptions?.length > 0) betStatusOptions.value = d.betStatusOptions
      if (d.betCategoryOptions?.length > 0) betCategoryOptions.value = d.betCategoryOptions
      if (d.platformConfigMap && Object.keys(d.platformConfigMap).length > 0) platformConfigMap.value = d.platformConfigMap
      if (d.accountDetailOptionsMap && Object.keys(d.accountDetailOptionsMap).length > 0) accountDetailOptionsMap.value = d.accountDetailOptionsMap
    }
  } catch (e) {
    console.error('loadFilterOptions error:', e)
  }
}

onMounted(async () => {
  await syncServerClock()
  loadAccountRecords(true)
  loadAccountStats()
  loadFilterOptions()
})
</script>

<style lang="scss" scoped>
.member-records {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;
}

.header {
  height: 46px;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 12px;
  position: relative;
  border-bottom: 1px solid #f5f5f5;
}

.back-icon {
  font-size: 20px;
  color: #333;
  margin-right: 15px;
}

.header-tabs {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.header-tab-item {
  font-size: 14px;
  color: #666;
  padding: 12px 5px;
  position: relative;
  
  &.active {
    color: #26A17B;
    font-weight: 700;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 2px;
      background: #26A17B;
      border-radius: 2px;
    }
  }
}

.content-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.tab-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;
}

.tab-slide-left-enter-active,
.tab-slide-left-leave-active {
  transition: transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1);
}
.tab-slide-left-enter-from {
  transform: translateX(100%);
}
.tab-slide-left-enter-to {
  transform: translateX(0);
}
.tab-slide-left-leave-from {
  transform: translateX(0);
}
.tab-slide-left-leave-to {
  transform: translateX(-100%);
}

.tab-slide-right-enter-active,
.tab-slide-right-leave-active {
  transition: transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1);
}
.tab-slide-right-enter-from {
  transform: translateX(-100%);
}
.tab-slide-right-enter-to {
  transform: translateX(0);
}
.tab-slide-right-leave-from {
  transform: translateX(0);
}
.tab-slide-right-leave-to {
  transform: translateX(100%);
}

.filter-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  row-gap: 10px;
  padding: 12px 15px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
}

.filter-bar :deep(.app-select) {
  display: inline-flex;
  min-width: 90px !important;
}

.filter-bar :deep(.app-select .select-trigger) {
  min-width: 90px;
  justify-content: space-between;
}

.filter-bar :deep(.app-select .select-panel) {
  min-width: 90px !important;
}

.filter-bar :deep(.app-select .panel-content) {
  max-height: 200px;
  overflow-y: auto;
}

.filter-bar :deep(.type-select) {
  min-width: 110px !important;
  margin-left: 10px;
}

.filter-bar :deep(.type-select .select-trigger) {
  min-width: 110px;
}

.filter-bar :deep(.type-select .select-panel) {
  min-width: 110px !important;
}

.filter-bar :deep(.detail-select) {
  min-width: 110px !important;
  margin-left: 10px;
}

.filter-bar :deep(.detail-select .select-trigger) {
  min-width: 110px;
}

.filter-bar :deep(.detail-select .select-panel) {
  min-width: 110px !important;
}

.filter-bar-scroll {
  flex-wrap: wrap;
  row-gap: 10px;
}

.filter-bar-scroll :deep(.app-select) {
  flex-shrink: 0;
}

.filter-bar :deep(.wide-select) {
  min-width: 110px !important;
  margin-left: 10px;
}

.filter-bar :deep(.wide-select .select-trigger) {
  min-width: 110px;
}

.filter-bar :deep(.wide-select .select-panel) {
  min-width: 110px !important;
}

.list-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.footer-stats {
  background: #fff;
  border-top: 1px solid #f5f5f5;
  padding: 12px 15px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  font-size: 13px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .label {
    font-size: 12px;
    color: #666;
  }
  
  .value {
    font-size: 14px;
    font-weight: 700;
  }
  
  &:last-child {
    grid-column: span 2;
    padding-top: 4px;
  }
}

.label { color: #999; }
.value { 
  color: #333; 
  font-weight: 700;
  
  &.green { color: #26A17B; }
  &.red { color: #ff4d4f; }
  &.gold { color: #FFAA09; }
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  
  &:active {
    background: #f5f5f5;
  }
}

.record-left {
  flex: 1;
  
  .record-title {
    font-size: 14px;
    color: #333;
    margin-bottom: 4px;
  }
  
  .record-time {
    font-size: 12px;
    color: #999;
  }
}

.record-right {
  text-align: right;
  
  .record-amount {
    font-size: 16px;
    font-weight: 700;
    color: #ff4d4f;
    margin-bottom: 4px;
    
    &.plus {
      color: #26A17B;
    }
  }
  
  .record-balance {
    font-size: 12px;
    color: #999;
  }
}

.bet-item {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.bet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  .bet-game {
    font-size: 14px;
    font-weight: 700;
    color: #333;
  }
}

.bet-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 6px;
  
  &.green { color: #26A17B; background: rgba(38, 161, 123, 0.1); }
  &.gray { color: #999; background: #f5f5f5; }
  &.blue { color: #1989fa; background: rgba(24, 144, 255, 0.1); }
  &.red { color: #ff4d4f; background: rgba(255, 77, 79, 0.1); }
}

.bet-info {
  font-size: 13px;
  color: #666;
  
  .bet-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  
  .bet-win {
    &.plus { color: #26A17B; }
    &.minus { color: #ff4d4f; }
  }
}

.bet-time {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.report-card {
  width: 100%;
  background: #fff;
  border-radius: 8px;
  padding: 15px;
}

.report-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  &.total {
    margin-top: 12px;
    padding-top: 15px;
    border-top: 1px solid #f5f5f5;
    border-bottom: none;
  }
}

.report-label {
  font-size: 14px;
  color: #666;
}

.report-value {
  font-size: 14px;
  font-weight: 700;
  color: #333;
  
  &.green { color: #26A17B; }
  &.red { color: #ff4d4f; }
  &.blue { color: #1989fa; }
}

.report-container {
  padding: 12px;
}

.report-section {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.summary-item {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.summary-label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  
  &.green { color: #26A17B; }
  &.red { color: #ff4d4f; }
  &.blue { color: #1989fa; }
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 12px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  .category-name {
    font-size: 14px;
    font-weight: 700;
    color: #333;
  }
  
  .category-platform {
    font-size: 12px;
    color: #999;
  }
}

.category-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  
  .green { color: #26A17B; }
  .red { color: #ff4d4f; }
}

.daily-list {
  font-size: 13px;
}

.daily-header {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
  color: #999;
  font-size: 12px;
  text-align: center;
}

.daily-item {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  text-align: center;
  color: #333;
  
  &:last-child {
    border-bottom: none;
  }
  
  .green { color: #26A17B; }
  .red { color: #ff4d4f; }
}

.no-more {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 12px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  
  .empty-image {
    width: 120px;
    height: 120px;
    margin-bottom: 15px;
  }
  
  .empty-text {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: #999;
  }
  
  .view-all {
    color: #26A17B;
    cursor: pointer;
    
    &:active {
      opacity: 0.7;
    }
  }
}

.date-picker-dropdown {
  position: absolute;
  top: 100%;
  left: -15px;
  right: -15px;
  background: #fff;
  z-index: 201;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  border-top: 1px solid #f5f5f5;
}

.date-picker-header {
  padding: 12px 15px 5px;
  
  .date-picker-title {
    display: flex;
    justify-content: space-around;
  }
  
  .col-title {
    font-size: 14px;
    font-weight: 700;
    color: #333;
  }
}

.date-picker-content {
  display: flex;
  align-items: stretch;
  width: 100%;
  
  .picker-divider {
    width: 1px;
    background: #f5f5f5;
    flex-shrink: 0;
  }
  
  :deep(.van-date-picker) {
    flex: 1 1 50%;
    max-width: 50%;
  }
  
  :deep(.van-picker) {
    width: 100% !important;
  }
  
  :deep(.van-picker__columns) {
    height: 150px;
  }
  
  :deep(.van-picker-column) {
    flex: 1;
  }
  
  :deep(.van-picker-column__item) {
    font-size: 13px;
    padding: 0 2px;
  }
}

.date-picker-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 12px 15px;
  
  .van-button {
    width: 100px;
    border-radius: 999px;
  }
}

.detail-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-wrapper {
  width: 85%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.detail-modal {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.detail-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px 20px;
  background: linear-gradient(to right, #f9f9f9, #fff);
  border-bottom: 1px solid #f5f5f5;
  
  .detail-title {
    font-size: 17px;
    font-weight: 700;
    color: #333;
  }
}

.detail-body {
  padding: 15px 20px 25px;
}

.close-btn-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
}

.bottom-close-icon {
  font-size: 24px;
  color: #fff;
  border: 2px solid #fff;
  border-radius: 50%;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
  
  &:active {
    background: rgba(0, 0, 0, 0.4);
  }
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.detail-label {
  font-size: 14px;
  color: #888;
  flex-shrink: 0;
}

.detail-value-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 65%;
}

.detail-value {
  font-size: 14px;
  color: #333;
  text-align: right;
  word-break: break-all;
  line-height: 1.4;
  
  &.green {
    color: #26A17B;
    font-weight: 700;
    font-size: 16px;
  }
  
  &.red {
    color: #ff4d4f;
    font-weight: 700;
    font-size: 16px;
  }
  
  &.order-no {
    font-size: 13px;
    color: #555;
    font-family: monospace;
  }
}

.copy-icon {
  font-size: 14px;
  color: #26A17B;
  cursor: pointer;
}
</style>
