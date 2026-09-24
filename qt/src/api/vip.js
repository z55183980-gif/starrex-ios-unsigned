import request from './request'

export const vipApi = {
  getVipPrivileges() {
    return request({ url: '/v1/level-rewards/vip-privileges', method: 'get' })
  },
  
  getLevelConfigs() {
    return request({
      url: '/v1/level-rewards/configs',
      method: 'get'
    })
  },

  
  getRewardInfo() {
    return request({
      url: '/v1/level-rewards',
      method: 'get'
    })
  },

  
  claimReward() {
    return request({
      url: '/v1/level-rewards',
      method: 'post'
    })
  },

  claimPeriodicReward(period) {
    return request({
      url: '/v1/level-rewards/claim-periodic',
      method: 'post',
      data: { period }
    })
  },

  
  getRecords(params) {
    return request({
      url: '/v1/level-rewards/records',
      method: 'get',
      params
    })
  }
}
