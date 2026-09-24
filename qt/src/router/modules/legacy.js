

export default [

  { path: '/lotteryMore', redirect: '/lottery/hall' },
  { path: '/lotteryAllhemai', redirect: '/lottery/hall/hemai' },
  { path: '/game/signin', redirect: '/lottery/signin' },
  { path: '/game/details/:id?', redirect: '/lottery/details' },
  { path: '/trend/:type?', redirect: '/lottery/trend' },
  

  { 
    path: '/ssc/:code?', 
    redirect: to => ({ 
      name: 'LotterySsc', 
      params: to.params,
      query: to.query 
    })
  },
  { 
    path: '/x5/:code?', 
    redirect: to => ({ 
      name: 'LotteryX5', 
      params: to.params,
      query: to.query 
    })
  },
  

  { 
    path: '/pk10/:code?', 
    redirect: to => ({ 
      name: 'LotteryPk10', 
      params: to.params,
      query: to.query 
    })
  },
  { path: '/lottery/pk10-anim/:code?', redirect: '/lottery/pk10-animal' },
  { path: '/odd/pk10/:code?', redirect: '/lottery/pk10' },
  

  { path: '/game/fc3d/', redirect: '/lottery/fc3d' },
  { path: '/game/fc3d/:code?', redirect: '/lottery/fc3d' },
  

  

  { path: '/lotterys_hot/lhc/:code/:mode', redirect: '/lottery/lhc' },
  

  { 
    path: '/lotterys_hot/ssc/:code/:mode',
    redirect: to => ({ 
      name: 'LotterySsc', 
      params: { code: to.params.code },
      query: { mode: 'double' }
    })
  },
  { 
    path: '/lotterys_hot/pk10/:code/:mode',
    redirect: to => ({ 
      name: 'LotteryPk10', 
      params: { code: to.params.code },
      query: { mode: 'double' }
    })
  },
  { 
    path: '/lotterys_hot/x5/:code/:mode',
    redirect: to => ({ 
      name: 'LotteryX5', 
      params: { code: to.params.code },
      query: { mode: 'double' }
    })
  },
  { 
    path: '/lotterys_hot/k3/:code/:mode',
    redirect: '/lottery/k3-double'
  },
  

  { path: '/userCenter/betRecord', redirect: '/member/history' },
  { path: '/userCenter/betRecords/:itemselect/:atime', redirect: '/member/history' },
  { path: '/invite', redirect: '/member/invite' },
  

  { path: '/withdraw', redirect: '/payment/withdraw' },
  { path: '/userCenter/withdrawals', redirect: '/payment/withdraw' },
  { path: '/recharge', redirect: '/payment/deposit' },
  { path: '/userCenter/rechargeWay', redirect: '/payment/deposit' },
  { path: '/userCenter/normalPayBank', redirect: '/payment/deposit' },
  { path: '/userCenter/zfbPay', redirect: '/payment/deposit' },
  { path: '/userCenter/wxPay', redirect: '/payment/deposit' },
  { path: '/payment/crypto', redirect: '/payment/deposit' },
  { path: '/payment/recharge', redirect: '/payment/deposit' },
  { path: '/payment/recharge/crypto', redirect: '/payment/deposit' },
  { path: '/payment/recharge/bank', redirect: '/payment/deposit' },
  { path: '/payment/recharge/alipay', redirect: '/payment/deposit' },
  { path: '/payment/recharge/wechat', redirect: '/payment/deposit' },
  { path: '/deposit', redirect: '/payment/deposit' },
  

  { path: '/trans', redirect: '/account/transfer' },
  { path: '/userCenter/trans', redirect: '/account/transfer' },
  { path: '/userCenter/user-transfer', redirect: '/account/user-transfer' },
  { path: '/fanshui', redirect: '/account/fanshui' },
  { path: '/today-stats', redirect: '/account/today-stats' },
  { path: '/userCenter/billRecord', redirect: '/account/bill' },
  { path: '/userCenter/PLstatement', redirect: '/account/today-stats' },
  { path: '/account/report', redirect: '/account/today-stats' },
  

  { path: '/yue-bao-center', redirect: '/interest' },
  { path: '/yue-bao/transfer-out', redirect: '/interest' },
  { path: '/yue-bao/transfer-in', redirect: '/interest' },
  { path: '/yue-bao/service', redirect: '/service/online' },
  { path: '/yue-bao/help', redirect: '/help' },
  { path: '/yue-bao/:pathMatch(.*)*', redirect: '/interest' },
  { path: '/yebCenter/:pathMatch(.*)*', redirect: '/interest' },
  { path: '/yuebao/:pathMatch(.*)*', redirect: '/interest' },
  

  { path: '/service/chat', redirect: '/service/online' },
  { path: '/userCenter/help', redirect: '/help' },
  { path: '/userCenter/notice', redirect: '/notice' },
  { path: '/userCenter/noticeDetail/:id', redirect: '/notice/:id' }
]
