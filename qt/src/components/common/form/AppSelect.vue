<template>
  <div class="app-select" :class="{ active: isOpen }" ref="selectRef">
    <div class="select-trigger" @click="toggle">
      <span class="trigger-text">{{ currentLabel }}</span>
      <svg class="trigger-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
    
    <Transition name="dropdown">
      <div v-if="isOpen" class="select-panel">
        <div class="panel-arrow"></div>
        <div class="panel-content">
          <div 
            v-for="item in options" 
            :key="item.value"
            class="select-option"
            :class="{ selected: modelValue === item.value }"
            @click="select(item)"
          >
            <span class="option-text">{{ item.label }}</span>
            <svg v-if="modelValue === item.value" class="option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
      </div>
    </Transition>
    
    <div v-if="isOpen" class="select-mask" @click="close"></div>
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
const selectRef = ref(null)

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
  isOpen.value = false
}
</script>

<style scoped>
.app-select {
  position: relative;
  display: inline-flex;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.app-select.active {
  z-index: 100;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 30px;
  padding: 0 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.app-select.active .select-trigger {
  border-color: var(--color-primary, #26A17B);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom-color: transparent;
  background: #fff;
  position: relative;
  z-index: 2;
}

.trigger-text {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
}

.app-select.active .trigger-text {
  color: var(--color-primary, #26A17B);
}

.trigger-arrow {
  width: 12px;
  height: 12px;
  color: #999;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.app-select.active .trigger-arrow {
  transform: rotate(180deg);
  color: var(--color-primary, #26A17B);
}

.select-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.select-panel {
  position: absolute;
  top: 29px;
  left: 0;
  min-width: 100%;
  z-index: 10;
}

.panel-arrow {
  display: none;
}

.panel-content {
  background: #fff;
  border: 1px solid var(--color-primary, #26A17B);
  border-top: none;
  border-radius: 0 0 12px 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.1s ease;
  border-bottom: 1px solid #f0f0f0;
}

.select-option:last-child {
  border-bottom: none;
}

.select-option:active {
  background: #f5f5f5;
}

.select-option.selected {
  background: rgba(38, 161, 123, 0.08);
}

.select-option.selected .option-text {
  color: var(--color-primary, #26A17B);
  font-weight: 500;
}

.option-text {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
}

.option-check {
  width: 14px;
  height: 14px;
  color: var(--color-primary, #26A17B);
  flex-shrink: 0;
}

.dropdown-enter-active {
  transition: all 0.15s ease-out;
}

.dropdown-leave-active {
  transition: all 0.1s ease-in;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
