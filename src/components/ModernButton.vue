<template>
  <button
    :class="[
      'modern-button',
      `modern-button--${type}`,
      `modern-button--${size}`,
      {
        'modern-button--loading': loading,
        'modern-button--disabled': disabled,
        'modern-button--circle': circle,
        'modern-button--gradient': gradient,
        'modern-button--glass': glass
      }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span class="button-content">
      <el-icon v-if="loading" class="loading-icon">
        <Loading />
      </el-icon>
      <el-icon v-else-if="icon" :class="icon" />
      <span v-if="!circle && $slots.default" class="button-text">
        <slot />
      </span>
    </span>
    <span class="button-ripple"></span>
  </button>
</template>

<script>
import { Loading } from '@element-plus/icons-vue';

export default {
  name: 'ModernButton',
  components: {
    Loading,
  },
  props: {
    type: {
      type: String,
      default: 'primary',
      validator: (value) => ['primary', 'secondary', 'success', 'warning', 'danger', 'info'].includes(value)
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    loading: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    circle: {
      type: Boolean,
      default: false
    },
    gradient: {
      type: Boolean,
      default: true
    },
    glass: {
      type: Boolean,
      default: false
    },
    icon: {
      type: String,
      default: ''
    }
  },
  emits: ['click'],
  methods: {
    handleClick(event) {
      if (!this.disabled && !this.loading) {
        this.createRipple(event);
        this.$emit('click', event);
      }
    },
    createRipple(event) {
      const button = event.currentTarget;
      const ripple = button.querySelector('.button-ripple');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple-active');
      
      setTimeout(() => {
        ripple.classList.remove('ripple-active');
      }, 600);
    }
  }
};
</script>

<style scoped>
.modern-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-lg);
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  overflow: hidden;
  outline: none;
  user-select: none;
  box-shadow: var(--shadow-md);
}

.modern-button:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* 尺寸 */
.modern-button--small {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 13px;
  min-height: 32px;
}

.modern-button--medium {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: 14px;
  min-height: 40px;
}

.modern-button--large {
  padding: var(--spacing-lg) var(--spacing-xl);
  font-size: 16px;
  min-height: 48px;
}

/* 圆形按钮 */
.modern-button--circle {
  border-radius: 50%;
  padding: 0;
  aspect-ratio: 1;
}

.modern-button--circle.modern-button--small {
  width: 32px;
  height: 32px;
}

.modern-button--circle.modern-button--medium {
  width: 40px;
  height: 40px;
}

.modern-button--circle.modern-button--large {
  width: 48px;
  height: 48px;
}

/* 类型样式 */
.modern-button--primary {
  background: var(--primary-gradient);
  color: var(--text-inverse);
}

.modern-button--primary:not(.modern-button--gradient) {
  background: var(--primary-color);
}

.modern-button--secondary {
  background: var(--secondary-gradient);
  color: var(--text-inverse);
}

.modern-button--secondary:not(.modern-button--gradient) {
  background: var(--secondary-color);
}

.modern-button--success {
  background: var(--success-gradient);
  color: var(--text-inverse);
}

.modern-button--success:not(.modern-button--gradient) {
  background: var(--success-color);
}

.modern-button--warning {
  background: var(--warning-gradient);
  color: var(--text-inverse);
}

.modern-button--warning:not(.modern-button--gradient) {
  background: var(--warning-color);
}

.modern-button--danger {
  background: var(--danger-gradient);
  color: var(--text-inverse);
}

.modern-button--danger:not(.modern-button--gradient) {
  background: var(--danger-color);
}

.modern-button--info {
  background: var(--gray-500);
  color: var(--text-inverse);
}

/* 玻璃效果 */
.modern-button--glass {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

/* 悬浮效果 */
.modern-button:hover:not(.modern-button--disabled):not(.modern-button--loading) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.modern-button:active:not(.modern-button--disabled):not(.modern-button--loading) {
  transform: translateY(0);
  box-shadow: var(--shadow-md);
}

/* 禁用状态 */
.modern-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: var(--shadow-sm) !important;
}

/* 加载状态 */
.modern-button--loading {
  cursor: wait;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

/* 按钮内容 */
.button-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  position: relative;
  z-index: 1;
}

.button-text {
  white-space: nowrap;
}

/* 波纹效果 */
.button-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  pointer-events: none;
}

.button-ripple.ripple-active {
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modern-button--large {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: 15px;
    min-height: 44px;
  }
  
  .modern-button--medium {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 13px;
    min-height: 36px;
  }
}
</style>
