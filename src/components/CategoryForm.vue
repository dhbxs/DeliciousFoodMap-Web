<template>
  <el-dialog
    v-model="visible"
    title="分类管理"
    width="90%"
    max-width="600px"
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
        <div class="form-row">
          <el-form-item prop="name">
            <el-input
              v-model="form.name"
              placeholder="分类名称"
              style="width: 120px"
            />
          </el-form-item>
          
          <el-form-item prop="icon">
            <el-select
              v-model="form.icon"
              placeholder="请选择图标"
              style="width: 100px"
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
          
          <el-form-item prop="color">
            <el-color-picker v-model="form.color" />
          </el-form-item>
          
          <el-form-item>
            <el-button
              type="primary"
              @click="handleAddCategory"
              :loading="loading"
            >
              添加
            </el-button>
          </el-form-item>
        </div>
      </el-form>
    </div>
    
    <!-- 现有分类列表 -->
    <div class="category-management">
      <h4>现有分类</h4>
      <div class="category-grid">
        <div
          v-for="category in categories"
          :key="category.id"
          class="category-card"
        >
          <div class="category-preview">
            <div
              class="category-icon"
              :style="{ backgroundColor: category.color }"
            >
              <svg class="icon" aria-hidden="true" style="font-size: 30px;">
                <use :xlink:href="category.icon"></use>
              </svg>
            </div>
            <span class="category-name">{{ category.name }}</span>
            <span class="category-count">
              ({{ getCategoryShopCount(category.name) }})
            </span>
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
      width="400px"
      append-to-body
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="rules"
        label-width="80px"
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
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { ElMessage, ElMessageBox } from "element-plus";
import { Edit, Delete } from "@element-plus/icons-vue";
import { getCategoryData, insertOrUpdateOrDeleteCategory} from "@/api/categoryApi";

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

    // 表单数据
    const form = ref({
      name: "",
      icon: "#food-icon-a-001-drink",
      color: "#409eff",
    });
    
    // 图标选项
    const iconOptions = ref([
      "#food-icon-a-001-drink",
      "#food-icon-a-011-food",
      "#food-icon-a-005-snack",
      "#food-icon-a-003-food",
      "#food-icon-a-009-snack",
      "#food-icon-a-002-food",
      "#food-icon-a-013-food",
      "#food-icon-a-019-food",
      "#food-icon-a-007-food",
      "#food-icon-a-012-bread",
      "#food-icon-a-004-meat",
      "#food-icon-a-017-strawberry",
      "#food-icon-a-006-strawberry",
      "#food-icon-a-020-cheese",
      "#food-icon-a-015-food",
      "#food-icon-a-018-strawberry",
      "#food-icon-a-010-food",
      "#food-icon-a-028-healthy",
      "#food-icon-a-012-drink",
      "#food-icon-a-030-drink",
      "#food-icon-a-005-softdrinkcan",
      "#food-icon-a-018-hotamericano",
      "#food-icon-a-026-drink",
      "#food-icon-a-024-drink",
      "#food-icon-a-001-sweet",
      "#food-icon-a-003-whiskey",
      "#food-icon-a-008-drink",
      "#food-icon-a-002-drink",
      "#food-icon-a-009-sweet",
      "#food-icon-a-006-drink",
      "#food-icon-a-007-strawberry",
      "#food-icon-a-004-cup",
      "#food-icon-a-022-glass",
      "#food-icon-a-015-drink",
      "#food-icon-a-013-drink",
      "#food-icon-a-025-drink",
      "#food-icon-a-017-drink",
      "#food-icon-a-014-glass",
      "#food-icon-a-019-alcohol",
      "#food-icon-a-016-moccha",
      "#food-icon-a-020-milk",
      "#food-icon-a-023-drink",
      "#food-icon-a-021-milk",
      "#food-icon-a-027-tropical",
      "#food-icon-a-029-drink",
      "#food-icon-a-010-fruit",
      "#food-icon-a-028-healthy",
      "#food-icon-a-012-drink",
      "#food-icon-a-030-drink",
      "#food-icon-a-005-softdrinkcan",
      "#food-icon-a-018-hotamericano",
      "#food-icon-a-026-drink",
      "#food-icon-a-024-drink",
      "#food-icon-a-001-sweet",
      "#food-icon-a-003-whiskey",
      "#food-icon-a-008-drink",
      "#food-icon-a-002-drink",
      "#food-icon-a-009-sweet",
      "#food-icon-a-006-drink",
      "#food-icon-a-007-strawberry",
      "#food-icon-a-004-cup",
      "#food-icon-a-022-glass",
      "#food-icon-a-015-drink",
      "#food-icon-a-013-drink",
      "#food-icon-a-025-drink",
      "#food-icon-a-017-drink",
      "#food-icon-a-014-glass",
      "#food-icon-a-019-alcohol",
      "#food-icon-a-016-moccha",
      "#food-icon-a-020-milk",
      "#food-icon-a-023-drink",
      "#food-icon-a-021-milk",
      "#food-icon-a-027-tropical",
      "#food-icon-a-029-drink",
      "#food-icon-a-010-fruit",
      "#food-icon-a-028-healthy",
      "#food-icon-a-012-drink",
      "#food-icon-a-030-drink"
    ]);
    
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
    
    const categories = ref([]);
    
    onMounted(async () => {
      try {
        const response = await getCategoryData();
        categories.value = response.data;
      } catch (error) {
        ElMessage.error('获取分类列表失败');
      }
    });
    const allShops = computed(() => store.getters["shops/allShops"]);

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
      return allShops.value.filter((shop) => shop.category === categoryName)
        .length;
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

        const result = await insertOrUpdateOrDeleteCategory({
          name: form.value.name,
          icon: form.value.icon,
          color: form.value.color,
          id: null,
          isDelete: 'N'
        });

        if (result) {
          ElMessage.success("分类添加成功");
          resetForm();
          // Refresh categories after adding
          const response = await getCategoryData();
          categories.value = response.data;
        } else {
          ElMessage.error("添加分类失败");
        }
      } catch (error) {
        if (error.message) {
          ElMessage.error(error.message);
        }
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

        const result = await insertOrUpdateOrDeleteCategory({
          id: editForm.value.id,
          name: editForm.value.name,
          icon: editForm.value.icon,
          color: editForm.value.color,
          isDelete: 'N'
        });

        if (result) {
          ElMessage.success("分类更新成功");
          showEditDialog.value = false;
          // Refresh categories after update
          const response = await getCategoryData();
          categories.value = response.data;
        } else {
          ElMessage.error("更新分类失败");
        }
      } catch (error) {
        if (error.message) {
          ElMessage.error(error.message);
        }
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
            const result = await insertOrUpdateOrDeleteCategory({
              id: category.id,
              isDelete: 'Y'
            });

            if (result) {
              ElMessage.success("分类删除成功");
              // Refresh categories after deletion
              const response = await getCategoryData();
              categories.value = response.data;
            } else {
              ElMessage.error("删除分类失败");
            }
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

.form-row .el-input,
.form-row .el-color-picker,
.form-row .el-select,
.form-row .el-select .iconfont {
  width: 100px !important;
}

.add-category-form h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.category-management h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(45%, 1fr));
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.form-row .el-input,
  .form-row .el-color-picker,
  .form-row .el-select {
    width: 100px !important;
  }

@media (max-width: 768px) {
  .add-category-form,
  .category-management {
    padding: 12px;
  }
  
  .form-row {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
  }
  
  .form-row .el-form-item {
    flex: 0 0 auto;
    min-width: 100px;
  }
  
  .form-row .el-form-item__content {
    width: 100px;
  }
  
  .form-row .el-input,
  .form-row .el-color-picker,
  .form-row .el-select {
    width: 100px !important;
  }
  
  .form-row .el-form-item:last-child {
    margin-left: auto;
    min-width: 80px;
  }
  
  .category-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .category-actions {
    margin-top: 8px;
    justify-content: flex-end;
  }
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
  font-size: 14px;
  color: #303133;
  margin-right: 4px;
}

.category-count {
  font-size: 12px;
  color: #909399;
}

.category-actions {
  display: flex;
  gap: 4px;
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
</style>
