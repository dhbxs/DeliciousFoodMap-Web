import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { loadAmapAPI } from "./utils/amapLoader";
import "../public/iconfont/iconfont.css";
import "../public/iconfont/iconfont.js";
import "@/assets/css/iconfont-symbol.css";
// Element Plus
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

async function initializeApp() {
  try {
    console.log("Loading application configuration...");
    await store.dispatch("environment/loadConfig");
    console.log("Configuration loaded successfully");
    const amapKey = store.getters["environment/amapKey"];
    if (amapKey) {
      console.log("Loading AMap API...");
      try {
        await loadAmapAPI(amapKey);
        console.log("AMap API loaded successfully");
      } catch (error) {
        console.warn("Failed to load AMap API:", error.message);
      }
    } else {
      console.warn(
        "AMap API key not configured, map functionality may be limited"
      );
    }

    const app = createApp(App);

    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component);
    }
    app.use(store).use(router).use(ElementPlus).mount("#app");

    console.log("Application initialized successfully");
  } catch (error) {
    console.error("Failed to initialize application:", error);

    const errorDiv = document.createElement("div");
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #f56565;
        color: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        font-family: Arial, sans-serif;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        <h3 style="margin: 0 0 10px 0;">应用初始化失败</h3>
        <p style="margin: 0 0 15px 0;">无法加载应用配置，请检查网络连接或联系管理员</p>
        <button onclick="location.reload()" style="
          background: white;
          color: #f56565;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        ">重新加载</button>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
}

// Initialize the application
initializeApp();
