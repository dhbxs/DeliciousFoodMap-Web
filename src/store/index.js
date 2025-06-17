import { createStore } from "vuex";
import shops from "./modules/shops";
import categories from "./modules/categories";
import ui from "./modules/ui";
import user from "./modules/user"; // Add user module

export default createStore({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {
    shops,
    categories,
    ui,
    user, // Add user module
  },
});
