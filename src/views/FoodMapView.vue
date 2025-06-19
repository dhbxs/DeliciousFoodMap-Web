<template>
  <div class="food-map-view">
    <!-- 移动端顶部工具栏 -->
    <div v-if="isMobile" class="mobile-header">
      <div class="mobile-header-left">
        <el-button :icon="Menu" @click="toggleSidebar" circle class="mobile-menu-btn" />
      </div>
      <div class="mobile-header-center">
        <h2 class="mobile-title">未境美食地图</h2>
      </div>
      <div class="mobile-header-right">
        <!-- 移动端用户菜单 -->
        <el-dropdown trigger="click" placement="bottom-end" class="user-dropdown">
          <div class="user-avatar-mobile">
            <el-avatar :size="36" :src="userAvatar" class="user-avatar">
              {{ userInitials }}
            </el-avatar>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>
                <div class="user-info">
                  <div class="user-name">{{ userName }}</div>
                  <div class="user-email">{{ userEmail }}</div>
                </div>
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <ThemeToggle />
        <!-- <el-button type="primary" :icon="Plus" @click="addShop" circle class="mobile-add-btn" /> -->
      </div>
    </div>

    <!-- 主要布局 -->
    <div class="main-layout" :class="{ mobile: isMobile }">
      <!-- 侧边栏 -->
      <div class="sidebar" :class="{
        collapsed: sidebarCollapsed,
        mobile: isMobile,
      }">
        <!-- 侧边栏展开折叠按钮 -->
        <el-button class="sidebar-button" :icon="sidebarCollapsed ? ArrowLeft : ArrowRight" @click="toggleSidebar" text />
        <!-- 桌面端头部 -->
        <div v-if="!isMobile" class="sidebar-header" :class="{ collapsed: sidebarCollapsed }">
          <h2 v-if="!sidebarCollapsed">未境美食地图</h2>
          <div v-if="!sidebarCollapsed" class="header-actions">
            <!-- 桌面端用户菜单 -->
            <el-dropdown trigger="click" placement="bottom-end" class="user-dropdown">
              <div class="user-avatar-desktop">
                <el-avatar :size="40" :src="userAvatar" class="user-avatar">
                  {{ userInitials }}
                </el-avatar>
                <span class="user-name-desktop">{{ userName }}</span>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item disabled>
                    <div class="user-info">
                      <div class="user-email">{{ userEmail }}</div>
                    </div>
                  </el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <ThemeToggle />
          </div>
        </div>

        <!-- 侧边栏内容 -->
        <div class="sidebar-content" v-show="!sidebarCollapsed || isMobile">

          <!-- 分类筛选 -->
          <div class="category-filter-header" :class="{ collapsed: categoryFilterCollapsed }">
            <h3>分类筛选</h3>
            <el-button
              :icon="categoryFilterCollapsed ? ArrowDown : ArrowUp"
              @click="toggleCategoryFilter"
              circle
              size="small"
            />
          </div>
          <CategoryFilter v-if="!categoryFilterCollapsed" />

          <!-- 店铺列表 -->
          <div class="shop-list-container">
            <ShopList />
          </div>
        </div>
      </div>

      <!-- 地图区域 -->
      <div class="map-area">
        <!-- 全局搜索栏 -->
        <div class="search-overlay" :class="{ 'mobile-search': isMobile }">
          <GlobalSearch />
        </div>
        <MapView />
      </div>
    </div>

    <!-- 弹窗组件 -->
    <ShopForm />
    <CategoryForm />

    <!-- 移动端遮罩 -->
    <!-- <div v-if="isMobile && !sidebarCollapsed" class="mobile-overlay" @click="closeSidebar"></div> -->
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Menu, Plus, ArrowLeft, ArrowRight, ArrowDown, ArrowUp, SwitchButton } from "@element-plus/icons-vue";
import categoryService from '@/services/CategoryService';
import shopService from '@/services/ShopService';
import { logout } from '@/api/user';
// 导入组件
import MapView from "@/components/MapView.vue";
import CategoryFilter from "@/components/CategoryFilter.vue";
import ShopList from "@/components/ShopList.vue";
import ShopForm from "@/components/ShopForm.vue";
import CategoryForm from "@/components/CategoryForm.vue";
import GlobalSearch from "@/components/GlobalSearch.vue";
import ThemeToggle from "@/components/ThemeToggle.vue";

export default {
  name: "FoodMapView",
  components: {
    MapView,
    CategoryFilter,
    ShopList,
    ShopForm,
    CategoryForm,
    GlobalSearch,
    ThemeToggle,
  },

  setup() {
    const store = useStore();
    const router = useRouter();

    // 计算属性
    const sidebarCollapsed = computed(
      () => store.getters["ui/sidebarCollapsed"]
    );
    const isMobile = computed(() => store.getters["ui/isMobile"]);

    // 用户信息
    const userInfo = computed(() => {
      let store_user = store.state.user.user;
      if (store_user) {
        return store_user;
      }
      store_user = JSON.parse(localStorage.getItem('user'));
      return store_user;
    });
    const userName = computed(() => userInfo.value.nickName || '未登录用户');
    console.log(userName);
    const userEmail = computed(() => userInfo.value.email || '');
    const userAvatar = computed(() => userInfo.value.avatar || '');
    const userInitials = computed(() => {
      if (userName.value === '未登录用户') return '?';
      return userName.value.length > 0 ? userName.value.charAt(0).toUpperCase() : '?';
    });
    // 分类筛选折叠状态
    const categoryFilterCollapsed = ref(false);
    const toggleCategoryFilter = () => {
      categoryFilterCollapsed.value = !categoryFilterCollapsed.value;
    };

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

    // 退出登录
    const handleLogout = async () => {
      try {
        // 调用登出接口
        const res = await logout();
        // 清除本地存储的用户信息
        localStorage.removeItem('user');
        
        ElMessage.success('退出登录成功');
        
        // 跳转到登录页面
        await router.push('/login');
      } catch (error) {
        console.error('退出登录失败:', error);
        ElMessage.error('退出登录失败');
      }
    };

    // 窗口大小变化处理
    const handleResize = () => {
      store.dispatch("ui/detectMobile");
    };

    // 初始化数据加载
    const initializeData = async () => {
      try {
        // 并行加载分类和店铺数据
        await Promise.all([
          categoryService.getCategories(),
          shopService.getShops({ pageNum: 1, pageSize: 100 })
        ]);
      } catch (error) {
        console.error('初始化数据加载失败:', error);
      }
    };

    onMounted(async () => {
      // 初始化检测移动端
      store.dispatch("ui/detectMobile");

      // 监听窗口大小变化
      window.addEventListener("resize", handleResize);

      // 加载初始数据
      await initializeData();
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
      toggleCategoryFilter,
      categoryFilterCollapsed,
      userName,
      userEmail,
      userAvatar,
      userInitials,
      handleLogout,
      Menu,
      Plus,
      ArrowLeft,
      ArrowRight,
      ArrowDown,
      ArrowUp,
      SwitchButton,
    };
  },
};
</script>

<style scoped>
.food-map-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  position: relative;
  overflow: hidden;
}

/* 移动端顶部工具栏 */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-md);
  z-index: 1002;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(20px);
}

.mobile-header-left,
.mobile-header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.mobile-header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.mobile-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.mobile-menu-btn,
.mobile-add-btn {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.mobile-menu-btn:hover,
.mobile-add-btn:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.main-layout.mobile {
  position: relative;
  padding-top: 60px; /* 为移动端顶部工具栏留出空间 */
}

.sidebar:not(.mobile) {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 450px;
  background: var(--bg-primary);
  border-left: 1px solid var(--gray-200);
  display: flex;
  flex-direction: column;
  transition: all var(--transition-normal);
  z-index: 100;
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(20px);
  will-change: transform;
}

.sidebar-button:not(.mobile) {
  position: absolute;
  top: 50%;
  left: -48px;
  width: 48px;
  height: 48px;
  transform: translateY(-50%);
  background: var(--bg-primary);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-full) 0 0 var(--radius-full);
  box-shadow: var(--shadow-lg);
  color: var(--text-primary);
  transition: all var(--transition-normal);
  z-index: 101;
}

.sidebar-button:not(.mobile):hover {
  background: var(--primary-gradient);
  color: var(--text-inverse);
  transform: translateY(-50%) scale(1.05);
}

.sidebar:not(.mobile).collapsed {
  width: 0;
  height: 48px;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  border-radius: var(--radius-full) 0 0 var(--radius-full);
  box-shadow: var(--shadow-lg);
}

.sidebar.mobile {
  position: fixed;
  top: 60px; /* 在移动端顶部工具栏下方 */
  left: 0;
  right: auto;
  height: calc(100vh - 60px);
  width: 320px;
  background: var(--bg-primary);
  box-shadow: var(--shadow-2xl);
  transform: translateX(-100%);
  z-index: 1001;
  border-radius: 0 var(--radius-2xl) var(--radius-2xl) 0;
  transition: transform var(--transition-normal);
  overflow-y: auto;
}

.sidebar.mobile:not(.collapsed) {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--gray-200);
  /* min-height: 80px; */
  height: 80px;
  background: var(--primary-gradient);
  color: var(--text-inverse);
  position: relative;
  overflow: hidden;
}

.sidebar-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="50" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="30" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  flex: 1;
}

.header-actions {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

/* 用户下拉菜单样式 */
.user-dropdown {
  cursor: pointer;
}

.user-avatar-desktop {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.user-avatar-desktop:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.user-avatar-mobile {
  display: flex;
  align-items: center;
  padding: var(--spacing-xs);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.user-avatar-mobile:hover {
  transform: scale(1.05);
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.user-avatar:hover {
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: var(--shadow-md);
}

.user-name-desktop {
  color: var(--text-inverse);
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info {
  padding: var(--spacing-sm) 0;
  text-align: center;
}

.user-info .user-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.user-info .user-email {
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.8;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}

.quick-actions {
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--gray-200);
  background: var(--bg-secondary);
}

.quick-actions .el-button {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.quick-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.category-filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
}

.category-filter-header.collapsed {
  border-bottom: 1px solid var(--gray-200);
}


.category-filter-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.category-filter-header h3::before {
  content: '🏷️';
  font-size: 18px;
}

.category-filter-header .el-button {
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.shop-list-container {
  flex: 1;
  overflow: hidden;
  height: calc(100% - 60px);
}

.map-area {
  flex: 1;
  position: relative;
  overflow: hidden;
  width: 100%;
  background: var(--bg-tertiary);
}

.search-overlay {
  position: absolute;
  top: var(--spacing-xl);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 90%;
  max-width: 500px;
  animation: slideUp var(--transition-normal) ease-out;
}

.search-overlay.mobile-search {
  top: var(--spacing-md);
  width: calc(100% - 2 * var(--spacing-md));
  left: var(--spacing-md);
  transform: none;
}

/* .mobile-overlay {
  position: fixed;
  top: 60px; 
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  animation: fadeIn var(--transition-fast) ease-out;
} */

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar:not(.mobile) {
    width: 320px;
  }

  .sidebar.collapsed:not(.mobile) {
    width: 0;
    border-left: none;
  }

  .mobile-header {
    height: 56px;
    padding: 0 var(--spacing-sm);
  }

  .mobile-title {
    font-size: 15px;
  }

  .mobile-menu-btn,
  .mobile-add-btn {
    width: 40px;
    height: 40px;
  }

  .main-layout.mobile {
    padding-top: 56px;
  }

  .sidebar.mobile {
    top: 56px;
    height: calc(100vh - 56px);
    width: 300px;
  }

  /* .mobile-overlay {
    top: 56px;
  } */
}

@media (max-width: 480px) {
  .mobile-header {
    height: 52px;
    padding: 0 var(--spacing-xs);
  }

  .mobile-title {
    font-size: 14px;
  }

  .mobile-menu-btn,
  .mobile-add-btn {
    width: 36px;
    height: 36px;
  }

  .main-layout.mobile {
    padding-top: 52px;
  }

  .sidebar.mobile {
    top: 52px;
    height: calc(100vh - 52px);
    width: 100%;
    border-radius: 0;
  }

  /* .mobile-overlay {
    display: none;
  } */

  .sidebar-header {
    padding: var(--spacing-md);
    min-height: 60px;
  }

  .sidebar-header h2 {
    font-size: 15px;
  }

  .quick-actions {
    padding: var(--spacing-md);
  }

  .shop-list-container {
    padding: var(--spacing-md);
  }

  /* 移动端用户头像调整 */
  .user-avatar-mobile .user-avatar {
    width: 32px !important;
    height: 32px !important;
  }

  .user-name-desktop {
    font-size: 12px;
    max-width: 80px;
  }

  .user-info .user-name {
    font-size: 14px;
  }

  .user-info .user-email {
    font-size: 11px;
  }
}

/* 动画效果 */
.sidebar {
  transition: all var(--transition-normal);
}

/* 进入动画 */
.food-map-view {
  animation: fadeIn var(--transition-slow) ease-out;
}

/* 悬浮效果 */
.sidebar:not(.mobile):not(.collapsed):hover {
  box-shadow: var(--shadow-2xl);
}

/* 加载状态 */
.loading-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  color: var(--text-secondary);
}

.loading-state .loading-spinner {
  width: 40px;
  height: 40px;
  border-width: 3px;
}
</style>
