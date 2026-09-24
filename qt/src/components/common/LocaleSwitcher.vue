<template>
  <div class="locale-switcher" @click="openPicker">
    <van-icon name="globe-o" size="20" />
    <span class="current-lang">{{ currentLangText }}</span>
  </div>
  <van-popup v-model:show="showPicker" position="bottom" round class="language-picker-popup">
    <van-picker
      class="mobile-language-picker"
      :columns="localeOptions"
      @confirm="onConfirm"
      @cancel="showPicker = false"
    />
    <div class="pc-language-dialog">
      <div class="pc-language-header">
        <div class="pc-language-heading">
          <div class="pc-language-icon"><van-icon name="globe-o" /></div>
          <div>
            <div class="pc-language-title">选择语言</div>
            <div class="pc-language-subtitle">选择界面显示语言</div>
          </div>
        </div>
        <button type="button" class="pc-language-close" aria-label="关闭" @click="showPicker = false">
          <van-icon name="cross" />
        </button>
      </div>
      <div class="pc-language-options">
        <button
          v-for="item in localeOptions"
          :key="item.value"
          type="button"
          class="pc-language-option"
          :class="{ active: pendingLocale === item.value }"
          @click="pendingLocale = item.value"
        >
          <span class="pc-language-option-text">
            <span class="pc-language-name">{{ item.text }}</span>
            <span class="pc-language-code">{{ item.value }}</span>
          </span>
          <span class="pc-language-check"><van-icon name="success" /></span>
        </button>
      </div>
      <div class="pc-language-footer">
        <button type="button" class="pc-language-button secondary" @click="showPicker = false">取消</button>
        <button type="button" class="pc-language-button primary" @click="confirmPcLocale">确认</button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed } from 'vue'
import { setLocale, getLocale, getLocaleOptions, loadEnabledLanguages } from '@/locales'

const showPicker = ref(false)
const currentLocale = ref(getLocale())
const pendingLocale = ref(currentLocale.value)

const openPicker = async () => {
  await loadEnabledLanguages()
  pendingLocale.value = currentLocale.value
  showPicker.value = true
}
const localeOptions = computed(() => getLocaleOptions())

const currentLangText = computed(() => {
  const option = localeOptions.value.find(item => item.value === currentLocale.value)
  return option ? option.text : ''
})

const onConfirm = ({ selectedOptions }) => {
  const locale = selectedOptions[0].value
  currentLocale.value = locale
  setLocale(locale)
  showPicker.value = false
}

const confirmPcLocale = () => {
  const locale = pendingLocale.value
  if (!locale) return
  currentLocale.value = locale
  setLocale(locale)
  showPicker.value = false
}
</script>

<style lang="scss" scoped>
.locale-switcher {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  color: #333;
}

.current-lang {
  font-size: 14px;
}
</style>

