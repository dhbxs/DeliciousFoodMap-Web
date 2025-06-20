import request from '@/utils/request'

/**
 * 获取分类列表
 * 
 * @param {*} params 
 * @returns "{"code": "200","message": "OK","description": "","data": [{"id": "1928292724911722497","name": "粤菜馆","displayName": "粤菜馆","color": "#dc2626","icon": "#food-icon-a-010-food","isDelete": "N"}]}"
 */
export function getCategoryData(params = {}) {
    return request({
        method: 'POST',
        url: '/category/get-all',
        params: params,
        requireAuth: false
    })
}

/**
 * 增删改分类数据接口
 * 
 * 有ID则更新 无则ID或ID不存在则新增
 * isDelete 值为Y则删除 值为空或值为N则不删除
 * 
 * @param {*} params "{"id": "111","name": "小吃","displayName": "小小吃","color": "#fff","icon": "#food-icon-a-010-food","isDelete": "N"}"
 * @returns boolean true/false
 */
export function insertOrUpdateOrDeleteCategory(data = {}) {
    return request({
        method: 'POST',
        url: '/category/insert-or-update-or-delete',
        data: data,
        requireAuth: true
    })
}