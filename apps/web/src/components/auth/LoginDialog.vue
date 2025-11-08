<template>
  <div class="login-overlay" v-if="showLogin">
    <div class="glitch-input-wrapper">
      <div class="input-container" :class="{
        'has-error': authStore.error,
        'is-validating': authStore.isLoading,
        'is-complete': isLicenseComplete
      }">
        <input
          type="text"
          id="holo-input"
          class="holo-input"
          :class="{
            'input-error': authStore.error,
            'input-validating': authStore.isLoading,
            'input-complete': isLicenseComplete
          }"
          placeholder=""
          v-model="licenseKey"
          :disabled="authStore.isLoading"
          @input="handleInput"
          @paste="handlePaste"
          maxlength="39"
        />
        <label for="holo-input" class="input-label" data-text="请输入激活后的Welight许可证">
          请输入激活后的Welight许可证
        </label>

        <div class="input-border"></div>
        <div class="input-scanline"></div>
        <div class="input-glow"></div>

        <div class="input-data-stream">
          <div class="stream-bar" style="--i: 0;"></div>
          <div class="stream-bar" style="--i: 1;"></div>
          <div class="stream-bar" style="--i: 2;"></div>
          <div class="stream-bar" style="--i: 3;"></div>
          <div class="stream-bar" style="--i: 4;"></div>
          <div class="stream-bar" style="--i: 5;"></div>
          <div class="stream-bar" style="--i: 6;"></div>
          <div class="stream-bar" style="--i: 7;"></div>
          <div class="stream-bar" style="--i: 8;"></div>
          <div class="stream-bar" style="--i: 9;"></div>
        </div>

        <div class="input-corners">
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast 组件 -->
  <Toast ref="toastRef" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Toast from '@/components/ui/Toast.vue'

interface Props {
  showLogin: boolean
}

interface Emits {
  (e: 'login-success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const authStore = useAuthStore()
const toastRef = ref()

const licenseKey = ref('')
const isLicenseComplete = ref(false)
const validationTimeout = ref<NodeJS.Timeout | null>(null)

// 清除错误信息当对话框打开时
watch(() => props.showLogin, (show) => {
  if (show) {
    authStore.clearError()
    licenseKey.value = ''
    isLicenseComplete.value = false
    if (validationTimeout.value) {
      clearTimeout(validationTimeout.value)
      validationTimeout.value = null
    }
  }
})

// 监听错误状态，显示 toast
watch(() => authStore.error, (error) => {
  if (error && toastRef.value) {
    toastRef.value.showToast.error(error, 'ACCESS DENIED')
  }
})

// 许可证格式验证
const isValidLicenseFormat = (key: string): boolean => {
  // 格式：XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  return pattern.test(key)
}

// 格式化许可证输入（自动添加连字符）
const formatLicenseKey = (input: string): string => {
  // 移除所有非字母数字字符
  const cleaned = input.replace(/[^A-Z0-9]/g, '')

  // 按4个字符分组，用连字符连接
  const groups = []
  for (let i = 0; i < cleaned.length; i += 4) {
    groups.push(cleaned.substr(i, 4))
  }

  return groups.join('-')
}

// 处理输入
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const rawValue = target.value.toUpperCase()

  // 格式化输入
  const formatted = formatLicenseKey(rawValue)
  licenseKey.value = formatted

  // 检查是否完整
  isLicenseComplete.value = formatted.length === 39 && isValidLicenseFormat(formatted)

  // 清除之前的验证定时器
  if (validationTimeout.value) {
    clearTimeout(validationTimeout.value)
  }

  // 如果输入为空或不完整，清除错误状态
  if (formatted.length === 0 || !isLicenseComplete.value) {
    authStore.clearError()
  }

  // 如果格式完整且有效，延迟验证
  if (isLicenseComplete.value) {
    validationTimeout.value = setTimeout(() => {
      autoValidate()
    }, 500) // 500ms 延迟，避免频繁请求
  }
}

// 处理粘贴
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pastedText = event.clipboardData?.getData('text') || ''
  const formatted = formatLicenseKey(pastedText.toUpperCase())
  licenseKey.value = formatted

  isLicenseComplete.value = formatted.length === 39 && isValidLicenseFormat(formatted)

  if (isLicenseComplete.value) {
    setTimeout(() => {
      autoValidate()
    }, 300)
  }
}

// 自动验证
const autoValidate = async () => {
  if (!isLicenseComplete.value || authStore.isLoading) {
    return
  }

  authStore.clearError()

  const result = await authStore.loginWithLicense({
    licenseKey: licenseKey.value,
    customerEmail: undefined
  })

  if (result.success) {
    if (toastRef.value) {
      toastRef.value.showToast.success('访问权限已获取', 'ACCESS GRANTED')
    }
    emit('login-success')
  }
}
</script>

<style scoped>
/* --- Root Variables & Wrapper --- */
.glitch-input-wrapper {
  --bg-color: #f8fafc;
  --primary-color: #00f2ea;
  --secondary-color: #a855f7;
  --text-color: #1e293b;
  --font-family: "Fira Code", Consolas, "Courier New", Courier, monospace;
  --glitch-anim-duration: 0.4s;

  display: flex;
  justify-content: center;
  align-items: center;
  font-family: var(--font-family);
  font-size: 16px;
  width: 90%;
  max-width: 550px;
}

/* --- Input Container --- */
.input-container {
  position: relative;
  width: 100%;
  max-width: 550px;
}

/* --- Main Input --- */
.holo-input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 2px solid rgba(30, 41, 59, 0.2);
  color: var(--text-color);
  font-family: var(--font-family);
  font-size: 1.2rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  padding: 1rem 0;
  outline: none;
  caret-color: var(--primary-color);
  transition: all 0.3s ease;
  z-index: 10;
  position: relative;
}

.holo-input:focus {
  border-bottom-color: var(--primary-color);
}



/* --- Input Label --- */
.input-label {
  position: absolute;
  top: 1rem;
  left: 0;
  font-size: 1rem;
  color: var(--text-color);
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 11;
}

.holo-input:focus + .input-label,
.holo-input:not(:placeholder-shown) + .input-label {
  top: -1.5rem;
  left: 0;
  font-size: 0.8rem;
  opacity: 1;
  color: var(--primary-color);
}

.holo-input:focus + .input-label::before,
.holo-input:focus + .input-label::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #212121;
}

.holo-input:focus + .input-label::before {
  color: var(--secondary-color);
  animation: glitch-label var(--glitch-anim-duration)
    cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

.holo-input:focus + .input-label::after {
  color: var(--primary-color);
  animation: glitch-label var(--glitch-anim-duration)
    cubic-bezier(0.25, 0.46, 0.45, 0.94) reverse both;
}

/* --- Decorative Elements --- */
.input-border {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 1px solid rgba(30, 41, 59, 0.1);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.holo-input:focus ~ .input-border {
  opacity: 1;
  border-color: var(--primary-color);
}

.input-glow {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 242, 234, 0.1) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.holo-input:focus ~ .input-glow {
  opacity: 1;
}

/* --- Scanline --- */
.input-scanline {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 242, 234, 0.1) 48%,
    rgba(0, 242, 234, 0.3) 50%,
    rgba(0, 242, 234, 0.1) 52%,
    transparent 100%
  );
  opacity: 0;
  z-index: 5;
}

.holo-input:focus ~ .input-scanline {
  animation: scan-vertical 4s linear infinite;
}

/* --- Data Stream --- */
.input-data-stream {
  position: absolute;
  bottom: -10px;
  left: 0;
  right: 0;
  height: 4px;
  display: flex;
  gap: 2px;
  z-index: 3;
}

.stream-bar {
  flex: 1;
  height: 100%;
  background-color: var(--primary-color);
  opacity: 0.3;
}

.holo-input:focus ~ .input-data-stream .stream-bar {
  animation: data-pulse 2s infinite;
  animation-delay: calc(var(--i) * 0.1s);
}

/* --- Corners --- */
.input-corners {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  pointer-events: none;
  z-index: 4;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid var(--primary-color);
  opacity: 0;
  transition: all 0.3s ease;
}

.corner-tl {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
}

.corner-tr {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
}

.corner-bl {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
}

.corner-br {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
}

.holo-input:focus ~ .input-corners .corner {
  opacity: 1;
  width: 30px;
  height: 30px;
}

/* --- State Styles --- */
.input-container.has-error {
  --primary-color: #ef4444;
  --secondary-color: #dc2626;
}

.input-container.is-validating {
  --primary-color: #f59e0b;
  --secondary-color: #d97706;
}

.input-container.is-complete {
  --primary-color: #10b981;
  --secondary-color: #059669;
}

.holo-input.input-error {
  border-bottom-color: #ef4444;
  color: #ef4444;
  caret-color: #ef4444;
}

.holo-input.input-error + .input-label {
  color: #ef4444;
}

.has-error .input-border {
  border-color: rgba(239, 68, 68, 0.5);
  opacity: 1;
}

.has-error .corner {
  border-color: #ef4444;
  opacity: 1;
}

.has-error .input-glow {
  background: radial-gradient(
    ellipse at center,
    rgba(239, 68, 68, 0.2) 0%,
    transparent 70%
  );
  opacity: 1;
}

.has-error .stream-bar {
  background-color: #ef4444;
}

.has-error .input-scanline {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(239, 68, 68, 0.1) 48%,
    rgba(239, 68, 68, 0.3) 50%,
    rgba(239, 68, 68, 0.1) 52%,
    transparent 100%
  );
  animation: scan-vertical 2s linear infinite;
}

/* --- Animations --- */
@keyframes glitch-label {
  0%, 100% {
    transform: translate(0);
  }
  20% {
    transform: translate(-2px, 2px);
  }
  40% {
    transform: translate(-2px, -2px);
  }
  60% {
    transform: translate(2px, 2px);
  }
  80% {
    transform: translate(2px, -2px);
  }
}

@keyframes scan-vertical {
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(calc(100vh + 100%));
    opacity: 0;
  }
}

@keyframes data-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scaleY(1);
  }
  50% {
    opacity: 1;
    transform: scaleY(1.5);
  }
}

/* --- Login Overlay --- */
.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.login-overlay::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 0;
  background-image: linear-gradient(to right, #e2e8f0 1px, transparent 1px),
    linear-gradient(to bottom, #e2e8f0 1px, transparent 1px);
  background-size: 20px 30px;
  -webkit-mask-image: radial-gradient(
    ellipse 70% 60% at 50% 0%,
    #000 60%,
    transparent 100%
  );
  mask-image: radial-gradient(
    ellipse 70% 60% at 50% 0%,
    #000 60%,
    transparent 100%
  );
}

.glitch-input-wrapper {
  position: relative;
  z-index: 1;
  width: 90%;
  max-width: 550px;
}
</style>
