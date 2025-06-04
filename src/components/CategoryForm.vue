<template>
  <el-dialog
    v-model="visible"
    title="分类管理"
    width="600px"
    @close="handleClose"
  >
    <!-- 添加新分类表单 -->
    <div class="add-category-form">
      <h4>添加新分类</h4>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        inline
        @submit.prevent="handleAddCategory"
      >
        <el-form-item prop="name">
          <el-input
            v-model="form.name"
            placeholder="分类名称"
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item prop="icon">
          <el-input
            v-model="form.icon"
            placeholder="图标"
            style="width: 80px"
          />
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
              {{ category.icon }}
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
          <el-input v-model="editForm.icon" />
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
import { getCategoryData } from "../api/categoryApi";

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
      icon: "🍽️",
      color: "#409eff",
    });

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
        icon: "🍽️",
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

        await store.dispatch("categories/addCategory", {
          name: form.value.name,
          icon: form.value.icon,
          color: form.value.color,
        });

        ElMessage.success("分类添加成功");
        resetForm();
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

        await store.dispatch("categories/updateCategory", {
          id: editForm.value.id,
          name: editForm.value.name,
          icon: editForm.value.icon,
          color: editForm.value.color,
        });

        ElMessage.success("分类更新成功");
        showEditDialog.value = false;
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
            await store.dispatch("categories/deleteCategory", category.id);
            ElMessage.success("分类删除成功");
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
}

.category-management h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
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
