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

    <!-- 马里奥风格的主题提交按钮 -->
    <div class="mario-submit-button">
      <div class="brick one" />
      <div class="tooltip-mario-container">
        <div class="box" />
        <div class="mush">
          <div class="tooltip-content">
            <h3>🎨 主题投稿</h3>
            <p>如果你也希望自己的主题可以让更多人使用，欢迎前往该地址进行主题投递，审核通过后将会在页面中展示。</p>
            <div class="submit-info">
              <p><strong>主题提交地址:</strong></p>
              <a href="https://ns29uimsog.feishu.cn/wiki/Tp7mwtC2GiTvfBkWzJZcwTWbnFh?from=from_copylink" target="_blank" rel="noopener noreferrer">
                📝 点击前往提交区
              </a>
              <p class="password-info">
                🔑 密码：<code>999&992W</code>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="brick two" />
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

/* 马里奥风格按钮样式 */
.mario-submit-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 100;
}

.brick {
  height: 2px;
  width: 2px;
  box-shadow:
    2px 2px 0px #ff9999,
    4px 2px 0px #ff9999,
    6px 2px 0px #ff9999,
    8px 2px 0px #ff9999,
    10px 2px 0px #ff9999,
    12px 2px 0px #ff9999,
    14px 2px 0px #ff9999,
    16px 2px 0px #ff9999,
    18px 2px 0px #ff9999,
    20px 2px 0px #ff9999,
    22px 2px 0px #ff9999,
    24px 2px 0px #ff9999,
    26px 2px 0px #ff9999,
    28px 2px 0px #ff9999,
    30px 2px 0px #ff9999,
    32px 2px 0px #ff9999,
    2px 4px 0px #cc3300,
    4px 4px 0px #cc3300,
    6px 4px 0px #cc3300,
    8px 4px 0px #cc3300,
    10px 4px 0px #cc3300,
    12px 4px 0px #cc3300,
    14px 4px 0px #cc3300,
    16px 4px 0px #000,
    18px 4px 0px #cc3300,
    20px 4px 0px #cc3300,
    22px 4px 0px #cc3300,
    24px 4px 0px #cc3300,
    26px 4px 0px #cc3300,
    28px 4px 0px #cc3300,
    30px 4px 0px #cc3300,
    32px 4px 0px #000,
    2px 6px 0px #cc3300,
    4px 6px 0px #cc3300,
    6px 6px 0px #cc3300,
    8px 6px 0px #cc3300,
    10px 6px 0px #cc3300,
    12px 6px 0px #cc3300,
    14px 6px 0px #cc3300,
    16px 6px 0px #000,
    18px 6px 0px #cc3300,
    20px 6px 0px #cc3300,
    22px 6px 0px #cc3300,
    24px 6px 0px #cc3300,
    26px 6px 0px #cc3300,
    28px 6px 0px #cc3300,
    30px 6px 0px #cc3300,
    32px 6px 0px #000,
    2px 8px 0px #000,
    4px 8px 0px #000,
    6px 8px 0px #000,
    8px 8px 0px #000,
    10px 8px 0px #000,
    12px 8px 0px #000,
    14px 8px 0px #000,
    16px 8px 0px #000,
    18px 8px 0px #000,
    20px 8px 0px #000,
    22px 8px 0px #000,
    24px 8px 0px #000,
    26px 8px 0px #000,
    28px 8px 0px #000,
    30px 8px 0px #000,
    32px 8px 0px #000,
    2px 10px 0px #cc3300,
    4px 10px 0px #cc3300,
    6px 10px 0px #cc3300,
    8px 10px 0px #000,
    10px 10px 0px #cc3300,
    12px 10px 0px #cc3300,
    14px 10px 0px #cc3300,
    16px 10px 0px #cc3300,
    18px 10px 0px #cc3300,
    20px 10px 0px #cc3300,
    22px 10px 0px #cc3300,
    24px 10px 0px #000,
    26px 10px 0px #cc3300,
    28px 10px 0px #cc3300,
    30px 10px 0px #cc3300,
    32px 10px 0px #cc3300,
    2px 12px 0px #cc3300,
    4px 12px 0px #cc3300,
    6px 12px 0px #cc3300,
    8px 12px 0px #000,
    10px 12px 0px #cc3300,
    12px 12px 0px #cc3300,
    14px 12px 0px #cc3300,
    16px 12px 0px #cc3300,
    18px 12px 0px #cc3300,
    20px 12px 0px #cc3300,
    22px 12px 0px #cc3300,
    24px 12px 0px #000,
    26px 12px 0px #cc3300,
    28px 12px 0px #cc3300,
    30px 12px 0px #cc3300,
    32px 12px 0px #cc3300,
    2px 14px 0px #cc3300,
    4px 14px 0px #cc3300,
    6px 14px 0px #cc3300,
    8px 14px 0px #000,
    10px 14px 0px #cc3300,
    12px 14px 0px #cc3300,
    14px 14px 0px #cc3300,
    16px 14px 0px #cc3300,
    18px 14px 0px #cc3300,
    20px 14px 0px #cc3300,
    22px 14px 0px #cc3300,
    24px 14px 0px #000,
    26px 14px 0px #cc3300,
    28px 14px 0px #cc3300,
    30px 14px 0px #cc3300,
    32px 14px 0px #cc3300,
    2px 16px 0px #000,
    4px 16px 0px #000,
    6px 16px 0px #000,
    8px 16px 0px #000,
    10px 16px 0px #000,
    12px 16px 0px #000,
    14px 16px 0px #000,
    16px 16px 0px #000,
    18px 16px 0px #000,
    20px 16px 0px #000,
    22px 16px 0px #000,
    24px 16px 0px #000,
    26px 16px 0px #000,
    28px 16px 0px #000,
    30px 16px 0px #000,
    32px 16px 0px #000,
    2px 18px 0px #cc3300,
    4px 18px 0px #cc3300,
    6px 18px 0px #cc3300,
    8px 18px 0px #cc3300,
    10px 18px 0px #cc3300,
    12px 18px 0px #cc3300,
    14px 18px 0px #cc3300,
    16px 18px 0px #000,
    18px 18px 0px #cc3300,
    20px 18px 0px #cc3300,
    22px 18px 0px #cc3300,
    24px 18px 0px #cc3300,
    26px 18px 0px #cc3300,
    28px 18px 0px #cc3300,
    30px 18px 0px #cc3300,
    32px 18px 0px #000,
    2px 20px 0px #cc3300,
    4px 20px 0px #cc3300,
    6px 20px 0px #cc3300,
    8px 20px 0px #cc3300,
    10px 20px 0px #cc3300,
    12px 20px 0px #cc3300,
    14px 20px 0px #cc3300,
    16px 20px 0px #000,
    18px 20px 0px #cc3300,
    20px 20px 0px #cc3300,
    22px 20px 0px #cc3300,
    24px 20px 0px #cc3300,
    26px 20px 0px #cc3300,
    28px 20px 0px #cc3300,
    30px 20px 0px #cc3300,
    32px 20px 0px #000,
    2px 22px 0px #cc3300,
    4px 22px 0px #cc3300,
    6px 22px 0px #cc3300,
    8px 22px 0px #cc3300,
    10px 22px 0px #cc3300,
    12px 22px 0px #cc3300,
    14px 22px 0px #cc3300,
    16px 22px 0px #000,
    18px 22px 0px #cc3300,
    20px 22px 0px #cc3300,
    22px 22px 0px #cc3300,
    24px 22px 0px #cc3300,
    26px 22px 0px #cc3300,
    28px 22px 0px #cc3300,
    30px 22px 0px #cc3300,
    32px 22px 0px #000,
    2px 24px 0px #000,
    4px 24px 0px #000,
    6px 24px 0px #000,
    8px 24px 0px #000,
    10px 24px 0px #000,
    12px 24px 0px #000,
    14px 24px 0px #000,
    16px 24px 0px #000,
    18px 24px 0px #000,
    20px 24px 0px #000,
    22px 24px 0px #000,
    24px 24px 0px #000,
    26px 24px 0px #000,
    28px 24px 0px #000,
    30px 24px 0px #000,
    32px 24px 0px #000,
    2px 26px 0px #cc3300,
    4px 26px 0px #cc3300,
    6px 26px 0px #cc3300,
    8px 26px 0px #000,
    10px 26px 0px #cc3300,
    12px 26px 0px #cc3300,
    14px 26px 0px #cc3300,
    16px 26px 0px #cc3300,
    18px 26px 0px #cc3300,
    20px 26px 0px #cc3300,
    22px 26px 0px #cc3300,
    24px 26px 0px #000,
    26px 26px 0px #cc3300,
    28px 26px 0px #cc3300,
    30px 26px 0px #cc3300,
    32px 26px 0px #cc3300,
    2px 28px 0px #cc3300,
    4px 28px 0px #cc3300,
    6px 28px 0px #cc3300,
    8px 28px 0px #000,
    10px 28px 0px #cc3300,
    12px 28px 0px #cc3300,
    14px 28px 0px #cc3300,
    16px 28px 0px #cc3300,
    18px 28px 0px #cc3300,
    20px 28px 0px #cc3300,
    22px 28px 0px #cc3300,
    24px 28px 0px #000,
    26px 28px 0px #cc3300,
    28px 28px 0px #cc3300,
    30px 28px 0px #cc3300,
    32px 28px 0px #cc3300,
    2px 30px 0px #cc3300,
    4px 30px 0px #cc3300,
    6px 30px 0px #cc3300,
    8px 30px 0px #000,
    10px 30px 0px #cc3300,
    12px 30px 0px #cc3300,
    14px 30px 0px #cc3300,
    16px 30px 0px #cc3300,
    18px 30px 0px #cc3300,
    20px 30px 0px #cc3300,
    22px 30px 0px #cc3300,
    24px 30px 0px #000,
    26px 30px 0px #cc3300,
    28px 30px 0px #cc3300,
    30px 30px 0px #cc3300,
    32px 30px 0px #cc3300,
    2px 32px 0px #000,
    4px 32px 0px #000,
    6px 32px 0px #000,
    8px 32px 0px #000,
    10px 32px 0px #000,
    12px 32px 0px #000,
    14px 32px 0px #000,
    16px 32px 0px #000,
    18px 32px 0px #000,
    20px 32px 0px #000,
    22px 32px 0px #000,
    24px 32px 0px #000,
    26px 32px 0px #000,
    28px 32px 0px #000,
    30px 32px 0px #000,
    32px 32px 0px #000;
}

.brick.one {
  transform: translateX(-60px);
}

.mush {
  height: 2px;
  width: 2px;
  transform: translate(-0px, -0px);
  z-index: -1;
  opacity: 0;
}

.box {
  position: absolute;
  background-color: rgba(46, 37, 37, 0);
  z-index: 3;
  width: 34px;
  height: 34px;
  cursor: pointer;
}

.box:hover + .mush {
  animation: mush 0.5s linear forwards;
  opacity: 1;
}

@keyframes mush {
  0% {
    transform: scale(0.8) translate(-8px, -0px);
  }
  50% {
    transform: scale(1.1) translate(-8px, -80px);
  }
  100% {
    transform: scale(1.1) translate(-8px, -45px);
  }
}

.tooltip-mario-container {
  height: 2px;
  width: 2px;
  box-shadow:
    4px 2px 0px #ce3100,
    6px 2px 0px #ce3100,
    8px 2px 0px #ce3100,
    10px 2px 0px #ce3100,
    12px 2px 0px #ce3100,
    14px 2px 0px #ce3100,
    16px 2px 0px #ce3100,
    18px 2px 0px #ce3100,
    20px 2px 0px #ce3100,
    22px 2px 0px #ce3100,
    24px 2px 0px #ce3100,
    26px 2px 0px #ce3100,
    28px 2px 0px #ce3100,
    30px 2px 0px #ce3100,
    2px 4px 0px #ce3100,
    4px 4px 0px #ff9c31,
    6px 4px 0px #ff9c31,
    8px 4px 0px #ff9c31,
    10px 4px 0px #ff9c31,
    12px 4px 0px #ff9c31,
    14px 4px 0px #ff9c31,
    16px 4px 0px #ff9c31,
    18px 4px 0px #ff9c31,
    20px 4px 0px #ff9c31,
    22px 4px 0px #ff9c31,
    24px 4px 0px #ff9c31,
    26px 4px 0px #ff9c31,
    28px 4px 0px #ff9c31,
    30px 4px 0px #ff9c31,
    32px 4px 0px #000,
    2px 6px 0px #ce3100,
    4px 6px 0px #ff9c31,
    6px 6px 0px #000,
    8px 6px 0px #ff9c31,
    10px 6px 0px #ff9c31,
    12px 6px 0px #ff9c31,
    14px 6px 0px #ff9c31,
    16px 6px 0px #ff9c31,
    18px 6px 0px #ff9c31,
    20px 6px 0px #ff9c31,
    22px 6px 0px #ff9c31,
    24px 6px 0px #ff9c31,
    26px 6px 0px #ff9c31,
    28px 6px 0px #000,
    30px 6px 0px #ff9c31,
    32px 6px 0px #000,
    2px 8px 0px #ce3100,
    4px 8px 0px #ff9c31,
    6px 8px 0px #ff9c31,
    8px 8px 0px #ff9c31,
    10px 8px 0px #ff9c31,
    12px 8px 0px #ce3100,
    14px 8px 0px #ce3100,
    16px 8px 0px #ce3100,
    18px 8px 0px #ce3100,
    20px 8px 0px #ce3100,
    22px 8px 0px #ff9c31,
    24px 8px 0px #ff9c31,
    26px 8px 0px #ff9c31,
    28px 8px 0px #ff9c31,
    30px 8px 0px #ff9c31,
    32px 8px 0px #000,
    2px 10px 0px #ce3100,
    4px 10px 0px #ff9c31,
    6px 10px 0px #ff9c31,
    8px 10px 0px #ff9c31,
    10px 10px 0px #ce3100,
    12px 10px 0px #ce3100,
    14px 10px 0px #000,
    16px 10px 0px #000,
    18px 10px 0px #000,
    20px 10px 0px #ce3100,
    22px 10px 0px #ce3100,
    24px 10px 0px #ff9c31,
    26px 10px 0px #ff9c31,
    28px 10px 0px #ff9c31,
    30px 10px 0px #ff9c31,
    32px 10px 0px #000,
    2px 12px 0px #ce3100,
    4px 12px 0px #ff9c31,
    6px 12px 0px #ff9c31,
    8px 12px 0px #ff9c31,
    10px 12px 0px #ce3100,
    12px 12px 0px #ce3100,
    14px 12px 0px #000,
    16px 12px 0px #ff9c31,
    18px 12px 0px #ff9c31,
    20px 12px 0px #ce3100,
    22px 12px 0px #ce3100,
    24px 12px 0px #000,
    26px 12px 0px #ff9c31,
    28px 12px 0px #ff9c31,
    30px 12px 0px #ff9c31,
    32px 12px 0px #000,
    2px 14px 0px #ce3100,
    4px 14px 0px #ff9c31,
    6px 14px 0px #ff9c31,
    8px 14px 0px #ff9c31,
    10px 14px 0px #ce3100,
    12px 14px 0px #ce3100,
    14px 14px 0px #000,
    16px 14px 0px #ff9c31,
    18px 14px 0px #ff9c31,
    20px 14px 0px #ce3100,
    22px 14px 0px #ce3100,
    24px 14px 0px #000,
    26px 14px 0px #ff9c31,
    28px 14px 0px #ff9c31,
    30px 14px 0px #ff9c31,
    32px 14px 0px #000,
    2px 16px 0px #ce3100,
    4px 16px 0px #ff9c31,
    6px 16px 0px #ff9c31,
    8px 16px 0px #ff9c31,
    10px 16px 0px #ff9c31,
    12px 16px 0px #000,
    14px 16px 0px #000,
    16px 16px 0px #ff9c31,
    18px 16px 0px #ce3100,
    20px 16px 0px #ce3100,
    22px 16px 0px #ce3100,
    24px 16px 0px #000,
    26px 16px 0px #ff9c31,
    28px 16px 0px #ff9c31,
    30px 16px 0px #ff9c31,
    32px 16px 0px #000,
    2px 18px 0px #ce3100,
    4px 18px 0px #ff9c31,
    6px 18px 0px #ff9c31,
    8px 18px 0px #ff9c31,
    10px 18px 0px #ff9c31,
    12px 18px 0px #ff9c31,
    14px 18px 0px #ff9c31,
    16px 18px 0px #ce3100,
    18px 18px 0px #ce3100,
    20px 18px 0px #000,
    22px 18px 0px #000,
    24px 18px 0px #000,
    26px 18px 0px #ff9c31,
    28px 18px 0px #ff9c31,
    30px 18px 0px #ff9c31,
    32px 18px 0px #000,
    2px 20px 0px #ce3100,
    4px 20px 0px #ff9c31,
    6px 20px 0px #ff9c31,
    8px 20px 0px #ff9c31,
    10px 20px 0px #ff9c31,
    12px 20px 0px #ff9c31,
    14px 20px 0px #ff9c31,
    16px 20px 0px #ce3100,
    18px 20px 0px #ce3100,
    20px 20px 0px #000,
    22px 20px 0px #ff9c31,
    24px 20px 0px #ff9c31,
    26px 20px 0px #ff9c31,
    28px 20px 0px #ff9c31,
    30px 20px 0px #ff9c31,
    32px 20px 0px #000,
    2px 22px 0px #ce3100,
    4px 22px 0px #ff9c31,
    6px 22px 0px #ff9c31,
    8px 22px 0px #ff9c31,
    10px 22px 0px #ff9c31,
    12px 22px 0px #ff9c31,
    14px 22px 0px #ff9c31,
    16px 22px 0px #ff9c31,
    18px 22px 0px #000,
    20px 22px 0px #000,
    22px 22px 0px #ff9c31,
    24px 22px 0px #ff9c31,
    26px 22px 0px #ff9c31,
    28px 22px 0px #ff9c31,
    30px 22px 0px #ff9c31,
    32px 22px 0px #000,
    2px 24px 0px #ce3100,
    4px 24px 0px #ff9c31,
    6px 24px 0px #ff9c31,
    8px 24px 0px #ff9c31,
    10px 24px 0px #ff9c31,
    12px 24px 0px #ff9c31,
    14px 24px 0px #ff9c31,
    16px 24px 0px #ce3100,
    18px 24px 0px #ce3100,
    20px 24px 0px #ff9c31,
    22px 24px 0px #ff9c31,
    24px 24px 0px #ff9c31,
    26px 24px 0px #ff9c31,
    28px 24px 0px #ff9c31,
    30px 24px 0px #ff9c31,
    32px 24px 0px #000,
    2px 26px 0px #ce3100,
    4px 26px 0px #ff9c31,
    6px 26px 0px #ff9c31,
    8px 26px 0px #ff9c31,
    10px 26px 0px #ff9c31,
    12px 26px 0px #ff9c31,
    14px 26px 0px #ff9c31,
    16px 26px 0px #ce3100,
    18px 26px 0px #ce3100,
    20px 26px 0px #000,
    22px 26px 0px #ff9c31,
    24px 26px 0px #ff9c31,
    26px 26px 0px #ff9c31,
    28px 26px 0px #ff9c31,
    30px 26px 0px #ff9c31,
    32px 26px 0px #000,
    2px 28px 0px #ce3100,
    4px 28px 0px #ff9c31,
    6px 28px 0px #000,
    8px 28px 0px #ff9c31,
    10px 28px 0px #ff9c31,
    12px 28px 0px #ff9c31,
    14px 28px 0px #ff9c31,
    16px 28px 0px #ff9c31,
    18px 28px 0px #000,
    20px 28px 0px #000,
    22px 28px 0px #ff9c31,
    24px 28px 0px #ff9c31,
    26px 28px 0px #ff9c31,
    28px 28px 0px #000,
    30px 28px 0px #ff9c31,
    32px 28px 0px #000,
    2px 30px 0px #ce3100,
    4px 30px 0px #ff9c31,
    6px 30px 0px #ff9c31,
    8px 30px 0px #ff9c31,
    10px 30px 0px #ff9c31,
    12px 30px 0px #ff9c31,
    14px 30px 0px #ff9c31,
    16px 30px 0px #ff9c31,
    18px 30px 0px #ff9c31,
    20px 30px 0px #ff9c31,
    22px 30px 0px #ff9c31,
    24px 30px 0px #ff9c31,
    26px 30px 0px #ff9c31,
    28px 30px 0px #ff9c31,
    30px 30px 0px #ff9c31,
    32px 30px 0px #000,
    2px 32px 0px #000,
    4px 32px 0px #000,
    6px 32px 0px #000,
    8px 32px 0px #000,
    10px 32px 0px #000,
    12px 32px 0px #000,
    14px 32px 0px #000,
    16px 32px 0px #000,
    18px 32px 0px #000,
    20px 32px 0px #000,
    22px 32px 0px #000,
    24px 32px 0px #000,
    26px 32px 0px #000,
    28px 32px 0px #000,
    30px 32px 0px #000,
    32px 32px 0px #000;
  position: absolute;
  transform: translate(-30px);
  z-index: 3;
}

.tooltip-content {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  max-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 2px solid #ff9c31;
  position: relative;
  transform: translate(-120px, -20px);
}

.tooltip-content h3 {
  margin: 0 0 12px 0;
  color: #ff9c31;
  font-size: 16px;
  font-weight: bold;
}

.tooltip-content p {
  margin: 0 0 12px 0;
}

.submit-info {
  border-top: 1px solid #333;
  padding-top: 12px;
  margin-top: 12px;
}

.submit-info p {
  margin: 0 0 8px 0;
}

.submit-info a {
  color: #66a8ff;
  text-decoration: none;
  display: inline-block;
  padding: 6px 12px;
  background: rgba(102, 168, 255, 0.1);
  border-radius: 4px;
  border: 1px solid #66a8ff;
  transition: all 0.2s ease;
}

.submit-info a:hover {
  background: rgba(102, 168, 255, 0.2);
  transform: translateY(-1px);
}

.password-info {
  font-size: 12px;
  color: #ccc;
  margin-top: 8px !important;
}

.password-info code {
  background: rgba(255, 156, 49, 0.2);
  color: #ff9c31;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mario-submit-button {
    bottom: 20px;
    right: 20px;
  }

  .tooltip-content {
    max-width: 250px;
    font-size: 13px;
    transform: translate(-100px, -20px);
  }
}
</style>
