<template>
  <Teleport to="body">
    <Transition name="login-notice">
      <div
        v-if="modelValue"
        class="login-notice-mask"
        role="presentation"
      >
        <section
          class="login-notice-card"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          @click.stop
        >
          <header class="login-notice-header">
            <h2 class="login-notice-title">
              <span class="login-notice-title-mark" aria-hidden="true"></span>
              {{ title }}
            </h2>
            <button
              type="button"
              class="login-notice-close"
              :aria-label="closeLabel"
              @click="close"
            >
              <span aria-hidden="true"></span>
            </button>
          </header>
          <p class="login-notice-message">{{ message }}</p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '提示信息' },
  message: { type: String, default: '' },
  closeLabel: { type: String, default: '关闭' }
})

const emit = defineEmits(['update:modelValue'])

const close = () => emit('update:modelValue', false)
</script>

<style scoped>
.login-notice-mask {
  position: fixed;
  z-index: 3000;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
}

.login-notice-card {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(440px, calc(100vw - 20px));
  height: 180px;
  overflow: hidden;
  border-radius: 6px;
  background: #fff;
  transform: translate(-50%, -50%);
  transform-origin: center;
  font-family: Arial, "Microsoft YaHei", sans-serif;
}

.login-notice-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  height: 64px;
  border-bottom: 1px solid #ebecef;
}

.login-notice-title {
  display: flex;
  align-items: center;
  height: 64px;
  margin: 0;
  padding-left: 40px;
  color: #000;
  font-size: 18px;
  font-weight: 400;
  line-height: 18px;
}

.login-notice-title-mark {
  width: 2px;
  height: 20px;
  margin-right: 10px;
  background: #f2ca57;
}

.login-notice-close {
  position: relative;
  flex: 0 0 52px;
  width: 52px;
  height: 64px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.login-notice-close span,
.login-notice-close span::after {
  position: absolute;
  top: 31px;
  left: 13px;
  width: 27px;
  height: 5px;
  border-radius: 1px;
  background: #c8c8c8;
  content: '';
  transform: rotate(45deg);
}

.login-notice-close span::after {
  top: 0;
  left: 0;
  transform: rotate(90deg);
}

.login-notice-close:hover span,
.login-notice-close:hover span::after {
  background: #a9a9a9;
}

.login-notice-message {
  width: 100%;
  height: 50px;
  margin: 0;
  color: #3c3c3c;
  font-size: 16px;
  line-height: 50px;
  text-align: center;
}

.login-notice-enter-active,
.login-notice-leave-active {
  transition: opacity 0.2s ease;
}

.login-notice-enter-from,
.login-notice-leave-to {
  opacity: 0;
}

.login-notice-enter-active .login-notice-card {
  animation: login-notice-bounce-in 0.6s both;
}

.login-notice-leave-active .login-notice-card {
  animation: login-notice-bounce-out 0.16s ease-in both;
}

@keyframes login-notice-bounce-in {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.05);
  }
  70% {
    transform: translate(-50%, -50%) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes login-notice-bounce-out {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.92);
  }
}

@media (max-width: 460px) {
  .login-notice-card {
    height: 180px;
  }

  .login-notice-title {
    padding-left: 24px;
  }
}
</style>
