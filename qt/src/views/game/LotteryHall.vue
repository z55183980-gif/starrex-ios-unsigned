<template>
  <div class="lottery-hall">
    <header class="hall-header">
      <div class="header-left" @click="router.back()">
        <van-icon name="arrow-left" size="22" color="#333" />
      </div>
      <h1 class="header-title">彩票大厅</h1>
      <div class="header-right">
        <van-icon name="service-o" size="22" color="#333" @click="openOnlineCustomerService" />
      </div>
    </header>

    <div class="hall-layout">
      <aside class="category-sidebar">
        <div 
          v-for="cat in categories" 
          :key="cat.code"
          class="cat-item"
          :class="{ active: activeCat === cat.code }"
          @click="activeCat = cat.code"
        >
          <div class="cat-icon">
            <img :src="cat.icon" :class="{ 'icon-active': activeCat === cat.code }" />
          </div>
          <span class="cat-name">{{ cat.name }}</span>
        </div>
      </aside>

      <main class="game-main">
        <van-loading v-if="loading" type="spinner" color="#26A17B" class="loading" />
        
        <div v-else class="game-grid">
          <div 
            v-for="(game, idx) in filteredGames" 
            :key="game.name"
            class="game-card"
            @click="navigateToGame(game)"
          >
            <div class="card-cover" :style="{ background: !getGameIcon(game) ? getDefaultColor(game.name) : '#fff' }">
              <img v-if="getGameIcon(game)" :src="getGameIcon(game)" :alt="game.name" @error="onImageError" />
              <div v-else class="card-placeholder">{{ game.name?.[0] || '彩' }}</div>
              <div class="card-badge" v-if="game.is_hot || game.hot">热门</div>
            </div>
            <div class="card-info">
              <span class="card-title">{{ game.name }}</span>
            </div>
          </div>
        </div>

        <van-empty v-if="!loading && filteredGames.length === 0" description="暂无游戏" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { gameApi } from '@/api/game'
import { openOnlineCustomerService } from '@/utils/customerService'

const router = useRouter()
const loading = ref(true)
const activeCat = ref('all')
const games = ref([])

const categories = [
  { code: 'all', name: '彩票', icon: '/assets/img/icon_dtfl_cp_0.svg' },
  { code: 'ssc', name: '时时彩', icon: '/assets/img/icon_dtfl_cp_0.svg' },
  { code: 'pk10', name: 'PK10', icon: '/assets/img/icon_dtfl_cp_0.svg' },
  { code: 'k3', name: '快三', icon: '/assets/img/icon_dtfl_cp_0.svg' },
  { code: 'x5', name: '11选5', icon: '/assets/img/icon_dtfl_cp_0.svg' },
  { code: 'lhc', name: '六合彩', icon: '/assets/img/icon_dtfl_cp_0.svg' },
  { code: 'keno', name: '快乐8', icon: '/assets/img/icon_dtfl_cp_0.svg' },
  { code: 'dpc', name: '低频彩', icon: '/assets/img/icon_dtfl_cp_0.svg' },
]

const defaultColors = ['#a18cd1', '#fbc2eb', '#84fab0', '#ff9a9e', '#ffecd2', '#fcb69f', '#667eea', '#764ba2']

const getDefaultColor = (name) => {
  if (!name) return defaultColors[0]
  const index = name.charCodeAt(0) % defaultColors.length
  return defaultColors[index]
}

const getGameIcon = (game) => {
  if (game.icon && !game.icon.includes('undefined')) return game.icon
  if (game.cover && !game.cover.includes('undefined')) return game.cover
  return null
}

const onImageError = (e) => {
  e.target.style.display = 'none'
  const parent = e.target.parentElement
  if (parent && !parent.querySelector('.card-placeholder')) {
    const placeholder = document.createElement('div')
    placeholder.className = 'card-placeholder'
    placeholder.textContent = e.target.alt?.[0] || '彩'
    parent.appendChild(placeholder)
  }
}

const filteredGames = computed(() => {
  if (activeCat.value === 'all') return games.value
  return games.value.filter(g => g.type === activeCat.value || g.typeid === activeCat.value)
})

const navigateToGame = (game) => {
  if (game.route) {
    let route = game.route
    const typeRouteMap = {
      '/keno/': '/kl8/',
    }
    for (const [from, to] of Object.entries(typeRouteMap)) {
      if (route.startsWith(from)) {
        route = route.replace(from, to)
        break
      }
    }
    router.push(route.startsWith('/lottery/') ? route : '/lottery' + route)
    return
  }
  const typeCode = game.type || game.typeid || 'ssc'
  const routeMap = {
    ssc: '/lottery/ssc/',
    pk10: '/lottery/pk10/',
    k3: '/lottery/k3/',
    x5: '/lottery/x5/',
    lhc: '/lottery/lhc/',
    keno: '/lottery/kl8/',
    kl8: '/lottery/kl8/',
    kl10: '/lottery/kl10/',
    dpc: '/lottery/dpc/',
    dwc: '/lottery/pk10-animal/',
    fc3d: '/lottery/fc3d/',
    pl3: '/lottery/pl3/',
    hn7xc: '/lottery/hn7xc/',
  }
  const basePath = routeMap[typeCode] || '/lottery/ssc/'
  const code = game.code || game.gameId || ''
  router.push(basePath + code)
}

const loadGames = async () => {
  loading.value = true
  try {
    const res = await gameApi.getGameList({ platform: 'BYLOT', limit: 200 })
    const list = res.code === 0 ? (res.data?.list || []) : (res?.list || [])
    games.value = list.map(g => ({
      ...g,
      name: g.title || g.name || g.game_name,
      type: g.typeid || g.type,
      hot: g.is_hot || g.hot,
      code: g.gameId || g.code || g.name
    }))
  } catch (e) {
  }
  loading.value = false
}

onMounted(() => {
  loadGames()
})
</script>

<style scoped>
.lottery-hall {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  background-image: url("/assets/img/bg_pattern_tile_0_95.png");
  background-size: 160px 160px;
}

.hall-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  flex-shrink: 0;
}
.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
.header-left, .header-right {
  width: 40px;
  display: flex;
  align-items: center;
}
.header-right { justify-content: flex-end; }

.hall-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.category-sidebar {
  width: 72px;
  background: #fff;
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
  padding: 8px 0;
  box-shadow: 1px 0 4px rgba(0,0,0,0.03);
  -webkit-overflow-scrolling: touch;
}
.category-sidebar::-webkit-scrollbar { display: none; }

.cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 4px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.cat-item.active {
  background: linear-gradient(135deg, #26A17B 0%, #1a7a5c 100%);
  border-radius: 0 12px 12px 0;
  margin-right: 4px;
}
.cat-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #26A17B;
}

.cat-icon {
  width: 28px;
  height: 28px;
  margin-bottom: 4px;
}
.cat-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: filter 0.2s;
}
.cat-icon img.icon-active {
  filter: brightness(0) invert(1);
}

.cat-name {
  font-size: 11px;
  color: #666;
  text-align: center;
  line-height: 1.2;
}
.cat-item.active .cat-name {
  color: #fff;
}

.game-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px;
  -webkit-overflow-scrolling: touch;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px 8px;
  justify-items: center;
}

.game-card {
  width: 100%;
  max-width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  background: transparent;
}
.game-card:active {
  transform: scale(0.97);
}

.card-cover {
  position: relative;
  width: 74px;
  height: 74px;
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  background: #fff;
}
.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.card-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  padding: 2px 6px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
  color: #fff;
  font-size: 9px;
  border-radius: 4px;
  font-weight: 500;
}

.card-info {
  text-align: center;
  background: transparent;
}
.card-title {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
  max-width: 80px;
}

.card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
</style>
