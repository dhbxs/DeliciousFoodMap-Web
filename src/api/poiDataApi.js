import request from '@/utils/request'

/**
 * 获取POI美食数据
 * 
 * @param {*} params {"pageNum": "1","pageSize": "100","keywords": "面","categoryId": "1928292724911722497,1928292724911722498"}
 * @returns 
 */
export function getPoiData(data = {}) {
    return request({
        method: 'POST',
        url: '/poi-data/search',
        data: data
    })
}

/**
 * 获取POI美食数据
 * 
 * @param {*} params {"id": "111","name": "闻人敬彪","address": "山西省 济都市 永昌县 忻栋9号 5号房间","description": "高和就就片市如参查。","categoryId": "1928292724911722497","longitude": "-150.7259","latitude": "47.4496","creator": "sed in consequat eu","photo": "https://loremflickr.com/400/400?lock=6811217164872013","isDelete": "N"}
 * @returns 
 */
export function insertOrUpdateOrDeleteData(data = {}) {
    return request({
        method: 'POST',
        url: '/poi-data/insert-or-update-or-delete',
        data: data
    })
}