

export default [
  {
    path: '/activity',
    name: 'ActivityIndex',
    component: () => import('@/views/activity/ActivityIndexNew.vue'),
    meta: { title: '活动中心', tabIndex: 0 }
  },
  {
    path: '/vip',
    name: 'VipCenter',
    component: () => import('@/views/activity/ActivityIndexNew.vue'),
    // VIP权益包含会员等级、投注进度及可领取奖励，仅允许登录用户访问。
    // /pc/vip 是通过设备路由别名映射到本路由的，同样会经过全局登录守卫。
    meta: { title: 'VIP中心', tabIndex: 1, requiresAuth: true }
  },
  {
    path: '/cashback',
    name: 'Cashback',
    component: () => import('@/views/activity/ActivityIndexNew.vue'),
    meta: { title: '返水', tabIndex: 2 }
  },
  {
    path: '/pending',
    name: 'PendingReward',
    component: () => import('@/views/activity/ActivityIndexNew.vue'),
    meta: { title: '待领取', tabIndex: 3 }
  },
  {
    path: '/interest',
    name: 'InterestTreasure',
    component: () => import('@/views/activity/ActivityIndexNew.vue'),
    meta: { title: '利息宝', tabIndex: 4 }
  },
  {
    path: '/reward-record',
    name: 'RewardRecord',
    component: () => import('@/views/activity/ActivityIndexNew.vue'),
    meta: { title: '领取记录', tabIndex: 5 }
  },
  {
    path: '/activity/detail/:id',
    name: 'ActivityDetail',
    component: () => import('@/views/activity/ActivityDetailNew.vue'),
    meta: { title: '活动详情' }
  },

  {
    path: '/activity/lucky-order/:id',
    name: 'LuckyOrderActivity',
    component: () => import('@/views/activity/LuckyOrderActivity.vue'),
    meta: { title: '幸运注单' }
  },
  {
    path: '/activity/loss-rescue/:id',
    name: 'LossRescueActivity',
    component: () => import('@/views/activity/LossRescueActivity.vue'),
    meta: { title: '亏损救援金' }
  },
  {
    path: '/activity/weekly-salary/:id',
    name: 'WeeklySalaryActivity',
    component: () => import('@/views/activity/WeeklySalaryActivity.vue'),
    meta: { title: '周俸禄' }
  },
  {
    path: '/activity/pg-betting-king/:id',
    name: 'PgBettingKingActivity',
    component: () => import('@/views/activity/PgBettingKingActivity.vue'),
    meta: { title: 'PG打码王' }
  },
  {
    path: '/activity/first-deposit/:id',
    name: 'FirstDepositActivity',
    component: () => import('@/views/activity/FirstDepositActivity.vue'),
    meta: { title: '首存彩金' }
  },
  {
    path: '/activity/deposit-bonus/:id',
    name: 'DepositBonusActivity',
    component: () => import('@/views/activity/DepositBonusActivity.vue'),
    meta: { title: '充值奖励' }
  },

  {
    path: '/activity/reward/:id',
    name: 'ActivityReward',
    component: () => import('@/views/activity/ActivityRewardDetail.vue'),
    meta: { title: '活动奖励' }
  },

  // 旧路径兼容（必须放在 ActivityUnknown 之前）
  { path: '/activity/everydayplus', redirect: '/activity' },
  { path: '/activity/daily-bonus', redirect: '/activity' },
  { path: '/activity/daily-first-deposit', redirect: '/activity' },
  { path: '/activity/bank-transfer', redirect: '/activity' },
  { path: '/activity/lucky-first', redirect: '/activity' },
  { path: '/activity/lucky-credit', redirect: '/activity' },
  { path: '/activity/recommend-app', redirect: '/activity' },
  { path: '/activity/welcome/:id', redirect: (to) => `/activity/detail/${to.params.id}` },
  { path: '/activity/activitylist1', redirect: '/activity/detail/1' },
  { path: '/activity/activitylist2', redirect: '/activity/detail/2' },
  { path: '/activity/activitylist3', redirect: '/activity/detail/3' },
  { path: '/activity/activitylist4', redirect: '/activity/detail/4' },
  { path: '/activity/activitylist5', redirect: '/activity/detail/5' },

  // 未知 /activity/* 不再落到全局 NotFound→首页，尽量留在优惠域内
  {
    path: '/activity/:pathMatch(.*)*',
    name: 'ActivityUnknown',
    redirect: (to) => {
      const segments = String(to.path || '')
        .split('/')
        .filter(Boolean)
      const last = segments[segments.length - 1]
      if (/^\d+$/.test(last)) {
        return { path: `/activity/detail/${last}`, query: to.query, hash: to.hash }
      }
      return { path: '/activity', query: to.query, hash: to.hash }
    }
  }
]
