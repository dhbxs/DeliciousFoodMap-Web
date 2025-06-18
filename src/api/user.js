import request from '@/utils/request'


// 登录
export function login(data) {
  return request({
    url: '/sys-user/login',
    method: 'post',
    data
  })
}

// 注册
export function register(data) {
  return request({
    url: '/sys-user/register',
    method: 'post',
    data
  })
}

// 退出
export function logout() {
  return request({
    url: '/sys-user/logout',
    method: 'post'
  })
}

// 获取验证码
export function getCode() {
  return request({
    url: '/captcha/getCaptcha.png',
    method: 'get',
    responseType: 'blob' // 指定响应类型为blob，用于处理图片流
  })
}