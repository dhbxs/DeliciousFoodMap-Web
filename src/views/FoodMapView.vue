<template>
  <div class="food-map-view">
    <!-- 移动端左侧工具栏 -->
    <div v-if="isMobile" class="left-toolbar">
      <el-button :icon="Menu" @click="toggleSidebar" circle />
      <el-button type="primary" :icon="Plus" @click="addShop" circle />
    </div>

    <!-- 主要布局 -->
    <div class="main-layout" :class="{ mobile: isMobile }">
      <!-- 侧边栏 -->
      <div
        class="sidebar"
        :class="{
          collapsed: sidebarCollapsed,
          mobile: isMobile,
        }"
      >
        <!-- 桌面端头部 -->
        <div v-if="!isMobile" class="sidebar-header">
          <h2 v-if="!sidebarCollapsed">美食地图管理系统</h2>
          <el-button
            :icon="sidebarCollapsed ? Expand : Fold"
            @click="toggleSidebar"
            text
          />
        </div>

        <!-- 侧边栏内容 -->
        <div class="sidebar-content" v-show="!sidebarCollapsed || isMobile">
          <!-- 快速操作 -->
          <div class="quick-actions">
            <el-button type="primary" @click="addShop" style="width: 100%">
              <el-icon><Plus /></el-icon>
              添加店铺
            </el-button>
          </div>

          <!-- 分类筛选 -->
          <CategoryFilter />

          <!-- 店铺列表 -->
          <div class="shop-list-container">
            <ShopList />
          </div>
        </div>
      </div>

      <!-- 地图区域 -->
      <div class="map-area">
        <MapView />
      </div>
    </div>

    <!-- 弹窗组件 -->
    <ShopForm />
    <CategoryForm />

    <!-- 移动端遮罩 -->
    <div
      v-if="isMobile && !sidebarCollapsed"
      class="mobile-overlay"
      @click="closeSidebar"
    ></div>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted } from "vue";
import { useStore } from "vuex";
import { Menu, Plus, Expand, Fold } from "@element-plus/icons-vue";

// 导入组件
import MapView from "@/components/MapView.vue";
import CategoryFilter from "@/components/CategoryFilter.vue";
import ShopList from "@/components/ShopList.vue";
import ShopForm from "@/components/ShopForm.vue";
import CategoryForm from "@/components/CategoryForm.vue";

export default {
  name: "FoodMapView",
  components: {
    MapView,
    CategoryFilter,
    ShopList,
    ShopForm,
    CategoryForm,
  },

  setup() {
    const store = useStore();

    // 计算属性
    const sidebarCollapsed = computed(
      () => store.getters["ui/sidebarCollapsed"]
    );
    const isMobile = computed(() => store.getters["ui/isMobile"]);

    // 切换侧边栏
    const toggleSidebar = () => {
      store.dispatch("ui/toggleSidebar");
    };

    // 关闭侧边栏（移动端）
    const closeSidebar = () => {
      if (isMobile.value) {
        store.dispatch("ui/setSidebarCollapsed", true);
      }
    };

    // 添加店铺
    const addShop = () => {
      store.dispatch("ui/showShopForm");
    };

    // 窗口大小变化处理
    const handleResize = () => {
      store.dispatch("ui/detectMobile");
    };

    onMounted(() => {
      // 初始化检测移动端
      store.dispatch("ui/detectMobile");

      // 监听窗口大小变化
      window.addEventListener("resize", handleResize);
    });

    onUnmounted(() => {
      window.removeEventListener("resize", handleResize);
    });

    return {
      sidebarCollapsed,
      isMobile,
      toggleSidebar,
      closeSidebar,
      addShop,
      Menu,
      Plus,
      Expand,
      Fold,
    };
  },
};
</script>

<style scoped>
.food-map-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.left-toolbar {
  position: fixed;
  top: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1002;
}

.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.main-layout.mobile {
  position: relative;
}

.sidebar:not(.mobile) {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 350px;
  background: white;
  border-right: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  z-index: 100;
  overflow: hidden;
  will-change: transform;
}

.sidebar:not(.mobile).collapsed {
  width: 60px;
  transform: translateX(0);
}

.sidebar.mobile {
  position: absolute;
  top: 0;
  left: 0;
  right: auto;
  height: 100%;
  width: 300px;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  transform: translateX(-100%);
  z-index: 1001;
}

.sidebar.mobile:not(.collapsed) {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  min-height: 60px;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 16px;
  color: #303133;
  white-space: nowrap;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.quick-actions {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.shop-list-container {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}

.map-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  width: 100%;
}

.mobile-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar:not(.mobile) {
    width: 300px;
  }

  .sidebar.collapsed:not(.mobile) {
    width: 0;
    border-right: none;
  }
}

@media (max-width: 480px) {
  .sidebar.mobile {
    width: 280px;
  }

  .mobile-toolbar {
    padding: 8px 12px;
  }

  .mobile-toolbar h2 {
    font-size: 16px;
  }
}

/* 动画效果 */
.sidebar {
  transition: transform 0.3s ease;
}
</style>
