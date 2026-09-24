<template>
  <div class="rebate-ratio-tab">
    <div class="ratio-table-card">
      <div class="ratio-table-scroll">
        <table class="ratio-table">
          <colgroup>
            <col style="width: 18%" />
            <col style="width: 28%" />
            <col style="width: 26%" />
            <col style="width: 28%" />
          </colgroup>
          <thead>
            <tr>
              <th>活动对象</th>
              <th>当月下级盈利</th>
              <th>
                有效人数
                <van-icon name="question-o" @click="showTip" />
              </th>
              <th>返还百分比</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in ratioRows" :key="item.id">
              <td v-if="index === 0" class="agent-scope" :rowspan="ratioRows.length">全部代理</td>
              <td>{{ formatNumber(item.performance) }}</td>
              <td>{{ item.effectiveCount }}</td>
              <td class="rate-cell">{{ formatRate(item.rate) }}</td>
            </tr>
            <tr v-if="!ratioRows.length">
              <td colspan="4" class="empty-row">暂无返佣档位</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <section class="rebate-notice" aria-label="返佣活动说明">
      <p class="notice-example"><strong>范例：</strong>代理人下级人数总10人，且上月总下级负盈利为15万元，本月1-5号即可联系APP专员领取返佣金</p>
      <p class="notice-warning"><strong>注：</strong>参与本活动需先向APP专员进行申请登记，否则无效。<br />（APP专员ID联系客服获取）</p>
      <h3 class="notice-title"><span>◀</span> 活动细则 <span>▶</span></h3>
      <ol class="notice-list">
        <li><strong>有效会员定义：</strong>当月存款次数3次以上，累计存款金额达500，有效投注达到3000，无需流水即可提现。</li>
        <li>推荐下级必须真实有效，若上下级同IP多账号，虚假注册将取消资格，推荐人不能成为本身下级。</li>
        <li>推荐人以及被推荐人需完成收款方式绑定。</li>
        <li>账号仅限本人使用，同IP多账号，对刷套利等手段不可参与本活动。</li>
        <li>为避免文字差异，我司保留最终解释权。</li>
      </ol>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast } from 'vant'
import { agentApi } from '@/api/agent'

const ratioList = ref([])

const ratioRows = computed(() => ratioList.value.map((item, index) => ({
  id: item.id || `ratio-${index}`,
  effectiveCount: item.effectiveCount ?? item.effective_count ?? 0,
  performance: item.performance ?? item.monthlyPerformance ?? 0,
  rate: item.rate ?? item.rebateRate ?? 0
})))

const formatNumber = (num) => {
  if (num === undefined || num === null) return '0.00'
  return parseFloat(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatRate = (rate) => `${parseFloat(rate || 0).toFixed(2).replace(/\.00$/, '')}%`

const showTip = () => {
  showToast({
    message: '有效的条件：该下级充值金额 ≥ 100，并且有效投注 ≥ 100',
    duration: 3000
  })
}

const fetchRatioList = async () => {
  try {
    const res = await agentApi.getCommissionRates()
    if (res.code === 0 && res.data) {
      ratioList.value = res.data.list || []
    }
  } catch (e) {
  }
}

onMounted(() => {
  fetchRatioList()
})
</script>

<style scoped>
.rebate-ratio-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ratio-table-card {
  overflow: hidden;
  border: 1px solid #8b7548;
  border-radius: 16px;
  background: #292929;
}

.ratio-table-scroll {
  overflow-x: auto;
}

.ratio-table {
  width: 100%;
  min-width: 560px;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  color: #f5f5f5;
}

.ratio-table th,
.ratio-table td {
  border-right: 1px solid rgba(217, 184, 102, .45);
  border-bottom: 1px solid rgba(217, 184, 102, .45);
  text-align: center;
}

.ratio-table th:last-child,
.ratio-table td:last-child {
  border-right: 0;
}

.ratio-table thead th {
  height: 48px;
  padding: 0 8px;
  color: #29200f;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(180deg, #ffd873, #edaa24);
}

.ratio-table thead th:first-child {
  border-top-left-radius: 15px;
}

.ratio-table thead th:last-child {
  border-top-right-radius: 15px;
}

.ratio-table thead .van-icon {
  margin-left: 3px;
  color: #6b4a10;
  vertical-align: middle;
}

.ratio-table tbody td {
  height: 39px;
  padding: 0 8px;
  color: #f1f1f1;
  font-size: 15px;
  background: #292929;
}

.ratio-table tbody tr:nth-child(even) td:not(.agent-scope) {
  background: #474747;
}

.ratio-table tbody tr:last-child td {
  border-bottom: 0;
}

.ratio-table td.agent-scope {
  width: 18%;
  color: #f1f1f1;
  font-size: 16px;
  background: #292929;
}

.ratio-table td.rate-cell {
  color: #fff;
  font-weight: 500;
}

.ratio-table .empty-row {
  height: 80px;
  color: #aaa;
}

.rebate-notice {
  padding: 14px 18px 16px;
  border: 1px solid rgba(139, 117, 72, .72);
  border-radius: 12px;
  color: #f1f1f1;
  font-size: 14px;
  line-height: 1.65;
  background: #050505;
}

.rebate-notice p {
  margin: 0;
}

.notice-example {
  color: #f3f3f3;
}

.notice-example strong,
.notice-title {
  color: #f6d23d;
}

.notice-warning {
  margin-top: 2px !important;
  color: #ed2024;
}

.notice-title {
  margin: 13px 0 8px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  text-align: center;
}

.notice-title span {
  color: #d86f36;
  font-size: 14px;
}

.notice-list {
  margin: 0;
  padding-left: 24px;
}

.notice-list li {
  padding-left: 2px;
}

.notice-list li + li {
  margin-top: 2px;
}

.notice-list li:first-child {
  color: #ed2024;
}

.notice-list li:first-child strong {
  font-weight: 400;
}


.result-row .label {
  color: #999;
}

.result-row .value {
  color: #333;
}

.result-row .value.green {
  color: #26A17B;
  font-weight: 600;
}
</style>
