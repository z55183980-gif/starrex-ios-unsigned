<template>
  <div class="tab-vip" :class="{ embedded: props.embedded }">
    <section class="vip-hero" aria-label="VIP尊贵特权">
      <div class="vip-hero-mark">V</div>
      <div class="vip-hero-copy">
        <span>周薪福利 月福利</span>
        <strong><em>VIP</em>尊贵特权</strong>
      </div>
    </section>
    <div class="vip-header-card">
      <div class="current-level-tag" v-if="previewLevel === currentLevel">当前等级</div>
      
      <div class="vip-level-node current-node">
        <div class="vip-badge-wrapper">
          <img :src="getBgIcon(currentLevel)" class="vip-outer-ring" />
          <div class="vip-badge-img-container">
            <img :src="getBadgeIcon(currentLevel)" class="vip-badge-img" />
            <span class="vip-level-num">{{ currentLevel }}</span>
          </div>
        </div>
        <strong>VIP{{ currentLevel }}</strong>
      </div>

      <div class="vip-status">
        <div class="status-text">
          <template v-if="previewLevel === currentLevel && getLevelData(currentLevel + 1).level">
            还需投注<span class="amount">{{ formatAmount(needBet) }}</span>晋升<span class="next-level">VIP{{ currentLevel + 1 }}</span>，领<span class="amount">{{ formatAmount(getLevelData(currentLevel + 1).upgradeBonus) }}</span>晋级礼金。
          </template>
          <template v-else>
            <span class="preview-title">VIP{{ previewLevel }} 详情</span>
          </template>
        </div>
        <div class="vip-progress-track" aria-label="VIP晋级进度">
          <span class="vip-progress-fill" :style="{ width: `${Math.max(0, Math.min(progress, 100))}%` }"></span>
        </div>
        <div class="status-sub">
          <template v-if="previewLevel === currentLevel">
            当前投注 {{ formatAmount(currentBet) }}
            <i
              class="refresh-icon"
              :class="{ spinning: refreshing }"
              @click="handleRefresh"
              title="点击刷新"
              aria-label="刷新"
            ></i>
          </template>
          <template v-else>
            晋级需投注 <span class="amount">{{ formatAmount(getLevelData(previewLevel).upgradeBet) }}</span>
          </template>
        </div>
      </div>

      <div class="vip-level-node next-node" v-if="getLevelData(currentLevel + 1).level">
        <div class="vip-badge-wrapper">
          <img :src="getBgIcon(currentLevel + 1)" class="vip-outer-ring" />
          <div class="vip-badge-img-container">
            <img :src="getBadgeIcon(currentLevel + 1)" class="vip-badge-img" />
            <span class="vip-level-num">{{ currentLevel + 1 }}</span>
          </div>
        </div>
        <strong>VIP{{ currentLevel + 1 }}</strong>
      </div>

      <div class="vip-actions">
        <button class="vip-claim-btn" :class="canClaim ? 'green' : 'gray'" :disabled="!canClaim" @click="handleClaim" type="button">一键领取</button>
        <button class="vip-record-btn" type="button" @click="openRecords">领取记录</button>
      </div>
    </div>

    <section class="vip-benefits" aria-label="当前等级专属权益">
      <div class="benefits-title">VIP{{ currentLevel }}会员，可享受以下专属权益</div>
      <div class="benefits-grid">
        <article v-for="benefit in currentBenefits" :key="benefit.title" class="benefit-card">
          <span class="benefit-icon" aria-hidden="true">{{ benefit.icon }}</span>
          <strong>{{ benefit.title }}</strong>
          <b>{{ formatAmount(benefit.value) }}元</b>
          <small>{{ benefit.status }}</small>
          <button type="button" :class="{ disabled: benefit.disabled }" :disabled="benefit.disabled" @click="benefit.action">{{ benefit.actionText }}</button>
        </article>
      </div>
    </section>

    <section class="vip-level-list" aria-label="各等级专属权益">
      <div v-for="item in vipLevels" :key="`benefits-${item.level}`" class="vip-level-row" :class="{ current: item.level === currentLevel }">
        <div class="vip-level-label">
          <div class="vip-badge-wrapper level-list-badge">
            <img :src="getBgIcon(item.level)" class="vip-outer-ring" />
            <div class="vip-badge-img-container">
              <img :src="getBadgeIcon(item.level)" class="vip-badge-img" />
              <span class="vip-level-num">{{ item.level }}</span>
            </div>
          </div>
          <span>VIP{{ item.level }}</span>
        </div>
        <div class="level-benefit-cell"><div class="benefit-main"><b>{{ formatAmount(item.upgradeBonus) }}元</b><span>晋级彩金</span></div><small>不可领取</small></div>
        <div class="level-benefit-cell"><div class="benefit-main"><b>{{ formatAmount(item.weeklyBonus) }}元</b><span>周礼金</span></div><small :class="{ active: item.level === currentLevel && weeklyCanClaim }">{{ item.level === currentLevel && weeklyCanClaim ? '领取' : '不可领取' }}</small></div>
        <div class="level-benefit-cell"><div class="benefit-main"><b>{{ formatAmount(item.monthlyBonus) }}元</b><span>月礼金</span></div><small>不可领取</small></div>
        <div class="level-benefit-cell"><div class="benefit-main"><b>—</b><span>年收益</span></div><small>未配置</small></div>
      </div>
    </section>

    <div class="vip-table-section">
      <div class="section-title">VIP等级对照表</div>
      
      <div class="table-body-wrapper">
        <div class="floating-arrow left" v-if="activeTableTab > 0" @click="activeTableTab--">
          <van-icon name="arrow-left" />
        </div>

        <van-tabs 
          v-model:active="activeTableTab" 
          animated 
          swipeable 
          color="#009688" 
          title-active-color="#009688"
          line-width="30px"
          line-height="3px"
        >
          <van-tab v-for="(tab, index) in tableTabs" :key="index" :title="tab">
            <div class="table-header">
              <div class="col-level">{{ index === 2 ? '档位' : '等级' }}</div>
              <template v-if="index === 0">
                <div class="col-data">每日提现总额<br><span class="sub">上限</span></div>
                <div class="col-data">每日提现次数<br><span class="sub">上限</span></div>
                <div class="col-data">每日免手续费<br><span class="sub">笔数</span></div>
              </template>
              <template v-if="index === 1">
                <div class="col-data">晋级再投注</div>
                <div class="col-data">晋级奖金</div>
              </template>
              <template v-if="index === 2">
                <div class="col-data">累计投注(≥)</div>
                <div class="col-data">奖励金额</div>
                <div class="col-data">领取次数</div>
              </template>
              <template v-if="index === 3">
                <div class="col-data">当月打码</div>
                <div class="col-data">月俸禄奖金</div>
              </template>
            </div>

            <div class="table-body">
              <div class="table-row" v-for="(item, rIndex) in (index === 0 ? vipPrivileges : index === 2 ? weeklySalaryTiers : vipLevels)" :key="rIndex" :ref="el => index !== 0 && index !== 2 && setRowRef(el, item.level)">
                <div class="col-level">
                  <template v-if="index === 2">{{ item.level }}</template>
                  <div v-else class="vip-badge-wrapper small">
                    <div v-if="currentLevel === item.level" class="current-level-mark">
                      <img src="/assets/img/img_vip_dqicon.svg" />
                    </div>
                    <img :src="getBgIcon(item.level)" class="vip-outer-ring" />
                    <div class="vip-badge-img-container">
                      <img :src="getBadgeIcon(item.level)" class="vip-badge-img" />
                      <span class="vip-level-num">{{ item.level }}</span>
                    </div>
                  </div>
                </div>

                <template v-if="index === 0">
                  <div class="col-data">{{ item.withdrawLimit }}</div>
                  <div class="col-data">{{ item.withdrawTimes }}</div>
                  <div class="col-data">{{ item.withdrawFree }}</div>
                </template>

                <template v-if="index === 1">
                  <div class="col-data w-progress" v-if="item.level === currentLevel + 1">
                    <div class="progress-bar-wrapper">
                      <div class="progress-bar" :class="{ 'no-progress': progress <= 0 }">
                         <div class="progress-fill" :style="{ width: progress + '%' }"></div>
                         <span class="progress-text">{{ formatAmount(currentBet) }}/{{ formatAmount(item.upgradeBet) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="col-data" v-else>{{ formatAmount(item.upgradeBet) }}</div>
                  <div class="col-data highlight">{{ formatAmount(item.upgradeBonus) }}</div>
                </template>

                <template v-if="index === 2">
                   <div class="col-data">{{ formatAmount(item.conditionMin) }}</div>
                   <div class="col-data highlight">{{ formatAmount(item.rewardAmount) }}</div>
                   <div class="col-data">{{ item.limitTimes }}</div>
                </template>

                <template v-if="index === 3">
                   <div class="col-data">{{ formatAmount(item.monthlyBet) }}</div>
                   <div class="col-data highlight">{{ formatAmount(item.monthlyBonus) }}</div>
                </template>
              </div>
            </div>
          </van-tab>
        </van-tabs>

        <div class="floating-arrow right" v-if="activeTableTab < tableTabs.length - 1" @click="activeTableTab++">
          <van-icon name="arrow" />
        </div>
      </div>
    </div>

     <div class="vip-rules">
       <div class="rules-title">VIP规则说明</div>
       <div class="rules-content">
         <p>1. 晋级标准：满足VIP晋级要求（即充值或有效投注都满足条件），即可晋级相应VIP等级，获得相应晋级奖金，如连续晋级多级，可获得全部等级晋级奖金，奖金实时可领取。</p>
         <p>2. 周俸禄：每周充值及有效投注满足当前等级周俸禄要求，可获得对应周俸禄奖金，如连续晋级多级，仅可获得当前等级周俸禄奖金，奖金实时可领取。</p>
         <p>3. 月俸禄：每月充值及有效投注满足当前等级月俸禄要求，可获得对应月俸禄奖金，如连续晋级多级，仅可获得当前等级月俸禄奖金，奖金实时可领取。</p>
         <p>4. 奖励过期时间：获得的奖金以优惠要求需手动领取</p>
         <p>5. 稽核说明：VIP所赠送的奖金需1倍流水（即稀核/打码或有效投注）才能提现，打码不限游戏平台</p>
         <p>6. 活动声明：本活动仅限账号本人进行正常游戏投注，禁止租借账号、无风险投注（如赌大/对刷/低倍刷水）、恶意复制、使用外挂程序、机器人、利用协议、漏洞、接口、群控或其他技术手段参与，一经稽核属实，本平台有权终止会员登陆、暂停会员使用网站以及没收奖金和不当盈利的权利，无需特别通知</p>
         <p>7. 解释说明：会员领取VIP奖励时，汇旺娱乐将默认会员同意且遵守对应条件等相关规定，为避免文字理解歧义，本平台保有本活动最终解释权。</p>
       </div>
     </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, showSuccessToast } from 'vant'
import { vipApi } from '@/api/vip'
import { activityApi } from '@/api/activity'

const router = useRouter()
const props = defineProps({ embedded: { type: Boolean, default: false } })

const currentLevel = ref(1)
const previewLevel = ref(1)
const needBet = ref(0)
const currentBet = ref(0)
const pendingReward = ref(0)
const canClaim = ref(false)
const weeklyCanClaim = ref(false)
const monthlyCanClaim = ref(false)
const progress = ref(0)
const loading = ref(true)
const refreshing = ref(false)

const tableTabs = ['VIP特权', '晋级奖金', '周薪', '月薪']
const activeTableTab = ref(1)

const vipLevels = ref([])
const vipPrivileges = ref([])
const weeklySalaryTiers = ref([])

const isApiSuccess = (res) => res && (res.code === 0 || res.code === 200)

const fetchVipPrivileges = async () => {
  vipPrivileges.value = []
  try {
    const res = await vipApi.getVipPrivileges()
    if (!isApiSuccess(res) || !Array.isArray(res.data)) return
    vipPrivileges.value = res.data.map(item => ({
      level: Number(item.levelId),
      withdrawLimit: Number(item.withdrawLimit) > 0 ? formatAmount(item.withdrawLimit) : '不限制',
      withdrawTimes: Number(item.withdrawTimes) > 0 ? `${item.withdrawTimes}次` : '不限制',
      withdrawFree: Number(item.freeWithdrawTimes) || 0
    }))
  } catch (e) {
    vipPrivileges.value = []
  }
}

const fetchWeeklySalaryTiers = async () => {
  weeklySalaryTiers.value = []
  try {
    const listRes = await activityApi.getActivityList()
    const activities = listRes?.data?.list
    if (!isApiSuccess(listRes) || !Array.isArray(activities)) return

    const activity = activities.find(item => item.type_code === 'weekly_salary')
    if (!activity) return

    const detailRes = await activityApi.getActivityDetail(activity.id)
    const rewards = detailRes?.data?.rewards
    if (!isApiSuccess(detailRes) || !Array.isArray(rewards)) return

    weeklySalaryTiers.value = rewards
      .filter(item => item.rewardType === 'weekly_salary')
      .map((item, index) => ({
        level: index + 1,
        conditionMin: Number(item.conditionMin) || 0,
        rewardAmount: Number(item.rewardAmount) || 0,
        limitTimes: Number(item.limitTimes) || 0
      }))
  } catch (e) {
    weeklySalaryTiers.value = []
  }
}

const fetchLevelConfigs = async () => {
  try {
    const res = await vipApi.getLevelConfigs()
    if (isApiSuccess(res) && res.data) {
      vipLevels.value = res.data.map((item, index) => ({
        level: index + 1,
        levelId: item.levelId,
        levelName: item.levelName,
        withdrawLimit: item.withdrawLimit > 0 ? formatAmount(item.withdrawLimit) : '不限制',
        withdrawTimes: item.withdrawTimes > 0 ? item.withdrawTimes + '次' : '不限制',
        withdrawFree: item.freeWithdrawTimes || 0,
        upgradeBet: item.cumulativeRequired || 0,
        upgradeBonus: item.rewardAmount || 0,
        weeklyBet: item.weeklyBetting || 0,
        weeklyBonus: item.weeklyBonus || 0,
        monthlyBet: 0,
        monthlyBonus: 0,
      }))
    }
  } catch (e) {
  }
}

const fetchRewardInfo = async () => {
  try {
    const res = await vipApi.getRewardInfo()
    if (isApiSuccess(res) && res.data) {
      const d = res.data
      currentLevel.value = Number(d.currentLevelId) || 1
      previewLevel.value = Number(d.currentLevelId) || 1
      pendingReward.value = Number(d.rewardAmount) || 0
      canClaim.value = d.canClaim || false
      weeklyCanClaim.value = Boolean(d.weeklyCanClaim)
      monthlyCanClaim.value = false
      progress.value = d.progress || 0
      currentBet.value = Number(d.totalBetting) || 0

      const nextLevelData = vipLevels.value.find(v => v.level === currentLevel.value + 1)
      if (nextLevelData) {
        needBet.value = Math.max(0, nextLevelData.upgradeBet - currentBet.value)
      }
    }
  } catch (e) {
  }
}

const handleClaim = async () => {
  if (!canClaim.value) return
  const toast = showLoadingToast({ message: '领取中...', forbidClick: true, duration: 0 })
  try {
    const res = await vipApi.claimReward()
    toast.close()
    if (isApiSuccess(res)) {
      showSuccessToast(`领取成功！${res.data?.amount || 0}`)
      fetchRewardInfo()
    } else {
      showToast(res?.msg || res?.message || '领取失败')
    }
  } catch (e) {
    toast.close()
    showToast(e?.message || '领取失败，请稍后重试')
  }
}

const openRecords = () => {
  router.push('/reward-record')
}

const getLevelData = (level) => {
  return vipLevels.value.find(item => item.level === level) || {}
}

const handlePeriodicClaim = async (period) => {
  if (period === 'monthly') {
    showToast('月薪暂未开放')
    return
  }
  const canClaimPeriod = period === 'weekly' ? weeklyCanClaim.value : monthlyCanClaim.value
  const level = getLevelData(currentLevel.value)
  const amount = period === 'weekly' ? Number(level.weeklyBonus || 0) : Number(level.monthlyBonus || 0)
  if (!canClaimPeriod || amount <= 0) {
    showToast(period === 'weekly' ? '当前等级暂无可领取的周礼金' : '当前等级暂无可领取的月礼金')
    return
  }
  const toast = showLoadingToast({ message: '领取中...', forbidClick: true, duration: 0 })
  try {
    const res = await vipApi.claimPeriodicReward(period)
    toast.close()
    if (isApiSuccess(res)) {
      showSuccessToast(`领取成功！${res.data?.amount || 0}`)
      await fetchRewardInfo()
    } else {
      showToast(res?.msg || res?.message || '领取失败')
    }
  } catch (e) {
    toast.close()
    showToast(e?.message || '领取失败，请稍后重试')
  }
}

const currentBenefits = computed(() => {
  const level = getLevelData(currentLevel.value)
  const canClaimWeekly = weeklyCanClaim.value && Number(level.weeklyBonus || 0) > 0
  const canClaimMonthly = false
  return [
    { title: '晋级彩金', icon: '¥', value: level.upgradeBonus || 0, status: '不可领取', actionText: '不可领取', disabled: true, action: () => {} },
    // 后端目前仅提供晋级奖励领取接口，周礼金没有独立领取接口，不能复用晋级奖励接口。
    { title: '周礼金', icon: '▣', value: level.weeklyBonus || 0, status: canClaimWeekly ? '当前等级可领取' : '本周期不可领取', actionText: canClaimWeekly ? '领取' : '不可领取', disabled: !canClaimWeekly, action: () => handlePeriodicClaim('weekly') },
    { title: '月礼金', icon: '♜', value: 0, status: '暂未开放', actionText: '不可领取', disabled: true, action: () => handlePeriodicClaim('monthly') },
    { title: '年收益', icon: '年', value: 0, status: '后端暂未配置', actionText: '暂未开放', disabled: true, action: () => {} }
  ]
})

const handleRefresh = async () => {
  if (refreshing.value) return
  refreshing.value = true
  showToast({ message: '刷新中...', duration: 800 })
  try {
    await fetchRewardInfo()
    showSuccessToast('刷新成功')
  } catch (e) {
    showToast('刷新失败')
  } finally {
    setTimeout(() => { refreshing.value = false }, 600)
  }
}

const rowRefs = ref({})
const setRowRef = (el, level) => {
  if (el) rowRefs.value[level] = el
}

const scrollToCurrentLevel = () => {
  nextTick(() => {
    const nextLevel = currentLevel.value + 1
    const row = rowRefs.value[nextLevel] || rowRefs.value[currentLevel.value]
    if (row) {
      row.scrollIntoView({ block: 'center' })
    }
  })
}

const getBgIcon = (level) => {
  if (level >= 10) return '/assets/img/color10.avif'
  return `/assets/img/color${level}.avif`
}

const getBadgeIcon = (level) => {
  if (level >= 10) return '/assets/img/img_dj10.avif'
  return `/assets/img/img_dj${level - 1}.avif`
}

const formatAmount = (num) => {
  if (!num) return '0.00'
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const getProgress = (item) => {
  if (!item.upgradeBet) return 0
  return Math.min((currentBet.value / item.upgradeBet) * 100, 100)
}

const loadData = async () => {
  loading.value = true
  await Promise.all([fetchLevelConfigs(), fetchVipPrivileges(), fetchWeeklySalaryTiers()])
  await fetchRewardInfo()
  loading.value = false
}

onMounted(() => {
  loadData()
})

onActivated(() => {
  loadData()
})
</script>

<style scoped>
.tab-vip {
  flex: 1;
  overflow-y: auto;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  background: #1c1c1c;
  padding: 18px 0 36px;
}
.tab-vip.embedded {
  padding-top: 0;
  background: #191919;
}
.tab-vip.embedded .vip-hero {
  display: none;
}

.vip-header-card {
  max-width: 980px;
  margin: 0 auto 18px;
  background: linear-gradient(180deg, #171717 0%, #070707 100%);
  border: 1px solid #40351f;
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.28);
  padding: 18px 22px 16px;
  position: relative;
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr) 92px auto;
  align-items: center;
  gap: 14px;
}
.current-level-tag {
  position: absolute;
  /* VIP 内容嵌入首页滚动容器，不能再向卡片外溢出，否则会被滚动容器裁剪。 */
  top: 0;
  left: 0;
  background: #ee514f;
  color: #fff;
  font-size: 11px;
  padding: 2px 6px;
  border-top-left-radius: 10px;
  border-bottom-right-radius: 10px;
  z-index: 2;
}
.level-switcher {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  position: relative;
}
.vip-level-node { display: flex; flex-direction: column; align-items: center; gap: 3px; color: #f2f2f2; }
.vip-level-node strong { font-size: 15px; font-weight: 700; }
.current-node { color: #f0d389; }
.next-node { color: #d8d8d8; }
.switch-btn-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
}
.switch-btn {
  color: #ccc;
  font-size: 16px;
  cursor: pointer;
  background: rgba(0,0,0,0.05);
  border-radius: 50%;
  padding: 2px;
}
.vip-badge-wrapper {
  position: relative;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 5px;
}
.vip-badge-wrapper.small {
  width: 40px;
  height: 40px;
  margin-left: 12px;
}

.current-level-mark {
  position: absolute;
  top: 0;
  left: -22px;
  background: #04BE02;
  border-radius: 2px;
  width: 18px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
.current-level-mark img {
  width: 10px;
  height: 10px;
  display: block;
}

.vip-outer-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  object-fit: contain;
}

.vip-badge-img-container {
  position: relative;
  width: 75%;
  height: 75%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.vip-badge-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.vip-level-num {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  font-family: 'Arial', sans-serif;
}
.vip-badge-wrapper.small .vip-level-num {
  font-size: 12px;
}

.vip-status { min-width: 0; display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
.status-text { font-size: 13px; color: #b3b3b3; margin-bottom: 4px; white-space: nowrap; }
.next-level { color: #e24b45; font-weight: bold; font-style: italic; margin-left: 4px; }
.preview-title { color: #e4c775; font-weight: bold; }
.status-sub { font-size: 12px; color: #999; display: flex; align-items: center; flex-wrap: wrap; }
.status-sub .amount { color: #e3bd63; font-weight: bold; margin: 0 4px; }
.vip-progress-track { position: relative; width: 100%; height: 18px; margin: 5px 0 3px; overflow: hidden; background: linear-gradient(180deg, #f6f6f6, #ddd); border-radius: 10px; box-shadow: inset 0 1px 3px rgba(0,0,0,.22); }
.vip-progress-fill { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #f7c65e, #fff0ae); transition: width .35s ease; }
.refresh-icon { 
  width: 16px; 
  height: 16px; 
  margin-left: 5px; 
  cursor: pointer;
  transition: transform 0.3s;
  display: inline-block;
  background-color: #c69b48;
  -webkit-mask: url('/assets/img/comm_icon_retry.svg') no-repeat center / contain;
  mask: url('/assets/img/comm_icon_retry.svg') no-repeat center / contain;
}
.refresh-icon:active { transform: scale(0.9); }
.refresh-icon.spinning {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.vip-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 5px;
}
.vip-claim-btn {
  border: none;
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
}
.vip-claim-btn.gray { background: #777; color: #fff; pointer-events: none; cursor: not-allowed; }
.vip-claim-btn.green { background: linear-gradient(135deg, #b98b38, #73521f); color: #ffe7a4; }
.vip-record-btn {
  font-size: 11px;
  padding: 4px 12px;
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  background: linear-gradient(135deg, #178f76, #0c6555);
  color: #e4fff6;
  border: 1px solid #299e85;
}
.vip-record-btn:hover { background: #1f8a68; }

.vip-table-section { width: min(1040px, calc(100% - 24px)); max-width: 1040px; margin: 0 auto; }
.section-title { text-align: center; font-size: 17px; color: #e4c775; margin: 0; padding: 13px 0 12px; border-bottom: 1px solid #4b3d22; }

.table-body-wrapper {
  position: relative;
}

:deep(.van-tabs__content) {
  background: #272727;
}
:deep(.van-tabs__wrap) {
  border-bottom: 1px solid #454545;
  margin-bottom: 0;
  background: #272727;
}
:deep(.van-tab) { color: #c0c0c0; font-size: 14px; }
:deep(.van-tab--active) { color: #f1d58b; background: linear-gradient(180deg, #c99b42, #9d712c); }
:deep(.van-tabs__line) { background: #f0d27d !important; }

.floating-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.72);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  font-size: 18px;
  z-index: 100;
  transition: background 0.3s;
}
.floating-arrow:hover { background: rgba(0, 0, 0, 0.6); }
.floating-arrow.left { left: 5px; }
.floating-arrow.right { right: 5px; }

.table-header, .table-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  text-align: center;
  font-size: 12px;
}
.table-header { background: #3b2c16; color: #e8d39b; font-weight: 500; }
.table-header .sub { font-size: 10px; color: #a8905f; font-weight: normal; }
.table-row { border-bottom: 1px solid #454545; height: 50px; background: #272727; }

.col-level { width: 80px; flex-shrink: 0; display: flex; justify-content: center; align-items: center; }

.col-data { flex: 1; color: #c7c7c7; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.col-data.highlight { color: #e4bd64; }

.w-progress { flex: 1; }
.progress-bar-wrapper { width: 100%; max-width: 130px; }
.progress-bar {
  position: relative;
  height: 20px;
  background: #505050;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
}
.progress-bar.no-progress {
  background: #424242;
}
.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #f7971e, #ffd200);
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(247, 151, 30, 0.4);
}
.progress-text {
  position: relative;
  z-index: 1;
  font-size: 10px;
  color: #eee;
  font-weight: 600;
  white-space: nowrap;
  text-shadow: 0 0 2px rgba(255,255,255,0.8);
}

.vip-rules { width: min(1040px, calc(100% - 24px)); max-width: 1040px; margin: 18px auto 0; padding: 20px 24px; box-sizing: border-box; color: #aaa; background: #242424; border: 1px solid #454545; }
.rules-title { color: #e4c775; font-size: 16px; margin-bottom: 12px; }
.rules-content p { font-size: 12px; line-height: 1.8; margin-bottom: 8px; text-align: justify; }

.vip-hero {
  width: min(1080px, calc(100% - 24px));
  max-width: 1080px;
  min-height: 210px;
  margin: 0 auto 18px;
  padding: 0 74px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 42px;
  overflow: hidden;
  position: relative;
  isolation: isolate;
  background:
    radial-gradient(circle at 18% 38%, rgba(201, 139, 49, .28), transparent 26%),
    radial-gradient(circle at 68% 108%, rgba(112, 69, 20, .26), transparent 43%),
    linear-gradient(112deg, #292929 0%, #111 56%, #050505 100%);
  border-bottom: 1px solid #4b3b1d;
  box-shadow: inset 0 -18px 40px rgba(0,0,0,.34), 0 8px 26px rgba(0,0,0,.3);
}
.vip-hero::before,
.vip-hero::after {
  content: '';
  position: absolute;
  pointer-events: none;
  z-index: -1;
  border: 1px solid rgba(227, 181, 82, .18);
  transform: rotate(28deg);
}
.vip-hero::before { width: 310px; height: 310px; left: -160px; top: -140px; border-radius: 42%; }
.vip-hero::after { width: 420px; height: 420px; right: -190px; bottom: -280px; border-radius: 45%; }
.vip-hero-mark {
  width: 210px;
  flex: 0 0 210px;
  color: transparent;
  font: 900 176px/1 Arial, sans-serif;
  letter-spacing: -28px;
  text-align: center;
  transform: skew(-8deg);
  background: linear-gradient(155deg, #fff6c9 2%, #dfaf46 46%, #77501c 86%);
  -webkit-background-clip: text;
  background-clip: text;
  filter: drop-shadow(10px 10px 0 rgba(0,0,0,.42));
  opacity: .96;
}
.vip-hero-copy { display: flex; flex-direction: column; gap: 14px; position: relative; z-index: 1; }
.vip-hero-copy span { color: #bdbdbd; font-size: 21px; letter-spacing: 2px; }
.vip-hero-copy strong { color: #f4f4f4; font-size: 38px; letter-spacing: 5px; font-weight: 700; text-shadow: 0 2px 8px rgba(0,0,0,.7); }
.vip-hero-copy strong em { color: #f5c84d; font-style: normal; }

.vip-benefits {
  width: min(1040px, calc(100% - 24px));
  max-width: 1040px;
  margin: 0 auto 18px;
  padding: 0 0 14px;
  background: #050505;
  border: 1px solid #3f321d;
  box-shadow: 0 8px 22px rgba(0,0,0,.23);
}
.benefits-title {
  width: min(86%, 720px);
  margin: 0 auto 14px;
  padding: 10px 20px;
  text-align: center;
  color: #22190c;
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(90deg, #c18d3d, #f3d890 50%, #c18d3d);
  border-radius: 0 0 22px 22px;
  box-shadow: 0 3px 8px rgba(0,0,0,.32);
}
.benefits-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 0 14px; }
.benefit-card {
  min-height: 178px;
  padding: 14px 10px 12px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  flex-direction: column;
  color: #4b4b4b;
  background: linear-gradient(180deg, #fafafa, #e8e8e8);
  border-radius: 3px;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.7), 0 4px 10px rgba(0,0,0,.22);
}
.benefit-icon {
  width: 34px;
  height: 34px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bd7e24;
  font-size: 22px;
  font-weight: 800;
  border: 2px solid #bd7e24;
  border-radius: 50%;
}
.benefit-card strong { font-size: 13px; color: #404040; }
.benefit-card b { margin: 7px 0 2px; color: #e88725; font-size: 22px; line-height: 1; }
.benefit-card small { min-height: 17px; color: #999; font-size: 11px; }
.benefit-card button {
  min-width: 74px;
  margin-top: 8px;
  padding: 5px 12px;
  border: 0;
  border-radius: 3px;
  color: #fff;
  font-size: 11px;
  background: linear-gradient(90deg, #f09a32, #dc741f);
  cursor: pointer;
}
.benefit-card button.disabled,
.benefit-card button:disabled { color: #fff; background: #b8b8b8; cursor: not-allowed; }

.vip-level-list {
  width: min(1040px, calc(100% - 24px));
  max-width: 1040px;
  margin: 0 auto 18px;
  padding: 10px 14px 5px;
  box-sizing: border-box;
  background: #050505;
  border-top: 1px solid #3f321d;
  border-bottom: 1px solid #3f321d;
}
.vip-level-row {
  min-height: 104px;
  display: grid;
  grid-template-columns: 126px repeat(4, minmax(0, 1fr));
  align-items: center;
  gap: 12px;
  border-bottom: 1px dashed #8b8b8b;
}
.vip-level-row:last-child { border-bottom: 0; }
.vip-level-row.current { background: linear-gradient(90deg, rgba(207, 156, 58, .18), transparent 34%); }
.vip-level-label { display: flex; flex-direction: column; align-items: center; gap: 4px; color: #c5c5c5; font-size: 12px; font-weight: 600; }
.level-list-badge { width: 68px; height: 68px; margin: 0; }
.level-list-badge .vip-level-num { font-size: 14px; }
.level-benefit-cell {
  min-height: 76px;
  display: flex;
  align-items: stretch;
  flex-direction: row;
  justify-content: space-between;
  overflow: hidden;
  border-radius: 6px;
  background: #f5f5f5;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.65), 0 2px 5px rgba(0,0,0,.18);
  color: #555;
}
.benefit-main { flex: 1; min-width: 0; display: flex; align-items: center; flex-direction: column; justify-content: center; padding: 4px 6px; }
.level-benefit-cell b { color: #f18443; font-size: 21px; font-weight: 500; line-height: 1.2; }
.level-benefit-cell span { margin-top: 5px; font-size: 16px; color: #454545; white-space: nowrap; }
.level-benefit-cell small {
  width: 34px;
  min-width: 34px;
  margin-top: 0;
  padding: 8px 3px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  line-height: 1.15;
  writing-mode: vertical-rl;
  letter-spacing: 1px;
  text-align: center;
  background: #999;
  border-radius: 0 6px 6px 0;
}
.level-benefit-cell small.active { background: #ff8c4d; }

@media (max-width: 700px) {
  .tab-vip { padding-top: 10px; }
  .vip-hero { min-height: 150px; padding: 0 18px; gap: 15px; }
  .vip-hero-mark { width: 120px; flex-basis: 120px; font-size: 116px; }
  .vip-hero-copy span { font-size: 13px; }
  .vip-hero-copy strong { font-size: 24px; letter-spacing: 2px; }
  .vip-header-card { margin: 0 12px 14px; padding: 15px 10px; grid-template-columns: 58px minmax(0, 1fr) 58px; gap: 7px; }
  .vip-header-card .vip-actions { grid-column: 1 / -1; flex-direction: row; justify-content: center; margin: 4px 0 0; }
  .vip-header-card .vip-badge-wrapper { width: 50px; height: 50px; }
  .vip-level-node strong { font-size: 12px; }
  .status-text { font-size: 11px; white-space: normal; line-height: 1.4; }
  .vip-progress-track { height: 12px; }
  .vip-benefits, .vip-level-list, .vip-table-section, .vip-rules { width: calc(100% - 24px); margin-left: 12px; margin-right: 12px; }
  .benefits-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 0 8px; }
  .vip-level-list { overflow-x: auto; padding: 8px; }
  .vip-level-row { min-width: 700px; min-height: 96px; }
  .level-list-badge { width: 60px; height: 60px; }
  .level-benefit-cell span { font-size: 14px; }
  .level-benefit-cell b { font-size: 19px; }
  .level-benefit-cell small { width: 32px; min-width: 32px; font-size: 13px; }
  .vip-rules { padding: 16px; }
}
</style>
