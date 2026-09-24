<template>
  <Teleport to="body">
    <Transition name="target-login">
      <div v-if="modelValue" class="target-login-mask" @click.self="close">
        <section class="target-login-dialog" role="dialog" aria-modal="true" aria-label="登录">
          <div class="target-login-visual" aria-hidden="true"></div>
          <header class="target-login-header">
            <div class="target-login-brand" aria-label="StarRex 星恒">
              <img class="target-login-brand-icon" src="/assets/img/starrex-icon.png" alt="" />
              <img class="target-login-brand-wordmark" src="/assets/img/starrex-wordmark.png" alt="StarRex 星恒" />
            </div>
            <button class="target-login-close" type="button" aria-label="关闭" @click="close">
              <img src="/assets/img/popup-close.png" alt="" />
            </button>
          </header>

          <form class="target-login-form" @submit.prevent="handleLogin">
            <div class="target-login-field">
              <label for="target-login-account">账号:</label>
              <input
                id="target-login-account"
                v-model="form.username"
                type="text"
                autocomplete="username"
                placeholder="请输入6-16位以字母开头的字母与数字组合账号"
              />
            </div>
            <div class="target-login-field">
              <label for="target-login-password">密码:</label>
              <div class="target-login-password">
                <input
                  id="target-login-password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="请输入8-16位，可输入大小写字母/数字/特殊符号"
                />
                <button type="button" class="target-login-eye" aria-label="显示密码" @click="showPassword = !showPassword">
                  <span :class="{ visible: showPassword }"></span>
                </button>
              </div>
            </div>

            <div class="target-login-options">
              <label class="target-login-remember">
                <input v-model="remember" type="checkbox" />
                <span class="target-login-radio" aria-hidden="true"></span>
                <strong>记住密码</strong>
              </label>
              <button type="button" class="target-login-link" @click="openService">忘记密码?</button>
              <span class="target-login-register-text">没有账号，</span>
              <button type="button" class="target-login-link" @click="register">立即注册</button>
            </div>

            <button class="target-login-submit" type="submit" :disabled="loading">
              {{ loading ? '登录中...' : '立即登录' }}
            </button>
          </form>
        </section>
      </div>
    </Transition>
  </Teleport>

  <LoginNoticeDialog
    v-model="showNotice"
    :message="noticeMessage"
    close-label="关闭"
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import { authApi } from '@/api/auth'
import { setCookie, getCookie, delCookie } from '@/utils/cookie'
import { handleLoginSuccess } from '@/utils/auth'
import { resetAuthState } from '@/api/request'
import { heartbeatService } from '@/utils/heartbeat'
import { openOnlineCustomerService } from '@/utils/customerService'
import LoginNoticeDialog from './LoginNoticeDialog.vue'

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'success', 'register'])

const form = ref({ username: '', password: '' })
const remember = ref(true)
const showPassword = ref(false)
const loading = ref(false)
const showNotice = ref(false)
const noticeMessage = ref('')

watch(() => props.modelValue, (visible) => {
  if (visible) {
    const account = getCookie('account')
    if (account) form.value.username = account
    showPassword.value = false
  }
})

const close = () => emit('update:modelValue', false)
const register = () => {
  close()
  emit('register')
}
const openService = async () => {
  close()
  await openOnlineCustomerService()
}

const handleLogin = async () => {
  if (!String(form.value.username || '').trim() || !String(form.value.password || '').trim()) {
    noticeMessage.value = '账号和密码不能为空'
    showNotice.value = true
    return
  }
  if (loading.value) return
  loading.value = true
  try {
    const res = await authApi.login({
      username: String(form.value.username).trim(),
      password: form.value.password
    })
    if (res.code !== 0 && res.code !== 200) {
      noticeMessage.value = res.message || res.msg || '登录失败'
      showNotice.value = true
      return
    }
    const loginData = {
      token: res.data?.token,
      refreshToken: res.data?.refreshToken,
      user: res.data?.user || res.data?.userInfo,
      expiresIn: res.data?.expiresIn || 7200
    }
    if (!handleLoginSuccess(loginData)) {
      noticeMessage.value = '登录失败，请稍后重试'
      showNotice.value = true
      return
    }
    if (remember.value) setCookie('account', form.value.username, 7)
    else delCookie('account')
    resetAuthState()
    heartbeatService.restart()
    close()
    emit('success')
  } catch (error) {
    noticeMessage.value = error?.message || '登录失败'
    showNotice.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.target-login-mask {
  position: fixed;
  z-index: 2500;
  inset: 0;
  background: rgba(0, 0, 0, 0.48);
}

.target-login-dialog {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(640px, calc(100vw - 18px));
  overflow: hidden;
  border-radius: 24px;
  background: transparent;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
  transform: translate(-50%, -50%);
  font-family: Arial, "Microsoft YaHei", sans-serif;
}

.target-login-visual {
  height: 260px;
  background: url('https://tya.5618861.cc/static/media/LoginBG.837fa339.png') center top / 500px auto no-repeat;
}

.target-login-header {
  position: relative;
  height: 78px;
  /* Logo 素材使用纯黑底，标题栏同步纯黑，避免图标与背景出现色块。 */
  background: #000;
}

.target-login-brand {
  position: absolute;
  top: 9px;
  left: 22px;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 60px;
  background: #000;
}

.target-login-brand-icon {
  width: 56px;
  height: 56px;
  object-fit: contain;
  display: block;
  background: #000;
}

.target-login-brand-wordmark {
  width: 132px;
  height: 52px;
  object-fit: contain;
  display: block;
  background: #000;
}

.target-login-close {
  position: absolute;
  top: 0;
  right: 10px;
  width: 76px;
  height: 56px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.target-login-close img {
  width: 76px;
  height: 56px;
  object-fit: contain;
}

.target-login-form {
  min-height: 320px;
  padding: 60px 90px 38px;
  background: linear-gradient(180deg, #ffd21c 0%, #ffdf5d 100%);
}

.target-login-field {
  display: flex;
  align-items: center;
  margin-bottom: 9px;
}

.target-login-field label {
  flex: 0 0 68px;
  color: #090909;
  font-size: 18px;
  font-weight: 700;
  text-align: left;
}

.target-login-field input {
  width: 100%;
  height: 33px;
  box-sizing: border-box;
  padding: 0 12px;
  border: 0;
  border-radius: 5px;
  outline: none;
  background: rgba(255, 255, 255, 0.94);
  color: #333;
  font-size: 14px;
}

.target-login-field input::placeholder {
  color: #b9b9b9;
}

.target-login-password {
  position: relative;
  flex: 1;
}

.target-login-password input {
  padding-right: 42px;
}

.target-login-eye {
  position: absolute;
  top: 0;
  right: 8px;
  width: 26px;
  height: 33px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.target-login-eye span {
  position: absolute;
  top: 11px;
  left: 3px;
  width: 18px;
  height: 11px;
  border: 2px solid #e4e4e4;
  border-radius: 50% / 65%;
}

.target-login-eye span::after {
  position: absolute;
  top: 2px;
  left: 6px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #e4e4e4;
  content: '';
}

.target-login-eye span.visible {
  border-color: #777;
}

.target-login-eye span.visible::after {
  background: #777;
}

.target-login-options {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  margin: 34px 0 44px;
  color: #090909;
  font-size: 15px;
  white-space: nowrap;
}

.target-login-remember {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.target-login-remember input {
  position: absolute;
  opacity: 0;
}

.target-login-radio {
  width: 17px;
  height: 17px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #e7b900;
}

.target-login-remember input:checked + .target-login-radio::after {
  display: block;
  width: 9px;
  height: 9px;
  margin: 4px;
  border-radius: 50%;
  background: #fff;
  content: '';
}

.target-login-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: #0000ee;
  font: inherit;
  cursor: pointer;
}

.target-login-submit {
  display: block;
  width: 240px;
  height: 40px;
  margin: 0 auto;
  border: 0;
  border-radius: 4px;
  background: #050505;
  color: #ffd72f;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
}

.target-login-submit:disabled {
  cursor: wait;
  opacity: 0.75;
}

.target-login-enter-active,
.target-login-leave-active {
  transition: opacity 0.2s ease;
}

.target-login-enter-from,
.target-login-leave-to {
  opacity: 0;
}

.target-login-enter-active .target-login-dialog {
  animation: target-login-bounce 0.45s ease-out both;
}

@keyframes target-login-bounce {
  0% { transform: translate(-50%, -50%) scale(0.82); }
  70% { transform: translate(-50%, -50%) scale(1.02); }
  100% { transform: translate(-50%, -50%) scale(1); }
}

@media (max-width: 640px) {
  .target-login-dialog { border-radius: 18px; }
  .target-login-visual { height: 185px; background-size: 356px auto; }
  .target-login-brand { left: 12px; gap: 6px; }
  .target-login-brand-icon { width: 48px; height: 48px; }
  .target-login-brand-wordmark { width: 116px; height: 46px; }
  .target-login-form { padding: 44px 22px 28px; }
  .target-login-options { gap: 12px; font-size: 12px; }
  .target-login-field label { flex-basis: 58px; font-size: 16px; }
}

@media (min-width: 641px) {
  .target-login-dialog {
    min-height: 398px;
  }
}
</style>
