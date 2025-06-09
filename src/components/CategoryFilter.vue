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
import { computed, ref, onMounted } from "vue";
import { useStore } from "vuex";
import { Setting } from "@element-plus/icons-vue";
import { ElMessage } from 'element-plus';
import { getCategoryData } from "@/api/categoryApi";

export default {
  name: "CategoryFilter",
  components: {
    Setting,
  },

  setup() {
    const store = useStore();
    const categories = ref([]);

    onMounted(async () => {
      try {
        const response = await getCategoryData();
        categories.value = response.data;
      } catch (error) {
        ElMessage.error('获取分类列表失败');
      }
    });
    const selectedCategories = computed(
      () => store.state.shops.filteredCategories
    );
    const allShops = computed(() => store.getters["shops/allShops"]);

    // 检查分类是否被选中
    const isSelected = (categoryName) => {
      return selectedCategories.value.includes(categoryName);
    };

    // 获取分类下的店铺数量
    const getCategoryCount = (categoryName) => {
      return allShops.value.filter((shop) => shop.category === categoryName)
        .length;
    };

    // 切换分类选择
    const toggleCategory = (categoryName) => {
      const current = [...selectedCategories.value];
      const index = current.indexOf(categoryName);

      if (index > -1) {
        // 取消选择
        current.splice(index, 1);
      } else {
        // 添加选择
        current.push(categoryName);
      }

      store.dispatch("shops/setFilteredCategories", current);
    };

    // 清空筛选
    const clearFilters = () => {
      store.dispatch("shops/clearFilters");
    };

    // 全选
    const selectAll = () => {
      const allCategoryNames = categories.value.map((cat) => cat.name);
      store.dispatch("shops/setFilteredCategories", allCategoryNames);
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
