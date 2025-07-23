/**
 * 地图工具类 - 抽取MapView组件中的可复用逻辑
 */

/**
 * 坐标验证工具
 */
export class CoordinateValidator {
  /**
   * 验证坐标是否有效
   * @param {number} lng - 经度
   * @param {number} lat - 纬度
   * @returns {boolean} 是否有效
   */
  static isValid(lng, lat) {
    const numLng = parseFloat(lng);
    const numLat = parseFloat(lat);
    
    return !isNaN(numLng) &&
           !isNaN(numLat) &&
           numLng !== 0 &&
           numLat !== 0 &&
           numLng >= 73 &&  // 中国经度范围
           numLng <= 135 &&
           numLat >= 3 &&   // 中国纬度范围
           numLat <= 54;
  }

  /**
   * 标准化坐标数据
   * @param {Object} shop - 店铺对象
   * @returns {Object} 标准化后的坐标
   */
  static normalize(shop) {
    const lng = parseFloat(shop.lng || shop.longitude || 0);
    const lat = parseFloat(shop.lat || shop.latitude || 0);
    
    return {
      lng,
      lat,
      isValid: this.isValid(lng, lat)
    };
  }
}

/**
 * 标记池管理器 - 复用标记对象以提高性能
 */
export class MarkerPool {
  constructor() {
    this.pool = [];
    this.activeMarkers = new Map();
  }

  /**
   * 从池中获取标记
   * @returns {Object|null} 标记对象或null
   */
  get() {
    return this.pool.length > 0 ? this.pool.pop() : null;
  }

  /**
   * 回收标记到池中
   * @param {Object} marker - 标记对象
   */
  recycle(marker) {
    if (marker) {
      marker.setMap(null);
      this.pool.push(marker);
    }
  }

  /**
   * 批量回收所有活跃标记
   * @param {Map} markers - 活跃标记Map
   */
  recycleAll(markers) {
    markers.forEach(marker => this.recycle(marker));
    markers.clear();
  }

  /**
   * 清空池
   */
  clear() {
    this.pool.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    this.pool.length = 0;
    this.activeMarkers.clear();
  }
}

/**
 * 信息窗口管理器
 */
export class InfoWindowManager {
  constructor() {
    this.cache = new Map();
  }

  /**
   * 获取信息窗口（使用缓存）
   * @param {Object} shop - 店铺对象
   * @param {Object} AMapInstance - 高德地图实例
   * @returns {Object} 信息窗口对象
   */
  get(shop, AMapInstance) {
    if (this.cache.has(shop.id)) {
      return this.cache.get(shop.id);
    }

    const coords = CoordinateValidator.normalize(shop);
    const description = shop.description || "暂无描述";

    const infoWindow = new AMapInstance.InfoWindow({
      content: this.createContent(shop, coords.lng, coords.lat, description),
      anchor: "bottom-center",
      offset: new AMapInstance.Pixel(0, -10),
      isCustom: false,
      closeWhenClickMap: true,
      showShadow: true,
      autoMove: true,
      avoid: [20, 20, 20, 20],
    });

    this.cache.set(shop.id, infoWindow);
    return infoWindow;
  }

  /**
   * 创建信息窗口内容
   * @param {Object} shop - 店铺对象
   * @param {number} lng - 经度
   * @param {number} lat - 纬度
   * @param {string} description - 描述
   * @returns {string} HTML内容
   */
  createContent(shop, lng, lat, description) {
    return `
      <div class="amap-info-window">
        <h4 class="shop-title">${shop.name}</h4>
        <div class="detail-item">
          <span class="detail-label">分类:</span>
          <span class="detail-value">${shop.categoryName}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">地址:</span>
          <span class="detail-value">${shop.address}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">描述:</span>
          <span class="detail-value">${description}</span>
        </div>
        <div class="shop-actions">
          <button
            data-lng="${lng}"
            data-lat="${lat}"
            class="navigation-btn el-button el-button--primary"
          >
            导航
          </button>
          <button
            data-shop-id="${shop.id}"
            class="edit-shop-btn el-button el-button--primary"
          >
            编辑
          </button>
          <button
            data-shop-id="${shop.id}"
            class="delete-shop-btn el-button el-button--danger"
          >
            删除
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 清理缓存
   */
  clear() {
    this.cache.forEach(infoWindow => {
      if (infoWindow && infoWindow.close) {
        infoWindow.close();
      }
    });
    this.cache.clear();
  }
}

/**
 * 地理定位管理器
 */
export class GeolocationManager {
  /**
   * 创建地理定位实例
   * @param {Object} AMapInstance - 高德地图实例
   * @param {Object} options - 定位选项
   * @returns {Object} 地理定位实例
   */
  static create(AMapInstance, options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      convert: true,
      showButton: false,
      buttonPosition: "LB",
      showMarker: true,
      showCircle: false,
      panToLocation: true,
      zoomToAccuracy: true,
    };

    return new AMapInstance.Geolocation({
      ...defaultOptions,
      ...options,
    });
  }

  /**
   * 获取当前位置
   * @param {Object} geolocation - 地理定位实例
   * @returns {Promise<Object>} 位置信息
   */
  static getCurrentPosition(geolocation) {
    return new Promise((resolve, reject) => {
      geolocation.getCurrentPosition((status, result) => {
        if (status === "complete") {
          const pos = result.position;
          if (pos && typeof pos.lng === "number" && typeof pos.lat === "number") {
            resolve(pos);
          } else {
            reject(new Error("无法获取有效位置信息"));
          }
        } else {
          reject(new Error(result.message || "定位失败"));
        }
      });
    });
  }
}

/**
 * 标记聚合管理器
 */
export class MarkerClusterManager {
  /**
   * 创建聚合配置
   * @param {Object} options - 自定义配置选项
   * @returns {Object} 聚合配置对象
   */
  static createConfig(options = {}) {
    const defaultConfig = {
      gridSize: 60,         // 聚合网格大小，像素单位
      maxZoom: 18,          // 最大聚合的地图级别
      averageCenter: true,  // 聚合点的中心是否基于所包含标记的平均中心
      zoomOnClick: true,    // 点击聚合标记时自动缩放到合适级别，实现散开效果
      renderClusterMarker: this.renderClusterMarker,
      renderMarker: this.renderMarker,
    };
    
    return { ...defaultConfig, ...options };
  }

  /**
   * 创建高级聚合配置（支持更多自定义）
   * @param {Object} options - 配置选项
   * @returns {Object} 聚合配置对象
   */
  static createAdvancedConfig(options = {}) {
    const {
      gridSize = 60,
      maxZoom = 18,
      minClusterSize = 2,     // 最小聚合数量
      enableCustomRender = true,
      zoomIncrement = 2,      // 点击聚合时的缩放增量
      ...customOptions
    } = options;

    return {
      gridSize,
      maxZoom,
      averageCenter: true,
      zoomOnClick: true,
      renderClusterMarker: enableCustomRender ? this.renderAdvancedClusterMarker : this.renderClusterMarker,
      renderMarker: this.renderMarker,
      ...customOptions
    };
  }

  /**
   * 渲染聚合标记
   * @param {Object} context - 聚合上下文
   * @returns {Object} 标记对象
   */
  static renderClusterMarker(context) {
    const count = context.count;
    let size = 40;
    let color = "#409EFF";
    let textColor = "white";

    // 根据聚合点包含的标记数量设置不同样式
    if (count < 10) {
      size = 45;
      color = "#409EFF";
    } else if (count < 50) {
      size = 55;
      color = "#E6A23C";
    } else if (count < 100) {
      size = 65;
      color = "#F56C6C";
    } else {
      size = 75;
      color = "#9C27B0";
    }

    const content = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 3px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${textColor};
        font-size: ${size > 60 ? "18px" : size > 50 ? "16px" : "14px"};
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.3s ease-in-out;
        position: relative;
      " 
      onmouseover="
        this.style.transform='scale(1.15)'; 
        this.style.boxShadow='0 6px 20px rgba(0,0,0,0.4)';
        this.style.zIndex='1000';
      " 
      onmouseout="
        this.style.transform='scale(1)'; 
        this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)';
        this.style.zIndex='auto';
      "
      title="点击查看 ${count} 个店铺">
        ${count}
      </div>
    `;

    context.marker.setContent(content);
    
    // 设置标记可点击
    context.marker.setClickable(true);
    
    return context.marker;
  }

  /**
   * 渲染高级聚合标记（带动画和更好的视觉效果）
   * @param {Object} context - 聚合上下文
   * @returns {Object} 标记对象
   */
  static renderAdvancedClusterMarker(context) {
    const count = context.count;
    let size = 40;
    let color = "#409EFF";
    let textColor = "white";
    let borderColor = "#ffffff";

    // 更精细的样式分级
    if (count < 5) {
      size = 40;
      color = "#67C23A";  // 绿色
    } else if (count < 15) {
      size = 50;
      color = "#409EFF";  // 蓝色
    } else if (count < 30) {
      size = 60;
      color = "#E6A23C";  // 橙色
    } else if (count < 50) {
      size = 70;
      color = "#F56C6C";  // 红色
    } else {
      size = 80;
      color = "#9C27B0";  // 紫色
      textColor = "#fff";
    }

    const content = `
      <div class="cluster-marker-advanced" style="
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, ${color} 0%, ${color}dd 100%);
        border: 4px solid ${borderColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${textColor};
        font-size: ${size > 70 ? "20px" : size > 60 ? "18px" : size > 50 ? "16px" : "14px"};
        font-weight: bold;
        box-shadow: 
          0 4px 15px rgba(0,0,0,0.2),
          0 2px 8px rgba(0,0,0,0.1),
          inset 0 1px 0 rgba(255,255,255,0.3);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        animation: clusterPulse 2s infinite;
      " 
      onmouseover="
        this.style.transform='scale(1.2) rotate(5deg)'; 
        this.style.boxShadow='0 8px 25px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.2)';
        this.style.zIndex='1000';
        this.style.animation='none';
      " 
      onmouseout="
        this.style.transform='scale(1) rotate(0deg)'; 
        this.style.boxShadow='0 4px 15px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.1)';
        this.style.zIndex='auto';
        this.style.animation='clusterPulse 2s infinite';
      "
      title="点击展开查看 ${count} 个店铺">
        <span style="text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${count}</span>
      </div>
      <style>
        @keyframes clusterPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      </style>
    `;

    context.marker.setContent(content);
    context.marker.setClickable(true);
    
    return context.marker;
  }

  /**
   * 渲染单个标记
   * @param {Object} context - 标记上下文
   * @returns {Object} 标记对象
   */
  static renderMarker(context) {
    const shop = context.data[0]?.shop;
    const shopName = shop ? shop.name : 'N/A';
    const firstChar = shopName ? shopName.substring(0, 1) : '?';
    
    context.marker.setContent(`<div class="shop-marker">${firstChar}</div>`);
    return context.marker;
  }
}

/**
 * 批处理管理器
 */
export class BatchProcessor {
  /**
   * 分批处理数据
   * @param {Array} data - 数据数组
   * @param {number} batchSize - 批次大小
   * @param {Function} processor - 处理函数
   * @param {Function} onComplete - 完成回调
   */
  static process(data, batchSize, processor, onComplete) {
    let currentIndex = 0;

    const processBatch = () => {
      const endIndex = Math.min(currentIndex + batchSize, data.length);
      
      for (let i = currentIndex; i < endIndex; i++) {
        processor(data[i], i);
      }
      
      currentIndex = endIndex;

      if (currentIndex >= data.length) {
        onComplete();
      } else {
        requestAnimationFrame(processBatch);
      }
    };

    processBatch();
  }
}

/**
 * 聚合模式枚举
 */
export const ClusterMode = {
  STANDARD: 'standard',
  ADVANCED: 'advanced',
  NONE: 'none'
};

/**
 * 聚合工厂类 - 提供统一的聚合创建接口
 */
export class ClusterFactory {
  /**
   * 创建聚合实例
   * @param {Object} AMapInstance - 高德地图实例
   * @param {Object} map - 地图对象
   * @param {Array} points - 标记点数据
   * @param {string} mode - 聚合模式
   * @param {Object} options - 自定义配置
   * @returns {Object} 聚合实例
   */
  static create(AMapInstance, map, points, mode = ClusterMode.STANDARD, options = {}) {
    if (!AMapInstance || !AMapInstance.MarkerCluster) {
      console.warn('MarkerCluster not available, points will be added directly');
      return null;
    }

    let config;
    
    switch (mode) {
      case ClusterMode.ADVANCED:
        config = MarkerClusterManager.createAdvancedConfig(options);
        break;
      case ClusterMode.STANDARD:
        config = MarkerClusterManager.createConfig(options);
        break;
      case ClusterMode.NONE:
        return null;
      default:
        config = MarkerClusterManager.createConfig(options);
    }

    return new AMapInstance.MarkerCluster(map, points, config);
  }

  /**
   * 获取推荐的聚合模式
   * @param {number} pointCount - 标记点数量
   * @returns {string} 推荐的聚合模式
   */
  static getRecommendedMode(pointCount) {
    if (pointCount < 10) {
      return ClusterMode.NONE;
    } else if (pointCount < 100) {
      return ClusterMode.STANDARD;
    } else {
      return ClusterMode.ADVANCED;
    }
  }
} 