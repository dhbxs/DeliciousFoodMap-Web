// UI状态管理模块
export default {
  namespaced: true,

  state: {
    // 侧边栏状态
    sidebarCollapsed: false,

    // 弹窗状态
    showShopForm: false,
    showCategoryForm: false,

    // 地图状态
    mapCenter: [39.9042, 116.4074], // 北京天安门
    mapZoom: 12,

    // 加载状态
    loading: false,

    // 移动端检测
    isMobile: false,

    // 当前编辑的店铺ID
    editingShopId: null,

    // 当前编辑的分类ID
    editingCategoryId: null,

    // 临时坐标（用于添加新店铺）
    tempCoordinates: null,
  },

  getters: {
    // 侧边栏状态
    sidebarCollapsed: (state) => state.sidebarCollapsed,

    // 弹窗状态
    showShopForm: (state) => state.showShopForm,
    showCategoryForm: (state) => state.showCategoryForm,

    // 地图状态
    mapCenter: (state) => state.mapCenter,
    mapZoom: (state) => state.mapZoom,

    // 加载状态
    loading: (state) => state.loading,

    // 移动端状态
    isMobile: (state) => state.isMobile,

    // 编辑状态
    editingShopId: (state) => state.editingShopId,
    editingCategoryId: (state) => state.editingCategoryId,

    // 是否在编辑模式
    isEditingShop: (state) => state.editingShopId !== null,
    isEditingCategory: (state) => state.editingCategoryId !== null,

    // 临时坐标
    tempCoordinates: (state) => state.tempCoordinates,
  },

  mutations: {
    // 切换侧边栏
    TOGGLE_SIDEBAR(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },

    // 设置侧边栏状态
    SET_SIDEBAR_COLLAPSED(state, collapsed) {
      state.sidebarCollapsed = collapsed;
    },

    // 显示/隐藏店铺表单
    SET_SHOP_FORM_VISIBLE(state, visible) {
      state.showShopForm = visible;
    },

    // 显示/隐藏分类表单
    SET_CATEGORY_FORM_VISIBLE(state, visible) {
      state.showCategoryForm = visible;
    },

    // 设置地图中心
    SET_MAP_CENTER(state, center) {
      state.mapCenter = center;
    },

    // 设置地图缩放级别
    SET_MAP_ZOOM(state, zoom) {
      state.mapZoom = zoom;
    },

    // 设置加载状态
    SET_LOADING(state, loading) {
      state.loading = loading;
    },

    // 设置移动端状态
    SET_MOBILE(state, isMobile) {
      state.isMobile = isMobile;
    },

    // 设置编辑的店铺ID
    SET_EDITING_SHOP_ID(state, shopId) {
      state.editingShopId = shopId;
    },

    // 设置编辑的分类ID
    SET_EDITING_CATEGORY_ID(state, categoryId) {
      state.editingCategoryId = categoryId;
    },

    // 设置临时坐标
    SET_TEMP_COORDINATES(state, coordinates) {
      state.tempCoordinates = coordinates;
    },

    // 清除临时坐标
    CLEAR_TEMP_COORDINATES(state) {
      state.tempCoordinates = null;
    },
  },

  actions: {
    // 切换侧边栏
    toggleSidebar({ commit }) {
      commit("TOGGLE_SIDEBAR");
    },

    // 设置侧边栏状态
    setSidebarCollapsed({ commit }, collapsed) {
      commit("SET_SIDEBAR_COLLAPSED", collapsed);
    },

    // 显示店铺表单
    showShopForm({ commit }, shopId = null) {
      commit("SET_EDITING_SHOP_ID", shopId);
      commit("SET_SHOP_FORM_VISIBLE", true);
    },

    // 隐藏店铺表单
    hideShopForm({ commit }) {
      commit("SET_SHOP_FORM_VISIBLE", false);
      commit("SET_EDITING_SHOP_ID", null);
    },

    // 显示分类表单
    showCategoryForm({ commit }, categoryId = null) {
      commit("SET_EDITING_CATEGORY_ID", categoryId);
      commit("SET_CATEGORY_FORM_VISIBLE", true);
    },

    // 隐藏分类表单
    hideCategoryForm({ commit }) {
      commit("SET_CATEGORY_FORM_VISIBLE", false);
      commit("SET_EDITING_CATEGORY_ID", null);
    },

    // 设置地图状态
    setMapState({ commit }, { center, zoom }) {
      if (center) commit("SET_MAP_CENTER", center);
      if (zoom) commit("SET_MAP_ZOOM", zoom);
    },

    // 设置加载状态
    setLoading({ commit }, loading) {
      commit("SET_LOADING", loading);
    },

    // 检测移动端
    detectMobile({ commit }) {
      const isMobile = window.innerWidth <= 768;
      commit("SET_MOBILE", isMobile);

      // 移动端默认收起侧边栏
      if (isMobile) {
        commit("SET_SIDEBAR_COLLAPSED", true);
      }
    },

    // 响应店铺选择（更新地图状态）
    onShopSelected({ commit }, shopId) {
      // 这里可以添加当店铺被选中时需要执行的UI逻辑
      // 比如自动关闭移动端侧边栏等
      if (this.getters["ui/isMobile"]) {
        commit("SET_SIDEBAR_COLLAPSED", true);
      }
    },
  },
};
