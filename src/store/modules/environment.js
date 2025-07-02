export default {
  namespaced: true,

  state: {
    config: {},
  },

  getters: {
    apiBaseUrl: (state) => {
      return state.config.API_BASE_URL || "http://localhost:8080";
    },

    amapKey: (state) => {
      return state.config.AMAP_KEY || "";
    },
  },

  mutations: {
    SET_CONFIG(state, config) {
      state.config = { ...config };
    },
  },

  actions: {
    async loadConfig({ commit }) {
      try {
        const response = await fetch("/config.json", {
          cache: "no-cache",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to load configuration: ${response.status} ${response.statusText}`
          );
        }

        const config = await response.json();
        commit("SET_CONFIG", config);
        return config;
      } catch (error) {
        console.error("Failed to load configuration:", error);

        const fallbackConfig = {
          API_BASE_URL: "http://localhost:8080",
          AMAP_KEY: "",
        };

        commit("SET_CONFIG", fallbackConfig);
        return fallbackConfig;
      }
    },
  },
};
