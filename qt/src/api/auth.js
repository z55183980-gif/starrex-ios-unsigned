import request from './request'

export const authApi = {
  /** 仅提交账号密码；验证码在前端校验，不传后端 */
  login({ username, password }) {
    return request({
      url: '/v1/auth/login',
      method: 'post',
      data: { username, password }
    })
  },

  register(data) {
    return request({
      url: '/v1/register',
      method: 'post',
      data
    })
  },

  getRegisterCaptcha() {
    return request({
      url: '/v1/register/captcha',
      method: 'get'
    })
  },

  logout() {
    return request({
      url: '/v1/auth/logout',
      method: 'post'
    })
  },

  getProfile() {
    return request({
      url: '/v1/auth/profile',
      method: 'get'
    })
  },

  checkUsername(username) {
    return request({
      url: '/v1/check-username',
      method: 'post',
      data: { username }
    })
  },

  validateReccode(reccode) {
    return request({
      url: '/v1/validate-reccode',
      method: 'post',
      data: { reccode }
    })
  },

  updateProfile(data) {
    return request({
      url: '/v1/auth/profile',
      method: 'put',
      data
    })
  },

  heartbeat() {
    return request({
      url: '/v1/auth/heartbeat',
      method: 'post'
    })
  }
}
