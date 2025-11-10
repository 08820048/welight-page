<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import LoginDialog from '@/components/auth/LoginDialog.vue'
import { Toaster } from '@/components/ui/sonner'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

const route = useRoute()
const uiStore = useUIStore()
const authStore = useAuthStore()
const { isDark } = storeToRefs(uiStore)

const isUtools = ref(false)
const showLoginDialog = ref(false)

// 公开页面列表（不需要登录的页面）
const publicRoutes = ['/themes']

// 判断当前页面是否为公开页面
const isPublicRoute = computed(() => {
  return publicRoutes.includes(route.path)
})

// 判断是否需要显示内容
const shouldShowContent = computed(() => {
  return isPublicRoute.value || authStore.isAuthenticated
})

onMounted(async () => {
  // 检测是否为 Utools 环境
  isUtools.value = !!(window as any).__MD_UTOOLS__
  if (isUtools.value) {
    document.documentElement.classList.add(`is-utools`)
  }

  // 初始化认证状态
  await authStore.initAuth()

  // 如果不是公开页面且未登录，显示登录对话框
  if (!isPublicRoute.value && !authStore.isAuthenticated) {
    showLoginDialog.value = true
  }
})

function handleLoginSuccess() {
  showLoginDialog.value = false
}

// 监听认证状态变化，如果用户登出且不在公开页面则显示登录对话框
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (!isAuthenticated && !isPublicRoute.value) {
    showLoginDialog.value = true
  }
})

// 监听路由变化，处理公开页面和私有页面的切换
watch(() => route.path, (newPath) => {
  const isPublic = publicRoutes.includes(newPath)
  if (!isPublic && !authStore.isAuthenticated) {
    showLoginDialog.value = true
  }
  else if (isPublic) {
    showLoginDialog.value = false
  }
})
</script>

<template>
  <router-view v-if="shouldShowContent" />

  <LoginDialog
    v-if="!isPublicRoute"
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
