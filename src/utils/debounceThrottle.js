/**
 * 防抖和节流工具函数
 * 用于优化高频事件处理，提升应用性能
 */

/**
 * 防抖函数 - 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时
 * 适用场景：搜索框输入、按钮点击防重复、窗口resize等
 * 
 * @param {Function} func - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @param {boolean} immediate - 是否立即执行（第一次触发时）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, delay = 300, immediate = false) {
  let timeoutId = null
  let isInvoked = false

  return function debounced(...args) {
    const context = this

    // 清除之前的定时器
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (immediate && !isInvoked) {
      // 立即执行模式：第一次触发时立即执行
      func.apply(context, args)
      isInvoked = true
    } else {
      // 延迟执行模式
      timeoutId = setTimeout(() => {
        func.apply(context, args)
        isInvoked = false
      }, delay)
    }
  }
}

/**
 * 节流函数 - 规定在一个单位时间内，只能触发一次函数
 * 适用场景：滚动事件、鼠标移动、按钮点击等高频事件
 * 
 * @param {Function} func - 需要节流的函数
 * @param {number} delay - 节流时间间隔（毫秒）
 * @param {Object} options - 配置选项
 * @param {boolean} options.leading - 是否在开始时执行
 * @param {boolean} options.trailing - 是否在结束时执行
 * @returns {Function} 节流后的函数
 */
export function throttle(func, delay = 300, options = {}) {
  const { leading = true, trailing = true } = options
  let timeoutId = null
  let lastExecTime = 0
  let lastArgs = null
  let lastContext = null

  const execute = () => {
    lastExecTime = Date.now()
    func.apply(lastContext, lastArgs)
  }

  return function throttled(...args) {
    const context = this
    const currentTime = Date.now()
    const timeSinceLastExec = currentTime - lastExecTime

    lastArgs = args
    lastContext = context

    if (lastExecTime === 0 && !leading) {
      // 如果是第一次调用且不需要立即执行
      lastExecTime = currentTime
    }

    if (timeSinceLastExec >= delay) {
      // 距离上次执行已经超过延迟时间
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      execute()
    } else if (!timeoutId && trailing) {
      // 设置定时器，在剩余时间后执行
      const remainingTime = delay - timeSinceLastExec
      timeoutId = setTimeout(() => {
        execute()
        timeoutId = null
      }, remainingTime)
    }
  }
}

/**
 * 取消防抖函数的执行
 * @param {Function} debouncedFunc - 防抖函数
 */
export function cancelDebounce(debouncedFunc) {
  if (debouncedFunc && typeof debouncedFunc.cancel === 'function') {
    debouncedFunc.cancel()
  }
}

/**
 * 取消节流函数的执行
 * @param {Function} throttledFunc - 节流函数
 */
export function cancelThrottle(throttledFunc) {
  if (throttledFunc && typeof throttledFunc.cancel === 'function') {
    throttledFunc.cancel()
  }
}

/**
 * 增强版防抖函数 - 支持取消和立即执行
 * @param {Function} func - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @param {Object} options - 配置选项
 * @returns {Function} 增强的防抖函数
 */
export function enhancedDebounce(func, delay = 300, options = {}) {
  const { immediate = false, maxWait = null } = options
  let timeoutId = null
  let maxTimeoutId = null
  let lastCallTime = 0
  let lastInvokeTime = 0
  let lastArgs = null
  let lastContext = null

  const invokeFunc = () => {
    const args = lastArgs
    const context = lastContext
    lastArgs = null
    lastContext = null
    lastInvokeTime = Date.now()
    return func.apply(context, args)
  }

  const leadingEdge = () => {
    lastInvokeTime = Date.now()
    timeoutId = setTimeout(timerExpired, delay)
    return immediate ? invokeFunc() : undefined
  }

  const remainingWait = (time) => {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = delay - timeSinceLastCall
    return maxWait !== null
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting
  }

  const shouldInvoke = (time) => {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime
    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== null && timeSinceLastInvoke >= maxWait)
    )
  }

  const timerExpired = () => {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time))
  }

  const trailingEdge = (time) => {
    timeoutId = null
    if (lastArgs) {
      return invokeFunc()
    }
    lastArgs = null
    lastContext = null
  }

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId)
    }
    lastInvokeTime = 0
    lastArgs = null
    lastCallTime = 0
    lastContext = null
    timeoutId = null
    maxTimeoutId = null
  }

  const flush = () => {
    return timeoutId === null ? undefined : trailingEdge(Date.now())
  }

  const pending = () => {
    return timeoutId !== null
  }

  const debounced = function (...args) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastContext = this
    lastCallTime = time

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge()
      }
      if (maxWait !== null) {
        timeoutId = setTimeout(timerExpired, delay)
        return invokeFunc()
      }
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, delay)
    }
  }

  debounced.cancel = cancel
  debounced.flush = flush
  debounced.pending = pending

  return debounced
}

/**
 * 增强版节流函数 - 支持取消和立即执行
 * @param {Function} func - 需要节流的函数
 * @param {number} delay - 节流时间间隔（毫秒）
 * @param {Object} options - 配置选项
 * @returns {Function} 增强的节流函数
 */
export function enhancedThrottle(func, delay = 300, options = {}) {
  const { leading = true, trailing = true } = options
  return enhancedDebounce(func, delay, {
    maxWait: delay,
    immediate: leading,
    ...options
  })
}

// 默认导出
export default {
  debounce,
  throttle,
  cancelDebounce,
  cancelThrottle,
  enhancedDebounce,
  enhancedThrottle
}