import { createRouter, createWebHistory } from 'vue-router'
import CodemirrorEditor from '@/views/CodemirrorEditor.vue'

const router = createRouter({
  history: createWebHistory('/wl/'),
  routes: [
    {
      path: '/',
      name: 'Editor',
      component: CodemirrorEditor,
      meta: {
        title: 'Welight - 微信公众号排版编辑器',
      },
    },
    {
      path: '/themes',
      name: 'ThemePreview',
      component: () => import('@/views/ThemePreview.vue'),
      meta: {
        title: 'Welight - 主题预览',
      },
    },
  ],
})

// 路由守卫 - 设置页面标题
router.beforeEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title as string
  }
})

export default router
