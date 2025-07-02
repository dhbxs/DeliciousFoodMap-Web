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
import { isAmapLoaded, getAMap } from "@/utils/amapLoader";
import categoryService from '@/services/CategoryService';
import shopService from '@/services/ShopService';

export default {
  name: "MapView",
  components: {},

  setup() {
    const store = useStore();
    const mapContainer = ref(null);
    const map = ref(null);
    const markers = ref(new Map());
    const addMode = ref(false);

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

    // 创建自定义标记内容
    const createCustomMarkerContent = (category) => {
      const color = category?.categoryColor || "#409eff";
      const icon = category?.categoryIcon || "#food-icon-a-001-drink";

      return `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          cursor: pointer;
        ">
          <svg class="icon" aria-hidden="true" style="font-size: 16px; color: white;">
            <use xlink:href="${icon}"></use>
          </svg>
        </div>
      `;
    };

    // 初始化地图
    const initMap = () => {
      if (!mapContainer.value || !isAmapLoaded()) return;

      const AMap = getAMap();
      if (!AMap) return;

      // 创建高德地图实例
      map.value = new AMap.Map(mapContainer.value, {
        center: [mapCenter.value[1], mapCenter.value[0]], // 高德地图使用[lng, lat]格式
        zoom: mapZoom.value,
        mapStyle: "amap://styles/normal", // 标准地图样式
        viewMode: "2D", // 2D视图
        lang: "zh_cn", // 中文
      });

      // 添加地图控件
      map.value.addControl(new AMap.Scale());
      map.value.addControl(new AMap.ToolBar({
          position: { bottom: "50px", left: "10px" }, // 控制条位置
          visible: true, // 是否显示
          Locate: true, // 定位按钮
          Zoom: true, // 缩放按钮
          Scale: true, // 比例尺
        }
      ));

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

    // 添加店铺标记
    const addShopMarkers = () => {
      if (!map.value) return;

      // 清除现有标记
      markers.value.forEach((marker) => {
        map.value.remove(marker);
      });
      markers.value.clear();

      // 添加新标记
      shops.value.forEach((shop) => {
        // 验证坐标有效性
        const lng = parseFloat(shop.lng || shop.longitude);
        const lat = parseFloat(shop.lat || shop.latitude);

        // 检查坐标是否有效
        if (isNaN(lng) || isNaN(lat) || lng === 0 || lat === 0) {
          console.warn(`店铺 "${shop.name}" 的坐标无效:`, { lng, lat, shop });
          return; // 跳过无效坐标的店铺
        }

        // 检查坐标范围是否合理（中国境内大致范围）
        if (lng < 73 || lng > 135 || lat < 3 || lat > 54) {
          console.warn(`店铺 "${shop.name}" 的坐标超出合理范围:`, { lng, lat });
          return; // 跳过超出范围的坐标
        }

        // 创建自定义标记
        const AMap = getAMap();
        const marker = new AMap.Marker({
          position: [lng, lat], // 高德地图使用[lng, lat]格式
          content: createCustomMarkerContent(shop),
          offset: new AMap.Pixel(-15, -15), // 标记偏移量
        });

        shop.description = shop.description || "暂无描述";

        // 创建信息窗体 (优化样式 - 简化结构)
        const infoWindow = new AMap.InfoWindow({
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
          anchor: "bottom-center",
          isCustom: true,
          closeWhenClickMap: true,
        });

        // 标记点击事件
        marker.on("click", () => {
          infoWindow.open(map.value, marker.getPosition());
          shopService.selectShop(shop);
          store.dispatch("shops/selectShop", shop.id);
          
          // 添加事件监听
          setTimeout(() => {
            const infoWindowElement = document.querySelector('.amap-info-window');
            if (infoWindowElement) {
              infoWindowElement.addEventListener('click', handleInfoWindowClick);
            }
          }, 100);
        });

        // 添加标记到地图
        map.value.add(marker);
        markers.value.set(shop.id, marker);
      });
    };

    // 切换添加模式
    const toggleAddMode = () => {
      addMode.value = !addMode.value;
      if (addMode.value) {
        ElMessage.info("请在地图上点击选择店铺位置");
      }
    };

    // 定位到用户位置
    const centerToUserLocation = () => {
      if (!map.value || !isAmapLoaded()) return;

      const AMap = getAMap();
      // 使用高德地图的定位插件
      AMap.plugin("AMap.Geolocation", () => {
        const geolocation = new AMap.Geolocation({
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
            if (pos && typeof pos.lng === "number" && typeof pos.lat === "number") {
              map.value.setCenter([pos.lng, pos.lat]);
              map.value.setZoom(17);
              ElMessage.success("定位成功");
              
              // 更新store中的地图状态
              store.dispatch("ui/setMapState", {
                center: [pos.lat, pos.lng],
                zoom: 17
              });
            } else {
              ElMessage.warning("无法获取有效位置信息");
            }
          } else {
            ElMessage.error("定位失败: " + (result.message || "未知错误"));
          }
        });

        map.value.addControl(geolocation);
      });
    };

    // 监听店铺变化
    watch(
      shops,
      () => {
        if (map.value) {
          addShopMarkers();
        }
      },
      { deep: true }
    );

    // 全局函数，供弹窗按钮调用
    window.navigationToShop = (lng, lat) => {
      if (!isAmapLoaded()) return;

      const AMap = getAMap();
      AMap.plugin("AMap.Geolocation", () => {
        const geolocation = new AMap.Geolocation({
          enableHighAccuracy: true, // 是否使用高精度定位
          timeout: 10000, // 超时时间
          maximumAge: 0, // 定位结果缓存0毫秒
          convert: true,
          panToLocation: false, // 定位成功后将定位到的位置作为地图中心点
        });

        geolocation.getCurrentPosition((status, result) => {
          if (status === "complete") {
            const pos = result.position;
            if (pos && typeof pos.lng === "number" && typeof pos.lat === "number") {
              // 更新store中的地图状态,从mutitions中的方法中更新
              store.commit("ui/SET_MAP_CENTER", [pos.lat, pos.lng]);
              
              let url = `//uri.amap.com/navigation?from=${pos.lng},${pos.lat}&to=${lng},${lat}&mode=car&policy=0&callnative=1`;
              // window.open("//uri.amap.com/navigation?from=116.478346,39.997361,startpoint&to=116.3246,39.966577,endpoint&via=116.402796,39.936915,midwaypoint&mode=car&policy=1&src=mypage&callnative=0", "_blank")
              console.log("url:", url);
              window.open(url, "_blank");
            } else {
              ElMessage.warning("无法获取有效位置信息");
            }
          } else {
            ElMessage.error("定位失败: " + (result.message || "未知错误"));
          }
        });
      });
    };
    
    // 添加事件委托处理编辑和删除
    const handleInfoWindowClick = (e) => {
      if (e.target.classList.contains('edit-shop-btn')) {
        const shopId = e.target.dataset.shopId;
        store.dispatch("ui/showShopForm", shopId);
      } else if (e.target.classList.contains('delete-shop-btn')) {
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
      // 等待 AMap API 加载完成后再初始化地图
      const checkAndInitMap = () => {
        if (isAmapLoaded()) {
          initMap();
        } else {
          // 如果 AMap 还未加载，等待一段时间后重试
          setTimeout(checkAndInitMap, 100);
        }
      };
      checkAndInitMap();
    });

    onUnmounted(() => {
      if (map.value) {
        map.value.destroy();
      }
      // 移除事件监听
      const infoWindowElement = document.querySelector('.amap-info-window');
      if (infoWindowElement) {
        infoWindowElement.removeEventListener('click', handleInfoWindowClick);
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

.map-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.map-controls .el-button+.el-button {
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
</style>