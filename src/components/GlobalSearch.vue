<template>
  <div class="global-search" :class="{ 'mobile': isMobile }">
    <!-- 搜索输入框 -->
    <div class="search-input-container">
      <el-input
        v-model="searchKeyword"
        :placeholder="isMobile ? '搜索店铺...' : '搜索店铺名称、地址或分类...'"
        clearable
        @input="handleSearchInput"
        @focus="handleFocus"
        @blur="handleBlur"
        class="search-input"
        :prefix-icon="Search"
        size="large"
      >
        <template #suffix>
          <el-button
            v-if="searchKeyword && !isMobile"
            type="primary"
            size="small"
            @click="performSearch"
            :loading="searching"
          >
            搜索
          </el-button>
        </template>
      </el-input>
    </div>

    <!-- 搜索结果下拉列表 -->
    <div
      v-if="showResults && searchResults.length > 0"
      class="search-results"
      :class="{ 'mobile-results': isMobile }"
    >
      <div class="results-header">
        <span class="results-count">找到 {{ searchResults.length }} 个结果</span>
        <el-button
          type="text"
          size="small"
          @click="closeResults"
          class="close-btn"
        >
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      
      <div class="results-list">
        <div
          v-for="result in searchResults"
          :key="result.id"
          class="result-item"
          @click="selectResult(result)"
        >
          <div class="result-content">
            <div class="result-header">
              <span class="result-name">{{ result.name }}</span>
              <span class="result-category" :style="{ color: getCategoryColor(result.categoryColor) }">
                <svg class="result-category-icon" aria-hidden="true">
                  <use :xlink:href="result.categoryIcon"></use>
                </svg>
              </span>
              <span class="result-category">{{ result.categoryName }}</span>
            </div>
            <div class="result-address">
              <el-icon class="location-icon"><Location /></el-icon>
              {{ result.address }}
            </div>
            <div v-if="result.description" class="result-description">
              {{ result.description }}
            </div>
          </div>
          <div class="result-actions">
            <el-button
              type="primary"
              size="small"
              @click.stop="jumpToLocation(result)"
            >
              跳转
            </el-button>
          </div>
        </div>
      </div>

      <!-- 移动端底部操作 -->
      <div v-if="isMobile" class="mobile-actions">
        <el-button @click="closeResults" style="width: 100%">
          关闭搜索结果
        </el-button>
      </div>
    </div>

    <!-- 无结果提示 -->
    <div
      v-if="showResults && searchResults.length === 0 && searchKeyword.trim()"
      class="no-results"
      :class="{ 'mobile-results': isMobile }"
    >
      <el-empty
        description="未找到相关店铺"
        :image-size="60"
      >
        <el-button type="primary" @click="closeResults">
          关闭
        </el-button>
      </el-empty>
    </div>

    <!-- 移动端遮罩 -->
    <div
      v-if="isMobile && showResults"
      class="mobile-overlay"
      @click="closeResults"
    ></div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
import { ElMessage } from 'element-plus';
import { Search, Close, Location } from '@element-plus/icons-vue';
import shopService from '@/services/ShopService';
import categoryService from '@/services/CategoryService';

export default {
  name: 'GlobalSearch',
  components: {
    Search,
    Close,
    Location,
  },

  setup() {
    const store = useStore();
    
    // 响应式数据
    const searchKeyword = ref('');
    const searchResults = ref([]);
    const showResults = ref(false);
    const searching = ref(false);
    const inputFocused = ref(false);
    
    // 计算属性
    const isMobile = computed(() => store.getters['ui/isMobile']);
    
    // 防抖搜索
    let searchTimeout = null;
    
    // 获取分类颜色
    const getCategoryColor = (categoryName) => {
      const category = categoryService.getCategoryByName(categoryName);
      return category?.color || '#409eff';
    };
    
    // 获取分类图标
    const getCategoryIcon = (categoryName) => {
      const category = categoryService.getCategoryByName(categoryName);
      return category?.icon || '🍽️';
    };
    
    // 处理搜索输入
    const handleSearchInput = (value) => {
      // 清除之前的定时器
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      // 如果输入为空，清空结果
      if (!value.trim()) {
        searchResults.value = [];
        showResults.value = false;
        return;
      }
      
      // 防抖搜索
      searchTimeout = setTimeout(() => {
        performSearch();
      }, 300);
    };
    
    // 执行搜索
    const performSearch = async () => {
      if (!searchKeyword.value.trim()) {
        return;
      }
      
      try {
        searching.value = true;
        
        // 使用 shopService 进行搜索
        const results = await shopService.searchShops(searchKeyword.value.trim());
        
        searchResults.value = results;
        showResults.value = true;
        
        // 移动端自动显示结果
        if (isMobile.value) {
          nextTick(() => {
            // 滚动到搜索结果
            const resultsElement = document.querySelector('.search-results');
            if (resultsElement) {
              resultsElement.scrollIntoView({ behavior: 'smooth' });
            }
          });
        }
        
      } catch (error) {
        ElMessage.error('搜索失败: ' + (error.message || '未知错误'));
        searchResults.value = [];
        showResults.value = false;
      } finally {
        searching.value = false;
      }
    };
    
    // 处理输入框聚焦
    const handleFocus = () => {
      inputFocused.value = true;
      // 如果有搜索结果，显示它们
      if (searchResults.value.length > 0) {
        showResults.value = true;
      }

      // 移动端聚焦时滚动到搜索框
      if (isMobile.value) {
        nextTick(() => {
          const searchElement = document.querySelector('.global-search');
          if (searchElement) {
            searchElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      }
    };
    
    // 处理输入框失焦
    const handleBlur = () => {
      inputFocused.value = false;
      // 延迟关闭结果，允许点击结果项
      setTimeout(() => {
        if (!inputFocused.value) {
          // showResults.value = false; // 不自动关闭，让用户手动关闭
        }
      }, 200);
    };
    
    // 选择搜索结果
    const selectResult = (result) => {
      jumpToLocation(result);
    };
    
    // 跳转到位置
    const jumpToLocation = (result) => {
      // 验证坐标
      const lng = parseFloat(result.lng || result.longitude);
      const lat = parseFloat(result.lat || result.latitude);
      
      if (isNaN(lng) || isNaN(lat)) {
        ElMessage.warning(`店铺"${result.name}"的位置信息不完整`);
        return;
      }
      
      // 更新地图中心点
      store.dispatch('ui/setMapState', {
        center: [lat, lng],
        zoom: 17
      });
      
      // 选择该店铺
      shopService.selectShop(result);
      store.dispatch('shops/selectShop', result.id);
      
      // 关闭搜索结果
      closeResults();
      
      // 移动端关闭侧边栏
      if (isMobile.value) {
        store.dispatch('ui/setSidebarCollapsed', true);
      }
      
      ElMessage.success(`已跳转到"${result.name}"`);
    };
    
    // 关闭搜索结果
    const closeResults = () => {
      showResults.value = false;
      searchKeyword.value = '';
      searchResults.value = [];
    };
    
    // 监听移动端状态变化
    watch(isMobile, (newVal) => {
      if (newVal && showResults.value) {
        // 移动端时确保结果可见
        nextTick(() => {
          const resultsElement = document.querySelector('.search-results');
          if (resultsElement) {
            resultsElement.scrollIntoView({ behavior: 'smooth' });
          }
        });
      }
    });
    
    return {
      searchKeyword,
      searchResults,
      showResults,
      searching,
      isMobile,
      getCategoryColor,
      getCategoryIcon,
      handleSearchInput,
      handleFocus,
      handleBlur,
      performSearch,
      selectResult,
      jumpToLocation,
      closeResults,
    };
  },
};
</script>

<style scoped>
.global-search {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  animation: slideUp var(--transition-normal) ease-out;
}

.search-input-container {
  position: relative;
  z-index: 1001;
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-normal);
  border: 1px solid var(--gray-200);
  background: var(--bg-primary);
  backdrop-filter: blur(20px);
  height: 56px;
}

.search-input :deep(.el-input__wrapper):hover {
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15), var(--shadow-xl);
  border-color: var(--primary-color);
  transform: translateY(-2px);
}

.search-input :deep(.el-input__inner) {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  padding: 0 var(--spacing-lg);
}

.search-input :deep(.el-input__prefix) {
  color: var(--primary-color);
  font-size: 18px;
}

.search-input :deep(.el-input__suffix) {
  padding-right: var(--spacing-sm);
}

/* 搜索结果样式 */
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  z-index: 1000;
  max-height: 400px;
  overflow: hidden;
  margin-top: var(--spacing-md);
  border: 1px solid var(--gray-200);
  backdrop-filter: blur(20px);
  animation: scaleIn var(--transition-normal) ease-out;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--gray-200);
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  position: relative;
}

.results-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="search-pattern" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23search-pattern)"/></svg>');
  opacity: 0.3;
}

.results-count {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 600;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.results-count::before {
  content: '🔍';
  font-size: 16px;
}

.close-btn {
  padding: var(--spacing-sm);
  min-height: auto;
  border-radius: var(--radius-full);
  position: relative;
  z-index: 1;
  transition: all var(--transition-fast);
}

.close-btn:hover {
  background: var(--danger-color);
  color: var(--text-inverse);
  transform: scale(1.1);
}

.results-list {
  max-height: 320px;
  overflow-y: auto;
  background: var(--bg-primary);
}

.result-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--gray-100);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.result-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: var(--primary-gradient);
  opacity: 0.05;
  transition: left var(--transition-normal);
}

.result-item:hover::before {
  left: 100%;
}

.result-item:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  transform: translateX(4px);
}

.result-item:last-child {
  border-bottom: none;
}

.result-content {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.result-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.result-name {
  font-weight: 700;
  color: var(--text-primary);
  font-size: 16px;
  line-height: 1.3;
}

.result-category {
  font-size: 12px;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: var(--radius-lg);
  white-space: nowrap;
  font-weight: 600;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.result-address {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: var(--spacing-sm);
  line-height: 1.4;
}

.location-icon {
  font-size: 14px;
  color: var(--primary-color);
}

.result-description {
  color: var(--text-tertiary);
  font-size: 13px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--gray-50);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--primary-color);
}

.result-actions {
  margin-left: var(--spacing-lg);
  position: relative;
  z-index: 1;
}

.result-actions .el-button {
  border-radius: var(--radius-xl);
  font-weight: 600;
  padding: var(--spacing-sm) var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.result-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* 无结果样式 */
.no-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  z-index: 1000;
  margin-top: var(--spacing-md);
  padding: var(--spacing-2xl);
  border: 1px solid var(--gray-200);
  backdrop-filter: blur(20px);
  animation: scaleIn var(--transition-normal) ease-out;
}

.no-results .el-empty {
  padding: var(--spacing-xl);
}

.no-results .el-button {
  border-radius: var(--radius-xl);
  padding: var(--spacing-md) var(--spacing-xl);
  font-weight: 600;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.no-results .el-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 移动端样式 */
.mobile .search-input :deep(.el-input__wrapper) {
  border-radius: var(--radius-xl);
  height: 48px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--gray-300);
}

.mobile .search-input :deep(.el-input__wrapper):hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.mobile .search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2), var(--shadow-lg);
  border-color: var(--primary-color);
}

.mobile .search-input :deep(.el-input__inner) {
  font-size: 16px; /* 防止iOS缩放 */
  padding: 0 var(--spacing-md);
}

.mobile .search-input :deep(.el-input__prefix) {
  font-size: 20px;
  color: var(--primary-color);
}

.mobile-results {
  position: fixed !important;
  top: 120px !important; /* 在移动端顶部工具栏和搜索框下方 */
  left: var(--spacing-md) !important;
  right: var(--spacing-md) !important;
  max-height: calc(100vh - 140px) !important;
  z-index: 2000 !important;
  margin-top: 0 !important;
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-2xl) !important;
  border: 1px solid var(--gray-200) !important;
}

.mobile-actions {
  padding: var(--spacing-xl);
  border-top: 1px solid var(--gray-200);
  background: var(--bg-secondary);
}

.mobile-actions .el-button {
  border-radius: var(--radius-xl);
  height: 48px;
  font-weight: 600;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-normal);
}

.mobile-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1999;
  animation: fadeIn var(--transition-fast) ease-out;
}

/* 移动端结果项优化 - 使用媒体查询而不是类选择器 */
@media (max-width: 768px) {
  .mobile-results .result-item {
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-sm);
    flex-direction: column;
    align-items: stretch;
    border: 1px solid var(--gray-200);
    background: var(--bg-primary);
    box-shadow: var(--shadow-sm);
  }

  .mobile-results .result-item:hover {
    transform: none; /* 移动端不需要hover位移 */
    background: var(--bg-secondary);
    box-shadow: var(--shadow-md);
  }

  .mobile-results .result-item:active {
    background: var(--gray-100);
    transform: scale(0.98);
  }

  .mobile-results .result-content {
    width: 100%;
    margin-bottom: var(--spacing-md);
  }

  .mobile-results .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }

  .mobile-results .result-name {
    font-size: 16px;
    font-weight: 700;
    line-height: 1.3;
    margin-bottom: var(--spacing-xs);
  }

  .mobile-results .result-category {
    font-size: 11px;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-md);
    align-self: flex-start;
  }

  .mobile-results .result-address {
    font-size: 14px;
    margin-bottom: var(--spacing-md);
    line-height: 1.4;
  }

  .mobile-results .result-address .location-icon {
    font-size: 16px;
  }

  .mobile-results .result-description {
    font-size: 13px;
    line-height: 1.5;
    margin-bottom: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--gray-50);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--primary-color);
  }

  .mobile-results .result-actions {
    margin-left: 0;
    margin-top: 0;
    width: 100%;
  }

  .mobile-results .result-actions .el-button {
    width: 100%;
    height: 48px;
    border-radius: var(--radius-lg);
    font-size: 15px;
    font-weight: 600;
    box-shadow: var(--shadow-md);
  }

  .mobile-results .result-actions .el-button:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }
}

/* 滚动条样式 */
.results-list::-webkit-scrollbar {
  width: 6px;
}

.results-list::-webkit-scrollbar-track {
  background: var(--gray-100);
  border-radius: var(--radius-full);
}

.results-list::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: var(--radius-full);
  transition: background-color var(--transition-fast);
}

.results-list::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

/* 加载状态 */
.search-input.loading :deep(.el-input__wrapper) {
  animation: pulse 1.5s ease-in-out infinite;
}

/* 结果项进入动画 */
.result-item {
  animation: slideUp var(--transition-normal) ease-out;
}

.result-item:nth-child(1) { animation-delay: 0.1s; }
.result-item:nth-child(2) { animation-delay: 0.2s; }
.result-item:nth-child(3) { animation-delay: 0.3s; }
.result-item:nth-child(4) { animation-delay: 0.4s; }
.result-item:nth-child(5) { animation-delay: 0.5s; }

/* 响应式设计 */
@media (max-width: 768px) {
  .global-search {
    max-width: none;
    width: 100%;
  }

  .search-input {
    font-size: 16px; /* 防止iOS缩放 */
  }

  .search-input :deep(.el-input__wrapper) {
    height: 48px;
    border-radius: var(--radius-lg);
  }

  .search-input :deep(.el-input__inner) {
    font-size: 16px;
    padding: 0 var(--spacing-md);
  }

  .search-results {
    border-radius: var(--radius-lg);
    margin-top: var(--spacing-sm);
  }

  .mobile-results {
    max-height: calc(100vh - 140px) !important;
    overflow: hidden;
  }

  .mobile-results .results-list {
    max-height: calc(100vh - 200px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: var(--spacing-sm);
  }

  .results-header {
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .results-count {
    font-size: 13px;
  }

  .result-item {
    padding: var(--spacing-lg);
    flex-direction: column;
    align-items: stretch;
  }

  .result-content {
    margin-bottom: var(--spacing-md);
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .result-name {
    font-size: 15px;
    margin-bottom: var(--spacing-xs);
  }

  .result-category {
    align-self: flex-start;
  }

  .result-address {
    font-size: 13px;
  }

  .result-description {
    font-size: 12px;
  }

  .result-actions {
    margin-left: 0;
    width: 100%;
  }

  .result-actions .el-button {
    width: 100%;
    height: 40px;
    font-size: 14px;
  }

  .no-results {
    padding: var(--spacing-lg);
    border-radius: var(--radius-lg);
  }

  .mobile-results.no-results {
    padding: var(--spacing-xl);
    text-align: center;
  }

  .mobile-results .el-empty {
    padding: var(--spacing-lg) 0;
  }

  .mobile-results .el-empty__description {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-lg);
  }
}

@media (max-width: 480px) {
  .search-input :deep(.el-input__wrapper) {
    height: 44px;
  }

  .search-input :deep(.el-input__inner) {
    font-size: 15px;
    padding: 0 var(--spacing-sm);
  }

  .search-input :deep(.el-input__prefix) {
    font-size: 18px;
  }

  .mobile-results {
    left: var(--spacing-sm) !important;
    right: var(--spacing-sm) !important;
    top: 110px !important;
    max-height: calc(100vh - 120px) !important;
    border-radius: var(--radius-md) !important;
  }

  .results-header {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .results-count {
    font-size: 12px;
  }

  .mobile-results .result-item {
    padding: var(--spacing-md);
  }

  .mobile-results .result-name {
    font-size: 15px;
  }

  .mobile-results .result-address {
    font-size: 13px;
  }

  .mobile-results .result-description {
    font-size: 12px;
    padding: var(--spacing-sm);
  }

  .mobile-results .result-actions .el-button {
    height: 44px;
    font-size: 14px;
  }

  .mobile-actions {
    padding: var(--spacing-md);
  }

  .mobile-actions .el-button {
    height: 44px;
    font-size: 14px;
  }
}
.result-category-icon {
  width: 20px;
  height: 20px;
  margin-right: var(--spacing-xs);
}
</style>
