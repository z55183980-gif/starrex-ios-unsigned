<template>
  <div class="v5-banner">
    <van-swipe :autoplay="4000" indicator-color="#e0be55" class="banner-swipe">
      <van-swipe-item v-for="(item, index) in banners" :key="index" @click="handleBannerClick(item)">
        <van-image :src="getImageUrl(item.image)" fit="fill" class="banner-img" />
      </van-swipe-item>
    </van-swipe>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { homeApi } from '@/api/home'
import { resolveMediaUrl } from '@/utils/mediaUrl'

const router = useRouter()
// 后台配置优先；本地数据库未启动或暂未配置移动端轮播图时，
// 复用项目内置的首页轮播素材，避免顶部区域完全空白。
const fallbackBanners = [
  { id: 'default-home-banner', image: '/assets/img/561.xrlb.pc.gif', url: '' }
]
const banners = ref(fallbackBanners)

const getImageUrl = (img) => resolveMediaUrl(img, '')

const handleBannerClick = (item) => {
  let url = item.url || item.link || item.jump_url
  if (!url) return
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    window.open(url, '_blank')
  } else if (url.includes('.com') || url.includes('.cn') || url.includes('.net') || url.includes('.org') || url.startsWith('www.')) {
    window.open('https://' + url, '_blank')
  } else if (url.startsWith('/')) {
    router.push(url)
  } else {
    router.push('/' + url)
  }
}

onMounted(async () => {
  try {
    const res = await homeApi.getBanners({ platform: 2, limit: 10 })
    if (res.code === 0 && Array.isArray(res.data) && res.data.length) banners.value = res.data
  } catch(e) {
    banners.value = fallbackBanners
  }
})
</script>

<style lang="scss" scoped>
.v5-banner {
  padding: 0;
  background: #080808;
}

/* 内框高度固定，任何尺寸的轮播图都拉伸铺满，不裁切 */
.banner-swipe {
  border-radius: 0;
  overflow: hidden;
  height: clamp(136px, 38vw, 154px);
}

.banner-img {
  width: 100%;
  height: 100%;
  display: block;

  :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: fill;
  }
}
</style>
