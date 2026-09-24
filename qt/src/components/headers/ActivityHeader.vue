<template>
  <div class="activity-header">
    <button class="nav-left" type="button" aria-label="返回" title="返回" @click="goBack">
      <van-icon name="arrow-left" size="20" />
    </button>
    <strong v-if="stripPcRoutePrefix(route.path) === '/interest'" class="page-title">利息宝</strong>
    <div class="pc-header-links">
      <span class="pc-date">{{ currentDate }}</span><i>|</i><span @click="goHome">网站首页</span><i>|</i><span @click="openService">在线客服</span>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { setTransitionDirection } from '@/stores/transition'
import { getDeviceHomePath } from '@/utils/device'
import { openOnlineCustomerService } from '@/utils/customerService'
import { stripPcRoutePrefix } from '@/utils/deviceRoutes'

const router = useRouter()
const route = useRoute()
const currentDate = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  .format(new Date())
  .replace(/\//g, '-')

const goBack = () => {
  const backPath = sessionStorage.getItem('activity_back_path')
  sessionStorage.removeItem('activity_back_path')
  if (backPath && backPath.startsWith('/') && backPath !== route.fullPath) {
    setTransitionDirection(route.path, backPath)
    router.replace(backPath)
    return
  }
  goHome()
}

const goHome = () => {
  sessionStorage.removeItem('activity_back_path')
  const homePath = getDeviceHomePath()
  setTransitionDirection(route.path, homePath)
  router.replace(homePath)
}

const openService = () => openOnlineCustomerService({ requireLogin: false })
</script>

<style scoped>
.activity-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: calc(50.59px + env(safe-area-inset-top, 0px));
  background: #050505;
  color: #f3d486;
  display: flex;
  align-items: center;
  padding: env(safe-area-inset-top, 0px) 10px 0;
  border-bottom: 1px solid rgba(232, 203, 112, 0.25);
  z-index: 999;
}

.pc-header-links { display: none; }

.page-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: #f5f1e5;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.nav-left {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f3d486;
  cursor: pointer;
}

.nav-tabs {
  flex: 1;
  display: flex;
  overflow-x: auto;
  height: 100%;
  align-items: center;
  gap: 20px;
  padding-left: 10px;
  scrollbar-width: none; 
}
.nav-tabs::-webkit-scrollbar { display: none; }

.nav-tab-item {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #666;
  flex-shrink: 0;
  font-weight: 500;
  cursor: pointer;
}
.nav-tab-item.active {
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
</style>

<style>
html.device-pc .activity-header {
  position: fixed;
  height: 35px;
  padding: 0;
  background: linear-gradient(to bottom, #fbe59c 0, #fbe59c 35px, #080808 35px, #080808 100%);
  border-bottom: 1px solid #3b321d;
  box-shadow: 0 2px 0 rgba(222, 173, 67, .15);
}
html.device-pc .activity-header::before {
  content: '';
  position: absolute;
  left: 0; right: 0; top: 0;
  height: 2px;
  background: linear-gradient(90deg, #8d6421, #f5d988 45%, #8d6421);
}
html.device-pc .activity-header .nav-left {
  display: flex;
}
html.device-pc .activity-header .page-title {
  top: 50%;
  transform: translate(-50%, -50%);
  color: #f5d988;
  font-size: 20px;
}
html.device-pc .activity-header .nav-tabs {
  display: none;
}
html.device-pc .activity-header .nav-tab-item {
  min-width: 116px;
  height: 85px;
  padding: 0 14px;
  color: #9b9b9b;
  font-size: 15px;
  letter-spacing: 1px;
}
html.device-pc .activity-header .nav-tab-item:hover { color: #f3d486; }
html.device-pc .activity-header .nav-tab-item.active {
  color: #f5d988;
  font-weight: 600;
  background: linear-gradient(180deg, rgba(168,121,37,.18), rgba(0,0,0,0));
}
html.device-pc .activity-header .active-line {
  bottom: 8px;
  width: 34px;
  height: 2px;
  background: #e7c56b;
  box-shadow: 0 0 8px rgba(231,197,107,.6);
}
html.device-pc .activity-header .pc-header-links {
  position: absolute;
  right: max(24px, calc((100% - 1200px) / 2));
  top: 11px;
  display: flex;
  gap: 9px;
  color: #4e4633;
  font-size: 12px;
}
html.device-pc .activity-header .pc-date { margin-right: 18px; color: #7a6b45; }
html.device-pc .activity-header .pc-header-links span { cursor: pointer; }
html.device-pc .activity-header .pc-header-links span:not(.pc-date):hover { color: #f5d988; }
html.device-pc .activity-header .pc-header-links i { color: #534729; font-style: normal; }
</style>

