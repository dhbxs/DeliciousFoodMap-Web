/**
 * Axios 二次封装
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'

const serverConfig = {
    localURL: process.env.VUE_APP_BACKEND_URL,
    useTokenAuthorization: true, // 开启Token认证
}

// 创建axios实例
const request = axios.create({
    // 通用请求地址前缀
    baseURL: serverConfig.localURL,
    // 超时时间，单位（毫秒）
    timeout: 10000,
    withCredentials: false
})

// 请求拦截器
request.interceptors.request.use(function (config) {
    // 在发送请求之前做什么
    if (serverConfig.useTokenAuthorization) {
        let user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
        if (user) {
            config.headers.authorization = "Bearer " + user.token;
        }
    }
    return config;
}, function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
});

// 响应拦截器
request.interceptors.response.use(function (response) {
    // 对响应数据做点什么
    if (response.data.code != "200") {
        if (response.data.code == "5000" || response.data.code == "5001" || response.data.code == "5002") {
            localStorage.removeItem("user");
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

export default request;