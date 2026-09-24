<template>
  <div class="v5-fund-pwd" :class="{ 'keyboard-open': showKeyboard, 'is-pc': isPc }">
    <van-nav-bar
      title="提现密码"
      left-arrow
      @click-left="onClickLeft"
      class="custom-nav"
    />

    <div class="content">
      <div class="form-panel">
        <div class="step-1">
          <div class="green-tip">为了资金安全，需先设置提现密码哦！</div>

          <div class="pwd-block" @click.stop="openKeyboard('fund')">
            <div class="label">设置提现密码</div>
            <van-password-input
              :value="fundPassword"
              :focused="currentFocus === 'fund'"
              :gutter="isPc ? 10 : 8"
              :length="6"
              :mask="true"
            />
          </div>

          <div class="pwd-block" @click.stop="openKeyboard('confirm')">
            <div class="label">确认提现密码</div>
            <van-password-input
              :value="confirmFundPassword"
              :focused="currentFocus === 'confirm'"
              :gutter="isPc ? 10 : 8"
              :length="6"
              :mask="true"
            />
          </div>

          <div class="warning-tip">
            <van-icon name="info" class="warn-icon" />
            注意：提现密码保护您的资金安全，非常重要，只能自己知道，以免造成资金损失
          </div>
        </div>

        <div class="bottom-area" :style="bottomAreaStyle">
          <van-button block color="#009688" class="submit-btn" @click="onSubmit" :loading="submitting">
            确定
          </van-button>
          <p v-if="isPc" class="pc-hint">可使用键盘数字键输入，Backspace 删除</p>
        </div>
      </div>
    </div>

    <van-number-keyboard
      v-if="!isPc"
      :show="showKeyboard"
      @input="onInput"
      @delete="onDelete"
      @blur="closeKeyboard"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { securityApi } from '@/api/security'
import { isPcRoutePath, navigatePcBack } from '@/utils/deviceRoutes'

const router = useRouter()
const route = useRoute()
const isPc = computed(() => isPcRoutePath(route.path))

const showKeyboard = ref(false)
const submitting = ref(false)

const fundPassword = ref('')
const confirmFundPassword = ref('')
const currentFocus = ref('')

const bottomAreaStyle = computed(() => {
  if (isPc.value) return undefined
  return { bottom: showKeyboard.value ? '240px' : '0' }
})

const onClickLeft = () => {
  if (navigatePcBack(router, route, '/member')) return
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.replace('/security')
}

const openKeyboard = (type) => {
  currentFocus.value = type
  showKeyboard.value = !isPc.value
}

const closeKeyboard = () => {
  showKeyboard.value = false
  currentFocus.value = ''
}

const onInput = (key) => {
  if (currentFocus.value === 'fund') {
    if (fundPassword.value.length < 6) {
      fundPassword.value += key
      if (fundPassword.value.length === 6) {
        currentFocus.value = 'confirm'
      }
    }
  } else if (currentFocus.value === 'confirm') {
    if (confirmFundPassword.value.length < 6) {
      confirmFundPassword.value += key
    }
  }
}

const onDelete = () => {
  if (currentFocus.value === 'fund') {
    fundPassword.value = fundPassword.value.slice(0, -1)
  } else if (currentFocus.value === 'confirm') {
    confirmFundPassword.value = confirmFundPassword.value.slice(0, -1)
  }
}

const onKeyDown = (event) => {
  if (!isPc.value || !currentFocus.value) return
  if (event.ctrlKey || event.metaKey || event.altKey) return

  if (/^[0-9]$/.test(event.key)) {
    event.preventDefault()
    onInput(event.key)
    return
  }
  if (event.key === 'Backspace') {
    event.preventDefault()
    onDelete()
    return
  }
  if (event.key === 'Enter') {
    event.preventDefault()
    onSubmit()
  }
}

const onSubmit = async () => {
  if (fundPassword.value.length !== 6) {
    showToast('请输入6位提现密码')
    currentFocus.value = 'fund'
    showKeyboard.value = !isPc.value
    return
  }
  if (confirmFundPassword.value.length !== 6) {
    showToast('请确认提现密码')
    currentFocus.value = 'confirm'
    showKeyboard.value = !isPc.value
    return
  }
  if (fundPassword.value !== confirmFundPassword.value) {
    showToast('两次输入不一致')
    confirmFundPassword.value = ''
    currentFocus.value = 'confirm'
    showKeyboard.value = !isPc.value
    return
  }
  submitting.value = true
  try {
    const res = await securityApi.setFundPassword({
      password: fundPassword.value,
      confirmPassword: confirmFundPassword.value
    })
    if (res.code === 0) {
      showToast('设置成功')
      setTimeout(() => {
        if (navigatePcBack(router, route, '/member')) return
        router.back()
      }, 1000)
    } else {
      showToast(res.message || '设置失败')
    }
  } catch (e) {
    showToast(e.message || '设置失败')
  } finally {
    submitting.value = false
    showKeyboard.value = false
  }
}

onMounted(() => {
  if (isPc.value) currentFocus.value = 'fund'
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.v5-fund-pwd {
  min-height: 100vh;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
}

.custom-nav {
  background: #fff;
}
:deep(.van-nav-bar__title) {
  font-weight: 500;
  font-size: 17px;
}
:deep(.van-icon-arrow-left) {
  color: #333;
  font-size: 20px;
}

.content {
  padding: 20px 16px;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 100px;
}

.form-panel {
  width: 100%;
}

.step-1 {
  text-align: center;
}

.green-tip {
  color: #009688;
  font-size: 14px;
  margin-bottom: 24px;
}

.pwd-block {
  margin-bottom: 24px;
  text-align: left;
  cursor: pointer;
}

.label {
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 500;
}

.warning-tip {
  color: #f44336;
  font-size: 12px;
  text-align: left;
  line-height: 1.5;
  display: flex;
  gap: 4px;
  margin-top: 16px;
}
.warn-icon {
  font-size: 14px;
  margin-top: 2px;
  flex-shrink: 0;
}

.bottom-area {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #f5f5f5;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  z-index: 2000;
  box-sizing: border-box;
  transition: bottom 0.3s ease;
}

.submit-btn {
  height: 44px;
  font-size: 16px;
  border-radius: 6px;
}

.pc-hint {
  margin: 10px 0 0;
  text-align: center;
  color: #8a94a0;
  font-size: 12px;
}

:deep(.van-password-input) {
  margin: 0;
}
:deep(.van-password-input__security) {
  height: 44px;
}
:deep(.van-password-input__item) {
  border-radius: 4px;
  border: 1px solid #ebedf0;
  background: #f7f8fa;
}
:deep(.van-password-input__item--focus) {
  border-color: #009688;
  background: #fff;
  box-shadow: 0 0 0 1px #009688;
}
:deep(.van-password-input__cursor) {
  background-color: #009688;
}

:deep(.van-number-keyboard) {
  z-index: 3000 !important;
}

.v5-fund-pwd.is-pc {
  min-height: calc(100vh - 48px);
  background: #fff;
}

.v5-fund-pwd.is-pc .content {
  display: flex;
  justify-content: center;
  padding: 36px 24px 40px;
  padding-bottom: 40px;
}

.v5-fund-pwd.is-pc .form-panel {
  width: 100%;
  max-width: 420px;
}

.v5-fund-pwd.is-pc .green-tip {
  font-size: 15px;
  margin-bottom: 28px;
}

.v5-fund-pwd.is-pc .pwd-block {
  margin-bottom: 28px;
}

.v5-fund-pwd.is-pc .bottom-area {
  position: static;
  left: auto;
  width: 100%;
  margin-top: 28px;
  padding: 0;
  border-top: 0;
  background: transparent;
  z-index: auto;
}

.v5-fund-pwd.is-pc .submit-btn {
  height: 46px;
  border-radius: 8px;
}

.v5-fund-pwd.is-pc :deep(.van-password-input__security) {
  height: 52px;
}

.v5-fund-pwd.is-pc :deep(.van-password-input__item) {
  border-radius: 8px;
}
</style>
