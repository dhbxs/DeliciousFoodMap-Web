<template>
  <div class="theme-toggle">
    <el-button
      :icon="isDark ? Sunny : Moon"
      @click="toggleTheme"
      circle
      :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
      class="theme-button"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { Sunny, Moon } from '@element-plus/icons-vue';

export default {
  name: 'ThemeToggle',
  components: {
    Sunny,
    Moon,
  },

  setup() {
    const isDark = ref(false);

    // 初始化主题
    const initTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      isDark.value = savedTheme === 'dark' || (!savedTheme && prefersDark);
      applyTheme();
    };

    // 应用主题
    const applyTheme = () => {
      const root = document.documentElement;
      if (isDark.value) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    };

    // 切换主题
    const toggleTheme = () => {
      isDark.value = !isDark.value;
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
      applyTheme();
    };

    // 监听系统主题变化
    const watchSystemTheme = () => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
          isDark.value = e.matches;
          applyTheme();
        }
      });
    };

    onMounted(() => {
      initTheme();
      watchSystemTheme();
    });

    return {
      isDark,
      toggleTheme,
      Sunny,
      Moon,
    };
  },
};
</script>

<style scoped>
.theme-toggle {
  position: relative;
}

.el-button.is-circle {
  width: 40px;
  height: 40px;
}

.theme-button {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background: var(--bg-primary);
  border: 1px solid var(--gray-200);
  color: var(--text-primary);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
}

.theme-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left var(--transition-normal);
}

.theme-button:hover::before {
  left: 100%;
}

.theme-button:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--shadow-lg);
  background: var(--primary-gradient);
  color: var(--text-inverse);
  border-color: var(--primary-color);
}

.theme-button:active {
  transform: translateY(0) scale(0.95);
}

/* 深色模式下的特殊样式 */
[data-theme="dark"] .theme-button {
  background: var(--bg-primary);
  border-color: var(--gray-600);
  color: var(--text-primary);
}

[data-theme="dark"] .theme-button:hover {
  background: var(--primary-gradient);
  color: var(--text-inverse);
  border-color: var(--primary-color);
}

/* 图标动画 */
.theme-button .el-icon {
  transition: all var(--transition-normal);
}

.theme-button:hover .el-icon {
  transform: rotate(180deg);
}
</style>
