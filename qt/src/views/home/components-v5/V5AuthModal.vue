<template>
  <van-popup 
    :show="show" 
    @update:show="onPopupUpdate"
    round 
    position="center"
    :class="['v5-auth-modal', { 'v5-auth-modal--mobile': layout === 'mobile' }]"
    :close-on-click-overlay="false"
    overlay
    :overlay-style="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
    teleport="body"
  >
    <div class="auth-content">
      <button type="button" class="panel-close" :aria-label="$t('common.close')" @click="close">
        <van-icon name="cross" />
      </button>

      <div class="auth-shell">
        <aside class="auth-visual">
          <div class="visual-brand">
            <img src="/assets/img/starrex-logo.png" class="visual-logo" @error="hideBrokenImg" />
            <span>{{ siteConfig.brandName || 'StarRex 星恒' }}</span>
          </div>
          <div class="visual-copy">
            <span class="visual-eyebrow">{{ $t('auth.easyUrl') }}</span>
            <h2>{{ activeTab === 'register' ? $t('auth.registerTitle') : $t('auth.loginTitle') }}</h2>
            <p>{{ siteConfig.siteDomain || '2015.com' }}</p>
            <small>{{ $t('auth.promoText2') }}</small>
          </div>
          <div class="visual-orbit orbit-one"></div>
          <div class="visual-orbit orbit-two"></div>
          <div class="visual-shine"></div>
        </aside>

        <section class="auth-panel">
          <div v-show="memberRegisterEnabled" class="auth-tabs">
            <button type="button" class="tab-item" :class="{ active: activeTab === 'login' }" @click="activeTab = 'login'">
              {{ $t('common.login') }}
            </button>
            <button type="button" class="tab-item" :class="{ active: activeTab === 'register' }" @click="activeTab = 'register'">
              {{ $t('common.register') }}
            </button>
          </div>

          <!-- 注册表单：关闭开关时 v-if 不渲染，源码仍保留 -->
          <div v-if="memberRegisterEnabled && activeTab === 'register'" class="auth-form">
            <div class="form-heading">
              <p>{{ $t('auth.registerOnly') }}</p>
            </div>

            <div class="tip-box" v-if="defaultTjcode && !tgid && false">
              <van-icon name="info-o" />
              无邀请码请填 <span class="code-highlight">{{ defaultTjcode }}</span>
            </div>

            <div class="field-group">
              <label>{{ $t('auth.inviteCode') }} <em>{{ $t('auth.optional') }}</em></label>
              <div class="form-item">
                <van-icon name="qr" class="input-icon" />
                <input type="text" v-model="regForm.reccode" :placeholder="tgid ? $t('auth.inviteCodeLocked') : $t('auth.inviteCodeOptional')" class="custom-input" :readonly="!!tgid" autocomplete="off" autocapitalize="none" spellcheck="false" />
              </div>
            </div>

            <div class="field-group">
              <label>{{ $t('auth.username') }} <span class="required">*</span></label>
              <div class="form-item">
                <van-icon name="manager" class="input-icon" />
                <input type="text" v-model="regForm.username" :placeholder="$t('auth.inputAccountTip')" class="custom-input" autocomplete="username" autocapitalize="none" spellcheck="false" />
              </div>
            </div>

            <div class="field-group">
              <label>{{ $t('auth.realName') }} <span class="required">*</span></label>
              <div class="form-item">
                <van-icon name="contact" class="input-icon" />
                <input type="text" v-model="regForm.userbankname" :placeholder="$t('auth.realName')" class="custom-input" autocomplete="name" autocapitalize="none" spellcheck="false" @input="realNameError = false" />
              </div>
              <div class="field-tip-box">
                <p class="field-tip-text">{{ $t('auth.realNameHint') }}</p>
                <p v-if="realNameError" class="field-error-text">
                  <van-icon name="warning-o" />
                  {{ $t('auth.realNameRequired') }}
                </p>
              </div>
            </div>

            <div class="field-group">
              <label>{{ $t('auth.phone') }} <span class="required">*</span></label>
              <div class="form-item">
                <van-icon name="phone-o" class="input-icon" />
                <input
                  type="tel"
                  v-model="regForm.phone"
                  :placeholder="$t('auth.pleaseInputPhone')"
                  class="custom-input"
                  maxlength="11"
                  autocomplete="tel"
                  inputmode="numeric"
                  autocapitalize="none"
                  spellcheck="false"
                />
              </div>
            </div>

            <div class="field-group password-pair">
              <label>{{ $t('auth.password') }} <span class="required">*</span></label>
              <div class="password-stack">
                <div class="form-item">
                  <van-icon name="lock" class="input-icon" />
                  <input :type="showPwd ? 'text' : 'password'" v-model="regForm.password" :placeholder="$t('auth.inputPassword')" class="custom-input" autocomplete="new-password" autocapitalize="none" />
                  <van-icon :name="showPwd ? 'eye-o' : 'closed-eye'" class="eye-icon" @click="showPwd = !showPwd" />
                </div>
                <div class="form-item">
                  <van-icon name="lock" class="input-icon" />
                  <input :type="showPwd ? 'text' : 'password'" v-model="regForm.cpassword" :placeholder="$t('auth.inputPasswordAgain')" class="custom-input" autocomplete="new-password" enterkeyhint="done" @keyup.enter="handleRegister" />
                  <van-icon name="closed-eye" class="eye-icon" style="opacity: 0" />
                </div>
              </div>
              <p class="field-hint">密码为 6-16 位，可使用字母或数字。</p>
            </div>

            <div class="field-group">
              <label>{{ $t('auth.verifyCode') }} <span class="required">*</span></label>
              <div class="captcha-row">
                <div class="form-item captcha-input">
                  <van-icon name="shield-o" class="input-icon" />
                  <input
                    type="text"
                    v-model="regForm.captcha"
                    :placeholder="$t('auth.pleaseInputCode')"
                    class="custom-input"
                    maxlength="6"
                    autocomplete="off"
                    autocapitalize="none"
                    spellcheck="false"
                    enterkeyhint="done"
                    @keyup.enter="handleRegister"
                  />
                </div>
                <button type="button" class="captcha-image-btn" :disabled="captchaLoading" @click="refreshCaptcha" :title="$t('auth.refreshCaptcha')">
                  <img v-if="captchaImage" :src="captchaImage" alt="captcha" />
                  <span v-else class="captcha-placeholder">{{ captchaLoading ? '...' : $t('auth.refreshCaptcha') }}</span>
                </button>
              </div>
            </div>

        <div class="agreement-row">
          <van-checkbox v-model="agree" checked-color="#d6b44a" icon-size="16px">
            {{ $t('auth.agreeTerms') }} <span class="link">{{ $t('auth.userAgreement') }}</span>
          </van-checkbox>
        </div>

        <van-button block color="#d6b44a" class="submit-btn" @click="handleRegister" :loading="loading">{{ $t('common.register') }}</van-button>
      </div>

          <div v-else class="auth-form">
            <!-- 登录表单（与上方注册 v-if 成对） -->
            <div class="form-heading">
              <p>{{ $t('auth.accountOnly') }}</p>
            </div>

            <div class="field-group">
              <label>{{ $t('auth.username') }} <span class="required">*</span></label>
              <div class="form-item">
                <van-icon name="manager" class="input-icon" />
                <input type="text" v-model="loginForm.username" :placeholder="$t('auth.inputAccount')" class="custom-input" autocomplete="username" autocapitalize="none" spellcheck="false" />
              </div>
            </div>

            <div class="field-group">
              <label>{{ $t('auth.password') }} <span class="required">*</span></label>
              <div class="form-item">
                <van-icon name="lock" class="input-icon" />
                <input :type="showPwd ? 'text' : 'password'" v-model="loginForm.password" :placeholder="$t('auth.inputPassword')" class="custom-input" autocomplete="current-password" enterkeyhint="go" @keyup.enter="handleLogin" />
                <van-icon :name="showPwd ? 'eye-o' : 'closed-eye'" class="eye-icon" @click="showPwd = !showPwd" />
              </div>
            </div>

        <div class="agreement-row">
          <van-checkbox v-model="remember" checked-color="#d6b44a" icon-size="16px">
            {{ $t('auth.rememberAccount') }}
          </van-checkbox>
        </div>

        <van-button block color="#d6b44a" class="submit-btn" @click="handleLogin" :loading="loading">{{ $t('common.login') }}</van-button>
      </div>

          <div class="auth-footer">
            <div class="link-item" @click="goService">{{ $t('auth.contactService') }}</div>
            <div class="link-item" v-if="activeTab === 'login'" @click="goForget">{{ $t('auth.forgotPassword') }}</div>
          </div>
        </section>
      </div>

    </div>

  </van-popup>

  <LoginNoticeDialog
    v-model="showLoginNotice"
    :message="loginNoticeMessage"
    :close-label="t('common.close')"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { showToast } from 'vant'
import { authApi } from '@/api/auth'
import { homeApi } from '@/api/home'
import { setCookie, getCookie, delCookie } from '@/utils/cookie'
import { handleLoginSuccess } from '@/utils/auth'
import { resetAuthState } from '@/api/request'
import { heartbeatService } from '@/utils/heartbeat'
import { MEMBER_REGISTER_ENABLED, resolveAuthTab } from '@/constants/featureFlags'
import { hideBrokenImg } from '@/utils/staticAssets'
import { openOnlineCustomerService } from '@/utils/customerService'
import { validatePhone } from '@/utils/validators'
import LoginNoticeDialog from '@/components/auth/LoginNoticeDialog.vue'

const { t } = useI18n()
const props = defineProps({
  modelValue: Boolean,
  initialTab: { type: String, default: 'login' },
  layout: { type: String, default: 'mobile' }
})

const layout = computed(() => props.layout)

const emit = defineEmits(['update:modelValue', 'success'])

const router = useRouter()
const show = ref(false)
const activeTab = ref('login')
const memberRegisterEnabled = MEMBER_REGISTER_ENABLED
const loading = ref(false)
const showPwd = ref(false)
const agree = ref(true)
const remember = ref(true)
const tgid = ref('')
const defaultTjcode = ref('')
const siteConfig = ref({
  brandName: '',
  siteDomain: '',
  promoTexts: []
})

const loginForm = ref({ username: '', password: '' })
const regForm = ref({ 
  username: '',
  userbankname: '',
  phone: '',
  password: '', 
  cpassword: '', 
  reccode: '',
  captcha: '',
  captcha_key: ''
})
const realNameError = ref(false)
const captchaImage = ref('')
const captchaLoading = ref(false)
const showLoginNotice = ref(false)
const loginNoticeMessage = ref('')

const refreshCaptcha = async () => {
  if (captchaLoading.value) return
  captchaLoading.value = true
  try {
    const res = await authApi.getRegisterCaptcha()
    captchaImage.value = res.data?.image || ''
    regForm.value.captcha_key = res.data?.key || ''
    regForm.value.captcha = ''
  } catch (e) {
    captchaImage.value = ''
    regForm.value.captcha_key = ''
    showToast(e.message || t('auth.captchaLoadFailed'))
  } finally {
    captchaLoading.value = false
  }
}

watch(() => props.modelValue, (val) => {
  show.value = val
  if (val) {
    activeTab.value = resolveAuthTab(props.initialTab || 'login')
    loadCookies()
    loadFromUrl()
    if (memberRegisterEnabled && activeTab.value === 'register') {
      refreshCaptcha()
    }
  }
}, { immediate: true })

watch(activeTab, (tab) => {
  if (!memberRegisterEnabled && tab === 'register') {
    activeTab.value = 'login'
    return
  }
  if (memberRegisterEnabled && tab === 'register') {
    refreshCaptcha()
  }
})

onMounted(() => {
  fetchDefaultTjcode()
  loadFromUrl()
})

const onPopupUpdate = (val) => {
  show.value = val
  emit('update:modelValue', val)
}

const close = () => {
  show.value = false
  emit('update:modelValue', false)
}

function loadFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('invite') || params.get('tgid') || params.get('code') || params.get('inviteCode') || params.get('reccode')
  if (id) {
    tgid.value = id
    regForm.value.reccode = id
  }
}

const fetchDefaultTjcode = async () => {
  try {
    const res = await homeApi.getConfig()
    if (res.code === 0 && res.data) {
      defaultTjcode.value = res.data.defaulttjcode || ''
      siteConfig.value = {
        brandName: res.data.webtitle || 'StarRex 星恒',
        siteDomain: res.data.sitedomain || '2015.com',
        promoTexts: res.data.promo_texts || []
      }
    }
  } catch (e) {}
}

function loadCookies() {
  const acc = getCookie('account')
  if (acc) {
    loginForm.value.username = acc
    remember.value = true
  }
}

const handleLogin = async () => {
  if (!String(loginForm.value.username || '').trim() || !String(loginForm.value.password || '').trim()) {
    loginNoticeMessage.value = '账号和密码不能为空'
    showLoginNotice.value = true
    return
  }
  
  loading.value = true
  try {
    const res = await authApi.login(loginForm.value)
    if (res.code === 0 || res.code === 200) {
      if (remember.value) {
        setCookie('account', loginForm.value.username, 7)
      } else {
        delCookie('account')
      }

      const loginData = {
        token: res.data?.token,
        refreshToken: res.data?.refreshToken,
        user: res.data?.user || res.data?.userInfo,
        expiresIn: res.data?.expiresIn || 7200
      }
      
      if (handleLoginSuccess(loginData)) {
        resetAuthState()
        heartbeatService.restart()
        showToast({ type: 'success', message: t('auth.loginSuccess') })
        emit('success')
        close()
        setTimeout(() => window.location.reload(), 500)
      }
    } else {
      loginNoticeMessage.value = res.message || t('common.failed')
      showLoginNotice.value = true
    }
  } catch (e) {
    loginNoticeMessage.value = e.message || t('common.failed')
    showLoginNotice.value = true
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!agree.value) return showToast(t('auth.pleaseAgreeTerms'))
  if (!regForm.value.username || !regForm.value.password) return showToast(t('auth.pleaseCompleteInfo'))
  if (!String(regForm.value.userbankname || '').trim()) {
    realNameError.value = true
    return
  }
  realNameError.value = false
  const phone = String(regForm.value.phone || '').trim()
  if (!phone) return showToast(t('auth.pleaseInputPhone'))
  if (!validatePhone(phone)) return showToast(t('auth.phoneInvalid'))
  if (regForm.value.password.length < 6 || regForm.value.password.length > 16) return showToast('密码需为 6-16 位')
  if (regForm.value.password !== regForm.value.cpassword) return showToast(t('auth.passwordNotMatch'))
  if (!String(regForm.value.captcha || '').trim() || !regForm.value.captcha_key) {
    return showToast(t('auth.pleaseInputCode'))
  }
  
  loading.value = true
  try {
    const payload = {
      username: regForm.value.username,
      password: regForm.value.password,
      cpassword: regForm.value.cpassword,
      reccode: regForm.value.reccode,
      userbankname: String(regForm.value.userbankname || '').trim(),
      phone,
      captcha: String(regForm.value.captcha || '').trim(),
      captcha_key: regForm.value.captcha_key
    }
    const res = await authApi.register(payload)
    if (res.code === 0 || res.code === 200) {
      const loginData = {
        token: res.data?.token,
        refreshToken: res.data?.refreshToken,
        user: res.data?.user,
        expiresIn: res.data?.expiresIn || 7200
      }
      
      if (loginData.token && handleLoginSuccess(loginData)) {
        resetAuthState()
        heartbeatService.restart()
        showToast({ type: 'success', message: t('auth.registerSuccess') })
        emit('success')
        close()
        setTimeout(() => window.location.reload(), 500)
      } else {
        showToast({ type: 'success', message: t('auth.registerSuccessLogin') })
        activeTab.value = 'login'
        loginForm.value.username = regForm.value.username
        loginForm.value.password = regForm.value.password
      }
    } else {
      showToast(res.message)
      refreshCaptcha()
    }
  } catch (e) {
    showToast(e.message)
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

const goService = async () => {
  close()
  await openOnlineCustomerService()
}
const goForget = async () => {
  close()
  await openOnlineCustomerService()
}
</script>

<style lang="scss" scoped>
.v5-auth-modal {
  width: 92%;
  max-width: 400px;
  overflow: visible;
  background-color: transparent !important;
  margin-top: 0;
}

.auth-content {
  background: #fff;
  border-radius: 12px;
  padding: 15px 12px 12px;
  position: relative;
}

.auth-header {
  text-align: center;
  margin-bottom: 8px;
}

.logo-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.logo-img {
  width: 32px;
  height: 32px;
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

:deep(.highlight) {
  color: #E60012;
}

.promo-text {
  text-align: center;
  margin-bottom: 12px;
}

.promo-text p {
  font-size: 13px;
  margin: 2px 0;
  color: #666;
  white-space: nowrap;
  transform: scale(0.98);
}

.site-url {
  font-weight: 700;
  color: #26A17B;
  margin-top: 8px;
  font-size: 14px;
}

.url-highlight {
  font-size: 16px;
}

.auth-tabs {
  display: flex;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 12px;
  justify-content: space-around;
}

.tab-item {
  font-size: 18px;
  color: #999;
  padding: 8px 0;
  position: relative;
  cursor: pointer;
  flex: 1;
  text-align: center;
  transition: color 0.2s ease;
}

.tab-item.active {
  color: #26A17B;
  font-weight: 700;
  font-size: 20px;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 3px;
  background: #26A17B;
  border-radius: 2px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-label {
  font-size: 14px;
  color: #999;
  margin-bottom: -6px;
  text-align: center;
}

.form-item {
  display: flex;
  align-items: center;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  padding: 0 12px;
  height: 48px;
  transition: border-color 0.2s ease;
}

.form-item:focus-within {
  border-color: #26A17B;
}

.input-icon {
  font-size: 22px;
  color: #bbb;
  margin-right: 12px;
}

.tip-box {
  background: rgba(255,215,0,0.15);
  color: #e6a700;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  text-align: center;
  border: 1px solid rgba(255,215,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.code-highlight {
  font-weight: 700;
  font-size: 14px;
  color: #26A17B;
}

.custom-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  color: #333;
  background: transparent;
}

.custom-input::placeholder {
  color: #bbb;
}

.eye-icon {
  font-size: 22px;
  color: #bbb;
  padding: 4px;
  cursor: pointer;
}

.required {
  color: #ff4d4f;
  margin-left: 4px;
  font-size: 14px;
}

.pwd-strength {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #666;
  gap: 8px;
  margin-top: -8px;
}

.strength-bars {
  display: flex;
  gap: 4px;
  flex: 1;
}

.bar {
  height: 5px;
  flex: 1;
  background: #f5f5f5;
  border-radius: 2px;
  transition: background 0.2s ease;
}

.bar.filled {
  background: #26A17B;
}

.strength-text {
  font-weight: 700;
  color: #26A17B;
  font-size: 13px;
}

.pwd-tips {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
  flex-wrap: wrap;
  margin-top: -8px;
}

.pwd-tips span {
  display: flex;
  align-items: center;
  gap: 2px;
}

.pwd-tips span.valid {
  color: #26A17B;
}

.agreement-row {
  font-size: 13px;
}

.link {
  color: #26A17B;
}

.auth-footer {
  display: flex;
  justify-content: space-around;
  margin-top: 12px;
  padding-top: 12px;
  padding-bottom: 5px;
  border-top: 1px solid #f5f5f5;
}

.link-item {
  font-size: 14px;
  color: #26A17B;
  cursor: pointer;
  font-weight: 500;
}

.link-item:active {
  opacity: 0.8;
}

.submit-btn {
  height: 46px;
  font-size: 18px;
  letter-spacing: 1px;
  border-radius: 8px;
  animation: btn-pulse 1.5s ease-in-out infinite;
}

@keyframes btn-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(0, 150, 136, 0.3);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 4px 16px rgba(0, 150, 136, 0.5);
  }
}
</style>

<style lang="scss">
/* Desktop authentication dialog: a quiet visual rail beside a focused form. */
.v5-auth-modal {
  width: min(920px, calc(100vw - 32px)) !important;
  max-width: none !important;
  overflow: visible !important;
  background: transparent !important;
}

.v5-auth-modal .auth-content {
  padding: 0;
  overflow: hidden;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(20, 82, 65, 0.24);
}

.v5-auth-modal .auth-shell {
  display: grid;
  grid-template-columns: minmax(280px, 42%) minmax(0, 1fr);
  min-height: 560px;
}

.v5-auth-modal .auth-visual {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: 38px 38px 34px;
  color: #fff;
  background: linear-gradient(148deg, #92d9c5 0%, #3db58f 48%, #16866c 100%);
}

.v5-auth-modal .auth-visual::before,
.v5-auth-modal .auth-visual::after {
  position: absolute;
  content: '';
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.34);
  pointer-events: none;
}

.v5-auth-modal .auth-visual::before {
  width: 340px;
  height: 340px;
  right: -178px;
  top: 120px;
}

.v5-auth-modal .auth-visual::after {
  width: 210px;
  height: 210px;
  left: -132px;
  bottom: -68px;
}

.v5-auth-modal .visual-brand {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
}

.v5-auth-modal .visual-logo {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.92);
}

.v5-auth-modal .visual-brand :is(.highlight) {
  color: #0d6f59;
}

.v5-auth-modal .visual-copy {
  position: relative;
  z-index: 1;
  margin-top: auto;
  padding-top: 120px;
}

.v5-auth-modal .visual-eyebrow {
  display: block;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
  letter-spacing: 0.08em;
}

.v5-auth-modal .visual-copy h2 {
  margin: 0 0 10px;
  color: #fff;
  font-size: clamp(28px, 3.5vw, 42px);
  line-height: 1.1;
}

.v5-auth-modal .visual-copy p {
  margin: 0 0 13px;
  color: #fff;
  font-size: 22px;
  font-weight: 600;
}

.v5-auth-modal .visual-copy small {
  display: block;
  max-width: 240px;
  color: rgba(255, 255, 255, 0.84);
  font-size: 13px;
  line-height: 1.7;
}

.v5-auth-modal .visual-orbit,
.v5-auth-modal .visual-shine {
  position: absolute;
  pointer-events: none;
}

.v5-auth-modal .visual-orbit {
  z-index: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
}

.v5-auth-modal .orbit-one {
  width: 128px;
  height: 128px;
  right: 28px;
  top: 178px;
}

.v5-auth-modal .orbit-two {
  width: 48px;
  height: 48px;
  right: 112px;
  top: 128px;
}

.v5-auth-modal .visual-shine {
  width: 180px;
  height: 180px;
  right: -72px;
  bottom: 54px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}

.v5-auth-modal .auth-panel {
  position: relative;
  min-width: 0;
  padding: 38px 48px 28px;
  background: #fff;
}

.v5-auth-modal .panel-close {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: #52796d;
  background: #eaf5f1;
  cursor: pointer;
}

.v5-auth-modal .panel-close:hover {
  color: #0d765e;
  background: #d8eee7;
}

.v5-auth-modal .auth-tabs {
  justify-content: flex-start;
  gap: 30px;
  margin: 0 0 28px;
  border-bottom: 1px solid #e5efec;
}

.v5-auth-modal .tab-item {
  flex: 0 0 auto;
  padding: 0 0 13px;
  border: 0;
  color: #8b9f99;
  background: transparent;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.v5-auth-modal .tab-item.active {
  color: #16866c;
  font-size: 22px;
  font-weight: 700;
}

.v5-auth-modal .tab-item.active::after {
  bottom: -1px;
  width: 34px;
  height: 3px;
  background: #26A17B;
}

.v5-auth-modal .auth-form {
  gap: 16px;
}

.v5-auth-modal .form-heading {
  margin: 0 0 1px;
}

.v5-auth-modal .form-heading h1 {
  margin: 0 0 6px;
  color: #263d36;
  font-size: 25px;
  line-height: 1.2;
}

.v5-auth-modal .form-heading p {
  margin: 0;
  color: #899b95;
  font-size: 13px;
}

.v5-auth-modal .field-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.v5-auth-modal .field-group > label {
  color: #667f77;
  font-size: 13px;
  line-height: 1.2;
}

.v5-auth-modal .field-group > label em {
  margin-left: 5px;
  color: #a4b3ae;
  font-style: normal;
}

.v5-auth-modal .field-hint {
  margin: -1px 0 0;
  color: #7f958e;
  font-size: 11px;
  line-height: 1.4;
}

.v5-auth-modal .password-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.v5-auth-modal .password-pair {
  gap: 6px;
}

.v5-auth-modal .field-tip-box {
  margin-top: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  background: #f3f5f4;
}

.v5-auth-modal .field-tip-text {
  margin: 0;
  color: #5f736c;
  font-size: 12px;
  line-height: 1.5;
}

.v5-auth-modal .field-error-text {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 6px 0 0;
  color: #e34d59;
  font-size: 12px;
  line-height: 1.4;
}

.v5-auth-modal .field-error-text .van-icon {
  font-size: 14px;
}

.v5-auth-modal .captcha-row {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

.v5-auth-modal .captcha-input {
  flex: 1;
  min-width: 0;
}

.v5-auth-modal .captcha-image-btn {
  flex: 0 0 118px;
  height: 52px;
  padding: 0;
  border: 1px solid #dce9e5;
  border-radius: 8px;
  background: #f7faf9;
  overflow: hidden;
  cursor: pointer;
}

.v5-auth-modal .captcha-image-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.v5-auth-modal .captcha-image-btn img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.v5-auth-modal .captcha-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #7f958e;
  font-size: 12px;
}

.v5-auth-modal .form-item {
  height: 52px;
  padding: 0 15px;
  border: 1px solid #dce9e5;
  border-radius: 8px;
  background: #fff;
}

.v5-auth-modal .form-item:focus-within {
  border-color: #45b895;
  box-shadow: 0 0 0 3px rgba(38, 161, 123, 0.12);
}

.v5-auth-modal .input-icon {
  margin-right: 11px;
  color: #8da59d;
  font-size: 19px;
}

.v5-auth-modal .form-item .custom-input {
  color: #283f38;
  font-size: 15px;
  background: transparent;
}

.v5-auth-modal .custom-input::placeholder {
  color: #a4b5af;
}

.v5-auth-modal .eye-icon {
  color: #819c93;
  font-size: 19px;
}

.v5-auth-modal .required {
  color: #ed6b6b;
}

.v5-auth-modal .agreement-row {
  margin-top: -2px;
  color: #758b84;
  font-size: 12px;
}

.v5-auth-modal .link {
  color: #16866c;
}

.v5-auth-modal .submit-btn {
  height: 52px;
  margin-top: 2px;
  border-radius: 8px;
  background: #26A17B !important;
  box-shadow: 0 8px 18px rgba(38, 161, 123, 0.24);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.08em;
  animation: none;
}

.v5-auth-modal .auth-footer {
  justify-content: flex-start;
  gap: 22px;
  margin-top: 21px;
  padding: 0;
  border: 0;
}

.v5-auth-modal .link-item {
  color: #66877d;
  font-size: 12px;
  font-weight: 400;
}

.v5-auth-modal .link-item:hover {
  color: #0d765e;
}

@mixin mobile-auth-layout {
  width: min(430px, calc(100vw - 20px)) !important;
  max-height: calc(100dvh - 16px);
  overflow: hidden !important;
  border: 1px solid rgba(220, 183, 73, 0.55);
  border-radius: 16px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.72), 0 0 28px rgba(209, 169, 55, 0.12);

  .auth-content {
    max-height: calc(100dvh - 16px);
    border-radius: 15px;
    background: #0b0b0b;
  }

  .auth-shell {
    display: flex;
    min-height: 0;
    max-height: calc(100dvh - 16px);
    flex-direction: column;
  }

  .auth-visual {
    min-height: 76px;
    flex: 0 0 76px;
    justify-content: center;
    padding: 12px 54px 12px 18px;
    border-bottom: 1px solid rgba(218, 181, 70, 0.34);
    background: radial-gradient(circle at 18% 0%, #342d17 0, #15130d 34%, #050505 76%);
  }

  .auth-visual::before,
  .auth-visual::after,
  .visual-copy,
  .visual-orbit,
  .visual-shine {
    display: none;
  }

  .visual-brand {
    gap: 10px;
    color: #f0d777;
    font-size: 17px;
    letter-spacing: 0.03em;
  }

  .visual-logo {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #050505;
    box-shadow: 0 0 0 1px rgba(236, 203, 100, 0.3), 0 6px 16px rgba(0, 0, 0, 0.45);
  }

  .visual-brand :is(.highlight) {
    color: #d7b748;
  }

  .auth-panel {
    min-height: 0;
    max-height: calc(100dvh - 92px);
    padding: 16px 18px 20px;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    color: #e8e8e8;
    background: linear-gradient(180deg, #111 0%, #080808 100%);
    scrollbar-color: #6c5a24 #151515;
  }

  .panel-close {
    top: 20px;
    right: 14px;
    z-index: 3;
    width: 32px;
    height: 32px;
    border: 1px solid rgba(225, 193, 91, 0.35);
    color: #e5c75e;
    background: rgba(0, 0, 0, 0.48);
  }

  .auth-tabs {
    position: sticky;
    top: -16px;
    z-index: 2;
    gap: 24px;
    margin: 0 0 18px;
    padding-top: 10px;
    border-bottom-color: #38301b;
    background: #101010;
  }

  .tab-item {
    padding-bottom: 10px;
    color: #777;
    font-size: 15px;
  }

  .tab-item.active {
    color: #f1d36a;
    font-size: 19px;
  }

  .tab-item.active::after {
    background: linear-gradient(90deg, #a77c20, #f1d36a);
    box-shadow: 0 0 9px rgba(229, 191, 72, 0.42);
  }

  .auth-form {
    gap: 12px;
  }

  .form-heading h1 {
    margin-bottom: 4px;
    color: #f0d777;
    font-size: 21px;
  }

  .form-heading p {
    color: #858585;
    font-size: 12px;
  }

  .field-group {
    gap: 5px;
  }

  .field-group > label {
    color: #c2b993;
    font-size: 12px;
  }

  .field-group > label em {
    color: #777;
  }

  .field-hint {
    display: block;
    margin-top: 0;
    color: #777;
    font-size: 11px;
  }

  .form-item {
    height: 46px;
    padding: 0 12px;
    border-color: #3c3728;
    background: #151515;
  }

  .form-item:focus-within {
    border-color: #d6b44a;
    box-shadow: 0 0 0 3px rgba(214, 180, 74, 0.12);
  }

  .form-item .custom-input {
    min-width: 0;
    color: #f2f2f2;
    font-size: 16px;
    background: transparent;
  }

  .custom-input::placeholder {
    color: #656565;
  }

  .input-icon,
  .eye-icon {
    color: #bda553;
  }

  .field-tip-box {
    background: #17150f;
    border: 1px solid #332d1b;
  }

  .field-tip-text {
    color: #999078;
  }

  .captcha-image-btn {
    height: 46px;
    border-color: #4d4325;
    background: #f2ead1;
  }

  .agreement-row {
    color: #979797;
    line-height: 1.45;
  }

  .link {
    color: #e0be53;
  }

  .submit-btn {
    height: 46px;
    margin-top: 0;
    border: 0 !important;
    color: #15120a !important;
    background: linear-gradient(100deg, #fff0ba, #e8c654) !important;
    box-shadow: 0 8px 20px rgba(214, 180, 74, 0.2);
    font-size: 16px;
  }

  .auth-footer {
    justify-content: space-between;
    gap: 8px;
    margin-top: 16px;
    border-top: 1px solid #2d291d;
    padding-top: 14px;
  }

  .link-item {
    white-space: nowrap;
    color: #c8aa4d;
    font-size: 11px;
  }

  .link-item:hover {
    color: #f0d777;
  }
}

.v5-auth-modal--mobile {
  @include mobile-auth-layout;
}

@media (max-width: 700px) {
  .v5-auth-modal {
    @include mobile-auth-layout;
  }
}

@media (max-width: 700px) and (max-height: 620px) {
  .v5-auth-modal .auth-visual {
    display: none;
  }

  .v5-auth-modal .auth-panel {
    max-height: calc(100dvh - 16px);
    padding-top: 12px;
  }

  .v5-auth-modal .panel-close {
    top: 8px;
    right: 10px;
    color: #14765f;
    background: #e7f4ef;
  }

  .v5-auth-modal .auth-tabs {
    padding-right: 40px;
  }
}
</style>



