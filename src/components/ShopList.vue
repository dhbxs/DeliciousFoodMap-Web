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
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索店铺名称或地址..."
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button
        class="refresh-button"
        type="primary"
        :icon="Refresh"
        circle
        @click="fetchInitialData"
        title="刷新店铺列表"
      />
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
            :style="{ backgroundColor: getCategoryColor(shop.category) }"
          >
            {{ getCategoryIcon(shop.category) }}
          </div>
          <div class="shop-info">
            <h4 class="shop-name">{{ shop.name }}</h4>
            <p class="shop-category-text">{{ shop.category }}</p>
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
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Edit, Delete, Location, Plus, Refresh } from "@element-plus/icons-vue";
import { getPoiData } from "@/api/poiDataApi";

export default {
  name: "ShopList",
  components: {
    Search,
    Edit,
    Delete,
    Location,
    Plus,
    Refresh,
  },

  setup() {
    const store = useStore();
    const searchKeyword = ref("");
    const searchResults = ref([]);

    // 计算属性
    const shops = ref([]);
    const shopsTotal = ref(0);
    const selectedShop = ref(null);
    const categories = computed(
      () => store.getters["categories/allCategories"]
    );

    // 显示的店铺列表（考虑搜索）
    const displayShops = computed(() => {
      if (!searchKeyword.value.trim()) {
        return shops.value;
      }
      return searchResults.value;
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

    // 搜索处理 - 调用后端接口
    const handleSearch = async (keyword) => {
      if (!keyword.trim()) {
        // 如果关键字为空，清空搜索结果，显示初始列表
        searchResults.value = [];
        return;
      }

      try {
        const response = await getPoiData({
          pageNum: 1,
          pageSize: 100,
          keywords: keyword
        });

        if (Array.isArray(response.data?.records)) {
          searchResults.value = response.data.records;
        } else if (Array.isArray(response.data)) {
          searchResults.value = response.data;
        } else {
          console.error('搜索API返回格式无效', response);
          searchResults.value = [];
        }
      } catch (error) {
        ElMessage.error("搜索失败");
        searchResults.value = [];
      }
    };

    // 选择店铺
    const selectShop = (shop) => {
      selectedShop.value = shop;
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
            await store.dispatch("shops/deleteShop", shop.id);
            ElMessage.success("删除成功");
            
            // 重新加载店铺列表
            fetchInitialData();
            
            // 如果删除的是当前选中的店铺，清除选择
            if (selectedShop.value?.id === shop.id) {
              selectedShop.value = null;
              store.dispatch("shops/clearSelection");
            }
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
        // 先清空当前数据
        shops.value = [];
        searchKeyword.value = "";
        searchResults.value = [];
        
        // 强制从服务器获取最新数据
        const result = await store.dispatch("shops/fetchShops", {
          pageNum: 1,
          pageSize: 100,
          forceRefresh: true // 添加强制刷新参数
        });
        
        // 更新响应式数据
        shops.value = result.records || [];
        shopsTotal.value = result.total || 0;
        
        // 如果当前有选中的店铺，检查是否仍然存在
        if (selectedShop.value && !shops.value.some(s => s.id === selectedShop.value.id)) {
          selectedShop.value = null;
          store.dispatch("shops/clearSelection");
        }
      } catch (error) {
        console.error('店铺刷新失败:', error);
        ElMessage.error("店铺刷新失败: " + (error.message || "未知错误"));
        shopsTotal.value = 0;
        shops.value = [];
      }
    };
    
    // 组件挂载时加载数据
    onMounted(() => {
      fetchInitialData();
    });

    return {
      searchKeyword,
      displayShops,
      selectedShop,
      getCategoryColor,
      getCategoryIcon,
      formatDate,
      handleSearch,
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
.shop-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.search-bar {
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  gap: 8px;
}

.search-bar .el-input {
  flex: 1;
}

.shop-items {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.shop-item {
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.shop-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.shop-item.active {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.shop-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.shop-category {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 14px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.shop-info {
  flex: 1;
}

.shop-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.shop-category-text {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.shop-actions {
  display: flex;
  gap: 4px;
}

.shop-details {
  padding-left: 44px;
}

.shop-address {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 4px;
}

.shop-description {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.shop-meta {
  margin: 0;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

/* 滚动条样式 */
.shop-items::-webkit-scrollbar {
  width: 4px;
}

.shop-items::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.shop-items::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.shop-items::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
