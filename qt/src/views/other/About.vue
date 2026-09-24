<template>
  <div class="about-page">
    <van-nav-bar
      title="关于我们"
      left-arrow
      @click-left="$router.back()"
      class="nav-bar"
      fixed
      :border="false"
    />

    <div class="content-wrapper">
      <div class="logo-section">
        <div class="logo-box">
          <img src="/assets/img/starrex-logo.png" class="logo-img" @error="handleLogoError" />
        </div>
        <h1 class="app-name">{{ configStore.siteName || '娱乐平台' }}</h1>
        <p class="version">Version 2.0.1</p>
      </div>

      <div class="info-card">
        <div class="card-title">平台简介</div>
        <div class="card-text">
          <p>{{ configStore.siteName || '本平台' }}致力于为用户提供安全、稳定、流畅的在线娱乐体验。我们采用顶尖的加密技术保护用户隐私，并引入全球领先的游戏系统，确保公平公正。</p>
          <p>作为行业领先者，我们拥有24小时专业客服团队，随时为您解答疑问，处理突发状况，让您无后顾之忧。</p>
        </div>
      </div>

      <div class="menu-list">
        <div class="menu-item" @click="showToast('已是最新版本')">
          <span>检查更新</span>
          <van-icon name="arrow" />
        </div>
        <div class="menu-item">
          <span>用户协议</span>
          <van-icon name="arrow" />
        </div>
        <div class="menu-item">
          <span>隐私政策</span>
          <van-icon name="arrow" />
        </div>
      </div>
      
      <div class="footer-copy">
        <p>©2006-2031 {{ configStore.siteName || 'StarRex 星恒' }} 版权所有</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { showToast } from 'vant'
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()

const handleLogoError = (e) => {
  e.target.src = '/assets/img/icon_sys_menu_service.svg'
}
</script>

<style scoped lang="scss">
/* 站点黑金皮肤：原为浅色绿色主题 */
.about-page {
  --ab-bg: #1c1c1c;
  --ab-nav: #111;
  --ab-surface: #252525;
  --ab-fill: #222;
  --ab-border: #3a3a3a;
  --ab-text: #e0e0e0;
  --ab-text-2: #bdbdbd;
  --ab-muted: #999;
  --ab-primary: #d5aa54;
  --ab-gold: #e8c978;
}

.about-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--ab-bg);
  color: var(--ab-text);
  padding-top: 46px;
  overflow: hidden;
  z-index: 100;
}

.nav-bar {
  background: var(--ab-nav) !important;
  box-shadow: none;
  border-bottom: 1px solid var(--ab-border);
  
  :deep(.van-nav-bar__title) {
    color: var(--ab-gold);
    font-weight: 600;
  }
  
  :deep(.van-icon) {
    color: var(--ab-muted);
  }
}

.content-wrapper {
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
}

.logo-box {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  background: var(--ab-surface);
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-name {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: var(--ab-gold);
}

.version {
  color: var(--ab-muted);
  font-size: 12px;
  margin: 0;
}

.info-card {
  background: var(--ab-surface);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--ab-border);
  box-shadow: none;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--ab-gold);
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid var(--ab-primary);
  line-height: 1;
}

.card-text {
  font-size: 13px;
  line-height: 1.7;
  color: var(--ab-text-2);
  
  p {
    margin: 0 0 10px 0;
    &:last-child { margin-bottom: 0; }
  }
}

.menu-list {
  background: var(--ab-surface);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--ab-border);
  box-shadow: none;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--ab-border);
  font-size: 14px;
  color: var(--ab-text);
  
  &:last-child { border-bottom: none; }
  &:active { background: var(--ab-fill); }
  
  .van-icon {
    color: var(--ab-muted);
  }
}

.footer-copy {
  text-align: center;
  color: var(--ab-muted);
  font-size: 11px;
  margin-top: 20px;
  
  p {
    margin: 0;
  }
}
</style>

