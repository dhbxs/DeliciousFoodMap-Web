# 美食地图 前端 - DeliciousFoodMap-Web

## 🌍 项目概述

Delicious Food Map 是一个基于 Vue.js 的美食地图应用，集成了高德地图服务，用于探索和定位美食场所。

- 美食地图 前端仓库地址 [https://github.com/dhbxs/DeliciousFoodMap-Web](https://github.com/dhbxs/DeliciousFoodMap-Web)
- 美食地图 后端仓库地址 [https://github.com/dhbxs/DeliciousFoodMap-Admin](https://github.com/dhbxs/DeliciousFoodMap-Admin)

## 🚀 快速开始

### 本地开发

1. **安装依赖**：

   ```bash
   pnpm install  # 或 npm install
   ```

2. **配置应用**：
   编辑 `public/config.json` 文件，填入你的高德地图 API 密钥：

   ```json
   {
     "APP_AMAP_KEY": "你的高德地图API密钥",
     "APP_BACKEND_URL": "http://localhost:8081/delicious-food-map"
   }
   ```

3. **启动开发服务器**：

   ```bash
   pnpm run serve  # 或 npm run serve
   ```

4. **访问应用**：
   ```
   http://localhost:8080
   ```

📖 **详细开发指南**: 请查看 [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)

### 生产部署

使用 Docker 进行生产部署：

```bash
# 构建镜像
docker build -t delicious-food-map-web .

# 运行容器
docker run -d -p 8080:80 \
  -e APP_AMAP_KEY="你的API密钥" \
  -e APP_BACKEND_URL="后端API地址" \
  delicious-food-map-web
```

## ⚙️ 配置说明

### 配置文件

应用使用 `public/config.json` 进行运行时配置：

```json
{
  "APP_AMAP_KEY": "高德地图API密钥",
  "APP_BACKEND_URL": "后端API地址"
}
```

### 获取高德地图 API 密钥

1. 访问 [高德开放平台](https://console.amap.com/dev/key/app)
2. 注册并登录账号
3. 创建新应用，选择"Web 端(JS API)"
4. 复制生成的 API Key

### 配置特点

- **运行时配置**: 无需重新构建即可更改配置
- **环境隔离**: 开发和生产环境使用不同配置
- **安全性**: 生产环境通过环境变量注入配置

## 📦 依赖项

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

## 📌 功能特性

- 集成高德地图 API 实现交互式地图
- 按类别筛选商家
- 响应式设计，适配各种设备
- 使用 Vuex 进行状态管理

## 📁 项目结构

- `public/`: 静态资源和 index.html
- `src/`: 主应用代码，包括组件、视图和存储
  - `components/`: 可重用组件（如 MapView、ShopList）
  - `views/`: 页面组件（如 HomeView、FoodMapView）
  - `store/`: Vuex 模块用于状态管理

## 🤝 贡献指南

欢迎通过以下方式参与项目：

1. Fork 项目仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 发起 Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE)

## 🙏 致谢

- Fluid 社群
- Vue 开源社区

---

> 🌟 如果这个项目对您有帮助，欢迎给个 Star 支持！您的认可是我们持续改进的动力！
