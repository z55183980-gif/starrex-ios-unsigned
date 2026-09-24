import { getDeviceHomePath } from '@/utils/device'

export default [
  {
    path: '/login',
    name: 'Login',
    redirect: (to) => ({ path: getDeviceHomePath(), query: { ...to.query, auth: 'login' } }),
    meta: {
      title: '登录',
      guest: true
    }
  },
  {
    path: '/register',
    name: 'Register',
    alias: '/pc/register',
    component: () => import('@/views/pc/PcRegister.vue'),
    meta: {
      title: '注册',
      guest: true,
      pc: true,
      standalone: true
    }
  }
]
