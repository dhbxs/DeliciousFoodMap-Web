import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import configService from "./services/configService";
import { updateRequestConfig } from "./utils/request";
import "../public/iconfont/iconfont.css";
import "../public/iconfont/iconfont.js";
import "@/assets/css/iconfont-symbol.css";
// Element Plus
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

// Initialize app
async function initApp() {
  try {
    await configService.loadConfig();

    await updateRequestConfig();

    const app = createApp(App);

    // Register Element Plus icons
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component);
    }

    app.use(store).use(router).use(ElementPlus).mount("#app");
  } catch (error) {
    console.error("Failed to initialize app:", error);
    // Show error message to user
    document.body.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-family: Arial, sans-serif;
        background-color: #f5f5f5;
      ">
        <div style="
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 500px;
        ">
          <h2 style="color: #e74c3c; margin-bottom: 20px;">配置加载失败</h2>
          <p style="color: #666; margin-bottom: 20px;">
            无法加载应用配置文件 config.json。请确保：
          </p>
          <ul style="text-align: left; color: #666; margin-bottom: 20px;">
            <li>config.json 文件存在于 public 目录中</li>
            <li>文件格式正确且包含必要的配置项</li>
            <li>已正确配置高德地图API密钥</li>
          </ul>
          <p style="color: #999; font-size: 14px;">
            错误详情: ${error.message}
          </p>
        </div>
      </div>
    `;
  }
}

// Start the application
initApp();
