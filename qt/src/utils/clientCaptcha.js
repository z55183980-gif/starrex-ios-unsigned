/** 纯前端图形验证码（不请求、不提交后端） */

export function createCaptchaCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

/**
 * @param {string} input 用户输入
 * @param {string} expected 当前展示的验证码
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateClientCaptcha(input, expected) {
  const value = String(input ?? '').trim()
  const code = String(expected ?? '').trim()
  if (!value) {
    return { ok: false, message: '请输入验证码' }
  }
  if (value !== code) {
    return { ok: false, message: '验证码不正确' }
  }
  return { ok: true }
}
