/**
 * Axios 二次封装
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'
import store from '@/store' // Import Vuex store

// Get configuration from environment store
const getServerConfig = () => {
    return {
        localURL: store.getters['environment/apiBaseUrl'],
        timeout: 10000,
        useTokenAuthorization: true, // 开启Token认证
    };
};

// 创建axios
const createAxiosInstance = () => {
    const config = getServerConfig();
    return axios.create({
        // 通用请求地址前缀
        baseURL: config.localURL,
        timeout: config.timeout,
        withCredentials: true
    });
};

// 初始化请求实例
let request = createAxiosInstance();



// Function to reinitialize request instance with updated configuration
export const reinitializeRequest = () => {
    request = createAxiosInstance();

    // Re-apply interceptors
    setupInterceptors();

    console.log('Request instance reinitialized with updated configuration');
};

// Function to setup interceptors (extracted for reuse)
const setupInterceptors = () => {
    // Clear existing interceptors
    request.interceptors.request.clear();
    request.interceptors.response.clear();

    // Re-apply request interceptor
    request.interceptors.request.use(function (config) {
        console.log("request url: ", config.url);
        const serverConfig = getServerConfig();
        if (serverConfig.useTokenAuthorization && config.requireAuth == true) {
            const user = store.state.user.user;
            let token = user ? user.jwtToken : null;
            if (token) {
                config.headers.authorization = "Bearer " + token;
            }
        }
        return config;
    }, function (error) {
        // 对请求错误做些什么
        return Promise.reject(error);
    });

    // Re-apply response interceptor
    request.interceptors.response.use(function (response) {
        // 对响应数据做点什么

        // 如果是blob类型（如图片流），直接返回数据
        if (response.config.responseType === 'blob') {
            return response.data;
        }
        // 处理普通JSON响应
        if (response.data.code != "200") {
            if (response.data.code == "5000" || response.data.code == "5001" || response.data.code == "5002") {
                // 清除 Vuex 中的用户数据 (使用命名空间)
                store.commit('user/SET_USER', null);
                ElMessage({
                    showClose: true,
                    message: response.data.code + " | " + response.data.message,
                    type: 'error',
                })
            }
        }
        return response.data;
    }, function (error) {
        // 对响应错误做点什么
        return Promise.reject(error);
    });
};

// Initialize interceptors
setupInterceptors();

export default request;