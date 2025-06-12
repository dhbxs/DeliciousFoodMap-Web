<template>
  <div class="loading-spinner-container" :class="{ fullscreen, overlay }">
    <div class="loading-content">
      <div class="spinner" :class="size">
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
        <div class="spinner-ring"></div>
      </div>
      <div v-if="text" class="loading-text">{{ text }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoadingSpinner',
  props: {
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    text: {
      type: String,
      default: ''
    },
    fullscreen: {
      type: Boolean,
      default: false
    },
    overlay: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style scoped>
.loading-spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

.loading-spinner-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: var(--bg-primary);
}

.loading-spinner-container.overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
}

.spinner {
  position: relative;
  display: inline-block;
}

.spinner.small {
  width: 32px;
  height: 32px;
}

.spinner.medium {
  width: 48px;
  height: 48px;
}

.spinner.large {
  width: 64px;
  height: 64px;
}

.spinner-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: var(--primary-color);
  animation-delay: -0.45s;
}

.spinner-ring:nth-child(2) {
  border-right-color: var(--secondary-color);
  animation-delay: -0.3s;
}

.spinner-ring:nth-child(3) {
  border-bottom-color: var(--success-color);
  animation-delay: -0.15s;
}

.spinner-ring:nth-child(4) {
  border-left-color: var(--warning-color);
}

.loading-text {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  text-align: center;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 进入和离开动画 */
.loading-spinner-container {
  animation: fadeIn var(--transition-normal) ease-out;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .spinner.large {
    width: 56px;
    height: 56px;
  }
  
  .spinner.medium {
    width: 40px;
    height: 40px;
  }
  
  .loading-text {
    font-size: 13px;
  }
}
</style>
