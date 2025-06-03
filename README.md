# Delicious Food Map

## 项目概述
Delicious Food Map 是一个基于 Vue.js 的美食地图应用，集成了高德地图服务，用于探索和定位美食场所。

## 开始使用

### 前置条件
- Node.js (版本 14 或更高)

### 安装
1. 克隆仓库。
2. 运行 `npm install` 安装依赖。
3. 配置 .env 中的高德地图 API Key。

### 使用方法
1. 启动开发服务器：`npm run serve`
2. 访问应用：`http://localhost:8080`（默认端口）

## 依赖项
- **核心依赖**：
  - Vue.js ^3.2.13
  - Vue Router ^4.0.3
  - Vuex ^4.0.0
  - Element Plus ^2.4.4
  - @element-plus/icons-vue ^2.1.0
- **开发依赖**：
  - ESLint ^7.32.0
  - Prettier ^2.4.1
  - Vue CLI Plugin Router ~5.0.0
  - 其他开发工具

## 功能特点
- 集成高德地图 API 实现交互式地图
- 按类别筛选商家
- 响应式设计，适配各种设备
- 使用 Vuex 进行状态管理

## 项目结构
- `public/`: 静态资源和 index.html
- `src/`: 主应用代码，包括组件、视图和存储
  - `components/`: 可重用组件（如 MapView、ShopList）
  - `views/`: 页面组件（如 HomeView、FoodMapView）
  - `store/`: Vuex 模块用于状态管理

## 许可证
MIT License

## 参与贡献
欢迎贡献。克隆仓库，创建拉取请求，并确保遵循项目指南。