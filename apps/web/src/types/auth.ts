// 认证相关类型定义

export interface ApiResponse<T> {
  code: number
  message: string
  data: T | null
  timestamp: number
  queryStats?: any
}

export interface User {
  id: number
  username: string
  email: string
  nickname: string
  avatar: string | null
  bio: string
  createdAt: string
}

export interface LoginResponseDTO {
  token: string
  tokenType: string
  user: User
}

export interface LicenseLoginRequest {
  licenseKey: string
  customerEmail?: string
}

export interface Transaction {
  id: number
  type: 'CONSUME' | 'RECHARGE' | 'REFUND'
  amount: number
  serviceCode: string
  createdAt: string
  description?: string
}

export interface TransactionHistory {
  content: Transaction[]
  totalElements: number
  number: number
  size: number
  totalPages?: number
}

export interface CreditQueryResponseDTO {
  email: string
  deviceFingerprint?: string | null
  isTrialUser: boolean
  totalCredits: number
  usedCredits: number
  remainingCredits: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  accountLevel: string
  usageRate: number
  creditStatusDescription: string
  creditStatusColor: string
  accountStatusTip: string
  queryTime: string
  creditUsageDescription: string
  recentTransactions: Transaction[] | null
  transactionHistory?: TransactionHistory | null
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  credits: CreditQueryResponseDTO | null
}
