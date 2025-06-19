const state = {
  user: null
};

const mutations = {
  SET_USER(state, user) {
    state.user = user;
  },
  CLEAR_USER(state) {
    state.user = null;
  }
};

export default {
  namespaced: true,
  state,
  mutations
};