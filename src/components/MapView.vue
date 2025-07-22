<template>
  <div class="map-container">
    <div ref="mapContainer" class="map"></div>

    <!-- 地图控制按钮 -->
    <div class="map-controls">
      <el-button
        type="primary"
        :icon="Plus"
        circle
        @click="toggleAddMode"
        :class="{ active: addMode }"
        title="点击地图添加店铺"
      />
      <el-button
        :icon="Location"
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
import { Plus, Location } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { debounce } from "lodash";
import shopService from "@/services/ShopService";
import amapLoader from "@/utils/amapLoader";

export default {
  name: "MapView",

  setup() {
    const store = useStore();
    const mapContainer = ref(null);
    const map = ref(null);
    const markers = ref(new Map());
    const markerCluster = ref(null);
    const addMode = ref(false);

    // 地图实例引用
    const AMapInstance = ref(null);

    const markerPool = [];
    const infoWindowCache = new Map();

    // 计算属性
    const shops = shopService.filteredShops;
    const mapCenter = computed(() => store.getters["ui/mapCenter"]);
    const mapZoom = computed(() => store.getters["ui/mapZoom"]);

    // Watch for map sync triggers from Vuex
    const mapSyncTrigger = computed(
      () => store.getters["shops/mapSyncTrigger"]
    );

    watch(mapSyncTrigger, () => {
      // Re-add markers when map sync is triggered
      if (map.value) {
        addShopMarkers();
      }
    });

    // 初始化地图
    const initMap = async () => {
      if (!mapContainer.value) return;

      try {
        // 使用升级后的官方loader加载地图
        AMapInstance.value = await amapLoader.loadAMap({
          // 可以在这里传入额外的配置
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
          center: [mapCenter.value[1], mapCenter.value[0]], // 高德地图使用[lng, lat]格式
          zoom: mapZoom.value,
          mapStyle: "amap://styles/normal", // 标准地图样式
          viewMode: "2D", // 2D视图
          lang: "zh_cn", // 中文
          zooms: [3, 20], // 2.0版本支持的缩放级别范围
          showIndoorMap: false, // 不显示室内地图
          expandZoomRange: true, // 是否支持可以扩展缩放范围
          dragEnable: true, // 是否可拖拽
          zoomEnable: true, // 是否可缩放
          doubleClickZoom: true, // 是否支持双击缩放
          keyboardEnable: true, // 是否支持键盘操作
          scrollWheel: true, // 是否支持滚轮缩放
          touchZoom: true, // 是否支持触摸缩放
          touchZoomCenter: 1, // 手机端双指缩放的中心
          showBuildingBlock: true, // 是否显示3D楼块
          features: ["bg", "point", "road", "building"], // 设置地图显示要素
          pitch: 0, // 地图俯仰角度，2D模式下为0
          rotation: 0, // 地图顺时针旋转角度
        });

        // 添加地图控件
        map.value.addControl(new AMapInstance.value.Scale());
        map.value.addControl(
          new AMapInstance.value.ToolBar({
            position: { bottom: "50px", left: "10px" }, // 控制条位置
            visible: true, // 是否显示
            locate: true, // 定位按钮
            zoom: true, // 缩放按钮
            scale: true, // 比例尺
          })
        );

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

        // 添加现有店铺标记
        addShopMarkers();
      } catch (error) {
        console.error("地图初始化失败:", error);
        ElMessage.error(
          `地图初始化失败: ${error.message || "请检查网络连接或API密钥配置"}`
        );
      }
    };

    // 处理地图点击
    const handleMapClick = (e) => {
      if (!addMode.value) return;

      const { lng, lat } = e.lnglat; // 高德地图事件对象结构

      // 显示添加店铺表单，并传递坐标
      store.dispatch("ui/showShopForm");

      // 临时存储点击的坐标
      store.commit("ui/SET_TEMP_COORDINATES", { lat, lng });

      // 关闭添加模式
      addMode.value = false;
    };

    const getMarkerFromPool = () => {
      return markerPool.length > 0 ? markerPool.pop() : null;
    };

    const recycleMarker = (marker) => {
      if (marker) {
        marker.setMap(null);
        markerPool.push(marker);
      }
    };

    const getInfoWindow = (shop) => {
      if (infoWindowCache.has(shop.id)) {
        return infoWindowCache.get(shop.id);
      }

      const lng = parseFloat(shop.lng || shop.longitude);
      const lat = parseFloat(shop.lat || shop.latitude);
      shop.description = shop.description || "暂无描述";

      const infoWindow = new AMapInstance.value.InfoWindow({
        content: `
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
              <span class="detail-value">${shop.description}</span>
            </div>
            <div class="shop-actions">
               <button
                onclick="navigationToShop(${lng}, ${lat})"
                class="el-button el-button--primary"
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
        `,
        anchor: "bottom-center", // 2.0版本推荐的锚点位置
        offset: new AMapInstance.value.Pixel(0, -10), // 调整偏移量
        isCustom: false, // 2.0版本建议使用标准信息窗体
        closeWhenClickMap: true, // 点击地图时关闭
        showShadow: true, // 显示阴影
        autoMove: true, // 是否自动调整窗体到视野内
        avoid: [20, 20, 20, 20], // 自动避让的边距
      });

      infoWindowCache.set(shop.id, infoWindow);
      return infoWindow;
    };

    const addShopMarkers = () => {
      if (!map.value || !AMapInstance.value) return;

      console.log("🗺️ AddShopMarkers called");
      console.log("📊 Shops data:", shops.value);
      console.log("📈 Shops count:", shops.value?.length || 0);

      requestAnimationFrame(() => {
        // 清理现有的聚合和标记
        if (markerCluster.value) {
          markerCluster.value.setMap(null);
          markerCluster.value = null;
        }
        markers.value.forEach((marker) => recycleMarker(marker));
        markers.value.clear();
        const points = [];
        const validShops = shops.value.filter((shop) => {
          const lng = parseFloat(shop.lng || shop.longitude);
          const lat = parseFloat(shop.lat || shop.latitude);
          const isValid =
            !isNaN(lng) &&
            !isNaN(lat) &&
            lng !== 0 &&
            lat !== 0 &&
            lng >= 73 &&
            lng <= 135 &&
            lat >= 3 &&
            lat <= 54;

          if (!isValid) {
            console.log("❌ Invalid shop coordinates:", shop.name, {
              lng,
              lat,
            });
          }

          return isValid;
        });

        console.log("✅ Valid shops count:", validShops.length);

        const batchSize = 100;
        let currentIndex = 0;
        const processBatch = () => {
          const endIndex = Math.min(
            currentIndex + batchSize,
            validShops.length
          );
          for (let i = currentIndex; i < endIndex; i++) {
            const shop = validShops[i];
            const lng = parseFloat(shop.lng || shop.longitude);
            const lat = parseFloat(shop.lat || shop.latitude);

            // 创建标记用于备用（当聚合不可用时）
            const content = `<div class="shop-marker">${shop.name.substring(
              0,
              1
            )}</div>`;
            let marker = getMarkerFromPool();

            if (!marker) {
              marker = new AMapInstance.value.Marker({
                content: content,
                position: [lng, lat],
                offset: new AMapInstance.value.Pixel(-20, -20),
                anchor: "center",
                clickable: true,
                bubble: true,
                draggable: false,
                cursor: "pointer",
                extData: shop, // 将店铺数据存储到marker中
              });
            } else {
              marker.setPosition([lng, lat]);
              marker.setContent(content);
              marker.setExtData(shop);
            }

            // 添加点击事件
            marker.off("click");
            marker.on("click", () => {
              const infoWindow = getInfoWindow(shop);
              infoWindow.open(map.value, marker.getPosition());
              setTimeout(() => {
                const infoWindowElement =
                  document.querySelector(".amap-info-window");
                if (infoWindowElement) {
                  infoWindowElement.addEventListener(
                    "click",
                    handleInfoWindowClick
                  );
                }
              }, 100);
            });

            // 创建points数组项，包含位置和店铺信息
            const point = {
              lnglat: [lng, lat],
              shop: shop, // 包含完整的店铺信息
              marker: marker, // 包含创建的标记
            };
            points.push(point);
            markers.value.set(shop.id, marker);
          }
          currentIndex = endIndex;

          // 处理完所有批次后创建聚合
          if (currentIndex >= validShops.length) {
            finishMarkerCreation(points);
          } else {
            requestAnimationFrame(processBatch);
          }
        };
        processBatch();
      });
    };

    const finishMarkerCreation = (points) => {
      console.log("📍 Creating markers with points count:", points.length);

      // 检查MarkerCluster插件是否可用
      if (AMapInstance.value && AMapInstance.value.MarkerCluster) {
        console.log("📍 Using MarkerCluster");

        // 如果已有聚合实例，先销毁
        if (markerCluster.value) {
          markerCluster.value.setMap(null);
          markerCluster.value = null;
        }

        // 创建新的聚合实例
        markerCluster.value = new AMapInstance.value.MarkerCluster(
          map.value,
          points,
          {
            gridSize: 60, // 聚合网格大小，像素单位
            maxZoom: 18, // 最大聚合的地图级别
            averageCenter: true, // 聚合点的中心是否基于所包含标记的平均中心
            zoomOnClick: true, // 点击聚合标记时是否自动缩放到合适级别
            renderClusterMarker: function (context) {
              // 自定义聚合点标记的渲染
              const count = context.count;
              let size = 40;
              let color = "#409EFF";

              // 根据聚合点包含的标记数量设置不同样式
              if (count < 10) {
                size = 40;
                color = "#409EFF";
              } else if (count < 100) {
                size = 50;
                color = "#E6A23C";
              } else {
                size = 60;
                color = "#F56C6C";
              }

              const content = `
                <div style="
                  width: ${size}px;
                  height: ${size}px;
                  background-color: ${color};
                  border: 2px solid #ffffff;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: ${size > 50 ? "16px" : "14px"};
                  font-weight: bold;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                  cursor: pointer;
                  transition: transform 0.2s ease-in-out;
                " onmouseover="this.style.transform='scale(1.1)'" 
                   onmouseout="this.style.transform='scale(1)'">
                  ${count}
                </div>
              `;

              // 设置聚合点标记内容
              context.marker.setContent(content);
              return context.marker;
            },
          }
        );

        console.log(
          "✅ MarkerCluster created successfully with",
          points.length,
          "points"
        );
      } else {
        // 如果MarkerCluster不可用，直接添加标记到地图
        console.log(
          "📍 MarkerCluster not available, adding markers directly to map"
        );

        // 从存储的markers中获取并添加到地图
        markers.value.forEach((marker) => {
          map.value.add(marker);
        });
        console.log("🎉 All markers added directly to map");
      }
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
        // 在高德地图2.0中，Geolocation插件已预加载，可以直接使用
        const geolocation = new AMapInstance.value.Geolocation({
          enableHighAccuracy: true, // 是否使用高精度定位
          timeout: 10000, // 超时时间
          maximumAge: 0, // 定位结果缓存0毫秒
          convert: true, // 自动偏移坐标
          showButton: false, // 不显示定位按钮
          buttonPosition: "LB", // 定位按钮停靠位置
          showMarker: true, // 定位成功后在定位到的位置显示点标记
          showCircle: false, // 定位成功后用圆圈表示定位精度范围
          panToLocation: true, // 定位成功后将定位到的位置作为地图中心点
          zoomToAccuracy: true, // 定位成功后调整地图视野范围使定位位置及精度范围视野内可见
        });

        geolocation.getCurrentPosition((status, result) => {
          if (status === "complete") {
            const pos = result.position;
            if (
              pos &&
              typeof pos.lng === "number" &&
              typeof pos.lat === "number"
            ) {
              map.value.setCenter([pos.lng, pos.lat]);
              map.value.setZoom(17);
              ElMessage.success("定位成功");

              // 更新store中的地图状态
              store.dispatch("ui/setMapState", {
                center: [pos.lat, pos.lng],
                zoom: 17,
              });
            } else {
              ElMessage.warning("无法获取有效位置信息");
            }
          } else {
            ElMessage.error("定位失败: " + (result.message || "未知错误"));
          }
        });

        // 在2.0中直接添加到地图
        map.value.addControl(geolocation);
      } catch (error) {
        console.error("定位功能初始化失败:", error);
        ElMessage.error("定位功能初始化失败");
      }
    };

    const shopIds = computed(() => shops.value.map((shop) => shop.id));

    const debouncedAddShopMarkers = debounce(() => {
      requestAnimationFrame(() => {
        addShopMarkers();
      });
    }, 100);

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

    // 全局函数，供弹窗按钮调用
    window.navigationToShop = async (lng, lat) => {
      try {
        if (!AMapInstance.value) {
          throw new Error("地图实例未加载");
        }

        // 在高德地图2.0中，Geolocation插件已预加载，可以直接使用
        const geolocation = new AMapInstance.value.Geolocation({
          enableHighAccuracy: true, // 是否使用高精度定位
          timeout: 10000, // 超时时间
          maximumAge: 0, // 定位结果缓存0毫秒
          convert: true,
          panToLocation: false, // 定位成功后将定位到的位置作为地图中心点
        });

        geolocation.getCurrentPosition((status, result) => {
          if (status === "complete") {
            const pos = result.position;
            if (
              pos &&
              typeof pos.lng === "number" &&
              typeof pos.lat === "number"
            ) {
              // 更新store中的地图状态,从mutitions中的方法中更新
              store.commit("ui/SET_MAP_CENTER", [pos.lat, pos.lng]);

              let url = `//uri.amap.com/navigation?from=${pos.lng},${pos.lat}&to=${lng},${lat}&mode=car&policy=0&callnative=1`;
              console.log("url:", url);
              window.open(url, "_blank");
            } else {
              ElMessage.warning("无法获取有效位置信息");
            }
          } else {
            ElMessage.error("定位失败: " + (result.message || "未知错误"));
          }
        });
      } catch (error) {
        console.error("导航功能初始化失败:", error);
        ElMessage.error("导航功能初始化失败");
      }
    };

    // 添加事件委托处理编辑和删除
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

              // 通知Vuex店铺数据已更新
              store.dispatch("shops/notifyShopDataUpdate");
            } catch (error) {
              ElMessage.error(error.message || "删除失败");
            }
          })
          .catch(() => {});
      }
    };

    // 监听地图中心点和缩放级别变化
    watch([mapCenter, mapZoom], ([newCenter, newZoom]) => {
      if (!map.value || !newCenter) return;

      // 获取当前地图中心点和缩放级别
      const currentCenter = map.value.getCenter();
      const currentZoom = map.value.getZoom();

      // 检查是否有变化（考虑浮点精度）
      const centerChanged =
        Math.abs(newCenter[0] - currentCenter.lat) > 1e-6 ||
        Math.abs(newCenter[1] - currentCenter.lng) > 1e-6;
      const zoomChanged = newZoom !== currentZoom;

      // 如果变化，更新地图视图
      if (centerChanged || zoomChanged) {
        map.value.setCenter([newCenter[1], newCenter[0]]); // 注意坐标转换
        map.value.setZoom(newZoom);
      }
    });

    onMounted(() => {
      initMap();
    });

    onUnmounted(() => {
      debouncedAddShopMarkers.cancel();

      // 清理聚合实例
      if (markerCluster.value) {
        markerCluster.value.setMap(null);
        markerCluster.value = null;
      }
      markerPool.forEach((marker) => {
        if (marker) {
          marker.setMap(null);
        }
      });
      markerPool.length = 0;
      infoWindowCache.forEach((infoWindow) => {
        if (infoWindow) {
          infoWindow.close();
        }
      });
      infoWindowCache.clear();

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
      Plus,
      Location,
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

.debug-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-family: var(--el-font-family);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color);
}

.debug-panel h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
}

.debug-panel p {
  margin-bottom: 5px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.shops-preview h5 {
  margin-top: 0;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
}

.shop-item {
  margin-bottom: 8px;
  padding: 8px;
  background-color: var(--el-fill-color-light);
  border-radius: 6px;
  border: 1px solid var(--el-border-color-light);
}

.shop-item strong {
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.shop-item small {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 编写一个适配移动端的 .map-controls */
@media (max-width: 768px) {
  .map-controls {
    position: absolute;
    top: 100px;
    left: 10px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 10px;
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

/* AMAP信息窗体样式 - 简化结构 */
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

:deep(.amap-info-window::before) {
  content: "";
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  border-color: transparent transparent #fff transparent;
  border-style: solid;
  border-width: 0 38px 38px 38px;
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

/* 按钮悬停效果 */
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

.amap-info-content .amap-info-outer {
  padding: 0 0 0 0 !important;
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
