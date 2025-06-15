<template>
  <el-dialog
    v-model="visible"
    :title="isEditing ? '编辑店铺' : '添加店铺'"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="店铺名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入店铺名称" clearable />
      </el-form-item>

      <el-form-item label="地址" prop="address">
        <el-input
          v-model="form.address"
          placeholder="请输入店铺地址"
          clearable
        />
      </el-form-item>

      <el-form-item label="分类" prop="categoryId">
        <el-select
          v-model="form.categoryId"
          placeholder="请选择分类"
          style="width: 100%"
          filterable
          allow-create
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          >
            <span>{{ category.icon }} {{ category.name }}</span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入店铺描述或备注"
        />
      </el-form-item>

      <el-form-item label="坐标">
        <el-row :gutter="10">
          <el-col :span="12">
            <el-input
              v-model.number="form.lat"
              placeholder="纬度"
              type="number"
              step="0.000001"
            />
          </el-col>
          <el-col :span="12">
            <el-input
              v-model.number="form.lng"
              placeholder="经度"
              type="number"
              step="0.000001"
            />
          </el-col>
        </el-row>
        <div class="coordinate-hint">
          <el-text size="small" type="info">
            可以在地图上点击选择位置，或手动输入坐标
          </el-text>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEditing ? "更新" : "添加" }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { useStore } from "vuex";
import { ElMessage } from "element-plus";
import categoryService from '@/services/CategoryService';
import shopService from '@/services/ShopService';

export default {
  name: "ShopForm",

  setup() {
    const store = useStore();
    const formRef = ref(null);
    const loading = ref(false);

    // 表单数据
    const form = ref({
      name: "",
      address: "",
      category: "",
      description: "",
      lat: null,
      lng: null,
    });

    // 计算属性
    const visible = computed({
      get: () => store.getters["ui/showShopForm"],
      set: (value) => {
        if (!value) {
          store.dispatch("ui/hideShopForm");
        }
      },
    });

    const isEditing = computed(() => store.getters["ui/isEditingShop"]);
    const editingShopId = computed(() => store.getters["ui/editingShopId"]);
    const categories = categoryService.categories;
    const tempCoordinates = computed(() => store.getters["ui/tempCoordinates"]);

    // Load categories on mount
    onMounted(async () => {
      await categoryService.getCategories();
    });

    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: "请输入店铺名称", trigger: "blur" },
        {
          min: 2,
          max: 50,
          message: "店铺名称长度在 2 到 50 个字符",
          trigger: "blur",
        },
      ],
      address: [
        { required: true, message: "请输入店铺地址", trigger: "blur" },
        {
          min: 5,
          max: 200,
          message: "地址长度在 5 到 200 个字符",
          trigger: "blur",
        },
      ],
      category: [
        { required: true, message: "请选择或输入分类", trigger: "change" },
      ],
      description: [
        { max: 500, message: "描述不能超过 500 个字符", trigger: "blur" },
      ],
    };

    // 重置表单
    const resetForm = () => {
      form.value = {
        name: "",
        address: "",
        categoryId: "",
        description: "",
        lat: null,
        lng: null,
      };

      if (formRef.value) {
        formRef.value.resetFields();
      }
    };

    // 加载编辑数据
    const loadEditData = async () => {
      if (isEditing.value && editingShopId.value) {
        const shop = await shopService.getShopById(editingShopId.value);
        if (shop) {
          form.value = {
            name: shop.name,
            address: shop.address,
            categoryId: shop.categoryId,
            description: shop.description,
            lat: shop.latitude || shop.lat,
            lng: shop.longitude || shop.lng,
          };
        }
      }
    };

    // 处理提交
    const handleSubmit = async () => {
      if (!formRef.value) return;

      try {
        await formRef.value.validate();

        // 验证坐标
        if (!form.value.lat || !form.value.lng) {
          ElMessage.error("请设置店铺位置坐标");
          return;
        }

        loading.value = true;

        const shopData = {
          name: form.value.name,
          address: form.value.address,
          category: form.value.category,
          description: form.value.description,
          lat: form.value.lat,
          lng: form.value.lng,
        };

        try {
          if (isEditing.value) {
            // 更新店铺
            shopData.id = editingShopId.value;
            await shopService.updateShop(shopData);
            ElMessage.success("店铺更新成功");
          } else {
            // 添加店铺
            await shopService.addShop(shopData);
            ElMessage.success("店铺添加成功");

            // 如果分类不存在，自动添加
            const existingCategory = categoryService.getCategoryByName(form.value.category);
            if (!existingCategory) {
              try {
                await categoryService.addCategory({
                  name: form.value.category,
                  color: "#409eff",
                  icon: "#food-icon-a-001-drink",
                });
                ElMessage.success(`新分类"${form.value.category}"已自动添加`);

                // 通知Vuex分类已更新
                store.dispatch("categories/notifyCategoryUpdate");
              } catch (error) {
                console.warn("自动添加分类失败:", error);
              }
            }
          }

          // 关闭表单
          handleClose();

          // 通知Vuex店铺数据已更新
          store.dispatch("shops/notifyShopDataUpdate");
        } catch (error) {
          ElMessage.error(error.message || (isEditing.value ? "更新店铺失败" : "添加店铺失败"));
        }
      } catch (validationError) {
        console.error("表单验证失败:", validationError);
      } finally {
        loading.value = false;
      }
    };

    // 处理关闭
    const handleClose = () => {
      resetForm();
      store.dispatch("ui/hideShopForm");
      store.commit("ui/CLEAR_TEMP_COORDINATES");
    };

    // 监听弹窗显示状态
    watch(visible, (newVal) => {
      if (newVal) {
        nextTick(() => {
          loadEditData();
          // 如果有临时坐标，使用它们
          if (tempCoordinates.value) {
            form.value.lat = tempCoordinates.value.lat;
            form.value.lng = tempCoordinates.value.lng;
          }
        });
      }
    });

    return {
      formRef,
      form,
      rules,
      visible,
      isEditing,
      categories,
      loading,
      handleSubmit,
      handleClose,
    };
  },
};
</script>

<style scoped>
.coordinate-hint {
  margin-top: var(--spacing-sm);
  font-size: 13px;
  color: var(--text-tertiary);
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding-top: var(--spacing-lg);
}

/* 移动端适配 */
:deep(.el-dialog) {
  margin: var(--spacing-lg);
  max-width: calc(100vw - 2 * var(--spacing-lg));
}

:deep(.el-dialog__header) {
  padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-lg);
  background: var(--bg-secondary);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
}

:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

:deep(.el-dialog__body) {
  padding: var(--spacing-xl);
  max-height: 60vh;
  overflow-y: auto;
}

:deep(.el-form-item) {
  margin-bottom: var(--spacing-lg);
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

:deep(.el-input__wrapper) {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

:deep(.el-input__wrapper):hover {
  box-shadow: var(--shadow-md);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

:deep(.el-textarea__inner) {
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: var(--radius-lg);
}

.dialog-footer .el-button {
  border-radius: var(--radius-lg);
  font-weight: 600;
  padding: var(--spacing-md) var(--spacing-xl);
  transition: all var(--transition-fast);
}

.dialog-footer .el-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* 移动端响应式 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    margin: var(--spacing-md);
    max-width: calc(100vw - 2 * var(--spacing-md));
    border-radius: var(--radius-xl);
  }

  :deep(.el-dialog__header) {
    padding: var(--spacing-lg);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }

  :deep(.el-dialog__title) {
    font-size: 16px;
  }

  :deep(.el-dialog__body) {
    padding: var(--spacing-lg);
    max-height: 50vh;
  }

  :deep(.el-form-item) {
    margin-bottom: var(--spacing-md);
  }

  :deep(.el-form-item__label) {
    font-size: 14px;
    width: auto !important;
    float: none;
    display: block;
    margin-bottom: 8px;
    text-align: left;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select) {
    width: 100%;
  }

  :deep(.el-col) {
    flex: 0 0 100%;
    max-width: 100%;
    margin-bottom: var(--spacing-sm);
  }

  :deep(.el-col:last-child) {
    margin-bottom: 0;
  }

  .dialog-footer {
    gap: var(--spacing-sm);
    flex-direction: column-reverse;
  }

  .dialog-footer .el-button {
    width: 100%;
    height: 44px;
    font-size: 15px;
    padding: 12px 16px;
  }

  .coordinate-hint {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  :deep(.el-dialog) {
    margin: var(--spacing-sm);
    max-width: calc(100vw - 2 * var(--spacing-sm));
    max-height: calc(100vh - 2 * var(--spacing-sm));
  }

  :deep(.el-dialog__header) {
    padding: var(--spacing-md);
  }

  :deep(.el-dialog__title) {
    font-size: 15px;
  }

  :deep(.el-dialog__body) {
    padding: var(--spacing-md);
    max-height: calc(100vh - 200px);
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    width: auto !important;
    float: none;
    display: block;
    margin-bottom: 8px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select) {
    width: 100%;
  }

  :deep(.el-col) {
    flex: 0 0 100%;
    max-width: 100%;
    margin-bottom: var(--spacing-xs);
  }

  :deep(.el-col:last-child) {
    margin-bottom: 0;
  }

  .dialog-footer .el-button {
    height: 44px;
    font-size: 14px;
    padding: 12px 16px;
  }
}
</style>
