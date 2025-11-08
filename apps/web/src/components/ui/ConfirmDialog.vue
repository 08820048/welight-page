<template>
  <div v-if="visible" class="confirm-overlay" @click="handleOverlayClick">
    <div class="confirm-dialog" @click.stop>
      <div class="confirm-header">
        <div class="confirm-icon">
          <component :is="iconComponent" class="h-6 w-6" />
        </div>
        <h3 class="confirm-title">{{ title }}</h3>
      </div>
      
      <div class="confirm-content">
        <p class="confirm-message">{{ message }}</p>
      </div>
      
      <div class="confirm-actions">
        <button 
          class="confirm-btn confirm-btn-cancel" 
          @click="handleCancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </button>
        <button 
          class="confirm-btn confirm-btn-confirm" 
          @click="handleConfirm"
          :disabled="loading"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangleIcon, InfoIcon, CheckCircleIcon, XCircleIcon } from 'lucide-vue-next'

interface Props {
  visible: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'info' | 'success' | 'error'
  loading?: boolean
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '确认操作',
  confirmText: '确认',
  cancelText: '取消',
  type: 'warning',
  loading: false
})

const emit = defineEmits<Emits>()

const iconComponent = computed(() => {
  switch (props.type) {
    case 'warning':
      return AlertTriangleIcon
    case 'info':
      return InfoIcon
    case 'success':
      return CheckCircleIcon
    case 'error':
      return XCircleIcon
    default:
      return AlertTriangleIcon
  }
})

const handleConfirm = () => {
  if (!props.loading) {
    emit('confirm')
  }
}

const handleCancel = () => {
  if (!props.loading) {
    emit('cancel')
  }
}

const handleOverlayClick = () => {
  if (!props.loading) {
    emit('close')
  }
}
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

.confirm-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 16px 24px;
}

.confirm-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #fef3c7;
  color: #f59e0b;
}

.confirm-icon[data-type="info"] {
  background: #dbeafe;
  color: #3b82f6;
}

.confirm-icon[data-type="success"] {
  background: #d1fae5;
  color: #10b981;
}

.confirm-icon[data-type="error"] {
  background: #fee2e2;
  color: #ef4444;
}

.confirm-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.4;
}

.confirm-content {
  padding: 0 24px 24px 24px;
}

.confirm-message {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin-left: 60px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px 24px;
  justify-content: flex-end;
}

.confirm-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  justify-content: center;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-btn-cancel {
  background: #f9fafb;
  color: #374151;
  border-color: #d1d5db;
}

.confirm-btn-cancel:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.confirm-btn-confirm {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.confirm-btn-confirm:hover:not(:disabled) {
  background: #dc2626;
  border-color: #dc2626;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  .confirm-dialog {
    margin: 16px;
    width: calc(100% - 32px);
  }
  
  .confirm-header {
    padding: 20px 20px 12px 20px;
  }
  
  .confirm-content {
    padding: 0 20px 20px 20px;
  }
  
  .confirm-message {
    margin-left: 0;
    margin-top: 8px;
  }
  
  .confirm-actions {
    padding: 12px 20px 20px 20px;
    flex-direction: column-reverse;
  }
  
  .confirm-btn {
    width: 100%;
  }
}
</style>
