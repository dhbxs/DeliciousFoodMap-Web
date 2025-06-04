import request from '@/utils/request'

/**
 * 获取分类列表
 * 
 * @param {*} params 
 * @returns "{"code": 200, "message": "获取成功", "data": [{"id": 1, "name": "美食", "color": "#409eff", "icon": "🍽️}], "description": ""}""
}
"}]
 */
export function getCategoryData(params = {}) {
    return request({
        method: 'GET',
        url: '/category/get-all',
        params: params
    })
}