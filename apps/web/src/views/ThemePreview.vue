<script setup lang="ts">
import type { ThemeName } from '@welight/shared/configs'
import { generateCSSVariables, initRenderer, processCSS, wrapCSSWithScope } from '@welight/core'
import { postProcessHtml, renderMarkdown } from '@welight/core/utils'
import { baseCSSContent, defaultStyleConfig, themeMap, themeOptionsMap } from '@welight/shared/configs'
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
async function injectThemeStyles() {
  // 移除旧的主题样式
  const oldStyles = document.querySelectorAll('style[data-theme-preview]')
  oldStyles.forEach(style => style.remove())

  // 为每个主题注入独立的样式
  for (const theme of themes.value) {
    const style = document.createElement('style')
    style.setAttribute('data-theme-preview', theme.key)

    try {
      // 1. 生成 CSS 变量（使用默认配置）
      const variablesCSS = generateCSSVariables({
        primaryColor: defaultStyleConfig.primaryColor,
        fontFamily: defaultStyleConfig.fontFamily,
        fontSize: defaultStyleConfig.fontSize,
        isUseIndent: false,
        isUseJustify: false,
      })

      // 2. 构建完整的主题CSS（和主页面一致的方式）
      let themeCSS = themeMap.default // 默认主题作为基础

      // 3. 如果不是 default 主题，叠加主题特定样式
      if (theme.key !== 'default') {
        const specificThemeCSS = themeMap[theme.key]
        if (specificThemeCSS) {
          themeCSS = `${themeCSS}\n\n${specificThemeCSS}`
        }
      }

      // 4. 给主题 CSS 添加作用域（只影响对应的预览区域）
      const scopedThemeCSS = wrapCSSWithScope(themeCSS, `#output-${theme.key}`)

      // 5. 拼接完整 CSS
      let mergedCSS = [
        variablesCSS, // CSS 变量（全局）
        baseCSSContent, // 基础样式（全局）
        scopedThemeCSS, // 主题样式（限制在对应预览区域）
      ].filter(Boolean).join('\n\n')

      // 6. 使用 PostCSS 处理 CSS（简化 calc() 表达式等）
      mergedCSS = await processCSS(mergedCSS)

      style.textContent = mergedCSS
      document.head.appendChild(style)
    }
    catch (error) {
      console.error(`Failed to inject theme ${theme.key}:`, error)
      // 降级处理：使用简单的作用域包装
      let themeCSS = themeMap.default
      if (theme.key !== 'default') {
        const specificThemeCSS = themeMap[theme.key]
        if (specificThemeCSS) {
          themeCSS = `${themeCSS}\n\n${specificThemeCSS}`
        }
      }
      const scopedCSS = themeCSS.replace(
        /(^|\n)([^{}]+)\{/g,
        `$1#output-${theme.key} $2{`,
      )
      style.textContent = scopedCSS
      document.head.appendChild(style)
    }
  }
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

    // 注入所有主题样式（异步）
    await injectThemeStyles()

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

// 处理主题提交按钮点击
function handleSubmitTheme() {
  window.open('https://ns29uimsog.feishu.cn/wiki/Tp7mwtC2GiTvfBkWzJZcwTWbnFh?from=from_copylink', '_blank', 'noopener,noreferrer')
}
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
            <div class="submit-theme-container">
              <button
                class="submit-theme-button inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3 py-1"
                @click="handleSubmitTheme"
              >
                提交主题
              </button>
              <div class="submit-theme-tooltip">
                <div class="tooltip-content">
                  <h3>主题投稿</h3>
                  <p>如果你也希望自己的主题可以让更多人使用，欢迎前往该地址进行主题投递，审核通过后将会在页面中展示。</p>
                  <div class="submit-info">
                    <p><strong>主题提交地址:</strong></p>
                    <p class="link-info">
                      飞书文档提交区
                    </p>
                    <p class="password-info">
                      密码：<code>999&992W</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主题预览网格 -->
    <div class="container mx-auto px-4 py-8 relative z-10">
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
  /*
  More comprehensive version at shenanigans.shoghisimon.ca/collection/css-rain-bg/
   */
.preview-container {
  width: 100%;
  min-height: 100vh;
  background: #cae9f1;
  background-image:
    radial-gradient(4px 100px at 0px 235px, #272257, #0000), radial-gradient(4px 100px at 300px 235px, #272257, #0000),
    radial-gradient(1.5px 1.5px at 150px 117.5px, #272257 100%, #0000 150%),
    radial-gradient(4px 100px at 0px 252px, #272257, #0000), radial-gradient(4px 100px at 300px 252px, #272257, #0000),
    radial-gradient(1.5px 1.5px at 150px 126px, #272257 100%, #0000 150%),
    radial-gradient(4px 100px at 0px 150px, #272257, #0000), radial-gradient(4px 100px at 300px 150px, #272257, #0000),
    radial-gradient(1.5px 1.5px at 150px 75px, #272257 100%, #0000 150%),
    radial-gradient(4px 100px at 0px 253px, #272257, #0000), radial-gradient(4px 100px at 300px 253px, #272257, #0000),
    radial-gradient(1.5px 1.5px at 150px 126.5px, #272257 100%, #0000 150%),
    radial-gradient(4px 100px at 0px 204px, #272257, #0000), radial-gradient(4px 100px at 300px 204px, #272257, #0000),
    radial-gradient(1.5px 1.5px at 150px 102px, #272257 100%, #0000 150%),
    radial-gradient(4px 100px at 0px 134px, #272257, #0000), radial-gradient(4px 100px at 300px 134px, #272257, #0000),
    radial-gradient(1.5px 1.5px at 150px 67px, #272257 100%, #0000 150%),
    radial-gradient(4px 100px at 0px 179px, #272257, #0000), radial-gradient(4px 100px at 300px 179px, #272257, #0000),
    radial-gradient(1.5px 1.5px at 150px 89.5px, #272257 100%, #0000 150%),
    radial-gradient(4px 100px at 0px 299px, #272257, #0000), radial-gradient(4px 100px at 300px 299px, #272257, #0000),
    radial-gradient(1.5px 1.5px at 150px 149.5px, #272257 100%, #0000 150%),
    radial-gradient(4px 100px at 0px 215px, #272257, #0000), radial-gradient(4px 100px at 300px 215px, #272257, #0000),
    radial-gradient(1.5px 1.5px at 150px 107.5px, #272257 100%, #0000 150%),
    radial-gradient(4px 100px at 0px 281px, #272257, #0000), radial-gradient(4px 100px at 300px 281px, #272257, #0000),
    radial-gradient(1.5px 1.5px at 150px 140.5px, #272257 100%, #0000 150%),
    radial-gradient(4px 100px at 0px 158px, #272257, #0000), radial-gradient(4px 100px at 300px 158px, #272257, #0000),
    radial-gradient(1.5px 1.5px at 150px 79px, #272257 100%, #0000 150%),
    radial-gradient(4px 100px at 0px 210px, #272257, #0000), radial-gradient(4px 100px at 300px 210px, #272257, #0000),
    radial-gradient(1.5px 1.5px at 150px 105px, #272257 100%, #0000 150%);
  background-size:
    300px 235px,
    300px 235px,
    300px 235px,
    300px 252px,
    300px 252px,
    300px 252px,
    300px 150px,
    300px 150px,
    300px 150px,
    300px 253px,
    300px 253px,
    300px 253px,
    300px 204px,
    300px 204px,
    300px 204px,
    300px 134px,
    300px 134px,
    300px 134px,
    300px 179px,
    300px 179px,
    300px 179px,
    300px 299px,
    300px 299px,
    300px 299px,
    300px 215px,
    300px 215px,
    300px 215px,
    300px 281px,
    300px 281px,
    300px 281px,
    300px 158px,
    300px 158px,
    300px 158px,
    300px 210px,
    300px 210px,
    300px 210px;
  animation: rain-animation 150s linear infinite;
  position: relative;
  overflow: hidden;
}

.preview-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.7) 40%,
    rgba(255, 255, 255, 0) 100%
  );
  pointer-events: none;
  z-index: 1;
}

@keyframes rain-animation {
  0% {
    background-position:
      0px 220px,
      3px 220px,
      151.5px 337.5px,
      25px 24px,
      28px 24px,
      176.5px 150px,
      50px 16px,
      53px 16px,
      201.5px 91px,
      75px 224px,
      78px 224px,
      226.5px 350.5px,
      100px 19px,
      103px 19px,
      251.5px 121px,
      125px 120px,
      128px 120px,
      276.5px 187px,
      150px 31px,
      153px 31px,
      301.5px 120.5px,
      175px 235px,
      178px 235px,
      326.5px 384.5px,
      200px 121px,
      203px 121px,
      351.5px 228.5px,
      225px 224px,
      228px 224px,
      376.5px 364.5px,
      250px 26px,
      253px 26px,
      401.5px 105px,
      275px 75px,
      278px 75px,
      426.5px 180px;
  }
  to {
    background-position:
      0px 6800px,
      3px 6800px,
      151.5px 6917.5px,
      25px 13632px,
      28px 13632px,
      176.5px 13758px,
      50px 5416px,
      53px 5416px,
      201.5px 5491px,
      75px 17175px,
      78px 17175px,
      226.5px 17301.5px,
      100px 5119px,
      103px 5119px,
      251.5px 5221px,
      125px 8428px,
      128px 8428px,
      276.5px 8495px,
      150px 9876px,
      153px 9876px,
      301.5px 9965.5px,
      175px 13391px,
      178px 13391px,
      326.5px 13540.5px,
      200px 14741px,
      203px 14741px,
      351.5px 14848.5px,
      225px 18770px,
      228px 18770px,
      376.5px 18910.5px,
      250px 5082px,
      253px 5082px,
      401.5px 5161px,
      275px 6375px,
      278px 6375px,
      426.5px 6480px;
  }
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

/* 提交主题按钮样式 */
.submit-theme-container {
  position: relative;
}

.submit-theme-button {
  transition: all 0.2s ease;
  background: #4f46e5;
  color: white !important;
  border: 1px solid #4f46e5;
  font-weight: 500;
}

.submit-theme-button:hover {
  background: #4338ca !important;
  border-color: #4338ca;
}

.submit-theme-tooltip {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 1000;
}

.submit-theme-container:hover .submit-theme-tooltip {
  opacity: 1;
  visibility: visible;
}

.tooltip-content {
  background: #ffffff;
  color: #374151;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  width: 280px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  position: relative;
  border: 1px solid #e5e7eb;
}

.tooltip-content::before {
  content: '';
  position: absolute;
  top: -8px;
  right: 24px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid #ffffff;
}

.tooltip-content h3 {
  margin: 0 0 12px 0;
  color: #111827;
  font-size: 16px;
  font-weight: 600;
}

.tooltip-content p {
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
}

.submit-info {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  margin-top: 12px;
}

.submit-info p {
  margin: 0 0 8px 0;
  font-size: 13px;
}

.submit-info p:last-child {
  margin-bottom: 0;
}

.link-info {
  color: #4f46e5;
  font-weight: 500;
}

.password-info {
  color: #6b7280;
  font-size: 12px;
}

.password-info code {
  background: #f3f4f6;
  color: #374151;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid #d1d5db;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tooltip-content {
    width: 260px;
    right: -50px;
  }

  .tooltip-content::before {
    right: 74px;
  }
}
</style>
