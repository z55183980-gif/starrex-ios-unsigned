import request from '../request'

export default {

  getPaymentChannels() {
    return request({
      url: '/v1/payment/channels',
      method: 'get'
    })
  },

  createOrder(data) {
    return request({
      url: '/v1/payment/order',
      method: 'post',
      data
    })
  },

  getOrderStatus(orderId) {
    return request({
      url: `/v1/payment/order/${orderId}`,
      method: 'get'
    })
  }
}


