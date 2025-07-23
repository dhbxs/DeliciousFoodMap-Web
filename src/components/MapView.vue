<template>
  <div class="map-container">
    <div ref="mapContainer" class="map"></div>

    <!-- 地图控制按钮 -->
    <div class="map-controls">
      <el-button
        type="primary"
        icon="plus"
        circle
        @click="toggleAddMode"
        :class="{ active: addMode }"
        title="点击地图添加店铺"
      />
      <el-button
        icon="location"
        circle
        @click="centerToUserLocation"
        title="定位到当前位置"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useStore } from "vuex";
import { ElMessage, ElMessageBox } from "element-plus";
import { debounce } from "@/utils/debounceThrottle";
import shopService from "@/services/ShopService";
import amapLoader from "@/utils/amapLoader";
import {
  CoordinateValidator,
  MarkerPool,
  InfoWindowManager,
  GeolocationManager,
  MarkerClusterManager,
  BatchProcessor,
  ClusterFactory,
  ClusterMode
} from "@/utils/mapUtils";

export default {
  name: "MapView",

  setup() {
    const store = useStore();
    
    // DOM引用
    const mapContainer = ref(null);
    
    // 地图相关
    const map = ref(null);
    const AMapInstance = ref(null);
    const markerCluster = ref(null);
    const addMode = ref(false);

    // 管理器实例
    const markerPool = new MarkerPool();
    const infoWindowManager = new InfoWindowManager();
    const markers = ref(new Map());

    // 计算属性
    const shops = shopService.filteredShops;
    const mapCenter = computed(() => store.getters["ui/mapCenter"]);
    const mapZoom = computed(() => store.getters["ui/mapZoom"]);
    const mapSyncTrigger = computed(() => store.getters["shops/mapSyncTrigger"]);

    // 监听地图同步触发器
    watch(mapSyncTrigger, () => {
      if (map.value) {
        addShopMarkers();
      }
    });

    // 初始化地图
    const initMap = async () => {
      if (!mapContainer.value) return;

      try {
        AMapInstance.value = await amapLoader.loadAMap({
          plugins: [
            "AMap.Scale",
            "AMap.ToolBar", 
            "AMap.Geolocation",
            "AMap.MarkerCluster",
          ],
        });

        if (!AMapInstance.value) {
          throw new Error("高德地图加载失败");
        }

        // 创建地图实例
        map.value = new AMapInstance.value.Map(mapContainer.value, {
          center: [mapCenter.value[1], mapCenter.value[0]],
          zoom: mapZoom.value,
          zooms: [3, 20],
          expandZoomRange: true,
          touchZoomCenter: 1,
          features: ["bg", "point", "road", "building"],
          pitch: 0,
          rotation: 0,
        });

        // 添加地图控件
        addMapControls();
        
        // 绑定事件
        bindMapEvents();

        // 添加现有店铺标记
        addShopMarkers();
      } catch (error) {
        console.error("地图初始化失败:", error);
        ElMessage.error(`地图初始化失败: ${error.message || "请检查网络连接或API密钥配置"}`);
      }
    };

    // 添加地图控件
    const addMapControls = () => {
      map.value.addControl(new AMapInstance.value.Scale());
      map.value.addControl(
        new AMapInstance.value.ToolBar({
          position: { bottom: "50px", left: "10px" },
          visible: true,
          locate: true,
          zoom: true,
          scale: true,
        })
      );
    };

    // 绑定地图事件
    const bindMapEvents = () => {
      // 地图点击事件
      map.value.on("click", handleMapClick);

      // 地图移动结束事件
      map.value.on("moveend", () => {
        const center = map.value.getCenter();
        const zoom = map.value.getZoom();
        store.dispatch("ui/setMapState", {
          center: [center.lat, center.lng],
          zoom: zoom,
        });
      });
    };

    // 处理地图点击
    const handleMapClick = (e) => {
      if (!addMode.value) return;

      const { lng, lat } = e.lnglat;

      store.dispatch("ui/showShopForm");
      store.commit("ui/SET_TEMP_COORDINATES", { lat, lng });
      addMode.value = false;
    };

    // 添加店铺标记
    const addShopMarkers = () => {
      if (!map.value || !AMapInstance.value) return;

      requestAnimationFrame(() => {
        // 清理现有标记
        cleanupMarkers();

        // 过滤有效店铺
        const validShops = shops.value.filter(shop => {
          const coords = CoordinateValidator.normalize(shop);
          return coords.isValid;
        });

        if (validShops.length === 0) return;

        // 批量处理标记创建
        const points = [];
        
        BatchProcessor.process(
          validShops,
          100, // 批次大小
          (shop) => {
            const point = createMarkerPoint(shop);
            if (point) {
              points.push(point);
            }
          },
          () => {
            finishMarkerCreation(points);
          }
        );
      });
    };

    // 清理标记
    const cleanupMarkers = () => {
      if (markerCluster.value) {
        markerCluster.value.setMap(null);
        markerCluster.value = null;
      }
      markerPool.recycleAll(markers.value);
    };

    // 创建标记点
    const createMarkerPoint = (shop) => {
      const coords = CoordinateValidator.normalize(shop);
      if (!coords.isValid) return null;

      const content = `<div class="shop-marker">${shop.name.substring(0, 1)}</div>`;
      let marker = markerPool.get();

      if (!marker) {
        marker = new AMapInstance.value.Marker({
          content: content,
          position: [coords.lng, coords.lat],
          offset: new AMapInstance.value.Pixel(-20, -20),
          anchor: "center",
          clickable: true,
          bubble: true,
          draggable: false,
          cursor: "pointer",
          extData: shop,
        });
      } else {
        marker.setPosition([coords.lng, coords.lat]);
        marker.setContent(content);
        marker.setExtData(shop);
      }

      // 添加点击事件
      bindMarkerEvents(marker, shop);

      markers.value.set(shop.id, marker);

      return {
        lnglat: [coords.lng, coords.lat],
        shop: shop,
        marker: marker,
      };
    };

    // 绑定标记事件
    const bindMarkerEvents = (marker, shop) => {
      marker.off("click");
      marker.on("click", () => {
        const infoWindow = infoWindowManager.get(shop, AMapInstance.value);
        infoWindow.open(map.value, marker.getPosition());
        
        // 延迟绑定信息窗口事件
        setTimeout(() => {
          const infoWindowElement = document.querySelector(".amap-info-window");
          if (infoWindowElement) {
            infoWindowElement.addEventListener("click", handleInfoWindowClick);
          }
        }, 100);
      });
    };

    // 完成标记创建
    const finishMarkerCreation = (points) => {
      console.log("📍 Creating markers with points count:", points.length);

      if (AMapInstance.value && AMapInstance.value.MarkerCluster) {
        // 使用聚合（已内置点击散开功能）
        createMarkerCluster(points);
      } else {
        // MarkerCluster不可用时直接添加标记
        console.log("📍 MarkerCluster not available, adding markers directly");
        addMarkersDirectly();
      }
    };

    // 创建标记聚合
    const createMarkerCluster = (points) => {
      if (markerCluster.value) {
        markerCluster.value.setMap(null);
        markerCluster.value = null;
      }

      // 根据点数量自动选择聚合模式
      const recommendedMode = ClusterFactory.getRecommendedMode(points.length);
      
      // 创建聚合实例，启用点击散开功能
      const cluster = ClusterFactory.create(
        AMapInstance.value,
        map.value,
        points,
        recommendedMode,
        {
          gridSize: 60,          // 聚合网格大小
          maxZoom: 18,           // 最大聚合级别
          zoomOnClick: true,     // 点击时缩放散开 - 这是关键设置！
        }
      );

      if (cluster) {
        // 修复渲染函数中的作用域问题
        const originalRenderMarker = cluster.renderMarker || MarkerClusterManager.renderMarker;
        cluster.renderMarker = function(context) {
          const marker = context.marker;
          const shop = context.data[0]?.shop;
          
          if (shop) {
            bindMarkerEvents(marker, shop);
          }
          
          return originalRenderMarker.call(this, context);
        };

        markerCluster.value = cluster;
        console.log(`✅ MarkerCluster created successfully with ${recommendedMode} mode and click-to-expand feature`);
      } else {
        console.log("📍 Using direct marker placement (no clustering)");
        addMarkersDirectly();
      }
    };

    // 直接添加标记
    const addMarkersDirectly = () => {
      console.log("📍 MarkerCluster not available, adding markers directly");
      markers.value.forEach((marker) => {
        map.value.add(marker);
      });
      console.log("🎉 All markers added directly to map");
    };

    // 切换添加模式
    const toggleAddMode = () => {
      addMode.value = !addMode.value;
      if (addMode.value) {
        ElMessage.info("请在地图上点击选择店铺位置");
      }
    };

    // 定位到用户位置
    const centerToUserLocation = async () => {
      if (!map.value || !AMapInstance.value) return;

      try {
        const geolocation = GeolocationManager.create(AMapInstance.value);
        const pos = await GeolocationManager.getCurrentPosition(geolocation);
        
        map.value.setCenter([pos.lng, pos.lat]);
        map.value.setZoom(17);
        ElMessage.success("定位成功");

        store.dispatch("ui/setMapState", {
          center: [pos.lat, pos.lng],
          zoom: 17,
        });

        map.value.addControl(geolocation);
      } catch (error) {
        console.error("定位失败:", error);
        ElMessage.error(`定位失败: ${error.message}`);
      }
    };

    // 处理信息窗口点击事件
    const handleInfoWindowClick = (e) => {
      if (e.target.classList.contains("edit-shop-btn")) {
        const shopId = e.target.dataset.shopId;
        store.dispatch("ui/showShopForm", shopId);
      } else if (e.target.classList.contains("delete-shop-btn")) {
        const shopId = e.target.dataset.shopId;
        ElMessageBox.confirm("确定要删除这个店铺吗？", "确认删除", {
          type: "warning",
        })
          .then(async () => {
            try {
              await shopService.deleteShop(shopId);
              ElMessage.success("删除成功");
              store.dispatch("shops/notifyShopDataUpdate");
            } catch (error) {
              ElMessage.error(error.message || "删除失败");
            }
          })
          .catch(() => {});
      } else if (e.target.classList.contains("navigation-btn")) {
        const lng = parseFloat(e.target.dataset.lng);
        const lat = parseFloat(e.target.dataset.lat);
        handleNavigation(lng, lat);
      }
    };

    // 处理导航功能
    const handleNavigation = async (lng, lat) => {
      try {
        if (!AMapInstance.value) {
          throw new Error("地图实例未加载");
        }

        const geolocation = GeolocationManager.create(AMapInstance.value, {
          panToLocation: false,
        });
        
        const pos = await GeolocationManager.getCurrentPosition(geolocation);
        
        store.commit("ui/SET_MAP_CENTER", [pos.lat, pos.lng]);
        
        const url = `//uri.amap.com/navigation?from=${pos.lng},${pos.lat}&to=${lng},${lat}&mode=car&policy=0&callnative=1`;
        window.open(url, "_blank");
      } catch (error) {
        console.error("导航功能失败:", error);
        ElMessage.error(`导航功能失败: ${error.message}`);
      }
    };

    // 防抖的添加标记函数
    const debouncedAddShopMarkers = debounce(() => {
      requestAnimationFrame(() => {
        addShopMarkers();
      });
    }, 100);

    // 监听店铺变化
    const shopIds = computed(() => shops.value.map((shop) => shop.id));
    watch(shopIds, (newIds, oldIds) => {
      if (
        map.value &&
        (!oldIds ||
          newIds.length !== oldIds.length ||
          !newIds.every((id, index) => id === oldIds[index]))
      ) {
        debouncedAddShopMarkers();
      }
    });

    // 监听地图中心点和缩放级别变化
    watch([mapCenter, mapZoom], ([newCenter, newZoom]) => {
      if (!map.value || !newCenter) return;

      const currentCenter = map.value.getCenter();
      const currentZoom = map.value.getZoom();

      const centerChanged =
        Math.abs(newCenter[0] - currentCenter.lat) > 1e-6 ||
        Math.abs(newCenter[1] - currentCenter.lng) > 1e-6;
      const zoomChanged = newZoom !== currentZoom;

      if (centerChanged || zoomChanged) {
        map.value.setCenter([newCenter[1], newCenter[0]]);
        map.value.setZoom(newZoom);
      }
    });

    // 生命周期
    onMounted(() => {
      initMap();
    });

    onUnmounted(() => {
      // 取消防抖函数
      debouncedAddShopMarkers.cancel();

      // 清理聚合实例
      if (markerCluster.value) {
        markerCluster.value.setMap(null);
        markerCluster.value = null;
      }

      // 清理标记池
      markerPool.clear();

      // 清理信息窗口缓存
      infoWindowManager.clear();

      // 清理地图
      if (map.value) {
        map.value.destroy();
      }

      // 移除事件监听
      const infoWindowElement = document.querySelector(".amap-info-window");
      if (infoWindowElement) {
        infoWindowElement.removeEventListener("click", handleInfoWindowClick);
      }
    });

    return {
      mapContainer,
      addMode,
      toggleAddMode,
      centerToUserLocation,
    };
  },
};
</script>

<style scoped>
.map-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.map {
  height: 100%;
  width: 100%;
}

/* 地图控制按钮 */
.map-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .map-controls {
    top: 80px;
    left: 10px;
  }
}

.map-controls .el-button + .el-button {
  margin-left: 0;
}

.map-controls .el-button.active {
  background-color: #67c23a;
  border-color: #67c23a;
}

/* 高德地图样式调整 */
:deep(.amap-container) {
  font-family: inherit;
}

/* 信息窗体样式 */
:deep(.amap-info-window) {
  position: relative;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
  padding: 20px;
  width: 320px;
  font-family: var(--el-font-family);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color);
}

:deep(.amap-info-window .shop-title) {
  margin: 0 0 15px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color);
}

:deep(.amap-info-window .detail-item) {
  display: flex;
  margin: 12px 0;
  font-size: 14px;
  line-height: 1.5;
}

:deep(.amap-info-window .detail-label) {
  flex: 0 0 60px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

:deep(.amap-info-window .detail-value) {
  flex: 1;
  color: var(--el-text-color-primary);
}

:deep(.amap-info-window .shop-actions) {
  display: flex;
  gap: 12px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--el-border-color-light);
}

:deep(.amap-info-window .el-button) {
  flex: 1;
  padding: 10px 0;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
}

:deep(.amap-info-window .el-button:hover) {
  opacity: 0.85;
}

:deep(.shop-marker) {
  box-sizing: content-box;
  width: 40px;
  height: 40px;
  text-align: center;
  vertical-align: middle;
  line-height: 40px;
  border-radius: 50%;
  color: #fff;
  background-color: #6b7feb;
}
</style>
