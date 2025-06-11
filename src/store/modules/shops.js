// 美食店铺管理模块
import { getPoiData, insertOrUpdateOrDeleteData } from '@/api/poiDataApi'

export default {
  namespaced: true,

  state: {
    shops: [],
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
    // 设置店铺列表
    SET_SHOPS(state, shops) {
      state.shops = shops;
    },
    
    // 添加店铺
    ADD_SHOP(state, shop) {
      state.shops.push(shop);
    },

    // 更新店铺
    UPDATE_SHOP(state, updatedShop) {
      const index = state.shops.findIndex((shop) => shop.id === updatedShop.id);
      if (index !== -1) {
        state.shops.splice(index, 1, updatedShop);
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
    // 获取所有店铺
    async fetchShops({ commit }, params = {}) {
      console.log("params",params);
      try {
        const response = await getPoiData({
          pageNum: params.pageNum || 1,
          pageSize: params.pageSize || 100,
          ...params
        });
        
        if (Array.isArray(response.data?.records)) {
          commit("SET_SHOPS", response.data.records);
          return response.data;
        } else if (Array.isArray(response.data)) {
          commit("SET_SHOPS", response.data);
          return { records: response.data, total: response.data.length };
        }
        return { records: [], total: 0 };
      } catch (error) {
        console.error("获取店铺列表失败:", error);
        return { records: [], total: 0 };
      }
    },

    // 添加店铺
    async addShop({ commit }, shopData) {
      try {
        // 准备API所需的数据格式
        const apiData = {
          name: shopData.name,
          address: shopData.address,
          description: shopData.description || "",
          category: shopData.category,
          longitude: shopData.lng,
          latitude: shopData.lat,
          isDelete: "N"
        };
        
        const response = await insertOrUpdateOrDeleteData(apiData);
        if (response.code === "200") {
          // 如果后端返回了完整的店铺数据，使用它
          if (response.data) {
            commit("ADD_SHOP", response.data);
            return response.data;
          } else {
            // 否则使用我们发送的数据加上一个临时ID
            const newShop = {
              ...shopData,
              id: response.data?.id || Date.now(), // 使用后端返回的ID或生成临时ID
              createdTime: new Date().toISOString(),
            };
            commit("ADD_SHOP", newShop);
            return newShop;
          }
        } else {
          throw new Error(response.message || "添加店铺失败");
        }
      } catch (error) {
        console.error("添加店铺失败:", error);
        throw error;
      }
    },

    // 更新店铺
    async updateShop({ commit }, shopData) {
      try {
        // 准备API所需的数据格式
        const apiData = {
          id: shopData.id,
          name: shopData.name,
          address: shopData.address,
          description: shopData.description || "",
          category: shopData.category,
          longitude: shopData.lng,
          latitude: shopData.lat,
          isDelete: "N"
        };
        
        const response = await insertOrUpdateOrDeleteData(apiData);
        if (response.code === "200") {
          // 如果后端返回了完整的店铺数据，使用它
          if (response.data) {
            commit("UPDATE_SHOP", response.data);
            return response.data;
          } else {
            // 否则使用我们发送的数据
            const updatedShop = {
              ...shopData,
              updatedTime: new Date().toISOString(),
            };
            commit("UPDATE_SHOP", updatedShop);
            return updatedShop;
          }
        } else {
          throw new Error(response.message || "更新店铺失败");
        }
      } catch (error) {
        console.error("更新店铺失败:", error);
        throw error;
      }
    },

    // 删除店铺
    async deleteShop({ commit }, shopId) {
      try {
        // 准备API所需的数据格式
        const apiData = {
          id: shopId,
          isDelete: "Y"
        };
        
        const response = await insertOrUpdateOrDeleteData(apiData);
        if (response.code === "200") {
          commit("DELETE_SHOP", shopId);
          return true;
        } else {
          throw new Error(response.message || "删除店铺失败");
        }
      } catch (error) {
        console.error("删除店铺失败:", error);
        throw error;
      }
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
