// 认证服务 API

import type { 
  ApiResponse, 
  LoginResponseDTO, 
  LicenseLoginRequest, 
  CreditQueryResponseDTO 
} from '@/types/auth'

const API_BASE_URL = 'https://ilikexff.cn/api'

class AuthService {
  private getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  /**
   * 许可证登录
   */
  async licenseLogin(request: LicenseLoginRequest): Promise<ApiResponse<LoginResponseDTO>> {
    const response = await fetch(`${API_BASE_URL}/auth/license-bootstrap`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 查询当前用户积分
   */
  async getMyCredits(
    token: string,
    options: {
      includeTransactionHistory?: boolean
      page?: number
      size?: number
    } = {}
  ): Promise<ApiResponse<CreditQueryResponseDTO>> {
    const { includeTransactionHistory = false, page = 0, size = 20 } = options
    
    const params = new URLSearchParams({
      includeTransactionHistory: includeTransactionHistory.toString(),
      page: page.toString(),
      size: size.toString(),
    })

    const response = await fetch(`${API_BASE_URL}/credits/me?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * 验证 token 是否有效
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await this.getMyCredits(token)
      return response.code === 200
    } catch (error) {
      return false
    }
  }
}

export const authService = new AuthService()
