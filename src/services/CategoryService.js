import { ref, reactive } from 'vue'
import { getCategoryData, insertOrUpdateOrDeleteCategory } from '@/api/categoryApi'

/**
 * Category Service - Manages category data without storing in Vuex
 * Provides reactive data and methods for category operations
 */
class CategoryService {
  constructor() {
    // Reactive data
    this.categories = ref([])
    this.loading = ref(false)
    this.error = ref(null)
    
    // Cache management
    this.cache = reactive({
      data: null,
      timestamp: null,
      ttl: 5 * 60 * 1000 // 5 minutes cache
    })
  }

  /**
   * Get all categories with caching
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Array>} Categories array
   */
  async getCategories(forceRefresh = false) {
    // Check cache validity
    const now = Date.now()
    const isCacheValid = this.cache.data && 
                        this.cache.timestamp && 
                        (now - this.cache.timestamp) < this.cache.ttl

    if (!forceRefresh && isCacheValid) {
      this.categories.value = this.cache.data
      return this.cache.data
    }

    try {
      this.loading.value = true
      this.error.value = null

      const response = await getCategoryData()
      const categoriesData = response.data || []

      // Update reactive data
      this.categories.value = categoriesData
      
      // Update cache
      this.cache.data = categoriesData
      this.cache.timestamp = now

      return categoriesData
    } catch (error) {
      this.error.value = error.message || '获取分类列表失败'
      console.error('CategoryService.getCategories error:', error)
      return []
    } finally {
      this.loading.value = false
    }
  }

  /**
   * Add a new category
   * @param {Object} categoryData - Category data
   * @returns {Promise<boolean>} Success status
   */
  async addCategory(categoryData) {
    try {
      this.loading.value = true
      this.error.value = null

      const result = await insertOrUpdateOrDeleteCategory({
        name: categoryData.name,
        icon: categoryData.icon,
        color: categoryData.color,
        id: null,
        isDelete: 'N'
      })

      if (result) {
        // Refresh categories after adding
        await this.getCategories(true)
        return true
      }
      return false
    } catch (error) {
      this.error.value = error.message || '添加分类失败'
      console.error('CategoryService.addCategory error:', error)
      throw error
    } finally {
      this.loading.value = false
    }
  }

  /**
   * Update an existing category
   * @param {Object} categoryData - Category data with id
   * @returns {Promise<boolean>} Success status
   */
  async updateCategory(categoryData) {
    try {
      this.loading.value = true
      this.error.value = null

      const result = await insertOrUpdateOrDeleteCategory({
        id: categoryData.id,
        name: categoryData.name,
        icon: categoryData.icon,
        color: categoryData.color,
        isDelete: 'N'
      })

      if (result) {
        // Refresh categories after updating
        await this.getCategories(true)
        return true
      }
      return false
    } catch (error) {
      this.error.value = error.message || '更新分类失败'
      console.error('CategoryService.updateCategory error:', error)
      throw error
    } finally {
      this.loading.value = false
    }
  }

  /**
   * Delete a category
   * @param {string} categoryId - Category ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteCategory(categoryId) {
    try {
      this.loading.value = true
      this.error.value = null

      const result = await insertOrUpdateOrDeleteCategory({
        id: categoryId,
        isDelete: 'Y'
      })

      if (result) {
        // Refresh categories after deletion
        await this.getCategories(true)
        return true
      }
      return false
    } catch (error) {
      this.error.value = error.message || '删除分类失败'
      console.error('CategoryService.deleteCategory error:', error)
      throw error
    } finally {
      this.loading.value = false
    }
  }

  /**
   * Find category by name
   * @param {string} name - Category name
   * @returns {Object|null} Category object or null
   */
  getCategoryByName(name) {
    return this.categories.value.find(cat => cat.name === name) || null
  }

  /**
   * Find category by ID
   * @param {string} id - Category ID
   * @returns {Object|null} Category object or null
   */
  getCategoryById(id) {
    return this.categories.value.find(cat => cat.id === id) || null
  }

  /**
   * Get category names array
   * @returns {Array<string>} Array of category names
   */
  getCategoryNames() {
    return this.categories.value.map(cat => cat.name)
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
    this.categories.value = []
    this.loading.value = false
    this.error.value = null
    this.clearCache()
  }
}

// Create singleton instance
const categoryService = new CategoryService()

export default categoryService
