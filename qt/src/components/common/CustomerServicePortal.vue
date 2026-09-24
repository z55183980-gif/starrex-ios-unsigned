<template>
  <Teleport to="body">
    <Transition name="customer-service-panel">
      <section
        v-if="show"
        class="customer-service-portal"
        role="dialog"
        aria-label="客服中心"
      >
        <div v-if="view === 'main'" class="portal-gradient">
          <button class="portal-close" type="button" aria-label="关闭" @click="close">
            <van-icon name="cross" />
          </button>

          <div class="portal-heading">客服中心</div>

          <div class="portal-avatar">
            <img src="/assets/img/img_kf_kf01.avif" alt="客服" />
          </div>

          <div class="portal-service-label">Service</div>
          <p class="portal-welcome">
            {{ portalWelcomeText }}
          </p>

          <div class="portal-options">
            <p class="portal-options-title">您可以选择以下客服来解决您的问题</p>

            <div class="portal-option-grid">
              <button class="portal-option" type="button" @click="openOnline">
                <span class="portal-option-icon portal-option-icon--online">
                  <van-icon name="service-o" />
                </span>
                <strong>Online</strong>
                <span>在线客服</span>
              </button>

              <button class="portal-option" type="button" @click="showTelegramList">
                <span class="portal-option-icon portal-option-icon--telegram">
                  <img src="/assets/img/telegram.avif" alt="" />
                </span>
                <strong>Telegram</strong>
                <span>客服服务</span>
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="view === 'telegram'" class="telegram-panel">
          <header class="telegram-header">
            <button class="telegram-back" type="button" aria-label="返回" @click="view = 'main'">
              <van-icon name="arrow-left" />
            </button>
            <button class="portal-close" type="button" aria-label="关闭" @click="close">
              <van-icon name="cross" />
            </button>

            <div class="telegram-heading">客户服务清单</div>
            <div class="telegram-title">Telegram</div>
            <div class="telegram-subtitle">客户服务清单</div>
          </header>

          <div class="telegram-list">
            <div
              v-for="item in telegramList"
              :key="item.username || item.url"
              class="telegram-service-item"
            >
              <span class="telegram-service-avatar">
                <img src="/assets/img/telegram.avif" alt="" />
              </span>
              <div class="telegram-service-info">
                <strong>{{ item.name }}</strong>
                <span>在线</span>
              </div>
              <button type="button" class="telegram-go" @click="openTelegram(item)">进入</button>
            </div>

            <div v-if="telegramList.length === 0" class="telegram-empty">
              暂无 Telegram 客服
            </div>
          </div>
        </div>

        <div v-else class="customer-service-chat">
          <ImChat :embedded-cs-user-id="csUserId" @close="close" />
        </div>
      </section>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { showToast } from 'vant'
import { useConfigStore } from '@/stores/config'
import { openOnlineCustomerService } from '@/utils/customerService'
import ImChat from '@/views/im/Chat.vue'

const configStore = useConfigStore()
const show = ref(false)
const view = ref('main')
const csUserId = ref(null)

const telegramList = computed(() => configStore.tgServiceList || [])

const DEFAULT_SERVICE_WELCOME = '星恒人工客服为您服务，请问有什么可以帮助您的呢？ ❤️'

const normalizeServiceWelcome = (text) => String(text || '').replace(/万利/g, '星恒')

const portalWelcomeText = computed(() => {
  const configuredText = configStore.csWelcomeEnabled && configStore.csWelcomeText
    ? configStore.csWelcomeText
    : DEFAULT_SERVICE_WELCOME

  // 兼容后台尚未更新的历史欢迎语，避免会员端继续展示旧品牌名。
  return normalizeServiceWelcome(configuredText)
})

const open = async () => {
  show.value = true
  view.value = 'main'
  await configStore.fetchConfig(true).catch(() => {})
}

const close = () => {
  show.value = false
  view.value = 'main'
  csUserId.value = null
}

const openOnline = async () => {
  close()
  await openOnlineCustomerService({ skipPortal: true, embedded: true })
}

const openChat = (event) => {
  const id = Number(event?.detail?.csUserId)
  if (!Number.isFinite(id) || id <= 0) return
  csUserId.value = id
  view.value = 'chat'
  show.value = true
}

const showTelegramList = async () => {
  await configStore.fetchConfig(true).catch(() => {})
  view.value = 'telegram'
}

const openTelegram = (item) => {
  const url = String(item?.url || '').trim()
  if (!url) {
    showToast('暂无 Telegram 客服')
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  window.addEventListener('open-customer-service-portal', open)
  window.addEventListener('open-customer-service-chat', openChat)
  const params = new URLSearchParams(window.location.search)
  if (params.get('cs') === '1') {
    open()
  } else if (params.get('cs') === 'online') {
    // PC 路由守卫会把旧客服地址重定向到 /pc?cs=online，直接进入同尺寸聊天弹窗。
    openOnlineCustomerService({ skipPortal: true, embedded: true })
  }
})

onUnmounted(() => {
  window.removeEventListener('open-customer-service-portal', open)
  window.removeEventListener('open-customer-service-chat', openChat)
})
</script>

<style scoped>
.customer-service-portal {
  position: fixed;
  right: 16px;
  bottom: 96px;
  z-index: 2000;
  width: 360px;
  height: 600px;
  min-height: 0;
  max-height: calc(100dvh - 112px);
  overflow: hidden;
  isolation: isolate;
  border-radius: 16px;
  border: 1px solid rgba(212, 171, 83, 0.34);
  background: #151515;
  box-shadow: 0 22px 46px rgba(0, 0, 0, 0.58), 0 0 0 1px rgba(212, 171, 83, 0.06);
  color: #ededed;
  color-scheme: dark;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
}

.portal-gradient {
  position: relative;
  height: 600px;
  min-height: 600px;
  padding: 24px 20px 0;
  background:
    radial-gradient(circle at 50% 16%, rgba(225, 189, 100, 0.2), transparent 23%),
    linear-gradient(180deg, #252525 0%, #1a1a1a 58%, #151515 100%);
  text-align: center;
}

.telegram-panel {
  display: flex;
  height: 600px;
  min-height: 0;
  flex-direction: column;
  background: #151515;
}

.telegram-header {
  position: relative;
  height: 143px;
  padding: 18px 48px 16px;
  flex: 0 0 143px;
  background: linear-gradient(180deg, #2a2a2a 0%, #171717 100%);
  color: #f0d27c;
  text-align: center;
}

.telegram-back {
  position: absolute;
  top: 18px;
  left: 18px;
  display: grid;
  width: 22px;
  height: 22px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 5px;
  background: rgba(212, 171, 83, 0.12);
  color: #e4bd64;
  font-size: 16px;
  cursor: pointer;
}

.telegram-heading {
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
}

.telegram-title {
  margin-top: 24px;
  font-size: 20px;
  font-weight: 700;
  line-height: 25px;
}

.telegram-subtitle {
  margin-top: 3px;
  color: #a5a5a5;
  font-size: 14px;
  line-height: 20px;
}

.telegram-list {
  min-height: 0;
  padding: 12px 9px 18px;
  flex: 1;
  overflow-y: auto;
  background: #151515;
  overscroll-behavior: contain;
}

.telegram-service-item {
  display: grid;
  min-height: 82px;
  padding: 12px 20px;
  grid-template-columns: 48px minmax(0, 1fr) 68px;
  align-items: center;
  gap: 16px;
  border: 1px solid #3b3b3b;
  border-radius: 12px;
  background: #222;
}

.telegram-service-item + .telegram-service-item {
  margin-top: 12px;
}

.telegram-service-avatar {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: #0d8fc3;
}

.telegram-service-avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.telegram-service-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.telegram-service-info strong {
  max-width: 100%;
  color: #eeeeee;
  font-size: 15px;
  font-weight: 500;
  line-height: 21px;
  overflow-wrap: anywhere;
}

.telegram-service-info span {
  margin-top: 4px;
  color: #e4bd64;
  font-size: 13px;
  line-height: 18px;
}

.telegram-go {
  width: 68px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: linear-gradient(135deg, #b98932, #76551f);
  color: #fff4d0;
  font-size: 15px;
  cursor: pointer;
}

.telegram-go:active {
  transform: translateY(1px);
}

.telegram-empty {
  padding: 72px 20px;
  color: #929292;
  font-size: 14px;
  text-align: center;
}

.portal-close {
  position: absolute;
  top: 18px;
  right: 18px;
  display: grid;
  width: 28px;
  height: 28px;
  padding: 0;
  place-items: center;
  border: 0;
  background: transparent;
  color: rgba(241, 214, 133, 0.82);
  font-size: 24px;
  cursor: pointer;
}

.portal-heading {
  color: #f3d882;
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
}

.portal-avatar {
  width: 88px;
  height: 88px;
  margin: 20px auto 10px;
  overflow: hidden;
  border: 4px solid rgba(212, 171, 83, 0.9);
  border-radius: 50%;
  background: #1e1e1e;
  box-shadow: 0 0 0 3px rgba(212, 171, 83, 0.18);
}

.portal-avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portal-service-label {
  color: #a7a7a7;
  font-size: 14px;
  line-height: 22px;
}

.portal-welcome {
  max-width: 306px;
  margin: 17px auto 0;
  color: #e6e6e6;
  font-size: 15px;
  line-height: 25px;
}

.portal-options {
  margin-top: 28px;
  padding: 25px 22px 27px;
  border-radius: 20px;
  border: 1px solid #373737;
  background: #202020;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.24);
}

.portal-options-title {
  margin: 0 0 20px;
  color: #a6a6a6;
  font-size: 14px;
  line-height: 22px;
}

.portal-option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.portal-option {
  display: flex;
  min-width: 0;
  height: 176px;
  padding: 24px 8px 20px;
  flex-direction: column;
  align-items: center;
  border: 1px solid #414141;
  border-radius: 16px;
  background: #222;
  color: #f2f2f2;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.customer-service-chat {
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #ededed;
}

.customer-service-chat :deep(.chat-page) {
  height: 100%;
  max-height: none;
}

.portal-option:active {
  transform: translateY(1px);
}

.portal-option:hover {
  border-color: #c9973d;
  box-shadow: 0 8px 18px rgba(201, 151, 61, 0.14);
  transform: translateY(-2px);
}

.portal-option-icon {
  display: grid;
  width: 58px;
  height: 58px;
  margin-bottom: 18px;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
}

.portal-option-icon--online {
  background: linear-gradient(135deg, #c9973d, #785521);
  color: #fff;
  font-size: 35px;
}

.portal-option-icon--telegram {
  background: #0d8fc3;
}

.portal-option-icon--telegram img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portal-option strong {
  overflow-wrap: anywhere;
  font-size: 17px;
  line-height: 24px;
}

.portal-option > span:last-child {
  margin-top: 15px;
  color: #a5a5a5;
  font-size: 14px;
  line-height: 20px;
}

.customer-service-panel-enter-active,
.customer-service-panel-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.customer-service-panel-enter-from,
.customer-service-panel-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 600px) {
  .customer-service-portal {
    inset: 9px 9px 7px;
    width: auto;
    height: auto;
    min-height: 0;
    max-height: none;
    border-radius: 20px;
  }

  :global(html.is-standalone.device-mobile .customer-service-portal) {
    bottom: calc(-1 * env(safe-area-inset-bottom, 0px));
  }

  :global(html.is-standalone.device-mobile .customer-service-portal .portal-gradient) {
    padding-top: calc(34px + env(safe-area-inset-top, 0px));
  }

  :global(html.is-standalone.device-mobile .customer-service-portal .portal-close) {
    top: calc(20px + env(safe-area-inset-top, 0px));
  }

  :global(html.is-standalone.device-mobile .customer-service-portal .telegram-header) {
    height: calc(143px + env(safe-area-inset-top, 0px));
    padding-top: calc(18px + env(safe-area-inset-top, 0px));
    flex-basis: calc(143px + env(safe-area-inset-top, 0px));
  }

  :global(html.is-standalone.device-mobile .customer-service-portal .telegram-back) {
    top: calc(18px + env(safe-area-inset-top, 0px));
  }

  .portal-gradient {
    height: auto;
    min-height: 610px;
    padding: 34px 21px 0;
  }

  .telegram-panel {
    height: 100%;
  }

  .telegram-header {
    padding-top: 18px;
  }

  .telegram-heading {
    font-size: 21px;
  }

  .telegram-service-item {
    min-height: 81px;
    padding-right: 20px;
    padding-left: 20px;
  }

  .portal-close {
    top: 20px;
    right: 19px;
  }

  .portal-heading {
    font-size: 21px;
  }

  .portal-avatar {
    width: 86px;
    height: 86px;
    margin-top: 22px;
  }

  .portal-welcome {
    max-width: 360px;
    margin-top: 17px;
    font-size: 16px;
    line-height: 27px;
  }

  .portal-options {
    margin-top: 27px;
    padding: 26px 25px 27px;
    border-radius: 20px;
  }

  .portal-options-title {
    margin-bottom: 21px;
    font-size: 15px;
  }

  .portal-option-grid {
    gap: 15px;
  }

  .portal-option {
    height: 199px;
    padding-top: 27px;
  }

  .portal-option-icon {
    width: 61px;
    height: 61px;
    margin-bottom: 18px;
  }

  .portal-option strong {
    font-size: 18px;
  }

  .portal-option > span:last-child {
    margin-top: 17px;
    font-size: 15px;
  }
}

@media (max-width: 360px) {
  .portal-gradient {
    padding-right: 16px;
    padding-left: 16px;
  }

  .portal-options {
    padding-right: 16px;
    padding-left: 16px;
  }

  .portal-option-grid {
    gap: 10px;
  }
}
</style>

