<template>
  <div class="app-dropdown" :class="{ active: isOpen }">
    <div class="dropdown-trigger" @click="toggle">
      <span class="trigger-text">{{ currentLabel }}</span>
      <div class="trigger-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>
    
    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-panel">
        <div class="dropdown-mask" @click="close"></div>
        <div class="dropdown-content">
          <div 
            v-for="(item, index) in options" 
            :key="item.value"
            class="dropdown-item"
            :class="{ selected: modelValue === item.value }"
            :style="{ animationDelay: `${index * 30}ms` }"
            @click="select(item)"
          >
            <span class="item-text">{{ item.label }}</span>
            <Transition name="check">
              <div v-if="modelValue === item.value" class="item-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)

const currentLabel = computed(() => {
  const item = props.options.find(o => o.value === props.modelValue)
  return item ? item.label : props.placeholder
})

const toggle = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

const select = (item) => {
  emit('update:modelValue', item.value)
  emit('change', item)
  setTimeout(() => {
    isOpen.value = false
  }, 150)
}
</script>

<style scoped>
.app-dropdown {
  position: relative;
  display: inline-flex;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid #e8e8e8;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.dropdown-trigger:active {
  transform: scale(0.96);
}

.app-dropdown.active .dropdown-trigger {
  border-color: var(--color-primary, #26A17B);
  box-shadow: 0 2px 12px rgba(38, 161, 123, 0.15);
}

.trigger-text {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.trigger-arrow {
  width: 14px;
  height: 14px;
  color: #999;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.trigger-arrow svg {
  width: 100%;
  height: 100%;
}

.app-dropdown.active .trigger-arrow {
  transform: rotate(180deg);
  color: var(--color-primary, #26A17B);
}

.dropdown-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.dropdown-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
}

.dropdown-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 200px;
  max-width: 80vw;
  max-height: 60vh;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: itemSlide 0.3s ease forwards;
  opacity: 0;
  transform: translateY(-10px);
  border-bottom: 1px solid #f5f5f5;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:active {
  background: #f8f8f8;
}

.dropdown-item.selected {
  background: linear-gradient(135deg, rgba(38, 161, 123, 0.08) 0%, rgba(38, 161, 123, 0.04) 100%);
}

.dropdown-item.selected .item-text {
  color: var(--color-primary, #26A17B);
  font-weight: 600;
}

.item-text {
  font-size: 15px;
  color: #333;
  transition: color 0.2s;
}

.item-check {
  width: 20px;
  height: 20px;
  color: var(--color-primary, #26A17B);
}

.item-check svg {
  width: 100%;
  height: 100%;
}

@keyframes itemSlide {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-enter-active {
  transition: opacity 0.25s ease;
}

.dropdown-enter-active .dropdown-content {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dropdown-leave-active {
  transition: opacity 0.2s ease;
}

.dropdown-leave-active .dropdown-content {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
}

.dropdown-enter-from .dropdown-content {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.9);
}

.dropdown-leave-to {
  opacity: 0;
}

.dropdown-leave-to .dropdown-content {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.95);
}

.check-enter-active {
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.check-leave-active {
  transition: all 0.15s ease;
}

.check-enter-from,
.check-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>

