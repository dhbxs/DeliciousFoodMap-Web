import { createStore } from "vuex";
import shops from "./modules/shops";
import categories from "./modules/categories";
import ui from "./modules/ui";

export default createStore({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {
    shops,
    categories,
    ui,
  },
});
