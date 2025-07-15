class ConfigService {
  constructor() {
    this.config = null;
    this.loaded = false;
  }

  async loadConfig() {
    if (this.loaded && this.config) {
      return this.config;
    }

    try {
      const response = await fetch("/config.json");
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }

      this.config = await response.json();
      this.loaded = true;

      console.log("Configuration loaded:", this.config);
      return this.config;
    } catch (error) {
      console.error("Failed to load configuration:", error);
      throw new Error(
        "Configuration file (config.json) is required but could not be loaded. Please ensure config.json exists in the public directory."
      );
    }
  }

  async get(key) {
    if (!this.loaded) {
      await this.loadConfig();
    }
    return this.config ? this.config[key] : null;
  }

  async getAll() {
    if (!this.loaded) {
      await this.loadConfig();
    }
    return this.config;
  }

  isLoaded() {
    return this.loaded;
  }
}

export default new ConfigService();
