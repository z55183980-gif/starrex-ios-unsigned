<template>
  <div class="service-redirect">
    <van-loading v-if="loading" type="spinner" vertical>{{ t('msgCenter.connectingCs') }}</van-loading>
    <div v-else class="service-fail">
      <p>{{ errorText }}</p>
      <van-button type="primary" size="small" @click="retry">重试</van-button>
      <van-button plain size="small" class="ml-2" @click="goHome">返回首页</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { openOnlineCustomerService } from '@/utils/customerService'

const { t } = useI18n()

const router = useRouter()
const loading = ref(true)
const errorText = ref('')

const connect = async () => {
  loading.value = true
  errorText.value = ''
  try {
    await openOnlineCustomerService({ forceIm: true, replace: true })
    await nextTick()
    if (router.currentRoute.value.path.startsWith('/service')) {
      errorText.value = t('msgCenter.openCsFailed')
      loading.value = false
    }
  } catch (e) {
    errorText.value = e?.message || t('msgCenter.connectCsFailed')
    loading.value = false
  }
}

const retry = () => connect()
const goHome = () => router.replace({ name: 'Home' })

onMounted(() => {
  connect()
})
</script>

<style scoped>
.service-redirect {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0c0f1a;
  color: #fff;
}
.service-fail {
  text-align: center;
  padding: 24px;
}
.service-fail p {
  margin-bottom: 16px;
  opacity: 0.85;
}
.ml-2 {
  margin-left: 8px;
}
</style>
