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

      <el-form-item label="分类" prop="category">
        <el-select
          v-model="form.category"
          placeholder="请选择分类"
          style="width: 100%"
          filterable
          allow-create
        >
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.name"
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
import { ref, computed, watch, nextTick } from "vue";
import { useStore } from "vuex";
import { ElMessage } from "element-plus";

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
    const categories = computed(
      () => store.getters["categories/allCategories"]
    );
    const tempCoordinates = computed(() => store.getters["ui/tempCoordinates"]);

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
        category: "",
        description: "",
        lat: null,
        lng: null,
      };

      if (formRef.value) {
        formRef.value.resetFields();
      }
    };

    // 加载编辑数据
    const loadEditData = () => {
      if (isEditing.value && editingShopId.value) {
        const shop = store.getters["shops/getShopById"](editingShopId.value);
        if (shop) {
          form.value = {
            name: shop.name,
            address: shop.address,
            category: shop.category,
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
            await store.dispatch("shops/updateShop", shopData);
            ElMessage.success("店铺更新成功");
          } else {
            // 添加店铺
            await store.dispatch("shops/addShop", shopData);
            ElMessage.success("店铺添加成功");

            // 如果分类不存在，自动添加
            const existingCategory = store.getters[
              "categories/getCategoryByName"
            ](form.value.category);
            if (!existingCategory) {
              try {
                await store.dispatch("categories/addCategory", {
                  name: form.value.category,
                  color: "#409eff",
                  icon: "🍽️",
                });
                ElMessage.success(`新分类"${form.value.category}"已自动添加`);
              } catch (error) {
                console.warn("自动添加分类失败:", error);
              }
            }
          }

          // 关闭表单
          handleClose();
          
          // 刷新店铺列表
          store.dispatch("shops/fetchShops");
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
  margin-top: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
