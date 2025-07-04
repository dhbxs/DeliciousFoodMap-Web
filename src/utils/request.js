/**
 * Axios 二次封装
 */
import axios from "axios";
import { ElMessage } from "element-plus";
import store from "@/store"; // Import Vuex store
import configService from "@/services/configService";

const serverConfig = {
  localURL: null,
  useTokenAuthorization: true, // 开启Token认证
};

// 创建axios实例
const request = axios.create({
  // 超时时间，单位（毫秒）
  timeout: 10000,
  withCredentials: true,
});

export async function updateRequestConfig() {
  try {
    const backendUrl = await configService.get("APP_BACKEND_URL");
    if (backendUrl) {
      request.defaults.baseURL = backendUrl;
      serverConfig.localURL = backendUrl;
      console.log("Updated axios baseURL to:", backendUrl);
    } else {
      const defaultUrl = "http://localhost:8081/delicious-food-map";
      request.defaults.baseURL = defaultUrl;
      serverConfig.localURL = defaultUrl;
      console.log("Using default axios baseURL:", defaultUrl);
    }
  } catch (error) {
    console.error("Failed to update axios baseURL:", error);
    const defaultUrl = "http://localhost:8081/delicious-food-map";
    request.defaults.baseURL = defaultUrl;
    serverConfig.localURL = defaultUrl;
  }
}

// 请求拦截器
request.interceptors.request.use(
  function (config) {
    console.log("request url: ", config.url);
    if (serverConfig.useTokenAuthorization && config.requireAuth == true) {
      const user = store.state.user.user;
      let token = user ? user.jwtToken : null;
      if (token) {
        config.headers.authorization = "Bearer " + token;
      }
    }
    return config;
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  function (response) {
    // 对响应数据做点什么

    // 如果是blob类型（如图片流），直接返回数据
    if (response.config.responseType === "blob") {
      return response.data;
    }
    // 处理普通JSON响应
    if (response.data.code != "200") {
      if (
        response.data.code == "5000" ||
        response.data.code == "5001" ||
        response.data.code == "5002"
      ) {
        // 清除 Vuex 中的用户数据 (使用命名空间)
        store.commit("user/SET_USER", null);
        ElMessage({
          showClose: true,
          message: response.data.code + " | " + response.data.message,
          type: "error",
        });
      }
    }
    return response.data;
  },
  function (error) {
    // 对响应错误做点什么
    return Promise.reject(error);
  }
);

export default request;
