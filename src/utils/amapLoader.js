/**
 * AMap Dynamic Loader
 * Dynamically loads AMap script with API key from configuration
 */
import configService from "@/services/configService";

class AmapLoader {
  constructor() {
    this.loaded = false;
    this.loading = false;
    this.loadPromise = null;
  }

  /**
   * Load AMap script dynamically
   * @returns {Promise<void>}
   */
  async loadAMap() {
    // If already loaded, return immediately
    if (this.loaded && window.AMap) {
      return Promise.resolve();
    }

    // If currently loading, return the existing promise
    if (this.loading && this.loadPromise) {
      return this.loadPromise;
    }

    this.loading = true;
    this.loadPromise = this._loadScript();

    try {
      await this.loadPromise;
      this.loaded = true;
      this.loading = false;
      return Promise.resolve();
    } catch (error) {
      this.loading = false;
      this.loadPromise = null;
      throw error;
    }
  }

  /**
   * Internal method to load the script
   * @returns {Promise<void>}
   * @private
   */
  async _loadScript() {
    try {
      // Get API key from configuration
      const apiKey = await configService.get("APP_AMAP_KEY");

      if (!apiKey) {
        throw new Error("AMap API key not found in configuration");
      }

      // Remove existing script if any
      const existingScript = document.querySelector(
        'script[src*="webapi.amap.com"]'
      );
      if (existingScript) {
        existingScript.remove();
      }

      // Create and load the script
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Scale,AMap.ToolBar,AMap.ControlBar,AMap.Geolocation`;

      return new Promise((resolve, reject) => {
        script.onload = () => {
          console.log("AMap script loaded successfully");
          resolve();
        };

        script.onerror = () => {
          reject(new Error("Failed to load AMap script"));
        };

        document.head.appendChild(script);
      });
    } catch (error) {
      console.error("Failed to load AMap:", error);
      throw error;
    }
  }

  /**
   * Check if AMap is loaded and available
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded && window.AMap;
  }
}

// Export singleton instance
export default new AmapLoader();
