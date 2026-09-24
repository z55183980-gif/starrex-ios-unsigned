
export default [
  {
    path: '/yue-bao-center',
    name: 'YueBaoCenter',
    redirect: '/interest'
  },
  {
    path: '/yue-bao/transfer-out',
    name: 'YueBaoTransferOut',
    redirect: '/interest'
  },
  {
    path: '/yue-bao/transfer-in',
    name: 'YueBaoTransferIn',
    redirect: '/interest'
  },
  {
    path: '/yue-bao/service',
    name: 'YueBaoService',
    redirect: '/service/online'
  },

  {
    path: '/service',
    redirect: '/service/online'
  },
  {
    path: '/service/online',
    name: 'ServiceOnline',
    component: () => import('@/views/service/Chat.vue'),
    meta: { title: '在线客服' }
  },
  {
    path: '/service/chat',
    name: 'ServiceChat',
    redirect: '/service/online'
  },

  {
    path: '/help',
    name: 'HelpCenter',
    component: () => import('@/views/userCenter/HelpCenter.vue'),
    meta: { title: '帮助中心' }
  },

  {
    path: '/notice',
    name: 'NoticeCenter',
    component: () => import('@/views/other/MessageCenter.vue'),
    meta: { title: '消息中心' }
  },
  {
    path: '/notice/:id',
    name: 'NoticeDetail',
    component: () => import('@/views/other/NoticeDetail.vue'),
    meta: { title: '公告详情' }
  },

  // 跑马灯已并入公告管理，旧详情链接统一进入公告列表
  { path: '/marquee/:id', redirect: { path: '/notice', query: { tab: 'announcement' } } },

  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/other/About.vue'),
    meta: { title: '关于我们' }
  }
]
