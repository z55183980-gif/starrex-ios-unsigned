import request from './request'

export const homeApi = {
  getBanners(params = {}) {
    return request({
      url: '/v1/banners',
      method: 'get',
      params
    })
  },

  getNotices(params = {}) {
    return request({
      url: '/v1/notices',
      method: 'get',
      params
    })
  },

  getConfig() {
    return request({
      url: '/v1/config',
      method: 'get'
    })
  },

  getActivityPopup() {
    return request({
      url: '/v1/activity-popup',
      method: 'get'
    })
  },

  getQuickMenus() {
    return request({
      url: '/v1/quick-menus',
      method: 'get'
    })
  },

  getQuickEntries() {
    return request({
      url: '/v1/quick-entries',
      method: 'get'
    })
  }
}

export default homeApi
