<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button class="user-trigger">
        <div class="user-avatar-small">
          <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" :alt="authStore.user.nickname" />
          <div v-else class="avatar-placeholder-small">
            {{ getUserInitials() }}
          </div>
        </div>
        <div class="user-details-small">
          <span class="user-name-small">{{ authStore.user?.nickname || '用户' }}</span>
          <span class="credits-small" v-if="authStore.credits">
            {{ authStore.credits.remainingCredits }} 积分
          </span>
        </div>
        <ChevronDownIcon class="h-3 w-3 text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>
    
    <DropdownMenuContent align="end" class="w-80">
      <!-- 用户基本信息 -->
      <div class="user-header">
        <div class="user-avatar">
          <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" :alt="authStore.user.nickname" />
          <div v-else class="avatar-placeholder">
            {{ getUserInitials() }}
          </div>
        </div>
        <div class="user-info">
          <h3 class="user-name">{{ authStore.user?.nickname || '用户' }}</h3>
          <p class="user-email">{{ authStore.user?.email }}</p>
        </div>
      </div>

      <DropdownMenuSeparator />

      <!-- 积分信息 -->
      <div class="credits-section" v-if="authStore.credits">
        <div class="credits-header">
          <h4>积分余额</h4>
          <button @click="refreshCredits" class="refresh-btn" :disabled="isRefreshing">
            <RefreshCwIcon :class="{ 'animate-spin': isRefreshing }" class="h-3 w-3" />
          </button>
        </div>
        
        <div class="credits-grid">
          <div class="credit-stat">
            <span class="credit-label">剩余</span>
            <span class="credit-value remaining">{{ authStore.credits.remainingCredits }}</span>
          </div>
          <div class="credit-stat">
            <span class="credit-label">总计</span>
            <span class="credit-value">{{ authStore.credits.totalCredits }}</span>
          </div>
          <div class="credit-stat">
            <span class="credit-label">已用</span>
            <span class="credit-value used">{{ authStore.credits.usedCredits }}</span>
          </div>
        </div>

        <div class="account-status" :class="{ active: authStore.credits.isActive }">
          <div class="status-dot"></div>
          <span>{{ authStore.credits.isActive ? '账户正常' : '账户异常' }}</span>
        </div>
      </div>

      <DropdownMenuSeparator />

      <!-- 最近交易 -->
      <div class="transactions-section" v-if="authStore.credits?.recentTransactions?.length">
        <h4>最近交易</h4>
        <div class="transaction-list">
          <div 
            v-for="transaction in authStore.credits.recentTransactions.slice(0, 3)" 
            :key="transaction.id"
            class="transaction-item"
          >
            <div class="transaction-info">
              <span class="service-name">{{ getServiceName(transaction.serviceCode) }}</span>
              <span class="transaction-time">{{ formatTime(transaction.createdAt) }}</span>
            </div>
            <span class="transaction-amount" :class="transaction.type.toLowerCase()">
              {{ transaction.type === 'CONSUME' ? '-' : '+' }}{{ transaction.amount }}
            </span>
          </div>
        </div>
      </div>

      <DropdownMenuSeparator />

      <!-- 操作按钮 -->
      <div class="actions-section">
        <DropdownMenuItem @click="handleLogout" class="logout-item">
          <LogOutIcon class="h-4 w-4 mr-2" />
          退出登录
        </DropdownMenuItem>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDownIcon, RefreshCwIcon, LogOutIcon } from 'lucide-vue-next'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isRefreshing = ref(false)

const getUserInitials = (): string => {
  const name = authStore.user?.nickname || authStore.user?.email || 'U'
  if (!name) return 'U'
  const parts = name.split('@')[0].split(/[\s._-]/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
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

const handleLogout = async () => {
  if (confirm('确定要退出登录吗？')) {
    await authStore.logout()
    // 页面会自动显示登录对话框
  }
}
</script>

<style scoped>
.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s;
}

.user-trigger:hover {
  background: rgba(255, 255, 255, 0.15);
}

.user-avatar-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar-small img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-small {
  width: 100%;
  height: 100%;
  background: #6366f1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 11px;
}

.user-details-small {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-name-small {
  font-size: 12px;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.credits-small {
  font-size: 10px;
  color: #059669;
  font-weight: 500;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
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

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.user-email {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.credits-section {
  padding: 16px;
}

.credits-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.credits-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.refresh-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #6366f1;
}

.credits-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.credit-stat {
  text-align: center;
}

.credit-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 4px;
}

.credit-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.credit-value.remaining {
  color: #059669;
}

.credit-value.used {
  color: #dc2626;
}

.account-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  font-size: 12px;
  color: #dc2626;
}

.account-status.active {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #059669;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #dc2626;
}

.account-status.active .status-dot {
  background: #059669;
}

.transactions-section {
  padding: 16px;
}

.transactions-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transaction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.transaction-info {
  flex: 1;
}

.service-name {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #1f2937;
}

.transaction-time {
  display: block;
  font-size: 10px;
  color: #6b7280;
  margin-top: 2px;
}

.transaction-amount {
  font-size: 12px;
  font-weight: 600;
}

.transaction-amount.consume {
  color: #dc2626;
}

.transaction-amount.recharge {
  color: #059669;
}

.actions-section {
  padding: 8px;
}

.logout-item {
  color: #dc2626;
  cursor: pointer;
}

.logout-item:hover {
  background: #fef2f2;
}
</style>
