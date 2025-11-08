<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Toaster } from '@/components/ui/sonner'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import CodemirrorEditor from '@/views/CodemirrorEditor.vue'
import LoginDialog from '@/components/auth/LoginDialog.vue'

const uiStore = useUIStore()
const authStore = useAuthStore()
const { isDark } = storeToRefs(uiStore)

const isUtools = ref(false)
const showLoginDialog = ref(false)

onMounted(async () => {
  // 检测是否为 Utools 环境
  isUtools.value = !!(window as any).__MD_UTOOLS__
  if (isUtools.value) {
    document.documentElement.classList.add(`is-utools`)
  }

  // 初始化认证状态
  await authStore.initAuth()

  // 如果未登录，显示登录对话框
  if (!authStore.isAuthenticated) {
    showLoginDialog.value = true
  }
})

const handleLoginSuccess = () => {
  showLoginDialog.value = false
}

// 监听认证状态变化，如果用户登出则显示登录对话框
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (!isAuthenticated) {
    showLoginDialog.value = true
  }
})
</script>

<template>
  <CodemirrorEditor v-if="authStore.isAuthenticated" />

  <LoginDialog
    :show-login="showLoginDialog"
    @login-success="handleLoginSuccess"
    @close="showLoginDialog = false"
  />

  <Toaster
    rich-colors
    position="top-center"
    :theme="isDark ? 'dark' : 'light'"
  />
</template>

<style lang="less">
html,
body,
#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}

// 抵消下拉菜单开启时带来的样式
body {
  pointer-events: initial !important;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
  background-color: rgba(243, 244, 247, 0.5);
}

::-webkit-scrollbar-track {
  border-radius: 6px;
  background-color: rgba(200, 200, 200, 0.3);
}

::-webkit-scrollbar-thumb {
  border-radius: 6px;
  background-color: rgba(144, 146, 152, 0.5);
}

// Utools 模式下隐藏所有滚动条
.is-utools {
  ::-webkit-scrollbar {
    display: none;
  }

  // Firefox
  * {
    scrollbar-width: none;
  }

  // IE and Edge
  * {
    -ms-overflow-style: none;
  }
}

/* CSS-hints */
.CodeMirror-hints {
  position: absolute;
  z-index: 10;
  overflow-y: auto;
  margin: 0;
  padding: 2px;
  border-radius: 4px;
  max-height: 20em;
  min-width: 200px;
  font-size: 12px;
  font-family: monospace;

  color: #333333;
  background-color: #ffffff;
  box-shadow:
    0 4px 8px 0 rgba(0, 0, 0, 0.12),
    0 2px 4px 0 rgba(0, 0, 0, 0.08);
}

.CodeMirror-hint {
  margin-top: 10px;
  padding: 4px 6px;
  border-radius: 2px;
  white-space: pre;
  color: #000000;
  cursor: pointer;

  &:first-of-type {
    margin-top: 0;
  }
  &:hover {
    background: #f0f0f0;
  }
}
.search-match {
  background-color: #ffeb3b; /* 所有匹配项颜色 */
}
.current-match {
  background-color: #ff5722; /* 当前匹配项更鲜艳的颜色 */
}
</style>
