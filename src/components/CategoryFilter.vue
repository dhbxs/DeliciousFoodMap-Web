<template>
  <div class="category-filter">
    <div class="filter-header">
      <h3></h3>
      <div class="filter-actions">
        <el-button size="small" @click="clearFilters" :disabled="selectedCategories.length === 0">
          清空
        </el-button>
        <el-button size="small" type="primary" @click="selectAll"
          :disabled="selectedCategories.length === categories.length">
          全选
        </el-button>
      </div>
    </div>
    <div class="category-list">
      <div v-for="category in categories" :key="category.id" class="category-item"
        :class="{ active: isSelected(category.name) }" @click="toggleCategory(category.name)">
        <div class="category-icon" :style="{ backgroundColor: category.color }">
          <svg class="icon" aria-hidden="true" style="font-size: 30px;">
            <use :xlink:href="category.icon"></use>
          </svg>
        </div>
        <span class="category-name">{{ category.name }}</span>
        <span class="category-count">({{ getCategoryCount(category.name) }})</span>
      </div>
    </div>

    <div class="filter-footer">
      <el-button type="primary" size="small" @click="showCategoryManager" style="width: 100%">
        <el-icon>
          <Setting />
        </el-icon>
        管理分类
      </el-button>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, watch } from "vue";
import { useStore } from "vuex";
import { Setting } from "@element-plus/icons-vue";
import { ElMessage } from 'element-plus';
import categoryService from '@/services/CategoryService';
import shopService from '@/services/ShopService';

export default {
  name: "CategoryFilter",
  components: {
    Setting,
  },

  setup() {
    const store = useStore();

    // Use service reactive data
    const categories = categoryService.categories;

    // Get selected categories from Vuex (for component coordination)
    const selectedCategories = computed(
      () => store.getters["categories/selectedCategories"]
    );

    // Get shops from service for counting
    const shops = shopService.shops;

    // Load categories on mount
    onMounted(async () => {
      try {
        await categoryService.getCategories();
      } catch (error) {
        ElMessage.error('获取分类列表失败');
      }
    });

    // Watch for category updates from other components
    const categoryUpdateTrigger = computed(
      () => store.getters["categories/categoryUpdateTrigger"]
    );

    watch(categoryUpdateTrigger, async () => {
      // Refresh categories when notified of updates
      try {
        await categoryService.getCategories(true);
      } catch (error) {
        console.error('刷新分类失败:', error);
      }
    });

    // 检查分类是否被选中
    const isSelected = (categoryName) => {
      return selectedCategories.value.includes(categoryName);
    };

    // 获取分类下的店铺数量
    const getCategoryCount = (categoryName) => {
      return shops.value.filter((shop) => shop.category === categoryName).length;
    };

    // 切换分类选择
    const toggleCategory = (categoryName) => {
      store.dispatch("categories/toggleCategory", categoryName);
    };

    // 清空筛选
    const clearFilters = () => {
      store.dispatch("categories/clearCategorySelection");
    };

    // 全选
    const selectAll = () => {
      const allCategoryNames = categories.value.map((cat) => cat.name);
      store.dispatch("categories/selectAllCategories", allCategoryNames);
    };

    // 显示分类管理器
    const showCategoryManager = () => {
      store.dispatch("ui/showCategoryForm");
    };

    return {
      categories,
      selectedCategories,
      isSelected,
      getCategoryCount,
      toggleCategory,
      clearFilters,
      selectAll,
      showCategoryManager,
    };
  },
};
</script>

<style scoped>
.category-filter {
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.category-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.category-item:hover {
  background-color: #f5f7fa;
}

.category-item.active {
  background-color: #ecf5ff;
  border-color: #409eff;
}

.category-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 12px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.category-name {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.category-count {
  font-size: 12px;
  color: #909399;
}

.filter-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

/* 滚动条样式 */
.category-list::-webkit-scrollbar {
  width: 4px;
}

.category-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.category-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.category-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
