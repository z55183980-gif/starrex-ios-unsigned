import userApi from './modules/user'
import lotteryApi from './modules/lottery'
import paymentApi from './modules/payment'
import animalApi from './modules/animal'
import k3Api from './k3'
import lhcApi from './lhc'
import pk10Api from './pk10'
import x5Api from './x5'
import pl3Api from './pl3'

export {
  userApi,
  lotteryApi,
  paymentApi,
  animalApi,
  k3Api,
  lhcApi,
  pk10Api,
  x5Api,
  pl3Api
}

export default {
  user: userApi,
  lottery: lotteryApi,
  payment: paymentApi,
  animal: animalApi,
  k3: k3Api,
  lhc: lhcApi,
  pk10: pk10Api,
  x5: x5Api,
  pl3: pl3Api
}

