/**
 * AMap Dynamic Loader - 升级版
 * 使用官方@amap/amap-jsapi-loader实现标准化的高德地图加载
 *
 * 使用示例：
 *
 * // 基本使用
 * import amapLoader from "@/utils/amapLoader";
 *
 * async function initMap() {
 *   try {
 *     const AMap = await amapLoader.loadAMap();
 *     const map = new AMap.Map('container', {
 *       center: [116.397428, 39.90923],
 *       zoom: 11
 *     });
 *   } catch (error) {
 *     console.error('地图加载失败:', error);
 *   }
 * }
 *
 * // 高级使用 - 自定义配置
 * const AMap = await amapLoader.loadAMap({
 *   version: '2.0',
 *   plugins: ['AMap.Geocoder', 'AMap.Autocomplete'],
 *   AMapUI: {
 *     version: '1.1',
 *     plugins: ['overlay/SimpleMarker']
 *   }
 * });
 *
 * // 动态加载插件
 * await amapLoader.loadPlugins(['AMap.PlaceSearch', 'AMap.DistrictSearch']);
 */
import AMapLoader from "@amap/amap-jsapi-loader";
import configService from "@/services/configService";

class AmapLoaderService {
  constructor() {
    this.loaded = false;
    this.loading = false;
    this.loadPromise = null;
    this.AMapInstance = null;
  }

  /**
   * 加载高德地图API
   * @param {Object} options - 加载配置选项
   * @returns {Promise<AMap>}
   */
  async loadAMap(options = {}) {
    // 如果已经加载完成，直接返回
    if (this.loaded && this.AMapInstance) {
      return Promise.resolve(this.AMapInstance);
    }

    // 如果正在加载，返回现有的Promise
    if (this.loading && this.loadPromise) {
      return this.loadPromise;
    }

    this.loading = true;
    this.loadPromise = this._loadWithOfficialLoader(options);

    try {
      this.AMapInstance = await this.loadPromise;
      this.loaded = true;
      this.loading = false;
      return this.AMapInstance;
    } catch (error) {
      this.loading = false;
      this.loadPromise = null;
      throw error;
    }
  }

  /**
   * 使用官方Loader加载地图
   * @param {Object} options - 配置选项
   * @returns {Promise<AMap>}
   * @private
   */
  async _loadWithOfficialLoader(options) {
    try {
      // 获取地图配置
      const mapConfig = await configService.getMapConfig();

      // 合并配置服务的配置和传入的配置
      const loaderConfig = {
        ...mapConfig,
        ...options, // 传入的配置覆盖默认配置
      };

      // 验证API密钥
      if (!loaderConfig.key) {
        throw new Error(
          "高德地图API密钥未找到，请检查配置文件或环境变量 VUE_APP_AMAP_KEY"
        );
      }

      // 设置安全密钥配置（避免统计接口问题）
      if (loaderConfig.securityJsCode) {
        window._AMapSecurityConfig = {
          securityJsCode: loaderConfig.securityJsCode,
        };
      }

      console.log("正在使用官方AMapLoader加载高德地图...", {
        version: loaderConfig.version,
        plugins: loaderConfig.plugins?.length || 0,
        hasLoca: !!loaderConfig.Loca,
        hasSecurityConfig: !!loaderConfig.securityJsCode,
      });

      // 使用官方加载器
      const AMap = await AMapLoader.load(loaderConfig);

      if (!AMap) {
        throw new Error("高德地图加载返回空对象");
      }

      console.log("高德地图加载成功", {
        version: AMap.version || "unknown",
        hasMarkerClusterer: !!AMap.MarkerClusterer,
        hasGeolocation: !!AMap.Geolocation,
      });

      return AMap;
    } catch (error) {
      console.error("高德地图加载失败:", error);

      // 提供更友好的错误信息
      let friendlyMessage = "高德地图加载失败";
      if (error.message.includes("key")) {
        friendlyMessage = "高德地图API密钥配置错误";
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        friendlyMessage = "网络连接失败，请检查网络状态";
      } else if (
        error.message.includes("script") ||
        error.message.includes("Script error")
      ) {
        friendlyMessage = "地图脚本加载失败，可能被广告拦截器阻止";
      } else if (
        error.message.includes("count") ||
        error.message.includes("UIInit")
      ) {
        friendlyMessage = "地图统计接口被拦截，请检查广告拦截器设置";
      }

      throw new Error(`${friendlyMessage}: ${error.message}`);
    }
  }

  /**
   * 检查地图是否已加载
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded && this.AMapInstance && window.AMap;
  }

  /**
   * 获取当前AMap实例
   * @returns {AMap|null}
   */
  getAMapInstance() {
    return this.AMapInstance;
  }

  /**
   * 重置加载状态（用于重新加载）
   */
  reset() {
    this.loaded = false;
    this.loading = false;
    this.loadPromise = null;
    this.AMapInstance = null;
  }

  /**
   * 加载额外插件
   * @param {Array} plugins - 插件名称数组
   * @returns {Promise}
   */
  async loadPlugins(plugins = []) {
    if (!this.isLoaded()) {
      throw new Error("请先加载高德地图主体库");
    }

    return new Promise((resolve, reject) => {
      if (plugins.length === 0) {
        resolve();
        return;
      }

      this.AMapInstance.plugin(
        plugins,
        () => {
          console.log("插件加载完成:", plugins);
          resolve();
        },
        (error) => {
          console.error("插件加载失败:", error);
          reject(new Error(`插件加载失败: ${error}`));
        }
      );
    });
  }
}

// 导出单例实例
export default new AmapLoaderService();
