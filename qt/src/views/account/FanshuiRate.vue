<template>
  <div class="rate-page">
    <div class="nav-header">
      <div class="back-btn" @click="goBack">
        <van-icon name="arrow-left" />
      </div>
      <div class="title">返水比例</div>
      <div class="placeholder"></div>
    </div>

    <div class="filter-bar">
      <div class="filter-col">
        <AppSelect 
          v-model="selectedCategory" 
          :options="categoryOptions" 
          placeholder="选择分类"
          class="category-select"
          @change="onCategoryChange"
        />
      </div>
      <div class="filter-col">
        <AppSelect 
          v-model="selectedVendor" 
          :options="vendorOptions" 
          placeholder="选择平台"
          class="vendor-select"
          @change="onVendorChange"
        />
      </div>
      <div class="filter-col header-text">会员等级</div>
      <div class="filter-col header-text">返水比例</div>
    </div>

    <div class="rate-list" v-if="rateList.length > 0">
      <div class="rate-item" v-for="(item, index) in rateList" :key="index">
        <div class="col cat">{{ categoryName }}</div>
        <div class="col vendor">{{ item.vendorName || vendorName || '-' }}</div>
        <div class="col bet">VIP{{ item.vipLevel }}</div>
        <div class="col rate">{{ item.rate.toFixed(2) }}%</div>
      </div>
    </div>

    <div v-else-if="loading" class="loading-state">
      <van-loading type="spinner" color="#999" />
    </div>

    <div v-else class="empty-state">
      <van-empty description="暂无返水比例配置" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/api/request'
import AppSelect from '@/components/common/form/AppSelect.vue'

const route = useRoute()
const router = useRouter()

const categories = [
  { code: 'slot', name: '电子' },
  { code: 'live', name: '真人' },
  { code: 'fishing', name: '捕鱼' },
  { code: 'chess', name: '棋牌' },
  { code: 'lottery', name: '彩票' },
  { code: 'sport', name: '体育' },
  { code: 'esport', name: '电竞' },
]

const categoryOptions = categories.map(c => ({ label: c.name, value: c.code }))

const vendors = ref([])
const vendorOptions = computed(() => {
  return [{ label: '全部平台', value: '' }, ...vendors.value.map(v => ({ label: v.name, value: v.code }))]
})

const loading = ref(false)
const selectedCategory = ref('slot')
const selectedVendor = ref('')
const rateList = ref([])

const categoryName = computed(() => {
  const cat = categories.find(c => c.code === selectedCategory.value)
  return cat?.name || '电子'
})

const vendorName = computed(() => {
  if (!selectedVendor.value) return ''
  const v = vendors.value.find(x => x.code === selectedVendor.value)
  return v?.name || selectedVendor.value
})

const goBack = () => {
  router.back()
}

const onCategoryChange = () => {
  selectedVendor.value = ''
  loadRates()
}

const onVendorChange = () => {
  loadRates()
}

const loadRates = async () => {
  loading.value = true
  try {
    const params = { category_code: selectedCategory.value }
    if (selectedVendor.value) {
      params.vendor_code = selectedVendor.value
    }
    
    const res = await request.get('/v1/rebate/tier-rates', { params })
    
    if (res.code === 0 && res.data) {
      rateList.value = res.data.list || []
      
      if (res.data.vendors && res.data.vendors.length > 0) {
        vendors.value = res.data.vendors
      }
    }
  } catch (err) {
    rateList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.query.category) {
    selectedCategory.value = route.query.category
  }
  if (route.query.vendor) {
    selectedVendor.value = route.query.vendor
  }
  loadRates()
})
</script>

<style scoped>
.rate-page {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f8f8f8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background: #fff;
}

.back-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #333;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.placeholder {
  width: 30px;
}

.filter-bar {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.filter-col {
  flex: 1;
  display: flex;
  justify-content: flex-start;
}

.filter-col.header-text {
  font-size: 13px;
  color: #999;
  justify-content: center;
}

.filter-bar :deep(.category-select),
.filter-bar :deep(.vendor-select) {
  width: 89.72px;
}

.filter-bar :deep(.select-trigger) {
  min-width: 89.72px;
  width: 89.72px;
  height: 26.66px;
  padding: 0 8px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #999;
}

.table-header {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: #f5f5f5;
}

.header-col {
  font-size: 12px;
  color: #999;
  text-align: center;
}

.header-col.cat {
  width: 60px;
}

.header-col.vendor {
  width: 80px;
}

.header-col.bet {
  flex: 1;
}

.header-col.rate {
  width: 70px;
  text-align: right;
}

.rate-list {
  flex: 1;
  overflow-y: auto;
  background: #fff;
  -webkit-overflow-scrolling: touch;
}

.rate-item {
  display: flex;
  align-items: center;
  padding: 14px 15px;
  border-bottom: 1px solid #f5f5f5;
}

.rate-item:last-child {
  border-bottom: none;
}

.rate-item .col {
  flex: 1;
  font-size: 13px;
  text-align: center;
}

.rate-item .cat {
  color: #666;
}

.rate-item .vendor {
  color: #333;
}

.rate-item .bet {
  color: #666;
}

.rate-item .rate {
  color: #f5a623;
  font-weight: 600;
}

.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}
</style>
