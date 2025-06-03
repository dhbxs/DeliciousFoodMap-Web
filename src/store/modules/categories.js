// 美食分类管理模块
export default {
  namespaced: true,

  state: {
    categories: [
      { id: 1, name: "烧烤", color: "#ff6b6b", icon: "🍖" },
      { id: 2, name: "火锅", color: "#ff8787", icon: "🍲" },
      { id: 3, name: "小吃", color: "#ffa8a8", icon: "🍡" },
      { id: 4, name: "甜品", color: "#ffc9c9", icon: "🍰" },
      { id: 5, name: "面食", color: "#ffe0e0", icon: "🍜" },
      { id: 6, name: "川菜", color: "#ff5722", icon: "🌶️" },
      { id: 7, name: "粤菜", color: "#4caf50", icon: "🥘" },
      { id: 8, name: "日料", color: "#2196f3", icon: "🍣" },
      { id: 9, name: "西餐", color: "#9c27b0", icon: "🍝" },
      { id: 10, name: "咖啡", color: "#795548", icon: "☕" },
    ],
  },

  getters: {
    // 获取所有分类
    allCategories: (state) => state.categories,

    // 根据ID获取分类
    getCategoryById: (state) => (id) => {
      return state.categories.find((category) => category.id === id);
    },

    // 根据名称获取分类
    getCategoryByName: (state) => (name) => {
      return state.categories.find((category) => category.name === name);
    },

    // 获取分类名称列表
    categoryNames: (state) => state.categories.map((cat) => cat.name),

    // 获取分类总数
    categoriesCount: (state) => state.categories.length,
  },

  mutations: {
    // 添加分类
    ADD_CATEGORY(state, category) {
      const newCategory = {
        ...category,
        id: Date.now(), // 简单的ID生成
        color: category.color || "#409eff", // 默认颜色
        icon: category.icon || "🍽️", // 默认图标
      };
      state.categories.push(newCategory);
    },

    // 更新分类
    UPDATE_CATEGORY(state, updatedCategory) {
      const index = state.categories.findIndex(
        (cat) => cat.id === updatedCategory.id
      );
      if (index !== -1) {
        state.categories.splice(index, 1, updatedCategory);
      }
    },

    // 删除分类
    DELETE_CATEGORY(state, categoryId) {
      const index = state.categories.findIndex((cat) => cat.id === categoryId);
      if (index !== -1) {
        state.categories.splice(index, 1);
      }
    },
  },

  actions: {
    // 添加分类
    addCategory({ commit, getters }, categoryData) {
      // 检查分类名称是否已存在
      const existingCategory = getters.getCategoryByName(categoryData.name);
      if (existingCategory) {
        throw new Error("分类名称已存在");
      }
      commit("ADD_CATEGORY", categoryData);
    },

    // 更新分类
    updateCategory({ commit, getters }, categoryData) {
      // 检查分类名称是否与其他分类重复
      const existingCategory = getters.getCategoryByName(categoryData.name);
      if (existingCategory && existingCategory.id !== categoryData.id) {
        throw new Error("分类名称已存在");
      }
      commit("UPDATE_CATEGORY", categoryData);
    },

    // 删除分类
    deleteCategory({ commit, rootGetters }, categoryId) {
      // 检查是否有店铺使用此分类
      const shops = rootGetters["shops/allShops"];
      const category = rootGetters["categories/getCategoryById"](categoryId);

      if (category) {
        const shopsUsingCategory = shops.filter(
          (shop) => shop.category === category.name
        );
        if (shopsUsingCategory.length > 0) {
          throw new Error(
            `无法删除分类"${category.name}"，还有${shopsUsingCategory.length}个店铺正在使用此分类`
          );
        }
      }

      commit("DELETE_CATEGORY", categoryId);
    },
  },
};
