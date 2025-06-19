const state = {
  user: null
};

const mutations = {
  SET_USER(state, user) {
    state.user = user;
  }
};

export default {
  namespaced: true,
  state,
  mutations
};