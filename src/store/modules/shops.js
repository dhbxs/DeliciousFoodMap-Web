// 店铺组件交互管理模块 - 不存储业务数据，只管理组件间交互
export default {
  namespaced: true,

  state: {
    // 当前选中的店铺ID（用于组件间通信）
    selectedShopId: null,

    // 店铺相关的UI状态
    shopListRefreshTrigger: 0,

    // 当前的分类筛选（从分类模块接收）
    currentCategoryFilter: [],

    // 地图相关状态
    mapSyncTrigger: 0,
  },

  getters: {
    // 获取选中的店铺ID
    selectedShopId: (state) => state.selectedShopId,

    // 店铺列表刷新触发器
    shopListRefreshTrigger: (state) => state.shopListRefreshTrigger,

    // 当前分类筛选
    currentCategoryFilter: (state) => state.currentCategoryFilter,

    // 地图同步触发器
    mapSyncTrigger: (state) => state.mapSyncTrigger,
  },

  mutations: {
    // 设置选中的店铺ID
    SET_SELECTED_SHOP_ID(state, shopId) {
      state.selectedShopId = shopId;
    },

    // 触发店铺列表刷新
    TRIGGER_SHOP_LIST_REFRESH(state) {
      state.shopListRefreshTrigger += 1;
    },

    // 设置当前分类筛选
    SET_CURRENT_CATEGORY_FILTER(state, categories) {
      state.currentCategoryFilter = [...categories];
    },

    // 触发地图同步
    TRIGGER_MAP_SYNC(state) {
      state.mapSyncTrigger += 1;
    },
  },

  actions: {
    // 选择店铺（触发地图和其他组件更新）
    selectShop({ commit, dispatch }, shopId) {
      commit("SET_SELECTED_SHOP_ID", shopId);

      // 通知地图组件更新中心点
      dispatch("ui/onShopSelected", shopId, { root: true });

      // 触发地图同步
      commit("TRIGGER_MAP_SYNC");
    },

    // 清除店铺选择
    clearShopSelection({ commit }) {
      commit("SET_SELECTED_SHOP_ID", null);
    },

    // 响应分类筛选变化（由分类模块调用）
    onCategoryFilterChanged({ commit }, categories) {
      commit("SET_CURRENT_CATEGORY_FILTER", categories);
      // 可以在这里添加其他需要响应分类变化的逻辑
    },

    // 通知店铺数据已更新（由组件调用）
    notifyShopDataUpdate({ commit }) {
      commit("TRIGGER_SHOP_LIST_REFRESH");
    },

    // 通知需要刷新店铺列表
    requestShopListRefresh({ commit }) {
      commit("TRIGGER_SHOP_LIST_REFRESH");
    },
  },
};
