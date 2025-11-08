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

    // 无论成功还是失败，都解析 JSON 响应
    const result: ApiResponse<LoginResponseDTO> = await response.json()

    // 如果服务器返回错误码，抛出包含服务器错误信息的错误
    if (!response.ok || result.code !== 200) {
      const error = new Error(result.message || `HTTP ${response.status}: ${response.statusText}`)
      // 将完整的响应信息附加到错误对象上
      ;(error as any).response = result
      throw error
    }

    return result
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

    // 无论成功还是失败，都解析 JSON 响应
    const result: ApiResponse<CreditQueryResponseDTO> = await response.json()

    // 如果服务器返回错误码，抛出包含服务器错误信息的错误
    if (!response.ok || result.code !== 200) {
      const error = new Error(result.message || `HTTP ${response.status}: ${response.statusText}`)
      ;(error as any).response = result
      throw error
    }

    return result
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
