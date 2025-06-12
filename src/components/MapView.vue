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
    const shops = computed(() => store.getters["shops/filteredShops"]);
    const mapCenter = computed(() => store.getters["ui/mapCenter"]);
    const mapZoom = computed(() => store.getters["ui/mapZoom"]);

    // 创建自定义标记内容
    const createCustomMarkerContent = (category) => {
      const categoryData =
        store.getters["categories/getCategoryByName"](category);
      const color = categoryData?.color || "#409eff";
      const icon = categoryData?.icon || "🍽️";

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
          ${icon}
        </div>
      `;
    };

    // 初始化地图
    const initMap = () => {
      if (!mapContainer.value || !window.AMap) return;

      // 创建高德地图实例
      map.value = new window.AMap.Map(mapContainer.value, {
        center: [mapCenter.value[1], mapCenter.value[0]], // 高德地图使用[lng, lat]格式
        zoom: mapZoom.value,
        mapStyle: "amap://styles/normal", // 标准地图样式
        viewMode: "2D", // 2D视图
        lang: "zh_cn", // 中文
      });

      // 添加地图控件
      map.value.addControl(new window.AMap.Scale());
      map.value.addControl(new window.AMap.ToolBar(
        {
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
        // 创建自定义标记
        const marker = new window.AMap.Marker({
          position: [shop.lng, shop.lat], // 高德地图使用[lng, lat]格式
          content: createCustomMarkerContent(shop.category),
          offset: new window.AMap.Pixel(-15, -15), // 标记偏移量
        });

        // 创建信息窗体
        const infoWindow = new window.AMap.InfoWindow({
          content: `
            <div class="shop-popup">
              <h4>${shop.name}</h4>
              <p><strong>分类:</strong> ${shop.category}</p>
              <p><strong>地址:</strong> ${shop.address}</p>
              <p><strong>描述:</strong> ${shop.description}</p>
              <div class="popup-actions">
                <button onclick="editShop(${shop.id})" class="edit-btn">编辑</button>
                <button onclick="deleteShop(${shop.id})" class="delete-btn">删除</button>
              </div>
            </div>
          `,
          offset: new window.AMap.Pixel(0, -30),
        });

        // 标记点击事件
        marker.on("click", () => {
          infoWindow.open(map.value, marker.getPosition());
          store.dispatch("shops/selectShop", shop);
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
      if (!map.value) return;

      // 使用高德地图的定位插件
      window.AMap.plugin("AMap.Geolocation", () => {
        const geolocation = new window.AMap.Geolocation({
          enableHighAccuracy: true, // 是否使用高精度定位
          timeout: 10000, // 超时时间
          maximumAge: 0, // 定位结果缓存0毫秒
          convert: true, // 自动偏移坐标
          showButton: false, // 不显示定位按钮
          buttonPosition: "LB", // 定位按钮停靠位置
          showMarker: true, // 定位成功后在定位到的位置显示点标记
          showCircle: true, // 定位成功后用圆圈表示定位精度范围
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
    window.editShop = (shopId) => {
      store.dispatch("ui/showShopForm", shopId);
    };

    window.deleteShop = (shopId) => {
      ElMessageBox.confirm("确定要删除这个店铺吗？", "确认删除", {
        type: "warning",
      })
        .then(() => {
          store.dispatch("shops/deleteShop", shopId);
          ElMessage.success("删除成功");
        })
        .catch(() => {});
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
      if (map.value) {
        map.value.destroy();
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

/* 弹窗样式 */
:deep(.shop-popup) {
  min-width: 200px;
}

:deep(.shop-popup h4) {
  margin: 0 0 10px 0;
  color: #409eff;
}

:deep(.shop-popup p) {
  margin: 5px 0;
  font-size: 12px;
}

:deep(.popup-actions) {
  margin-top: 10px;
  display: flex;
  gap: 5px;
}

:deep(.edit-btn),
:deep(.delete-btn) {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

:deep(.edit-btn) {
  background-color: #409eff;
  color: white;
}

:deep(.delete-btn) {
  background-color: #f56c6c;
  color: white;
}
</style>
