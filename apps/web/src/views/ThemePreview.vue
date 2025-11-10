<script setup lang="ts">
import type { ThemeName } from '@welight/shared/configs'
import { initRenderer } from '@welight/core'
import { postProcessHtml, renderMarkdown } from '@welight/core/utils'
import { baseCSSContent, themeMap, themeOptionsMap } from '@welight/shared/configs'
import { computed, nextTick, onMounted, ref } from 'vue'
import DEFAULT_CONTENT from '@/assets/example/markdown.md?raw'

// 使用与预览区一致的示例内容
const sampleMarkdown = DEFAULT_CONTENT

// 主题列表
const themes = computed(() => {
  return Object.entries(themeOptionsMap).map(([key, value]) => ({
    key: key as ThemeName,
    ...value,
    css: themeMap[key as ThemeName],
  }))
})

// 渲染后的HTML内容
const renderedThemes = ref<Record<string, string>>({})

// 为每个主题创建独立的CSS样式
function injectThemeStyles() {
  // 移除旧的主题样式
  const oldStyles = document.querySelectorAll('style[data-theme-preview]')
  oldStyles.forEach(style => style.remove())

  // 注入基础样式
  const baseStyle = document.createElement('style')
  baseStyle.setAttribute('data-theme-preview', 'base')
  baseStyle.textContent = baseCSSContent
  document.head.appendChild(baseStyle)

  // 为每个主题注入独立的样式
  themes.value.forEach((theme) => {
    const style = document.createElement('style')
    style.setAttribute('data-theme-preview', theme.key)

    // 构建完整的主题CSS（和主页面一致的方式）
    let themeCSS = themeMap.default // 默认主题作为基础

    // 如果不是 default 主题，叠加主题特定样式
    if (theme.key !== 'default') {
      const specificThemeCSS = themeMap[theme.key]
      if (specificThemeCSS) {
        themeCSS = `${themeCSS}\n\n${specificThemeCSS}`
      }
    }

    // 将CSS包装在主题特定的作用域中
    const scopedCSS = themeCSS.replace(
      /(^|\n)([^{}]+)\{/g,
      `$1#output-${theme.key} $2{`,
    )

    style.textContent = scopedCSS
    document.head.appendChild(style)
  })
}

// 渲染单个主题
async function renderTheme(theme: typeof themes.value[0], renderer: ReturnType<typeof initRenderer>) {
  try {
    console.log(`Rendering theme: ${theme.key}`)

    // 渲染内容
    const { html: baseHtml, readingTime } = renderMarkdown(sampleMarkdown, renderer)
    const finalHtml = postProcessHtml(baseHtml, readingTime, renderer)

    renderedThemes.value[theme.key] = finalHtml
    console.log(`Successfully rendered theme: ${theme.key}`)
  }
  catch (error) {
    console.error(`Failed to render theme ${theme.key}:`, error)
    renderedThemes.value[theme.key] = `<div class="p-4 text-center text-red-500">
      <p>渲染失败</p>
      <p class="text-xs mt-2">${error.message || '未知错误'}</p>
    </div>`
  }
}

// 初始化渲染器并渲染所有主题
onMounted(async () => {
  try {
    // 初始化渲染器
    const renderer = initRenderer()

    // 注入所有主题样式
    injectThemeStyles()

    // 等待CSS注入完成
    await nextTick()

    // 渲染所有主题
    for (const theme of themes.value) {
      await renderTheme(theme, renderer)
    }
  }
  catch (error) {
    console.error('Failed to initialize renderer:', error)
  }
})
</script>

<template>
  <div class="preview-container">
    <!-- 顶部导航栏 -->
    <div class="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div class="container mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              @click="$router.push('/')"
            >
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              进入编辑器
            </button>
            <div class="h-6 w-px bg-border" />
            <h1 class="text-lg font-semibold">
              主题预览
            </h1>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-sm text-muted-foreground">
              共 {{ themes.length }} 个主题
            </div>
            <div class="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              公开预览
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主题预览网格 -->
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-center">
        <div class="w-full max-w-7xl">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            <!-- 每个主题的手机预览 -->
            <div v-for="theme in themes" :key="theme.key" class="flex flex-col items-center">
              <!-- 主题标题 -->
              <h3 class="text-sm font-medium mb-2">
                {{ theme.label }}<span v-if="theme.desc" class="text-xs text-muted-foreground ml-1">{{ theme.desc }}</span>
              </h3>

              <!-- 手机预览 -->
              <div class="card">
                <div class="btn1" />
                <div class="btn2" />
                <div class="btn3" />
                <div class="btn4" />
                <div class="card-int">
                  <!-- 渲染的主题内容 -->
                  <div
                    :id="`output-${theme.key}`"
                    class="theme-preview-content"
                    v-html="renderedThemes[theme.key] || '渲染中...'"
                  />
                </div>
                <div class="top">
                  <div class="camera">
                    <div class="int" />
                  </div>
                  <div class="speaker" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .preview-container {
  width: 100%;
  min-height: 100vh;
  background:
    linear-gradient(to bottom, #fff 0%, #fff 40%, rgba(255, 255, 255, 0) 100%),
    linear-gradient(to right, #0ed2da, #5f29c7);
  position: relative;
  overflow: hidden;
}

.preview-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(90deg, #ccc 1px, transparent 1px);
  background-size: 50px 100%;
  pointer-events: none;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 70%);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 70%);
}

.card {
  width: 320px;
  height: 640px;
  background: black;
  border-radius: 35px;
  border: 2px solid rgb(40, 40, 40);
  padding: 7px;
  position: relative;
  box-shadow: 2px 5px 15px rgba(0, 0, 0, 0.486);
}

.card-int {
  background: white;
  height: calc(100% - 14px);
  width: calc(100% - 14px);
  margin: 7px;
  border-radius: 25px;
  transition: all 0.6s ease-out;
  overflow: hidden;
}

.top {
  position: absolute;
  top: 0px;
  right: 50%;
  transform: translate(50%, 0%);
  width: 35%;
  height: 18px;
  background-color: black;
  border-bottom-left-radius: 10px;
  border-bottom-right-radius: 10px;
}

.speaker {
  position: absolute;
  top: 2px;
  right: 50%;
  transform: translate(50%, 0%);
  width: 40%;
  height: 2px;
  border-radius: 2px;
  background-color: rgb(20, 20, 20);
}

.camera {
  position: absolute;
  top: 6px;
  right: 84%;
  transform: translate(50%, 0%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.048);
}

.int {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  top: 50%;
  right: 50%;
  transform: translate(50%, -50%);
  background-color: rgba(0, 0, 255, 0.212);
}

.btn1,
.btn2,
.btn3,
.btn4 {
  position: absolute;
  width: 2px;
}

.btn1,
.btn2,
.btn3 {
  height: 45px;
  top: 30%;
  right: -4px;
  background-image: linear-gradient(to right, #111111, #222222, #333333, #464646, #595959);
}

.btn2,
.btn3 {
  transform: scale(-1);
  left: -4px;
}

.btn2,
.btn3 {
  transform: scale(-1);
  height: 30px;
}

.btn2 {
  top: 26%;
}

.btn3 {
  top: 36%;
}

/* 主题预览内容样式 - 和主页面移动端预览完全一致 */
.theme-preview-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 0;
  font-size: 14px;
  line-height: 1.6;
}

.theme-preview-content::-webkit-scrollbar {
  width: 4px;
}

.theme-preview-content::-webkit-scrollbar-track {
  background: transparent;
}

.theme-preview-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.theme-preview-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
