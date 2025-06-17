const state = {
  token: null,
  user: null
};

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token;
  },
  SET_USER(state, user) {
    state.user = user;
  }
};

export default {
  namespaced: true,
  state,
  mutations
};