<template>
  <section class="v5-recent-wins" aria-label="近期大奖">
    <div class="wins-card">
      <div class="wins-header">
        <van-icon name="good-job-o" size="18" color="#3b82f6" />
        <h2>近期大奖</h2>
      </div>

      <div class="wins-summary">
        <div class="summary-art" aria-hidden="true">
          <van-icon name="chart-trending-o" size="22" color="#22c55e" />
          <van-icon name="medal-o" size="26" color="#f5a623" />
        </div>
        <div class="summary-copy">
          <p>过去30天内发放的奖金</p>
          <div class="summary-amount">
            <strong>¥{{ monthlyPrizeText }}</strong>
            <span class="currency-dot" aria-hidden="true">¥</span>
          </div>
        </div>
      </div>

      <div class="wins-list" @mouseenter="pauseWinningMotion" @mouseleave="resumeWinningMotion">
        <div
          v-for="record in winningRecords"
          :key="record.id"
          class="win-row"
          :class="{ 'is-enter': record.isEnter }"
        >
          <img
            class="win-avatar"
            :src="record.avatar"
            alt=""
            @error="onAvatarError"
          />
          <span class="win-player">{{ record.player }}</span>
          <strong class="win-amount">¥{{ record.amount }}</strong>
          <span class="currency-dot sm" aria-hidden="true">¥</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useWinningRecords, WIN_AVATAR_POOL } from '@/composables/useWinningRecords'
import { hideBrokenImg } from '@/utils/staticAssets'

defineOptions({ name: 'V5RecentWins' })

const {
  winningRecords,
  monthlyPrizeText,
  seedWinningRecords,
  pauseWinningMotion,
  resumeWinningMotion,
  startWinningDynamics,
  stopWinningDynamics
} = useWinningRecords()

const onAvatarError = (event) => {
  const img = event?.target
  if (!img) return
  if (img.dataset.fallback === '1') {
    hideBrokenImg(event)
    return
  }
  img.dataset.fallback = '1'
  img.src = WIN_AVATAR_POOL[0]
}

onMounted(() => {
  if (!winningRecords.value.length) seedWinningRecords()
  startWinningDynamics({ injectInterval: 5200 })
})

onUnmounted(() => {
  stopWinningDynamics()
})
</script>

<style lang="scss" scoped>
.v5-recent-wins {
  padding: 0 12px 16px;
  background: #f3f6f9;
}

.wins-card {
  padding: 14px 12px 6px;
  background: #fff;
  border-radius: 12px;
}

.wins-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #1f2937;
  }
}

.wins-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%);
  border-radius: 10px;
}

.summary-art {
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.12);
}

.summary-copy {
  min-width: 0;
  flex: 1;

  p {
    margin: 0 0 4px;
    font-size: 12px;
    color: #6b7280;
  }
}

.summary-amount {
  display: flex;
  align-items: center;
  gap: 6px;

  strong {
    font-size: 20px;
    font-weight: 800;
    color: #111827;
    font-variant-numeric: tabular-nums;
  }
}

.currency-dot {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  background: #22c55e;

  &.sm {
    width: 14px;
    height: 14px;
    font-size: 9px;
    flex-shrink: 0;
  }
}

.wins-list {
  max-height: 360px;
  overflow: hidden;
}

.win-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 8px 2px;
  border-bottom: 1px solid #eef2f6;
  transition: transform 0.35s ease, opacity 0.35s ease;

  &:last-child {
    border-bottom: 0;
  }

  &.is-enter {
    opacity: 0;
    transform: translateY(-10px);
  }
}

.win-avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
  background: #eef2f6;
  flex-shrink: 0;
}

.win-player {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
  color: #374151;
}

.win-amount {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  font-variant-numeric: tabular-nums;
}
</style>
