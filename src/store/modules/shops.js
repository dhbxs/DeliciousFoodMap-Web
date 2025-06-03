// 美食店铺管理模块
export default {
  namespaced: true,

  state: {
    shops: [
      // 示例数据
      {
        id: 1,
        name: "老北京炸酱面",
        address: "北京市朝阳区三里屯路12号",
        category: "面食",
        description: "正宗老北京炸酱面，传统手工制作",
        lat: 39.9042,
        lng: 116.4074,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        name: "川味火锅",
        address: "北京市海淀区中关村大街1号",
        category: "火锅",
        description: "正宗四川火锅，麻辣鲜香",
        lat: 39.9889,
        lng: 116.3058,
        createdAt: new Date().toISOString(),
      },
    ],
    selectedShop: null,
    filteredCategories: [], // 当前筛选的分类
  },

  getters: {
    // 获取所有店铺
    allShops: (state) => state.shops,

    // 根据分类筛选店铺
    filteredShops: (state) => {
      if (state.filteredCategories.length === 0) {
        return state.shops;
      }
      return state.shops.filter((shop) =>
        state.filteredCategories.includes(shop.category)
      );
    },

    // 获取选中的店铺
    selectedShop: (state) => state.selectedShop,

    // 根据ID获取店铺
    getShopById: (state) => (id) => {
      return state.shops.find((shop) => shop.id === id);
    },

    // 获取店铺总数
    shopsCount: (state) => state.shops.length,
  },

  mutations: {
    // 添加店铺
    ADD_SHOP(state, shop) {
      const newShop = {
        ...shop,
        id: Date.now(), // 简单的ID生成
        createdAt: new Date().toISOString(),
      };
      state.shops.push(newShop);
    },

    // 更新店铺
    UPDATE_SHOP(state, updatedShop) {
      const index = state.shops.findIndex((shop) => shop.id === updatedShop.id);
      if (index !== -1) {
        state.shops.splice(index, 1, {
          ...updatedShop,
          updatedAt: new Date().toISOString(),
        });
      }
    },

    // 删除店铺
    DELETE_SHOP(state, shopId) {
      const index = state.shops.findIndex((shop) => shop.id === shopId);
      if (index !== -1) {
        state.shops.splice(index, 1);
      }
    },

    // 设置选中的店铺
    SET_SELECTED_SHOP(state, shop) {
      state.selectedShop = shop;
    },

    // 设置分类筛选
    SET_FILTERED_CATEGORIES(state, categories) {
      state.filteredCategories = categories;
    },

    // 清空筛选
    CLEAR_FILTERS(state) {
      state.filteredCategories = [];
    },
  },

  actions: {
    // 添加店铺
    addShop({ commit }, shopData) {
      commit("ADD_SHOP", shopData);
    },

    // 更新店铺
    updateShop({ commit }, shopData) {
      commit("UPDATE_SHOP", shopData);
    },

    // 删除店铺
    deleteShop({ commit }, shopId) {
      commit("DELETE_SHOP", shopId);
    },

    // 选择店铺
    selectShop({ commit }, shop) {
      commit("SET_SELECTED_SHOP", shop);
    },

    // 清除选择
    clearSelection({ commit }) {
      commit("SET_SELECTED_SHOP", null);
    },

    // 设置分类筛选
    setFilteredCategories({ commit }, categories) {
      commit("SET_FILTERED_CATEGORIES", categories);
    },

    // 清空筛选
    clearFilters({ commit }) {
      commit("CLEAR_FILTERS");
    },
  },
};
