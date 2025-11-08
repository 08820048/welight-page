// 认证状态管理

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth'
import { useStorage } from '@vueuse/core'
import type { 
  User, 
  CreditQueryResponseDTO, 
  LicenseLoginRequest,
  AuthState 
} from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const credits = ref<CreditQueryResponseDTO | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 持久化存储
  const token = useStorage<string | null>('welight_auth_token', null)
  const userInfo = useStorage<User | null>('welight_user_info', null)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const hasCredits = computed(() => credits.value && credits.value.remainingCredits > 0)

  // 初始化：从存储中恢复用户信息
  const initAuth = async () => {
    if (token.value && userInfo.value) {
      user.value = userInfo.value
      
      // 验证 token 是否仍然有效
      const isValid = await authService.validateToken(token.value)
      if (!isValid) {
        await logout()
      } else {
        // 获取最新的积分信息
        await fetchCredits()
      }
    }
  }

  // 许可证登录
  const loginWithLicense = async (request: LicenseLoginRequest) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.licenseLogin(request)
      
      if (response.code === 200 && response.data) {
        // 保存认证信息
        token.value = response.data.token
        user.value = response.data.user
        userInfo.value = response.data.user
        
        // 获取积分信息
        await fetchCredits()
        
        return { success: true, message: response.message }
      } else {
        error.value = response.message || '登录失败'
        return { success: false, message: response.message || '登录失败' }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '网络错误，请稍后重试'
      error.value = message
      return { success: false, message }
    } finally {
      isLoading.value = false
    }
  }

  // 获取积分信息
  const fetchCredits = async (includeHistory = false) => {
    if (!token.value) return

    try {
      const response = await authService.getMyCredits(token.value, {
        includeTransactionHistory: includeHistory,
        page: 0,
        size: 20
      })

      if (response.code === 200 && response.data) {
        credits.value = response.data
      }
    } catch (err) {
      console.error('获取积分信息失败:', err)
    }
  }

  // 登出
  const logout = async () => {
    token.value = null
    user.value = null
    userInfo.value = null
    credits.value = null
    error.value = null
  }

  // 清除错误
  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    user,
    credits,
    token,
    isLoading,
    error,
    
    // 计算属性
    isAuthenticated,
    hasCredits,
    
    // 方法
    initAuth,
    loginWithLicense,
    fetchCredits,
    logout,
    clearError,
  }
})
