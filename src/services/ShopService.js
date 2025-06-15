import { ref, reactive, computed } from 'vue'
import { getPoiData, insertOrUpdateOrDeleteData } from '@/api/poiDataApi'

/**
 * Shop Service - Manages shop data without storing in Vuex
 * Provides reactive data and methods for shop operations
 */
class ShopService {
  constructor() {
    // Reactive data
    this.shops = ref([])
    this.loading = ref(false)
    this.error = ref(null)
    this.selectedShop = ref(null)
    
    // Filter state
    this.filteredCategories = ref([])
    this.searchKeyword = ref('')
    this.searchResults = ref([])
    
    // Cache management
    this.cache = reactive({
      data: null,
      timestamp: null,
      ttl: 2 * 60 * 1000 // 2 minutes cache for shops
    })

    // Computed properties
    this.filteredShops = computed(() => {
      if (this.filteredCategories.value.length === 0) {
        return this.shops.value
      }
      return this.shops.value.filter(shop =>
        this.filteredCategories.value.includes(shop.category)
      )
    })

    this.displayShops = computed(() => {
      if (this.searchKeyword.value.trim()) {
        return this.searchResults.value
      }
      return this.filteredShops.value
    })
  }

  /**
   * Get all shops with caching
   * @param {Object} params - Query parameters
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Object>} Shop data with records and total
   */
  async getShops(params = {}, forceRefresh = false) {
    const { pageNum = 1, pageSize = 100, ...otherParams } = params
    
    // Check cache validity
    const now = Date.now()
    const isCacheValid = this.cache.data && 
                        this.cache.timestamp && 
                        (now - this.cache.timestamp) < this.cache.ttl

    if (!forceRefresh && isCacheValid && Object.keys(otherParams).length === 0) {
      this.shops.value = this.cache.data.records || []
      return this.cache.data
    }

    try {
      this.loading.value = true
      this.error.value = null

      const response = await getPoiData({
        pageNum,
        pageSize,
        ...otherParams
      })

      let resultData = { records: [], total: 0 }
      
      if (Array.isArray(response.data?.records)) {
        resultData = response.data
      } else if (Array.isArray(response.data)) {
        resultData = {
          records: response.data,
          total: response.data.length
        }
      }

      // Normalize shop data before updating reactive data
      const normalizedShops = this.normalizeShopsData(resultData.records)

      // Update reactive data
      this.shops.value = normalizedShops
      
      // Update cache only for basic queries
      if (Object.keys(otherParams).length === 0) {
        this.cache.data = resultData
        this.cache.timestamp = now
      }

      return resultData
    } catch (error) {
      this.error.value = error.message || '获取店铺列表失败'
      console.error('ShopService.getShops error:', error)
      return { records: [], total: 0 }
    } finally {
      this.loading.value = false
    }
  }

  /**
   * Search shops by keyword
   * @param {string} keyword - Search keyword
   * @returns {Promise<Array>} Search results
   */
  async searchShops(keyword) {
    if (!keyword.trim()) {
      this.searchResults.value = []
      this.searchKeyword.value = ''
      return []
    }

    try {
      this.searchKeyword.value = keyword
      
      const response = await getPoiData({
        pageNum: 1,
        pageSize: 100,
        keywords: keyword
      })

      let results = []
      if (Array.isArray(response.data?.records)) {
        results = response.data.records
      } else if (Array.isArray(response.data)) {
        results = response.data
      }

      // Normalize search results
      const normalizedResults = this.normalizeShopsData(results)

      this.searchResults.value = normalizedResults
      return normalizedResults
    } catch (error) {
      this.error.value = error.message || '搜索失败'
      console.error('ShopService.searchShops error:', error)
      this.searchResults.value = []
      return []
    }
  }

  /**
   * Clear search results
   */
  clearSearch() {
    this.searchKeyword.value = ''
    this.searchResults.value = []
  }

  /**
   * Add a new shop
   * @param {Object} shopData - Shop data
   * @returns {Promise<Object>} Created shop data
   */
  async addShop(shopData) {
    try {
      this.loading.value = true
      this.error.value = null

      const apiData = {
        name: shopData.name,
        address: shopData.address,
        description: shopData.description || "",
        categoryId: shopData.categoryId,
        longitude: shopData.lng,
        latitude: shopData.lat,
        isDelete: "N"
      }

      const response = await insertOrUpdateOrDeleteData(apiData)
      
      if (response.code === "200") {
        // Refresh shops after adding
        await this.getShops({}, true)
        
        const newShop = response.data || {
          ...shopData,
          id: response.data?.id || Date.now(),
          createdTime: new Date().toISOString(),
        }
        
        return newShop
      } else {
        throw new Error(response.message || "添加店铺失败")
      }
    } catch (error) {
      this.error.value = error.message || '添加店铺失败'
      console.error('ShopService.addShop error:', error)
      throw error
    } finally {
      this.loading.value = false
    }
  }

  /**
   * Update an existing shop
   * @param {Object} shopData - Shop data with id
   * @returns {Promise<Object>} Updated shop data
   */
  async updateShop(shopData) {
    try {
      this.loading.value = true
      this.error.value = null

      const apiData = {
        id: shopData.id,
        name: shopData.name,
        address: shopData.address,
        description: shopData.description || "",
        categoryId: shopData.categoryId,
        longitude: shopData.lng,
        latitude: shopData.lat,
        isDelete: "N"
      }

      const response = await insertOrUpdateOrDeleteData(apiData)
      
      if (response.code === "200") {
        // Refresh shops after updating
        await this.getShops({}, true)
        
        const updatedShop = response.data || {
          ...shopData,
          updatedTime: new Date().toISOString(),
        }
        
        return updatedShop
      } else {
        throw new Error(response.message || "更新店铺失败")
      }
    } catch (error) {
      this.error.value = error.message || '更新店铺失败'
      console.error('ShopService.updateShop error:', error)
      throw error
    } finally {
      this.loading.value = false
    }
  }

  /**
   * Delete a shop
   * @param {string} shopId - Shop ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteShop(shopId) {
    try {
      this.loading.value = true
      this.error.value = null

      const response = await insertOrUpdateOrDeleteData({
        id: shopId,
        isDelete: "Y"
      })
      
      if (response.code === "200") {
        // Refresh shops after deletion
        await this.getShops({}, true)
        
        // Clear selection if deleted shop was selected
        if (this.selectedShop.value?.id === shopId) {
          this.selectedShop.value = null
        }
        
        return true
      } else {
        throw new Error(response.message || "删除店铺失败")
      }
    } catch (error) {
      this.error.value = error.message || '删除店铺失败'
      console.error('ShopService.deleteShop error:', error)
      throw error
    } finally {
      this.loading.value = false
    }
  }

  /**
   * Select a shop
   * @param {Object} shop - Shop object
   */
  selectShop(shop) {
    this.selectedShop.value = shop
  }

  /**
   * Clear shop selection
   */
  clearSelection() {
    this.selectedShop.value = null
  }

  /**
   * Set filtered categories
   * @param {Array<string>} categories - Array of category names
   */
  setFilteredCategories(categories) {
    this.filteredCategories.value = [...categories]
  }

  /**
   * Clear category filters
   */
  clearFilters() {
    this.filteredCategories.value = []
  }

  /**
   * Get shop by ID
   * @param {string} id - Shop ID
   * @returns {Object|null} Shop object or null
   */
  async getShopById(id) {
    // Check reactive data first
    let shop = await getPoiData({ id }).then(response => {
      let records = response.data.records
      if (records && records.length > 0) {
        return records[0]
      }
      return null;
    });
    return shop;
  }

  /**
   * Normalize shops data to ensure consistent coordinate format
   * @param {Array} shops - Raw shops data
   * @returns {Array} Normalized shops data
   */
  normalizeShopsData(shops) {
    if (!Array.isArray(shops)) {
      return []
    }

    return shops.map(shop => {
      // Ensure consistent coordinate field names
      const normalizedShop = {
        ...shop,
        // Standardize longitude field
        lng: shop.lng || shop.longitude || 0,
        longitude: shop.lng || shop.longitude || 0,
        // Standardize latitude field
        lat: shop.lat || shop.latitude || 0,
        latitude: shop.lat || shop.latitude || 0
      }

      // Convert coordinates to numbers and validate
      normalizedShop.lng = parseFloat(normalizedShop.lng) || 0
      normalizedShop.longitude = normalizedShop.lng
      normalizedShop.lat = parseFloat(normalizedShop.lat) || 0
      normalizedShop.latitude = normalizedShop.lat

      // Ensure other required fields
      normalizedShop.name = normalizedShop.name || '未命名店铺'
      normalizedShop.category = normalizedShop.category || '其他'
      normalizedShop.address = normalizedShop.address || ''
      normalizedShop.description = normalizedShop.description || ''

      return normalizedShop
    })
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.data = null
    this.cache.timestamp = null
  }

  /**
   * Reset service state
   */
  reset() {
    this.shops.value = []
    this.selectedShop.value = null
    this.filteredCategories.value = []
    this.searchKeyword.value = ''
    this.searchResults.value = []
    this.loading.value = false
    this.error.value = null
    this.clearCache()
  }
}

// Create singleton instance
const shopService = new ShopService()

export default shopService
