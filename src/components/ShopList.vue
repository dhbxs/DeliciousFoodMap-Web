<template>
  <div class="shop-list">
    <div class="list-header">
      <h3>店铺列表</h3>
      <div class="list-stats">
        <el-tag size="small">
          共 {{ shopsTotal }} 家店铺
        </el-tag>
      </div>
    </div>
    <div class="shop-items" v-if="displayShops.length > 0">
      <div
        v-for="shop in displayShops"
        :key="shop.id"
        class="shop-item"
        :class="{ active: selectedShop?.id === shop.id }"
        @click="selectShop(shop)"
      >
        <div class="shop-header">
          <div
            class="shop-category"
            :style="{ backgroundColor: shop.categoryColor }"
          >
            <svg class="icon" aria-hidden="true" style="font-size: 30px;">
              <use :xlink:href="shop.categoryIcon"></use>
            </svg>
          </div>
          <div class="shop-info">
            <h4 class="shop-name">{{ shop.name }}</h4>
            <p class="shop-category-text">{{ shop.categoryName }}</p>
          </div>
          <div class="shop-actions">
            <el-button
              size="small"
              type="primary"
              text
              @click.stop="editShop(shop.id)"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button
              size="small"
              type="danger"
              text
              @click.stop="deleteShop(shop)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="shop-details">
          <p class="shop-address">
            <el-icon><Location /></el-icon>
            {{ shop.address }}
          </p>
          <p class="shop-description" v-if="shop.description">
            <ChatRound style="width: 1em; height: 1em;"/>
            {{ shop.description }}
          </p>
          <div class="shop-meta">
            <el-text size="small" type="info">
              添加时间: {{ formatDate(shop.createdTime) }}
            </el-text>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty description="暂无店铺数据" :image-size="80">
        <el-button type="primary" @click="addShop">
          <el-icon><Plus /></el-icon>
          添加第一家店铺
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useStore } from "vuex";
import { ElMessage, ElMessageBox } from "element-plus";
import { Edit, Delete, Location, Plus, Refresh } from "@element-plus/icons-vue";
import categoryService from '@/services/CategoryService';
import shopService from '@/services/ShopService';

export default {
  name: "ShopList",
  components: {
    Edit,
    Delete,
    Location,
    Plus,
    Refresh,
  },

  setup() {
    const store = useStore();

    // Use service reactive data
    const shops = shopService.shops;
    const selectedShop = shopService.selectedShop;
    const searchKeyword = shopService.searchKeyword;
    const searchResults = shopService.searchResults;
    const displayShops = shopService.displayShops;
    const filteredShops = shopService.filteredShops;
    const categories = categoryService.categories;

    // Local state
    const shopsTotal = ref(0);

    // Load initial data
    onMounted(async () => {
      await fetchInitialData();
    });

    // Watch for shop list refresh triggers from Vuex
    const shopListRefreshTrigger = computed(
      () => store.getters["shops/shopListRefreshTrigger"]
    );

    watch(shopListRefreshTrigger, async () => {
      await fetchInitialData();
    });

    // Watch for category filter changes from Vuex
    const currentCategoryFilter = computed(
      () => store.getters["shops/currentCategoryFilter"]
    );

    watch(currentCategoryFilter, async (newFilter) => {
        // 调用店铺搜索接口，获取筛选后的店铺列表
        // TODO 需要支持查询多个分类一起传递
        let params = {
          pageNum: 1,
          pageSize: 100,
        };


        if (newFilter.length === 0) {
          // 如果没有选择分类，则返回所有店铺
          const result = await shopService.getShops(params, true);
          shopsTotal.value = result.total || 0;
          shops.value = result.records || [];
          return;
        }

        params.categoryId = newFilter.join(",");
        const result = await shopService.getShops(params, true); 
        shopsTotal.value = result.total || 0;
        shops.value = result.records || [];
    });

    // 获取分类颜色
    const getCategoryColor = (categoryName) => {
      const category = categories.value.find(
        (cat) => cat.name === categoryName
      );
      return category?.color || "#409eff";
    };

    // 获取分类图标
    const getCategoryIcon = (categoryName) => {
      const category = categories.value.find(
        (cat) => cat.name === categoryName
      );
      return category?.icon || "🍽️";
    };

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // 搜索输入处理
    const handleSearchInput = (value) => {
      if (value.trim()) {
        handleSearch(value);
      } else {
        shopService.clearSearch();
      }
    };

    // 搜索处理 - 使用服务
    const handleSearch = async (keyword) => {
      try {
        await shopService.searchShops(keyword);
      } catch (error) {
        ElMessage.error("搜索失败");
      }
    };

    // 选择店铺
    const selectShop = (shop) => {
      shopService.selectShop(shop);
      store.dispatch("shops/selectShop", shop.id);
      store.dispatch("ui/setMapState", {
        center: [shop.latitude, shop.longitude],
        zoom: 16,
      });
    };

    // 编辑店铺
    const editShop = (shopId) => {
      store.dispatch("ui/showShopForm", shopId);
    };

    // 删除店铺
    const deleteShop = (shop) => {
      ElMessageBox.confirm(
        `确定要删除店铺"${shop.name}"吗？此操作不可恢复。`,
        "确认删除",
        {
          type: "warning",
          confirmButtonText: "确定删除",
          cancelButtonText: "取消",
        }
      )
        .then(async () => {
          try {
            await shopService.deleteShop(shop.id);
            ElMessage.success("删除成功");

            // 通知Vuex刷新相关组件
            store.dispatch("shops/notifyShopDataUpdate");
          } catch (error) {
            ElMessage.error(error.message || "删除失败");
          }
        })
        .catch(() => {
          // 用户取消删除
        });
    };

    // 添加店铺
    const addShop = () => {
      store.dispatch("ui/showShopForm");
    };

    // 初始化加载数据
    const fetchInitialData = async () => {
      try {
        // 使用服务获取数据
        const result = await shopService.getShops({
          pageNum: 1,
          pageSize: 100
        }, true); // 强制刷新

        shopsTotal.value = result.total || 0;

        // 同时加载分类数据
        await categoryService.getCategories();
      } catch (error) {
        console.error('数据加载失败:', error);
        ElMessage.error("数据加载失败: " + (error.message || "未知错误"));
        shopsTotal.value = 0;
      }
    };

    return {
      searchKeyword,
      displayShops,
      selectedShop,
      getCategoryColor,
      getCategoryIcon,
      formatDate,
      handleSearch,
      handleSearchInput,
      selectShop,
      editShop,
      deleteShop,
      addShop,
      shopsTotal,
      fetchInitialData,
      Refresh
    };
  },
};
</script>

<style scoped>

.el-button.is-circle {
  width: 40px;
  height: 40px;
}

.shop-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  overflow: hidden;
  transition: all var(--transition-normal);
}

.shop-list:hover {
  box-shadow: var(--shadow-xl);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  position: relative;
}

.list-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
  opacity: 0.3;
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.list-header h3::before {
  content: '🏪';
  font-size: 20px;
}

.list-stats {
  position: relative;
  z-index: 1;
}

.list-stats .el-tag {
  background: var(--primary-gradient);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 600;
  padding: var(--spacing-sm) var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.shop-items {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  background: var(--bg-primary);
  min-height: 0; /* 确保flex子元素可以收缩 */
  -webkit-overflow-scrolling: touch; /* iOS平滑滚动 */
}

.shop-item {
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-xl);
  cursor: pointer;
  transition: all var(--transition-normal);
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

.shop-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
  transition: left var(--transition-normal);
}

.shop-item:hover::before {
  left: 100%;
}

.shop-item:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.shop-item.active {
  border-color: var(--primary-color);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  box-shadow: var(--shadow-md);
}

.shop-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-md);
  position: relative;
  z-index: 1;
}

.shop-category {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-lg);
  font-size: 16px;
  color: var(--text-inverse);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-fast);
}

.shop-item:hover .shop-category {
  transform: scale(1.1) rotate(5deg);
  box-shadow: var(--shadow-lg);
}

.shop-info {
  flex: 1;
  min-width: 0;
}

.shop-name {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shop-category-text {
  margin: 0;
  font-size: 13px;
  color: var(--text-tertiary);
  font-weight: 500;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--gray-100);
  border-radius: var(--radius-md);
  display: inline-block;
}

.shop-actions {
  display: flex;
  gap: var(--spacing-sm);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.shop-item:hover .shop-actions {
  opacity: 1;
}

.shop-actions .el-button {
  border-radius: var(--radius-full);
  width: 32px;
  height: 32px;
  padding: 0;
  color: #fff;
  transition: all var(--transition-fast);
}

.shop-actions .el-button:hover {
  transform: scale(1.1);
}

.shop-details {
  padding-left: 56px;
  position: relative;
  z-index: 1;
}

.shop-address {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  line-height: 1.4;
}

.shop-address .el-icon {
  color: var(--primary-color);
  font-size: 14px;
}

.shop-description {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 13px;
  color: var(--text-tertiary);
  line-height: 1.5;
  background: var(--gray-50);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
}

.shop-meta {
  margin: 0;
}

.shop-meta .el-text {
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--gray-100);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  margin: var(--spacing-lg);
}

.empty-state .el-empty {
  padding: var(--spacing-xl);
}

.empty-state .el-button {
  border-radius: var(--radius-xl);
  padding: var(--spacing-md) var(--spacing-xl);
  font-weight: 600;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.empty-state .el-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 滚动条样式 */
.shop-items::-webkit-scrollbar {
  width: 6px;
}

.shop-items::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: var(--radius-full);
}

.shop-items::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: var(--radius-full);
  transition: background-color var(--transition-fast);
}

.shop-items::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

/* 加载动画 */
.shop-item.loading {
  animation: pulse 1.5s ease-in-out infinite;
}

/* 进入动画 */
.shop-item {
  animation: slideUp var(--transition-normal) ease-out;
}

.shop-item:nth-child(1) { animation-delay: 0.1s; }
.shop-item:nth-child(2) { animation-delay: 0.2s; }
.shop-item:nth-child(3) { animation-delay: 0.3s; }
.shop-item:nth-child(4) { animation-delay: 0.4s; }
.shop-item:nth-child(5) { animation-delay: 0.5s; }

/* 响应式设计 */
@media (max-width: 768px) {
  .shop-list {
    border-radius: var(--radius-lg);
  }

  .list-header {
    padding: var(--spacing-lg);
    flex-direction: row;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .list-header h3 {
    text-align: center;
    font-size: 14px;
  }

  .list-stats {
    padding-top: 7px;
    text-align: center;
  }

  .search-bar {
    padding: var(--spacing-lg);
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .refresh-button {
    width: 100%;
    height: 44px;
    border-radius: var(--radius-lg);
  }

  .shop-items {
    padding: var(--spacing-sm);
  }

  .shop-item {
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-sm);
    border-radius: var(--radius-lg);
  }

  .shop-header {
    margin-bottom: var(--spacing-md);
  }

  .shop-category {
    width: 36px;
    height: 36px;
    font-size: 14px;
    margin-right: var(--spacing-md);
  }

  .shop-name {
    font-size: 15px;
    line-height: 1.4;
  }

  .shop-category-text {
    font-size: 12px;
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .shop-actions {
    opacity: 1; /* 移动端始终显示操作按钮 */
    gap: var(--spacing-xs);
  }

  .shop-actions .el-button {
    width: 28px;
    height: 28px;
  }

  .shop-details {
    padding-left: 52px;
  }

  .shop-address {
    font-size: 13px;
    margin-bottom: var(--spacing-sm);
  }

  .shop-description {
    font-size: 12px;
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
  }

  .shop-meta .el-text {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .list-header {
    padding: var(--spacing-md);
  }

  .list-header h3 {
    font-size: 15px;
  }

  .search-bar {
    padding: var(--spacing-md);
  }

  .shop-items {
    padding: var(--spacing-xs);
  }

  .shop-item {
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-xs);
  }

  .shop-category {
    width: 32px;
    height: 32px;
    font-size: 12px;
    margin-right: var(--spacing-sm);
  }

  .shop-name {
    font-size: 14px;
  }

  .shop-category-text {
    font-size: 11px;
  }

  .shop-details {
    padding-left: 44px;
  }

  .shop-address {
    font-size: 12px;
  }

  .shop-description {
    font-size: 11px;
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .shop-actions .el-button {
    width: 24px;
    height: 24px;
  }
}
</style>
