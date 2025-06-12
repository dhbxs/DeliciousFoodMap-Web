// 分类组件交互管理模块 - 不存储业务数据，只管理组件间交互
export default {
  namespaced: true,

  state: {
    // 当前选中的分类（用于组件间通信）
    selectedCategories: [],

    // 分类相关的UI状态
    categoryFilterExpanded: true,

    // 分类操作触发标识（用于通知其他组件刷新）
    categoryUpdateTrigger: 0,
  },

  getters: {
    // 获取选中的分类
    selectedCategories: (state) => state.selectedCategories,

    // 分类筛选器是否展开
    categoryFilterExpanded: (state) => state.categoryFilterExpanded,

    // 分类更新触发器（用于监听变化）
    categoryUpdateTrigger: (state) => state.categoryUpdateTrigger,
  },

  mutations: {
    // 设置选中的分类
    SET_SELECTED_CATEGORIES(state, categories) {
      state.selectedCategories = [...categories];
    },

    // 切换分类选择
    TOGGLE_CATEGORY(state, categoryName) {
      const index = state.selectedCategories.indexOf(categoryName);
      if (index > -1) {
        state.selectedCategories.splice(index, 1);
      } else {
        state.selectedCategories.push(categoryName);
      }
    },

    // 清空分类选择
    CLEAR_CATEGORY_SELECTION(state) {
      state.selectedCategories = [];
    },

    // 设置分类筛选器展开状态
    SET_CATEGORY_FILTER_EXPANDED(state, expanded) {
      state.categoryFilterExpanded = expanded;
    },

    // 触发分类更新通知
    TRIGGER_CATEGORY_UPDATE(state) {
      state.categoryUpdateTrigger += 1;
    },
  },

  actions: {
    // 选择分类（触发店铺列表更新）
    selectCategories({ commit, dispatch }, categories) {
      commit("SET_SELECTED_CATEGORIES", categories);
      // 通知店铺模块更新筛选
      dispatch("shops/onCategoryFilterChanged", categories, { root: true });
    },

    // 切换单个分类选择
    toggleCategory({ commit, dispatch, state }, categoryName) {
      commit("TOGGLE_CATEGORY", categoryName);
      // 通知店铺模块更新筛选
      dispatch("shops/onCategoryFilterChanged", state.selectedCategories, { root: true });
    },

    // 清空分类选择
    clearCategorySelection({ commit, dispatch }) {
      commit("CLEAR_CATEGORY_SELECTION");
      // 通知店铺模块清空筛选
      dispatch("shops/onCategoryFilterChanged", [], { root: true });
    },

    // 全选分类
    selectAllCategories({ commit, dispatch }, allCategoryNames) {
      commit("SET_SELECTED_CATEGORIES", allCategoryNames);
      // 通知店铺模块更新筛选
      dispatch("shops/onCategoryFilterChanged", allCategoryNames, { root: true });
    },

    // 切换分类筛选器展开状态
    toggleCategoryFilter({ commit }, expanded) {
      commit("SET_CATEGORY_FILTER_EXPANDED", expanded);
    },

    // 通知分类数据已更新（由组件调用）
    notifyCategoryUpdate({ commit }) {
      commit("TRIGGER_CATEGORY_UPDATE");
    },
  },
};
