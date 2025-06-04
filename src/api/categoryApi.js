import request from '@/utils/request'

/**
 * 获取分类列表
 * 
 * @param {*} params 
 * @returns 
 */
export function getCategoryData(params = {}) {
    return request({
        method: 'POST',
        url: '/category/get-all',
        data: params
    })
}