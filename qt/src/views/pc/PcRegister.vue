<template>
  <main class="pc-register-page">
    <div class="register-shell">
      <div class="register-actions" aria-label="注册页导航">
        <button type="button" class="back-button" aria-label="返回大厅" @click="goLobby">
          <van-icon name="arrow-left" />
          <span>返回大厅</span>
        </button>
        <button type="button" class="close-button" aria-label="关闭注册页" @click="goLobby">
          <van-icon name="cross" />
        </button>
      </div>
      <section class="register-form-panel">
        <div class="register-heading">
          <h1><span>欢迎注册</span><b>register</b></h1>
          <p>创建您的平台账号，开启稳定、流畅的娱乐体验</p>
        </div>

        <form class="register-form" novalidate @submit.prevent="handleRegister">
          <div class="form-row">
            <label class="input-box" :class="{ invalid: errors.username }">
              <van-icon name="manager-o" />
              <input
                v-model.trim="form.username"
                type="text"
                maxlength="15"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                placeholder="用户名"
                @blur="checkUsernameAvailability"
              />
            </label>
            <p class="field-hint" :class="{ error: errors.username }">{{ errors.username || '用户名必须是6-15位的字母或数字' }}</p>
          </div>

          <div class="form-row">
            <label class="input-box" :class="{ invalid: errors.password }">
              <van-icon name="lock" />
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                maxlength="16"
                autocomplete="new-password"
                placeholder="密码"
              />
              <button type="button" class="eye-button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword">
                <van-icon :name="showPassword ? 'eye-o' : 'closed-eye'" />
              </button>
            </label>
            <p class="field-hint" :class="{ error: errors.password }">{{ errors.password || '请输入8-16位，可输入大小写字母/数字/特殊符号' }}</p>
          </div>

          <div class="form-row">
            <label class="input-box" :class="{ invalid: errors.confirmPassword }">
              <van-icon name="lock" />
              <input v-model="form.confirmPassword" :type="showPassword ? 'text' : 'password'" maxlength="16" autocomplete="new-password" placeholder="确认密码" />
            </label>
            <p class="field-hint" :class="{ error: errors.confirmPassword }">{{ errors.confirmPassword || '请再次确认密码' }}</p>
          </div>

          <div class="form-row">
            <label class="input-box" :class="{ invalid: errors.realName }">
              <van-icon name="contact" />
              <input v-model.trim="form.realName" type="text" maxlength="30" autocomplete="name" placeholder="姓名" />
            </label>
            <p class="field-hint" :class="{ error: errors.realName }">{{ errors.realName || '姓名必须是中文' }}</p>
          </div>

          <div class="form-row">
            <label class="input-box" :class="{ invalid: errors.phone }">
              <van-icon name="phone-o" />
              <input v-model.trim="form.phone" type="tel" inputmode="numeric" maxlength="11" autocomplete="tel" placeholder="手机号" />
            </label>
            <p class="field-hint" :class="{ error: errors.phone }">{{ errors.phone || '手机号必须是11位数字' }}</p>
          </div>

          <div class="form-row captcha-row">
            <label class="input-box" :class="{ invalid: errors.captcha }">
              <van-icon name="shield-o" />
              <input v-model.trim="form.captcha" type="text" maxlength="4" autocomplete="off" placeholder="验证码" @keyup.enter="handleRegister" />
            </label>
            <button class="captcha-image" type="button" :disabled="captchaLoading" title="点击刷新验证码" @click="refreshCaptcha">
              <img v-if="captchaImage" :src="captchaImage" alt="验证码" />
              <span v-else>{{ captchaLoading ? '加载中' : '点击获取' }}</span>
            </button>
            <p class="field-hint captcha-hint" :class="{ error: errors.captcha }">{{ errors.captcha || '请输入右侧验证码' }}</p>
          </div>

          <button class="register-submit" type="submit" :disabled="loading">
            <van-loading v-if="loading" size="18" color="#151515" />
            <span v-else>立即注册</span>
          </button>
        </form>

        <div class="login-prompt">
          已经有账号？
          <button type="button" @click="goLogin">请立即登录</button>
        </div>
      </section>

      <aside class="register-aside">
        <div class="aside-divider" aria-hidden="true"></div>
        <div class="download-card">
          <div class="qr-frame">
            <img v-if="qrImage" :src="qrImage" alt="下载 StarRex APP" />
            <div v-else class="qr-placeholder">APP</div>
          </div>
          <h2>扫码下载 StarRex APP</h2>
          <p>（iOS / Android 通用）</p>
        </div>
        <div class="aside-visual" aria-hidden="true">
          <div class="visual-glow"></div>
          <img class="visual-mark" src="/assets/img/starrex-icon.png" alt="" />
          <div class="visual-phone">
            <div class="phone-top"></div>
            <div class="phone-screen"><img src="/assets/img/starrex-wordmark.png" alt="" /></div>
          </div>
          <span class="visual-star star-one">✦</span>
          <span class="visual-star star-two">✧</span>
        </div>
        <p class="share-line">H5页面访问：{{ siteDomain }}</p>
      </aside>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import QRCode from 'qrcode'
import { authApi } from '@/api/auth'
import { homeApi } from '@/api/home'
import { handleLoginSuccess } from '@/utils/auth'
import { resetAuthState } from '@/api/request'
import { heartbeatService } from '@/utils/heartbeat'
import { validatePhone } from '@/utils/validators'
import { isMobileLayout } from '@/utils/device'

defineOptions({ name: 'PcRegister' })

const router = useRouter()
const loading = ref(false)
const showPassword = ref(false)
const captchaLoading = ref(false)
const captchaImage = ref('')
const captchaKey = ref('')
const qrImage = ref('')
const siteDomain = ref(window.location.host)
const form = reactive({ username: '', password: '', confirmPassword: '', realName: '', phone: '', captcha: '', reccode: '' })
const errors = reactive({ username: '', password: '', confirmPassword: '', realName: '', phone: '', captcha: '' })

const clearErrors = () => Object.keys(errors).forEach((key) => { errors[key] = '' })

const refreshCaptcha = async () => {
  if (captchaLoading.value) return
  captchaLoading.value = true
  try {
    const res = await authApi.getRegisterCaptcha()
    captchaImage.value = res.data?.image || ''
    captchaKey.value = res.data?.key || ''
    form.captcha = ''
  } catch (error) {
    captchaImage.value = ''
    captchaKey.value = ''
    showToast(error.message || '验证码加载失败')
  } finally {
    captchaLoading.value = false
  }
}

const checkUsernameAvailability = async () => {
  if (!/^[A-Za-z0-9]{6,15}$/.test(form.username)) return
  try {
    const res = await authApi.checkUsername(form.username)
    if (res.data?.ishas || res.data?.available === false) errors.username = '用户名已被注册'
  } catch (error) {
    // 提交时仍由服务端再次校验，失焦检查失败不阻塞注册。
  }
}

const validate = () => {
  clearErrors()
  if (!/^[A-Za-z0-9]{6,15}$/.test(form.username)) errors.username = '用户名必须是6-15位的字母或数字'
  if (!/^[\s\S]{8,16}$/.test(form.password)) errors.password = '密码必须是8-16位'
  if (form.password !== form.confirmPassword) errors.confirmPassword = '两次密码输入不一致'
  if (!/^[\u4e00-\u9fa5]{2,30}$/.test(form.realName)) errors.realName = '姓名必须是中文'
  if (!validatePhone(form.phone)) errors.phone = '手机号必须是11位数字'
  if (!form.captcha || !captchaKey.value) errors.captcha = '请输入验证码'
  return !Object.values(errors).some(Boolean)
}

const handleRegister = async () => {
  if (!validate() || loading.value) return
  loading.value = true
  try {
    const res = await authApi.register({
      username: form.username,
      password: form.password,
      cpassword: form.confirmPassword,
      userbankname: form.realName,
      phone: form.phone,
      captcha: form.captcha,
      captcha_key: captchaKey.value,
      reccode: form.reccode,
      client: 'pc'
    })
    const loginData = {
      token: res.data?.token,
      refreshToken: res.data?.refreshToken,
      user: res.data?.user,
      expiresIn: res.data?.expiresIn || 7200
    }
    if (loginData.token) {
      handleLoginSuccess(loginData)
      resetAuthState()
      heartbeatService.restart()
      showToast({ type: 'success', message: '注册成功' })
      await router.replace('/pc')
    } else {
      showToast({ type: 'success', message: '注册成功，请登录' })
      await router.replace({ path: '/pc', query: { auth: 'login' } })
    }
  } catch (error) {
    showToast(error.message || '注册失败，请稍后重试')
    await refreshCaptcha()
  } finally {
    loading.value = false
  }
}

const goLogin = () => router.replace({ path: '/pc', query: { auth: 'login' } })
const goLobby = () => router.replace('/pc')

const buildQr = async () => {
  try {
    const config = await homeApi.getConfig()
    const configuredDomain = config.data?.sitedomain || window.location.host
    siteDomain.value = configuredDomain
    const protocol = window.location.protocol === 'http:' || window.location.protocol === 'https:' ? window.location.protocol : 'https:'
    qrImage.value = await QRCode.toDataURL(`${protocol}//${configuredDomain}/#/`, { width: 168, margin: 1, color: { dark: '#111111', light: '#ffffff' } })
  } catch (error) {
    qrImage.value = await QRCode.toDataURL(window.location.origin, { width: 168, margin: 1 })
  }
}

onMounted(() => {
  if (isMobileLayout()) {
    router.replace({ path: '/home-new', query: { auth: 'register' } })
    return
  }
  const params = new URLSearchParams(window.location.search)
  form.reccode = params.get('invite') || params.get('tgid') || params.get('code') || params.get('reccode') || ''
  refreshCaptcha()
  buildQr()
})
</script>

<style scoped>
.pc-register-page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 30px 36px;
  overflow: auto;
  color: #f4f4f4;
  background: radial-gradient(circle at 12% 0%, #242424 0, #101010 35%, #050505 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.register-shell {
  position: relative;
  width: min(1140px, 100%);
  min-height: 650px;
  display: grid;
  grid-template-columns: minmax(650px, 1fr) 330px;
  background: #050505;
  border: 1px solid #252525;
  border-radius: 16px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, .52), inset 0 1px rgba(255, 255, 255, .035);
  overflow: hidden;
}

.register-actions { position: absolute; z-index: 4; top: 14px; left: 18px; right: 18px; display: flex; align-items: center; justify-content: space-between; }
.back-button, .close-button { border: 0; color: #a7a7a7; background: transparent; cursor: pointer; transition: color .2s, transform .2s; }
.back-button { display: inline-flex; align-items: center; gap: 7px; padding: 7px 9px; font-size: 12px; }
.back-button .van-icon { font-size: 15px; }
.close-button { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; font-size: 21px; }
.back-button:hover, .close-button:hover { color: #f2d36d; }
.close-button:hover { transform: rotate(90deg); }
.register-form-panel { padding: 58px 50px 34px; }
.register-heading { margin-bottom: 28px; }
.register-heading h1 { margin: 0; font-size: 27px; font-weight: 500; letter-spacing: .5px; }
.register-heading h1 span { color: #d8d8d8; }
.register-heading h1 b { margin-left: 4px; color: #f4cf68; font-weight: 500; }
.register-heading p { margin: 8px 0 0; color: #7f7f7f; font-size: 13px; }

.register-form { width: min(100%, 660px); }
.form-row { display: grid; grid-template-columns: 308px 1fr; align-items: center; gap: 16px; min-height: 60px; }
.input-box { height: 43px; display: flex; align-items: center; border: 1px solid #9d9d9d; border-radius: 8px; background: #080808; color: #ececec; transition: border-color .2s, box-shadow .2s; }
.input-box:focus-within { border-color: #f2d36d; box-shadow: 0 0 0 2px rgba(242, 211, 109, .12); }
.input-box.invalid { border-color: #dc5e52; }
.input-box > .van-icon { width: 45px; display: grid; place-items: center; color: #fff; font-size: 19px; }
.input-box input { min-width: 0; flex: 1; height: 100%; border: 0; outline: 0; background: transparent; color: #f5f5f5; font-size: 14px; }
.input-box input::placeholder { color: #bdbdbd; }
.eye-button { width: 38px; height: 100%; border: 0; background: transparent; color: #999; cursor: pointer; }
.field-hint { margin: 0; color: #a9a9a9; font-size: 12px; line-height: 1.5; }
.field-hint::first-letter { color: #e1493f; }
.field-hint.error { color: #ed766a; }
.captcha-row { grid-template-columns: 240px 100px 1fr; gap: 10px; }
.captcha-image { height: 43px; padding: 0; overflow: hidden; border: 1px solid #9d9d9d; border-radius: 8px; background: #f3f7f5; cursor: pointer; }
.captcha-image img { display: block; width: 100%; height: 100%; object-fit: cover; }
.captcha-image span { color: #4f7467; font-size: 12px; }
.captcha-hint { margin-left: 2px; }

.register-submit { width: 308px; height: 56px; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 17px; border: 0; border-radius: 28px; color: #1b1b1b; background: linear-gradient(100deg, #fff0ba, #f1d46b); box-shadow: 0 8px 22px rgba(240, 208, 101, .12); font-size: 16px; cursor: pointer; transition: transform .2s, filter .2s; }
.register-submit:hover { filter: brightness(1.06); transform: translateY(-1px); }
.register-submit:disabled { cursor: wait; opacity: .7; }
.login-prompt { width: 308px; margin-top: 20px; text-align: center; color: #8d8d8d; font-size: 13px; }
.login-prompt button { padding: 0; border: 0; color: #f2d36d; background: transparent; cursor: pointer; }

.register-aside { position: relative; display: flex; flex-direction: column; align-items: center; padding: 40px 22px 28px; background: linear-gradient(180deg, #080808, #11100b); }
.aside-divider { position: absolute; left: 0; top: 25px; bottom: 25px; width: 1px; background: linear-gradient(180deg, transparent, #5e5330 20%, #5e5330 80%, transparent); }
.download-card { text-align: center; }
.qr-frame { width: 155px; height: 155px; margin: 0 auto 16px; padding: 8px; background: #fff; border-radius: 4px; box-shadow: 0 0 0 1px #e6cf75; }
.qr-frame img, .qr-placeholder { width: 100%; height: 100%; display: grid; place-items: center; object-fit: contain; color: #222; font-weight: 700; }
.download-card h2 { margin: 0; color: #e7e7e7; font-size: 14px; font-weight: 500; }
.download-card p { margin: 8px 0 0; color: #f0cf61; font-size: 13px; }
.aside-visual { position: relative; width: 260px; height: 250px; margin-top: 28px; display: grid; place-items: center; }
.visual-glow { position: absolute; width: 210px; height: 110px; bottom: 20px; border-radius: 50%; background: rgba(227, 183, 59, .2); filter: blur(28px); }
.visual-mark { position: absolute; z-index: 1; width: 83px; height: 83px; left: 13px; bottom: 32px; object-fit: contain; filter: drop-shadow(0 8px 12px rgba(0,0,0,.5)); }
.visual-phone { position: relative; z-index: 2; width: 134px; height: 220px; padding: 12px 6px; border: 3px solid #b9b9b9; border-radius: 20px; background: #161616; transform: rotate(8deg); box-shadow: 0 12px 25px rgba(0, 0, 0, .55); }
.phone-top { width: 42px; height: 4px; margin: -3px auto 8px; border-radius: 4px; background: #555; }
.phone-screen { height: 186px; display: grid; place-items: center; overflow: hidden; border-radius: 11px; background: radial-gradient(circle, #4b3d1e, #0a0a0a 65%); }
.phone-screen img { width: 90px; height: auto; transform: rotate(-8deg); }
.visual-star { position: absolute; z-index: 3; color: #f1d46b; text-shadow: 0 0 12px #f1d46b; font-size: 24px; }
.star-one { top: 27px; right: 12px; }
.star-two { bottom: 20px; right: 23px; font-size: 18px; }
.share-line { margin: auto 0 0; color: #858585; font-size: 11px; text-align: center; word-break: break-all; }

@media (max-width: 900px) {
  .pc-register-page { padding: 20px; }
  .register-shell { grid-template-columns: 1fr; max-width: 620px; }
  .register-aside { display: none; }
  .register-form-panel { padding: 32px 28px; }
  .form-row { grid-template-columns: 1fr; gap: 5px; min-height: 73px; }
  .field-hint { min-height: 17px; }
  .captcha-row { grid-template-columns: 1fr 100px; }
  .captcha-hint { grid-column: 1 / -1; }
  .register-submit, .login-prompt { width: 100%; }
}
</style>
