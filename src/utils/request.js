/**
 * Axios 二次封装
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'
import store from '@/store' // Import Vuex store

const serverConfig = {
    localURL: process.env.VUE_APP_BACKEND_URL,
    useTokenAuthorization: true, // 开启Token认证
}

// 白名单，不添加token的请求地址
const whiteList = [
    '/captcha/getCaptcha.png',
    '/sys-user/login',
    '/sys-user/register',
]

const isInWhiteList = (url) => {
    return whiteList.includes(url);
}

// 创建axios实例
const request = axios.create({
    // 通用请求地址前缀
    baseURL: serverConfig.localURL,
    // 超时时间，单位（毫秒）
    timeout: 10000,
    withCredentials: true
})

// 请求拦截器
request.interceptors.request.use(function (config) {
    console.log("request url: ", config.url);

    if (isInWhiteList(config.url)) {
        return config
    }

    if (serverConfig.useTokenAuthorization) {
        // 优先从 Vuex 获取 token
        const token = store.state.user.user.jwtToken;
        if (token) {
            config.headers.authorization = "Bearer " + token;
        } else {
            // 回退到 localStorage 获取 token
            let user = localStorage.getItem("user");            
            config.headers.authorization = "Bearer " + user.jwtToken;
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
    
    // 如果是blob类型（如图片流），直接返回数据
    if (response.config.responseType === 'blob') {
        return response.data;
    }
    // 处理普通JSON响应
    if (response.data.code != "200") {
        if (response.data.code == "5000" || response.data.code == "5001" || response.data.code == "5002") {
            localStorage.removeItem("user");
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

export default request;