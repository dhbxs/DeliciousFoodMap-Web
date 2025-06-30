<template>
  <div>
    <el-dialog
    v-model="visible"
    title="分类管理"
    width="700px"
    @close="handleClose"
  >
    <!-- 添加新分类表单 -->
    <div class="add-category-form">
      <h4>添加新分类</h4>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        @submit.prevent="handleAddCategory"
      >
        <div class="form-row" :class="{ 'mobile-form': isMobile }">
          <el-form-item prop="name" class="form-item-name">
            <el-input
              v-model="form.name"
              placeholder="分类名称"
            />
          </el-form-item>
          
          <el-form-item prop="icon" class="form-item-icon">
            <el-select
              v-model="form.icon"
              placeholder="请选择图标"
            >
              <el-option
                v-for="icon in iconOptions"
                :key="icon"
                :label="icon"
                :value="icon"
              >
                <svg class="icon" aria-hidden="true" style="font-size: 30px;">
                  <use :xlink:href="icon" />
                </svg>
              </el-option>
            </el-select>
          </el-form-item>
          
          <div class="color-and-btn-row">
            <el-form-item prop="color" class="form-item-color">
              <el-color-picker v-model="form.color" />
            </el-form-item>
            <el-form-item class="form-item-button">
              <el-button
                type="primary"
                @click="handleAddCategory"
                :loading="loading"
              >
                添加
              </el-button>
            </el-form-item>
          </div>
        </div>
      </el-form>
    </div>
    
    <!-- 现有分类列表 -->
    <div class="category-management">
      <h4>现有分类</h4>
      <div class="category-grid" :class="{ 'mobile-grid': isMobile }">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-card"
          :class="{ 'mobile-card': isMobile }"
        >
          <div class="category-preview">
            <div class="category-icon"
              :style="{ backgroundColor: category.color }"
            >
              <svg class="icon" aria-hidden="true" style="font-size: 30px;">
                <use :xlink:href="category.icon"></use>
              </svg>
            </div>
            <div class="category-info">
              <span class="category-name">{{ category.name }}</span>
              <span class="category-count">
                ({{ getCategoryShopCount(category.name) }})
              </span>
            </div>
          </div>
          
          <div class="category-actions">
            <el-button
              size="small"
              type="primary"
              text
              @click="editCategory(category)"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button
              size="small"
              type="danger"
              text
              @click="deleteCategory(category)"
              :disabled="getCategoryShopCount(category.name) > 0"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 编辑分类对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑分类"
      width="90%"
      max-width="400px"
      :class="{ 'mobile-dialog': isMobile }"
      append-to-body
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="rules"
        label-width="80px"
        :class="{ 'mobile-edit-form': isMobile }"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-select v-model="editForm.icon" placeholder="请选择图标" style="width: 100px">
            <el-option
              v-for="icon in iconOptions"
              :key="icon"
              :label="icon"
              :value="icon"
            >
              <svg class="icon" aria-hidden="true" style="font-size: 30px;">
                <use :xlink:href="icon" />
              </svg>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="editForm.color" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleUpdateCategory"
          :loading="loading"
        >
          更新
        </el-button>
      </template>
    </el-dialog>
    
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { ElMessage, ElMessageBox } from "element-plus";
import { Edit, Delete } from "@element-plus/icons-vue";
import categoryService from '@/services/CategoryService';
import shopService from '@/services/ShopService';
import { iconList } from '@/consts/icon';

export default {
  name: "CategoryForm",
  components: {
    Edit,
    Delete,
  },
  
  setup() {
    const store = useStore();
    const formRef = ref(null);
    const editFormRef = ref(null);
    const loading = ref(false);
    const showEditDialog = ref(false);

    // 检测移动端
    const isMobile = ref(false);
    
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768;
    };

    // 表单数据
    const form = ref({
      name: "",
      icon: "#food-icon-a-001-drink",
      color: "#409eff",
    });
    
    // 图标选项
    const iconOptions = ref(iconList);
    
    const editForm = ref({
      id: null,
      name: "",
      icon: "",
      color: "",
    });

    // 计算属性
    const visible = computed({
      get: () => store.getters["ui/showCategoryForm"],
      set: (value) => {
        if (!value) {
          store.dispatch("ui/hideCategoryForm");
        }
      },
    });
    
    // Use service reactive data
    const categories = categoryService.categories;

    onMounted(async () => {
      try {
        await categoryService.getCategories();
        await shopService.getShops(); // Load shops for counting        
      } catch (error) {
        ElMessage.error('获取数据失败');
      }
    });

    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: "请输入分类名称", trigger: "blur" },
        {
          min: 1,
          max: 20,
          message: "分类名称长度在 1 到 20 个字符",
          trigger: "blur",
        },
      ],
      icon: [{ required: true, message: "请输入图标", trigger: "blur" }],
      color: [{ required: true, message: "请选择颜色", trigger: "change" }],
    };

    // 获取分类下的店铺数量
    const getCategoryShopCount = (categoryName) => {
      return shopService.shops.value.filter((shop) => shop.category === categoryName).length;
    };

    // 重置表单
    const resetForm = () => {
      form.value = {
        name: "",
        icon: "#food-icon-a-001-drink",
        color: "#409eff",
      };

      if (formRef.value) {
        formRef.value.resetFields();
      }
    };

    // 添加分类
    const handleAddCategory = async () => {
      if (!formRef.value) return;

      try {
        await formRef.value.validate();
        loading.value = true;

        await categoryService.addCategory({
          name: form.value.name,
          icon: form.value.icon,
          color: form.value.color
        });

        ElMessage.success("分类添加成功");
        resetForm();

        // 通知Vuex分类已更新
        store.dispatch("categories/notifyCategoryUpdate");
      } catch (error) {
        ElMessage.error(error.message || "添加分类失败");
      } finally {
        loading.value = false;
      }
    };

    // 编辑分类
    const editCategory = (category) => {
      editForm.value = {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
      };
      showEditDialog.value = true;
    };

    // 更新分类
    const handleUpdateCategory = async () => {
      if (!editFormRef.value) return;

      try {
        await editFormRef.value.validate();
        loading.value = true;

        await categoryService.updateCategory({
          id: editForm.value.id,
          name: editForm.value.name,
          icon: editForm.value.icon,
          color: editForm.value.color
        });

        ElMessage.success("分类更新成功");
        showEditDialog.value = false;

        // 通知Vuex分类已更新
        store.dispatch("categories/notifyCategoryUpdate");
      } catch (error) {
        ElMessage.error(error.message || "更新分类失败");
      } finally {
        loading.value = false;
      }
    };

    // 删除分类
    const deleteCategory = (category) => {
      const shopCount = getCategoryShopCount(category.name);

      if (shopCount > 0) {
        ElMessage.warning(
          `无法删除分类"${category.name}"，还有${shopCount}个店铺正在使用此分类`
        );
        return;
      }

      ElMessageBox.confirm(`确定要删除分类"${category.name}"吗？`, "确认删除", {
        type: "warning",
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
      })
        .then(async () => {
          try {
            await categoryService.deleteCategory(category.id);
            ElMessage.success("分类删除成功");

            // 通知Vuex分类已更新
            store.dispatch("categories/notifyCategoryUpdate");
          } catch (error) {
            ElMessage.error(error.message || "删除失败");
          }
        })
        .catch(() => {
          // 用户取消删除
        });
    };

    // 处理关闭
    const handleClose = () => {
      resetForm();
      showEditDialog.value = false;
      store.dispatch("ui/hideCategoryForm");
    };

    return {
      formRef,
      editFormRef,
      form,
      editForm,
      rules,
      visible,
      categories,
      loading,
      showEditDialog,
      iconOptions,
      isMobile,
      getCategoryShopCount,
      handleAddCategory,
      editCategory,
      handleUpdateCategory,
      deleteCategory,
      handleClose,
    };
  },
};
</script>

<style scoped>
.add-category-form {
  margin-bottom: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.add-category-form h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.category-management h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
}

.category-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  align-items: flex-end;
}

.form-row .el-form-item {
  margin-bottom: 0;
}

.form-row .el-input,
.form-row .el-color-picker,
.form-row .el-select {
  width: 200px !important;
}

.category-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: white;
  transition: all 0.3s ease;
}

.category-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.category-preview {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  gap: 12px;
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.category-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.category-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-count {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.category-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* 滚动条样式 */
.category-grid::-webkit-scrollbar {
  width: 4px;
}

.category-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.category-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.category-grid::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 移动端优化 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 85% !important;
    height: 80% !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  :deep(.el-dialog__body) {
    flex: 1 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    padding: 16px !important;
  }
  
  .add-category-form {
    padding: 12px;
    margin-bottom: 20px;
    flex-shrink: 0;
  }
  
  .add-category-form h4,
  .category-management h4 {
    font-size: 15px;
    margin-bottom: 12px;
  }
  
  .category-management {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .form-row {
    flex-direction: column;
    gap: 16px;
    margin-bottom: 20px;
  }
  
  .form-row .el-form-item {
    width: 100%;
    margin-bottom: 0;
  }
  
  .form-row .el-input,
  .form-row .el-color-picker,
  .form-row .el-select {
    width: 100% !important;
  }
  
  .form-row .el-input {
    height: 44px;
  }
  
  .form-row .el-select {
    height: 44px;
  }
  
  .form-row .el-color-picker {
    height: 44px;
    width: 44px !important;
  }
  
  .form-row .el-button {
    width: 100%;
    height: 44px;
    font-size: 16px;
  }
  
  /* 颜色选择器和按钮并排 */
  .form-row .form-item-color,
  .form-row .form-item-button {
    display: inline-block;
    width: calc(50% - 8px) !important;
    margin-right: 16px;
  }
  
  .form-row .form-item-button {
    margin-right: 0;
  }
  
  .form-row .form-item-color .el-color-picker {
    width: 100% !important;
    height: 44px;
  }
  
  .form-row .form-item-button .el-button {
    width: 100%;
    height: 44px;
  }
  
  .category-card {
    flex-direction: column;
    align-items: stretch;
    padding: 16px;
    gap: 12px;
  }
  
  .category-preview {
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 12px;
  }
  
  .category-icon {
    width: 48px;
    height: 48px;
  }
  
  .category-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }
  
  .category-name {
    font-size: 16px;
    font-weight: 500;
  }
  
  .category-count {
    font-size: 13px;
  }
  
  .category-actions {
    justify-content: flex-end;
    gap: 8px;
  }
  
  .category-actions .el-button {
    padding: 8px 12px;
    font-size: 14px;
  }
  
  .category-grid {
    flex: 1;
    overflow-y: auto;
    gap: 16px;
  }
  
  .category-grid::-webkit-scrollbar {
    width: 6px;
  }
  
  .category-grid::-webkit-scrollbar-thumb {
    background: #d1d1d1;
    border-radius: 3px;
  }
}

.color-and-btn-row {
  display: flex;
  gap: 12px;
}
.color-and-btn-row .el-form-item {
  flex: 1;
  margin-bottom: 0;
}
</style>
