<template>
  <div class="user-profile">
    <!-- 用户信息卡片 -->
    <div class="user-card">
      <div class="user-info">
        <div class="user-avatar">
          <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" :alt="authStore.user.nickname" />
          <div v-else class="avatar-placeholder">
            {{ getInitials(authStore.user?.nickname || authStore.user?.email || '') }}
          </div>
        </div>
        <div class="user-details">
          <h3 class="user-name">{{ authStore.user?.nickname || '用户' }}</h3>
          <p class="user-email">{{ authStore.user?.email }}</p>
        </div>
      </div>
      <button @click="handleLogout" class="logout-button" title="退出登录">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16,17 21,12 16,7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>

    <!-- 积分信息 -->
    <div class="credits-card" v-if="authStore.credits">
      <div class="credits-header">
        <h4>积分余额</h4>
        <button @click="refreshCredits" class="refresh-button" :disabled="isRefreshing" title="刷新积分">
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
            :class="{ 'spinning': isRefreshing }"
          >
            <polyline points="23,4 23,10 17,10"/>
            <polyline points="1,20 1,14 7,14"/>
            <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10m22,4L18.36,18.36A9,9,0,0,1,3.51,15"/>
          </svg>
        </button>
      </div>
      
      <div class="credits-stats">
        <div class="credit-item">
          <span class="credit-label">剩余积分</span>
          <span class="credit-value remaining">{{ authStore.credits.remainingCredits }}</span>
        </div>
        <div class="credit-item">
          <span class="credit-label">总积分</span>
          <span class="credit-value">{{ authStore.credits.totalCredits }}</span>
        </div>
        <div class="credit-item">
          <span class="credit-label">已使用</span>
          <span class="credit-value used">{{ authStore.credits.usedCredits }}</span>
        </div>
      </div>

      <div class="account-status" :class="{ active: authStore.credits.isActive }">
        <span class="status-indicator"></span>
        <span class="status-text">
          {{ authStore.credits.isActive ? '账户正常' : '账户异常' }}
        </span>
      </div>
    </div>

    <!-- 最近交易 -->
    <div class="transactions-card" v-if="authStore.credits?.recentTransactions?.length">
      <h4>最近交易</h4>
      <div class="transaction-list">
        <div 
          v-for="transaction in authStore.credits.recentTransactions" 
          :key="transaction.id"
          class="transaction-item"
        >
          <div class="transaction-info">
            <span class="transaction-service">{{ getServiceName(transaction.serviceCode) }}</span>
            <span class="transaction-time">{{ formatTime(transaction.createdAt) }}</span>
          </div>
          <div class="transaction-amount" :class="transaction.type.toLowerCase()">
            {{ transaction.type === 'CONSUME' ? '-' : '+' }}{{ transaction.amount }}
          </div>
        </div>
      </div>
      
      <button @click="showTransactionHistory" class="view-more-button">
        查看完整交易记录
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isRefreshing = ref(false)

const getInitials = (name: string): string => {
  if (!name) return 'U'
  const parts = name.split('@')[0].split(/[\s._-]/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const handleLogout = async () => {
  if (confirm('确定要退出登录吗？')) {
    await authStore.logout()
  }
}

const refreshCredits = async () => {
  isRefreshing.value = true
  try {
    await authStore.fetchCredits()
  } finally {
    isRefreshing.value = false
  }
}

const getServiceName = (serviceCode: string): string => {
  const serviceNames: Record<string, string> = {
    'OCR': '文字识别',
    'TRANSLATE': '翻译服务',
    'AI_CHAT': 'AI 对话',
    'IMAGE_GEN': '图片生成',
    'MARKDOWN': 'Markdown 处理'
  }
  return serviceNames[serviceCode] || serviceCode
}

const formatTime = (timeStr: string): string => {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  
  return date.toLocaleDateString()
}

const showTransactionHistory = () => {
  // TODO: 实现交易历史弹窗
  console.log('显示交易历史')
}
</script>

<style scoped>
.user-profile {
  padding: 16px;
  max-width: 320px;
}

.user-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #6366f1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-button {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.logout-button:hover {
  background: #f3f4f6;
  color: #dc2626;
}

.credits-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.credits-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.credits-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.refresh-button {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.refresh-button:hover:not(:disabled) {
  background: #f3f4f6;
  color: #6366f1;
}

.refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.credits-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.credit-item {
  text-align: center;
}

.credit-item:first-child {
  grid-column: 1 / -1;
}

.credit-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.credit-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.credit-value.remaining {
  color: #059669;
  font-size: 24px;
}

.credit-value.used {
  color: #dc2626;
}

.account-status {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.account-status.active {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc2626;
  margin-right: 8px;
}

.account-status.active .status-indicator {
  background: #059669;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
  color: #dc2626;
}

.account-status.active .status-text {
  color: #059669;
}

.transactions-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.transactions-card h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.transaction-list {
  margin-bottom: 16px;
}

.transaction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-info {
  flex: 1;
}

.transaction-service {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.transaction-time {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.transaction-amount {
  font-size: 14px;
  font-weight: 600;
}

.transaction-amount.consume {
  color: #dc2626;
}

.transaction-amount.recharge {
  color: #059669;
}

.view-more-button {
  width: 100%;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-more-button:hover {
  background: #f3f4f6;
  color: #374151;
}
</style>
