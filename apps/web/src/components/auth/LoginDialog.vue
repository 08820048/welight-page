<template>
  <div class="login-overlay" v-if="showLogin">
    <div class="login-dialog">
      <div class="login-header">
        <h2>Welight 许可证登录</h2>
        <p class="subtitle">使用您的许可证信息登录，桌面版和网页版通用</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="licenseKey">许可证密钥 *</label>
          <input
            id="licenseKey"
            v-model="licenseKey"
            type="text"
            placeholder="WELIGHT-XXXX-XXXX-XXXX"
            class="license-input"
            :disabled="authStore.isLoading"
            required
          />
          <small class="help-text">
            桌面版用户可在软件中查看许可证密钥
          </small>
        </div>

        <div class="form-group">
          <label for="customerEmail">邮箱地址（可选）</label>
          <input
            id="customerEmail"
            v-model="customerEmail"
            type="email"
            placeholder="购买时使用的邮箱"
            :disabled="authStore.isLoading"
          />
          <small class="help-text">
            提供邮箱将进行一致性校验，提高安全性
          </small>
        </div>

        <div class="error-message" v-if="authStore.error">
          {{ authStore.error }}
        </div>

        <button 
          type="submit" 
          class="login-button"
          :disabled="authStore.isLoading || !licenseKey.trim()"
        >
          <span v-if="authStore.isLoading">登录中...</span>
          <span v-else>登录 Welight</span>
        </button>
      </form>

      <div class="login-help">
        <details class="help-section">
          <summary>桌面版用户如何查看许可证？</summary>
          <ol>
            <li>打开 Welight 桌面版</li>
            <li>点击菜单栏的"帮助" → "许可证信息"</li>
            <li>复制显示的许可证密钥</li>
            <li>使用购买时的邮箱和许可证密钥登录</li>
          </ol>
        </details>

        <details class="help-section">
          <summary>常见问题</summary>
          <div class="faq-item">
            <strong>Q: 忘记了购买时使用的邮箱？</strong>
            <p>A: 请联系客服，提供您的许可证密钥，我们将帮您找回邮箱信息。</p>
          </div>
          <div class="faq-item">
            <strong>Q: 许可证密钥丢失了？</strong>
            <p>A: 请提供购买时的邮箱和订单信息，客服将为您重新发送许可证。</p>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

interface Props {
  showLogin: boolean
}

interface Emits {
  (e: 'login-success'): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()

const licenseKey = ref('')
const customerEmail = ref('')

// 清除错误信息当对话框打开时
watch(() => props.showLogin, (show) => {
  if (show) {
    authStore.clearError()
    licenseKey.value = ''
    customerEmail.value = ''
  }
})

const handleLogin = async () => {
  const result = await authStore.loginWithLicense({
    licenseKey: licenseKey.value.trim(),
    customerEmail: customerEmail.value.trim() || undefined
  })

  if (result.success) {
    emit('login-success')
  }
}
</script>

<style scoped>
.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.login-dialog {
  background: white;
  border-radius: 12px;
  padding: 32px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group input:disabled {
  background-color: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.license-input {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  letter-spacing: 1px;
}

.help-text {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
}

.login-button {
  width: 100%;
  background: #6366f1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-button:hover:not(:disabled) {
  background: #5856eb;
}

.login-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.login-help {
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
}

.help-section {
  margin-bottom: 16px;
}

.help-section summary {
  cursor: pointer;
  font-weight: 500;
  color: #374151;
  padding: 8px 0;
}

.help-section summary:hover {
  color: #6366f1;
}

.help-section ol {
  margin: 12px 0 0 20px;
  color: #6b7280;
  font-size: 14px;
}

.help-section ol li {
  margin-bottom: 4px;
}

.faq-item {
  margin-bottom: 12px;
}

.faq-item strong {
  display: block;
  color: #374151;
  font-size: 14px;
  margin-bottom: 4px;
}

.faq-item p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}
</style>
