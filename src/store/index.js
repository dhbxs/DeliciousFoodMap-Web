import { createStore } from "vuex";
import shops from "./modules/shops";
import categories from "./modules/categories";
import ui from "./modules/ui";
import user from "./modules/user";
import createPersistedState from 'vuex-persistedstate';

export default createStore({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {
    shops,
    categories,
    ui,
    user,
  },
  plugins: [
    // veux持久化配置
    createPersistedState({
      storage: window.localStorage,
      key: 'delicious-food-map',
      paths: ['user', 'ui']
    })
  ],
});
