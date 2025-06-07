import request from '@/utils/request'

/**
 * 获取POI美食数据
 * 
 * @param {*} params {"pageNum": "1","pageSize": "100","keywords": "面","categoryId": "1928292724911722497,1928292724911722498"}
 * @returns 
 */
export function getCategoryData(data = {}) {
    return request({
        method: 'POST',
        url: '/poi-data/search',
        data: data
    })
}