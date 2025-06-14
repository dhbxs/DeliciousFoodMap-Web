<template>
  <div class="category-filter">
    <div class="filter-header">
      <div class="filter-actions">
        <el-button size="medium" @click="clearFilters" :disabled="selectedCategories.length === 0">
          清空
        </el-button>
        <el-button size="medium" type="primary" @click="selectAll"
          :disabled="selectedCategories.length === categories.length">
          全选
        </el-button>
      </div>
    </div>
    <div class="category-list">
      <div v-for="category in categories" :key="category.id" class="category-item"
        :class="{ active: isSelected(category.name) }" @click="toggleCategory(category.id)">
        <div class="category-icon" :style="{ backgroundColor: category.color }">
          <svg class="icon" aria-hidden="true" style="font-size: 30px;">
            <use :xlink:href="category.icon"></use>
          </svg>
        </div>
        <span class="category-name">{{ category.name }}</span>
        <span class="category-count">({{ category.num }})</span>
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
    const toggleCategory = (categoryId) => {
      store.dispatch("categories/toggleCategory", categoryId);
    };

    // 清空筛选
    const clearFilters = () => {
      store.dispatch("categories/clearCategorySelection");
    };

    // 全选
    const selectAll = () => {
      const allCategoryIds = categories.value.map((cat) => cat.id);
      store.dispatch("categories/selectAllCategories", allCategoryIds);
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
  padding: 10px 0 0 0;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--gray-200);
}

.category-filter:hover {
  box-shadow: var(--shadow-xl);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.filter-actions {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  gap: var(--spacing-sm);
  padding: 0 10px;
}

.filter-actions .el-button {
  border-radius: var(--radius-lg);
  font-weight: 600;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.filter-actions .el-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.category-list {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--spacing-md);
  max-height: 230px;
  overflow-y: auto;
  margin: 10px 10px 0 10px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 1px solid var(--gray-200);
  background: var(--bg-primary);
  position: relative;
  overflow: hidden;
}

.category-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
  transition: left var(--transition-normal);
}

.category-item:hover::before {
  left: 100%;
}

.category-item:hover {
  background: var(--bg-primary);
  border-color: var(--primary-color);
}

.category-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-color: var(--primary-color);
  box-shadow: var(--shadow-md);
}

.category-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-md);
  font-size: 14px;
  color: var(--text-inverse);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.category-item:hover .category-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: var(--shadow-md);
}

.category-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.category-count {
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--gray-100);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

.category-item.active .category-count {
  background: var(--primary-color);
  color: var(--text-inverse);
}

.filter-footer {
  padding: var(--spacing-md);
}

.filter-footer .el-button {
  height: 44px;
  border-radius: var(--radius-xl);
  font-weight: 600;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.filter-footer .el-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 滚动条样式 */
.category-list::-webkit-scrollbar {
  width: 6px;
}

.category-list::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: var(--radius-full);
}

.category-list::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: var(--radius-full);
  transition: background-color var(--transition-fast);
}

.category-list::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

/* 进入动画 */
.category-item {
  animation: slideUp var(--transition-normal) ease-out;
}

.category-item:nth-child(1) { animation-delay: 0.1s; }
.category-item:nth-child(2) { animation-delay: 0.2s; }
.category-item:nth-child(3) { animation-delay: 0.3s; }
.category-item:nth-child(4) { animation-delay: 0.4s; }
.category-item:nth-child(5) { animation-delay: 0.5s; }
.category-item:nth-child(6) { animation-delay: 0.6s; }

/* 响应式设计 */
@media (max-width: 768px) {
  .category-filter {
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
  }

  .filter-header {
    margin-bottom: var(--spacing-lg);
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }

  .filter-header h3 {
    text-align: center;
    font-size: 15px;
  }

  .filter-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-sm);
  }

  .filter-actions .el-button {
    height: 40px;
    font-size: 13px;
  }

  .category-list {
    grid-template-columns: 1fr;
    max-height: 240px;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
  }

  .category-item {
    padding: var(--spacing-md);
  }

  .category-icon {
    width: 28px;
    height: 28px;
    font-size: 12px;
    margin-right: var(--spacing-sm);
  }

  .category-name {
    font-size: 13px;
  }

  .category-count {
    font-size: 11px;
    padding: var(--spacing-xs);
  }

  .filter-footer {
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-lg);
  }

  .filter-footer .el-button {
    height: 40px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .category-filter {
    padding: var(--spacing-md);
  }

  .filter-header {
    margin-bottom: var(--spacing-md);
  }

  .filter-header h3 {
    font-size: 14px;
  }

  .filter-actions {
    grid-template-columns: 1fr;
    gap: var(--spacing-xs);
  }

  .filter-actions .el-button {
    height: 36px;
    font-size: 12px;
  }

  .category-list {
    max-height: 200px;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs);
  }

  .category-item {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .category-icon {
    width: 24px;
    height: 24px;
    font-size: 10px;
    margin-right: var(--spacing-sm);
  }

  .category-name {
    font-size: 12px;
  }

  .category-count {
    font-size: 10px;
    min-width: 20px;
  }

  .filter-footer {
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
  }

  .filter-footer .el-button {
    height: 36px;
    font-size: 12px;
  }
}
</style>
