class ConfigService {
  constructor() {
    this.config = null;
    this.loaded = false;
    this.loading = false;
    this.loadPromise = null;
  }

  async loadConfig() {
    // 如果已经加载完成，直接返回配置
    if (this.loaded && this.config) {
      return this.config;
    }

    // 如果正在加载，返回现有的Promise避免重复加载
    if (this.loading && this.loadPromise) {
      return this.loadPromise;
    }

    this.loading = true;
    this.loadPromise = this._loadConfigFromFile();

    try {
      this.config = await this.loadPromise;
      this.loaded = true;
      this.loading = false;
      console.log("Configuration loaded successfully:", this.config);
      return this.config;
    } catch (error) {
      this.loading = false;
      this.loadPromise = null;
      console.error("Failed to load configuration:", error);
      throw error;
    }
  }

  async _loadConfigFromFile() {
    try {
      const response = await fetch("/config.json");
      if (!response.ok) {
        throw new Error(
          `Failed to load config: ${response.status} ${response.statusText}`
        );
      }

      const config = await response.json();

      // 验证必要的配置项
      this._validateConfig(config);

      return config;
    } catch (error) {
      // 如果配置文件加载失败，尝试使用环境变量
      console.warn(
        "Config file not available, falling back to environment variables"
      );
      return this._loadConfigFromEnv();
    }
  }

  _loadConfigFromEnv() {
    // 从环境变量中获取配置（适用于开发环境）
    const config = {
      APP_AMAP_KEY: process.env.VUE_APP_AMAP_KEY || "",
      APP_AMAP_SECRET: process.env.VUE_APP_AMAP_SECRET || "",
      API_BASE_URL: process.env.VUE_APP_API_BASE_URL || "http://localhost:8080",
      APP_NAME: process.env.VUE_APP_NAME || "美食地图",
      APP_VERSION: process.env.VUE_APP_VERSION || "1.0.0",
    };

    this._validateConfig(config);
    return config;
  }

  _validateConfig(config) {
    if (!config) {
      throw new Error("Configuration object is null or undefined");
    }

    // 检查必要的配置项
    const requiredKeys = ["APP_AMAP_KEY"];
    const missingKeys = requiredKeys.filter((key) => !config[key]);

    if (missingKeys.length > 0) {
      console.warn(`Missing configuration keys: ${missingKeys.join(", ")}`);
      // 对于开发环境，只是警告而不抛出错误
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          `Missing required configuration: ${missingKeys.join(", ")}`
        );
      }
    }
  }

  async get(key, defaultValue = null) {
    if (!this.loaded) {
      await this.loadConfig();
    }
    return this.config ? this.config[key] ?? defaultValue : defaultValue;
  }

  async getAll() {
    if (!this.loaded) {
      await this.loadConfig();
    }
    return this.config || {};
  }

  /**
   * 获取地图相关配置
   * @returns {Promise<Object>}
   */
  async getMapConfig() {
    if (!this.loaded) {
      await this.loadConfig();
    }

    return {
      key: await this.get("APP_AMAP_KEY"),
      securityJsCode: await this.get("APP_AMAP_SECRET"),
      version: await this.get("APP_AMAP_VERSION", "2.0"),
      plugins: await this.get("APP_AMAP_PLUGINS", [
        "AMap.Scale",
        "AMap.ToolBar",
        "AMap.ControlBar",
        "AMap.Geolocation",
        "AMap.MarkerClusterer",
      ]),
      AMapUI: await this.get("APP_AMAP_UI", {
        version: "1.1",
        plugins: [],
      }),
      Loca: await this.get("APP_AMAP_LOCA", {
        version: "2.0.0",
      }),
    };
  }

  /**
   * 检查配置是否已加载
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * 重置配置服务（用于测试或重新加载）
   */
  reset() {
    this.config = null;
    this.loaded = false;
    this.loading = false;
    this.loadPromise = null;
  }

  /**
   * 动态设置配置项（用于开发调试）
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    if (!this.config) {
      this.config = {};
    }
    this.config[key] = value;
    console.log(`Configuration updated: ${key} = ${value}`);
  }
}

export default new ConfigService();
