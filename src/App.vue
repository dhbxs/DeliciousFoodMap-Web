<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
/* CSS 变量定义 - 现代化色彩系统 */
:root {
  /* 主色调 */
  --primary-color: #667eea;
  --primary-light: #764ba2;
  --primary-dark: #5a67d8;
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  /* 辅助色 */
  --secondary-color: #f093fb;
  --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);

  /* 成功色 */
  --success-color: #48bb78;
  --success-gradient: linear-gradient(135deg, #48bb78 0%, #38a169 100%);

  /* 警告色 */
  --warning-color: #ed8936;
  --warning-gradient: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);

  /* 危险色 */
  --danger-color: #f56565;
  --danger-gradient: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);

  /* 中性色 */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  /* 背景色 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  /* 文字色 */
  --text-primary: #1a202c;
  --text-secondary: #4a5568;
  --text-tertiary: #718096;
  --text-inverse: #ffffff;

  /* 阴影 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  /* 圆角 */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;

  /* 过渡动画 */
  --transition-fast: 0.15s ease-out;
  --transition-normal: 0.3s ease-out;
  --transition-slow: 0.5s ease-out;

  /* 间距 */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
}

/* 深色模式变量 */
[data-theme="dark"] {
  --bg-primary: #1a202c;
  --bg-secondary: #2d3748;
  --bg-tertiary: #4a5568;
  --text-primary: #f7fafc;
  --text-secondary: #e2e8f0;
  --text-tertiary: #cbd5e0;
  --gray-50: #4a5568;
  --gray-100: #2d3748;
  --gray-200: #1a202c;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}

#app {
  font-family: "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI",
    "Roboto", "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji",
    "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-primary);
  background: var(--bg-secondary);
  height: 100vh;
  overflow: hidden;
  transition: background-color var(--transition-normal), color var(--transition-normal);
}

body {
  margin: 0;
  padding: 0;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-secondary);
}

/* Element Plus 样式覆盖 */
.el-button {
  font-family: inherit;
  border-radius: var(--radius-lg);
  font-weight: 500;
  transition: all var(--transition-fast);
  border: none;
  position: relative;
  overflow: hidden;
}

.el-button:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left var(--transition-normal);
}

.el-button:hover:before {
  left: 100%;
}

.el-button--primary {
  background: var(--primary-gradient);
  color: var(--text-inverse);
  box-shadow: var(--shadow-md);
}

.el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.el-button--success {
  background: var(--success-gradient);
  color: var(--text-inverse);
}

.el-button--warning {
  background: var(--warning-gradient);
  color: var(--text-inverse);
}

.el-button--danger {
  background: var(--danger-gradient);
  color: var(--text-inverse);
}

.el-dialog {
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  backdrop-filter: blur(10px);
}

.el-card {
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--gray-200);
  background: var(--bg-primary);
  transition: all var(--transition-normal);
}

.el-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.el-input__wrapper {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.el-input__wrapper:hover {
  box-shadow: var(--shadow-md);
}

.el-input__wrapper.is-focus {
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 滚动条全局样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: var(--radius-full);
  transition: background-color var(--transition-fast);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

/* 页面过渡动画 */
.page-enter-active,
.page-leave-active {
  transition: all var(--transition-normal);
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 通用动画类 */
.fade-in {
  animation: fadeIn var(--transition-normal) ease-out;
}

.slide-up {
  animation: slideUp var(--transition-normal) ease-out;
}

.scale-in {
  animation: scaleIn var(--transition-normal) ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--gray-200);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 脉冲动画 */
.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
