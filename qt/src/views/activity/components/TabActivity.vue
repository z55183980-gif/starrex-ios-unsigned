<template>
  <div class="tab-activity" :class="{ embedded: props.embedded }">
    <div class="activity-main">
      <section class="activity-hero" aria-label="优惠活动主题">
        <div class="hero-copy">
          <span>每月独有优惠专题</span>
          <strong>奢华优惠</strong>
          <em>创新优惠风采　承当优惠王者</em>
        </div>
        <div class="hero-orbit hero-orbit-one"></div>
        <div class="hero-orbit hero-orbit-two"></div>
        <div class="hero-gift" aria-hidden="true">礼</div>
      </section>

      <nav class="category-nav" aria-label="活动分类">
        <button
          v-for="(item, index) in categories"
          :key="index"
          type="button"
          class="category-pill"
          :class="{ active: activeCategory === index }"
          @click="selectCategory(index)"
        >
          <img :src="item.iconImg" alt="" />
          <span>{{ item.text }}</span>
        </button>
      </nav>

      <div class="content-list" ref="contentListRef">
        <van-loading v-if="loading" type="spinner" size="24" style="margin: 40px auto;">加载中...</van-loading>

        <div
          class="activity-card"
          v-for="(act, index) in activities"
          :key="index"
          @click="goDetail(act)"
        >
          <img :src="act.image" class="card-img" />
          <div class="card-title">{{ act.title || '优惠活动' }}</div>
        </div>

        <div v-if="!loading && activities.length === 0" class="empty-text">暂无活动</div>
      </div>
    </div>

    <van-popup
      v-model:show="showActivityPopup"
      position="center"
      round
      closeable
      close-icon="cross"
      :overlay="true"
      :lock-scroll="true"
      class="activity-detail-popup"
    >
      <div class="activity-popup-content">
        <div class="activity-popup-header">
          <h2>{{ selectedActivity.title || '活动详情' }}</h2>
          <van-loading v-if="detailLoading" type="spinner" size="20" />
        </div>
        <div v-if="detailLoading" class="activity-popup-loading">加载中...</div>
        <div v-else class="activity-popup-body" v-safe-html="selectedActivity.content"></div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { activityApi } from '@/api/activity'
import { prepareActivityHtml, resolveMediaUrl } from '@/utils/mediaUrl'

const props = defineProps({ embedded: { type: Boolean, default: false } })
const contentListRef = ref(null)

const showActivityPopup = ref(false)
const detailLoading = ref(false)
const selectedActivity = ref({ title: '', content: '<p>暂无活动说明</p>' })

const categories = ref([])
const activeCategory = ref(0)
const selectedCategoryCode = ref('all')
const activityCategoryCodes = new Set(['all', 'hot', 'promotion', 'daily_red_packet', 'rescue', 'games'])

const fallbackCategories = [
  { text: '所有活动', iconImg: '/assets/img/icon_dtfl_zh_0.svg', code: 'all' },
  { text: '热门活动', iconImg: '/assets/img/icon_dtfl_zh_0.svg', code: 'hot' },
  { text: '全民推广', iconImg: '/assets/img/icon_dtfl_zh_0.svg', code: 'promotion' },
  { text: '每日红包', iconImg: '/assets/img/icon_dtfl_zh_0.svg', code: 'daily_red_packet' },
  { text: '救援活动', iconImg: '/assets/img/icon_dtfl_zh_0.svg', code: 'rescue' },
  { text: '游戏活动', iconImg: '/assets/img/icon_dtfl_zh_0.svg', code: 'games' },
]

const loadCategories = async () => {
  try {
    const res = await activityApi.getCategoryList()
    if (res.code === 0 && res.data && res.data.length > 0) {
      categories.value = res.data
        .filter(item => activityCategoryCodes.has(item.code))
        .map(item => ({
          text: item.code === 'all' || item.code === 'general' ? '所有活动' : item.name,
          iconImg: resolveMediaUrl(item.icon, '/assets/img/icon_dtfl_zh_0.svg'),
          code: item.code
        }))
      activeCategory.value = Math.max(0, categories.value.findIndex(item => item.code === selectedCategoryCode.value))
    } else {
      categories.value = fallbackCategories
    }
  } catch (error) {
    categories.value = fallbackCategories
  }
}

const selectCategory = (index) => {
  activeCategory.value = index
  selectedCategoryCode.value = categories.value[index]?.code || 'all'
  sessionStorage.setItem('activity_category', selectedCategoryCode.value)
}

const loading = ref(false)
const allActivities = ref([])

const loadActivities = async () => {
  loading.value = true
  try {
    const res = await activityApi.getActivityList()
    if (res.code === 0 && res.data && res.data.list) {
      allActivities.value = res.data.list.map(item => ({
        id: item.id,
        title: item.title,
        tag: getActivityTag(item.type_code || item.type),
        tagClass: getActivityTagClass(item.type_code || item.type),
        image: resolveMediaUrl(item.banner, '/assets/img/icon_sys_menu_service.svg'),
        type: item.type_code || item.type,
        category: item.category || [],
        status: item.status,
        jumpType: item.jump_type || 0,
        jumpUrl: item.jump_url || ''
      }))
    }
  } catch (error) {
    allActivities.value = []
  } finally {
    loading.value = false
    restoreScrollPosition()
  }
}

const getActivityTag = (type) => {
  const tagMap = {
    'lucky_order': '幸运',
    'loss_rescue': '救援',
    'weekly_salary': '周俸禄',
    'monthly_salary': '月俸禄',
    'pg_betting_king': '打码王',
    'deposit': '充值',
    'deposit_bonus': '充值',
    'other': '热门'
  }
  return tagMap[type] || '活动'
}

const getActivityTagClass = (type) => {
  const rewardTypes = ['lucky_order', 'loss_rescue', 'weekly_salary', 'monthly_salary', 'pg_betting_king']
  return rewardTypes.includes(type) ? 'tag-pink' : 'tag-orange'
}

const activities = computed(() => {
  if (!categories.value || categories.value.length === 0) return allActivities.value
  
  const selectedCategory = categories.value[activeCategory.value]
  if (!selectedCategory) return allActivities.value
  
  if (
    selectedCategory.code === 'general' ||
    selectedCategory.code === 'all'
  ) {
    return allActivities.value
  }
  
  return allActivities.value.filter(act => {
    if (Array.isArray(act.category)) {
      return act.category.includes(selectedCategory.code)
    }
    return act.category === selectedCategory.code
  })
})

const goDetail = (act) => {
  selectedActivity.value = {
    ...act,
    content: '<p>暂无活动说明</p>'
  }
  showActivityPopup.value = true
  detailLoading.value = true

  activityApi.getActivityDetail(act.id)
    .then((res) => {
      if (res.code === 0 && res.data) {
        selectedActivity.value = {
          ...selectedActivity.value,
          title: res.data.title || act.title || '活动详情',
          content: prepareActivityHtml(res.data.content || res.data.desc || '')
        }
      }
    })
    .catch(() => {
      selectedActivity.value.content = '<p>活动详情加载失败，请稍后重试</p>'
    })
    .finally(() => {
      detailLoading.value = false
    })
}

onMounted(() => {
  const savedCategory = sessionStorage.getItem('activity_category')
  if (savedCategory !== null) {
    selectedCategoryCode.value = /^\d+$/.test(savedCategory)
      ? fallbackCategories[Number(savedCategory)]?.code || 'all'
      : savedCategory
  }
  loadCategories()
  loadActivities()
})

const restoreScrollPosition = () => {
  nextTick(() => {
    const savedScroll = sessionStorage.getItem('activity_scroll_top')
    if (savedScroll && contentListRef.value) {
      setTimeout(() => {
        if (contentListRef.value) {
          contentListRef.value.scrollTop = parseInt(savedScroll, 10)
        }
      }, 100)
    }
  })
}

</script>

<style scoped>
.tab-activity {
  flex: 1;
  overflow: hidden;
  background: #191919;
  color: #eee;
}
.activity-main {
  height: 100%;
  overflow-y: auto;
  background: #191919;
}
.tab-activity.embedded .activity-hero { display: none; }
.tab-activity.embedded .category-nav { padding-top: 20px; }
.activity-hero {
  position: relative;
  min-height: 225px;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 18px clamp(28px, 7vw, 110px);
  box-sizing: border-box;
  background: radial-gradient(circle at 78% 60%, rgba(214, 143, 41, .42), transparent 24%), linear-gradient(115deg, #0b0b0b, #27221a 58%, #101010);
}
.activity-hero::before {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(160deg, transparent 0 20px, rgba(255,255,255,.035) 21px 22px);
  content: '';
}
.hero-copy { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 8px; }
.hero-copy span { color: #f3c975; font-size: 22px; letter-spacing: 3px; }
.hero-copy strong { color: #fff0cf; font-size: clamp(42px, 6vw, 72px); line-height: 1; letter-spacing: 8px; text-shadow: 0 3px 0 #713b18, 0 0 12px rgba(255,177,70,.5); }
.hero-copy em { color: #f7f4ef; font-size: clamp(17px, 2vw, 28px); font-style: normal; letter-spacing: 2px; }
.hero-gift { position: absolute; right: 13%; bottom: -24px; width: 170px; height: 150px; border-radius: 52% 48% 45% 55%; background: linear-gradient(135deg, #fff1c5, #bd8c3f 56%, #64431f); color: #9b5b19; font-size: 80px; font-weight: 900; line-height: 150px; text-align: center; transform: rotate(-9deg); box-shadow: 0 0 45px rgba(244,189,82,.35); }
.hero-orbit { position: absolute; border: 1px solid rgba(244,199,111,.25); border-radius: 50%; transform: rotate(-18deg); }
.hero-orbit-one { right: 5%; width: 480px; height: 190px; }
.hero-orbit-two { right: 22%; width: 260px; height: 120px; }
.category-nav { display: grid; grid-template-columns: repeat(6, minmax(120px, 1fr)); gap: 18px; padding: 18px clamp(16px, 5vw, 75px); background: #1e1e1e; }
.category-pill { height: 48px; border: 0; border-radius: 28px; background: #292929; color: #e4e4e4; font-size: 14px; cursor: pointer; transition: .2s ease; }
.category-pill img { display: none; }
.category-pill.active { color: #3b2b0f; background: linear-gradient(135deg, #ffe9a2, #f2c95a); box-shadow: 0 3px 12px rgba(244,196,88,.25); }
.category-pill:hover { transform: translateY(-1px); background: #373737; }
.category-pill.active:hover { background: linear-gradient(135deg, #ffe9a2, #f2c95a); }
.content-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px 28px;
  max-width: 1260px;
  margin: 0 auto;
  flex: 1;
  padding: 24px clamp(16px, 4vw, 46px) 48px;
  box-sizing: border-box;
  background: #191919;
}
.activity-card {
  min-width: 0;
  background: #2a2a2a;
  border-radius: 14px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 7px 18px rgba(0,0,0,.2);
  cursor: pointer;
  transition: transform .15s, box-shadow .15s;
}
.activity-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(0,0,0,.34); }
.card-img { width: 100%; height: auto; aspect-ratio: 710 / 320; display: block; object-fit: cover; }
.card-title {
  min-height: 54px;
  padding: 15px 16px;
  box-sizing: border-box;
  color: #ddd;
  font-size: 16px;
  line-height: 1.5;
  background: #2a2a2a;
}

.empty-text {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
}

.activity-detail-popup {
  width: min(760px, calc(100vw - 28px));
  max-height: min(86vh, 760px);
  overflow: hidden;
  background: #f7f8fa !important;
  color: #202124 !important;
}

.activity-popup-content {
  display: flex;
  flex-direction: column;
  max-height: min(86vh, 760px);
}

.activity-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 48px 16px 20px;
  border-bottom: 1px solid #e2e5ea;
  background: #fff;
}

.activity-popup-header h2 {
  margin: 0;
  color: #202124;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.35;
}

.activity-popup-loading {
  min-height: 160px;
  display: grid;
  place-items: center;
  color: #666b73;
  font-size: 14px;
}

.activity-popup-body {
  overflow-y: auto;
  padding: 18px 20px 24px;
  background: #f7f8fa;
  color: #2d3138;
  font-size: 14px;
  line-height: 1.75;
}

.activity-popup-body :deep(p),
.activity-popup-body :deep(div),
.activity-popup-body :deep(span),
.activity-popup-body :deep(font),
.activity-popup-body :deep(li) {
  color: #2d3138 !important;
  font-size: 14px !important;
  line-height: 1.75 !important;
}

.activity-popup-body :deep(h1),
.activity-popup-body :deep(h2),
.activity-popup-body :deep(h3),
.activity-popup-body :deep(h4),
.activity-popup-body :deep(h5),
.activity-popup-body :deep(h6) {
  color: #202124 !important;
}

.activity-popup-body :deep(a) {
  color: #2563eb !important;
}

.activity-popup-body :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 12px auto;
  border-radius: 6px;
}

.activity-popup-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}

.activity-popup-body :deep(th),
.activity-popup-body :deep(td) {
  border: 1px solid #d9dde4;
  padding: 8px;
  color: #2d3138 !important;
}

.activity-popup-body :deep(th) {
  background: #eef1f5;
  color: #202124 !important;
}

:deep(.activity-detail-popup .van-popup__close-icon) {
  color: #616771;
}

:global(html.device-pc .activity-detail-popup),
:global(html.device-mobile .activity-detail-popup) {
  background: #f7f8fa !important;
  color: #202124 !important;
}

@media (max-width: 760px) {
  .activity-hero { min-height: 160px; padding: 16px 24px; }
  .hero-copy span { font-size: 14px; }
  .hero-copy strong { font-size: 34px; letter-spacing: 4px; }
  .hero-copy em { font-size: 14px; }
  .hero-gift { right: 4%; width: 90px; height: 84px; font-size: 44px; line-height: 84px; }
  .category-nav { grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 12px; }
  .category-pill { height: 40px; font-size: 12px; }
  .content-list { grid-template-columns: 1fr; gap: 14px; padding: 16px 12px 32px; }
  .activity-detail-popup { width: calc(100vw - 20px); max-height: 88vh; }
  .activity-popup-header { padding: 16px 44px 14px 16px; }
  .activity-popup-body { padding: 14px 16px 20px; }
}
</style>
