<script setup lang="ts">
import { ChevronDownIcon, Code, Menu, Monitor, Moon, PanelLeft, PanelLeftClose, PanelLeftOpen, Sun, List } from 'lucide-vue-next'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Menubar, MenubarContent, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar'
import { Separator } from '@/components/ui/separator'
import { useEditorStore } from '@/stores/editor'
import { useExportStore } from '@/stores/export'
import { useRenderStore } from '@/stores/render'
import { useThemeStore } from '@/stores/theme'
import { useUIStore } from '@/stores/ui'
import { addPrefix, generatePureHTML, processClipboardContent, store } from '@/utils'
import { widthOptions } from '@welight/shared/configs'
import FormatDropdown from './FormatDropdown.vue'
import SettingsDropdown from './SettingsDropdown.vue'

const emit = defineEmits([`startCopy`, `endCopy`])

const editorStore = useEditorStore()
const themeStore = useThemeStore()
const renderStore = useRenderStore()
const uiStore = useUIStore()
const exportStore = useExportStore()

const { editor } = storeToRefs(editorStore)
const { output } = storeToRefs(renderStore)
const { primaryColor, previewWidth } = storeToRefs(themeStore)
const { isOpenRightSlider, isOpenPostSlider, isDark, isPinFloatingToc, isShowCssEditor } = storeToRefs(uiStore)

// Editor refresh function
function editorRefresh() {
  themeStore.updateCodeTheme()

  const raw = editorStore.getContent()
  renderStore.render(raw, {
    isCiteStatus: themeStore.isCiteStatus,
    legend: themeStore.legend,
    isUseIndent: themeStore.isUseIndent,
    isUseJustify: themeStore.isUseJustify,
    isCountStatus: themeStore.isCountStatus,
    isMacCodeBlock: themeStore.isMacCodeBlock,
    isShowLineNumber: themeStore.isShowLineNumber,
  })
}

// 对话框状态
const aboutDialogVisible = ref(false)
const fundDialogVisible = ref(false)
const editorStateDialogVisible = ref(false)

// 处理帮助菜单事件
function handleOpenAbout() {
  aboutDialogVisible.value = true
}

function handleOpenFund() {
  fundDialogVisible.value = true
}



function handleOpenEditorState() {
  editorStateDialogVisible.value = true
}

// 切换内容管理侧边栏
function togglePostSlider() {
  isOpenPostSlider.value = !isOpenPostSlider.value
}

// 切换主题设置面板
function toggleRightSlider() {
  isOpenRightSlider.value = !isOpenRightSlider.value
}

// 预览模式切换
function previewWidthChanged(newWidth: string) {
  themeStore.previewWidth = newWidth
  editorRefresh()
}

// 深色模式切换
function toggleDarkMode() {
  uiStore.toggleDark()
}

// 浮动目录切换
function toggleFloatingToc() {
  uiStore.togglePinFloatingToc()
}

// CSS编辑器切换
function toggleCssEditor() {
  uiStore.toggleShowCssEditor()
}

const copyMode = useStorage(addPrefix(`copyMode`), `txt`)

const { copy: copyContent } = useClipboard({
  legacy: true,
})

const delay = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms))

const normalizeErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

async function writeClipboardItems(items: ClipboardItem[]) {
  if (!navigator.clipboard?.write) {
    throw new Error(`Clipboard API not available.`)
  }

  await delay(0)
  await navigator.clipboard.write(items)
}

function fallbackCopyUsingExecCommand(htmlContent: string) {
  const selection = window.getSelection()

  if (!selection) {
    return false
  }

  const tempContainer = document.createElement(`div`)
  tempContainer.innerHTML = htmlContent
  tempContainer.style.position = `fixed`
  tempContainer.style.left = `-9999px`
  tempContainer.style.top = `0`
  tempContainer.style.opacity = `0`
  tempContainer.style.pointerEvents = `none`
  tempContainer.style.setProperty(`background-color`, `#ffffff`, `important`)
  tempContainer.style.setProperty(`color`, `#000000`, `important`)

  document.body.appendChild(tempContainer)

  const htmlElement = document.documentElement
  const wasDark = htmlElement.classList.contains(`dark`)
  let successful = false

  try {
    if (wasDark) {
      htmlElement.classList.remove(`dark`)
    }

    const range = document.createRange()
    range.selectNodeContents(tempContainer)
    selection.removeAllRanges()
    selection.addRange(range)

    successful = document.execCommand(`copy`)
  }
  catch {
    successful = false
  }
  finally {
    selection.removeAllRanges()
    tempContainer.remove()

    if (wasDark) {
      htmlElement.classList.add(`dark`)
    }
  }

  return successful
}

// 复制到微信公众号
async function copy() {
  // 如果是 Markdown 源码，直接复制并返回
  if (copyMode.value === `md`) {
    const mdContent = editor.value?.state.doc.toString() || ``
    await copyContent(mdContent)
    toast.success(`已复制 Markdown 源码到剪贴板。`)
    return
  }

  // 以下处理非 Markdown 的复制流程
  emit(`startCopy`)

  setTimeout(() => {
    nextTick(async () => {
      try {
        await processClipboardContent(primaryColor.value)
      }
      catch (error) {
        toast.error(`处理 HTML 失败，请联系开发者。${normalizeErrorMessage(error)}`)
        editorRefresh()
        emit(`endCopy`)
        return
      }

      const clipboardDiv = document.getElementById(`output`)

      if (!clipboardDiv) {
        toast.error(`未找到复制输出区域，请刷新页面后重试。`)
        editorRefresh()
        emit(`endCopy`)
        return
      }

      clipboardDiv.focus()
      window.getSelection()?.removeAllRanges()

      const temp = clipboardDiv.innerHTML

      if (copyMode.value === `txt`) {
        try {
          if (typeof ClipboardItem === `undefined`) {
            throw new TypeError(`ClipboardItem is not supported in this browser.`)
          }

          const plainText = clipboardDiv.textContent || ``
          const clipboardItem = new ClipboardItem({
            'text/html': new Blob([temp], { type: `text/html` }),
            'text/plain': new Blob([plainText], { type: `text/plain` }),
          })

          await writeClipboardItems([clipboardItem])
        }
        catch (error) {
          const fallbackSucceeded = fallbackCopyUsingExecCommand(temp)
          if (!fallbackSucceeded) {
            clipboardDiv.innerHTML = output.value
            window.getSelection()?.removeAllRanges()
            editorRefresh()
            toast.error(`复制失败，请联系开发者。${normalizeErrorMessage(error)}`)
            emit(`endCopy`)
            return
          }
        }
      }

      clipboardDiv.innerHTML = output.value

      // 输出提示
      toast.success(`已复制渲染后的内容到剪贴板，可直接到公众号后台粘贴。`)
      window.dispatchEvent(
        new CustomEvent(`copyToMp`, {
          detail: {
            content: output.value,
          },
        }),
      )
      editorRefresh()
      emit(`endCopy`)
    })
  }, 350)
}
</script>

<template>
  <header
    class="header-container h-15 flex flex-wrap items-center justify-between relative"
  >
    <!-- 左侧区域 -->
    <div class="flex items-center">
      <!-- 内容管理侧边栏切换按钮 -->
      <Button
        variant="ghost"
        size="icon"
        class="hidden md:flex ml-2 mr-1"
        :class="{ 'bg-accent': isOpenPostSlider }"
        @click="togglePostSlider"
        title="切换内容管理"
      >
        <PanelLeftOpen v-if="!isOpenPostSlider" class="h-4 w-4" />
        <PanelLeftClose v-else class="h-4 w-4" />
      </Button>

      <!-- 桌面端菜单 -->
      <div class="hidden md:flex ml-1">
        <Menubar class="menubar border-0">
          <FileDropdown @open-editor-state="handleOpenEditorState" />
          <FormatDropdown />
          <EditDropdown />
          <StyleDropdown />
          <SettingsDropdown />
          <HelpDropdown @open-about="handleOpenAbout" @open-fund="handleOpenFund" />
        </Menubar>
      </div>


    </div>

    <!-- 移动端按钮组 -->
    <div class="md:hidden flex items-center ml-2">
      <!-- 内容管理侧边栏切换按钮 -->
      <Button
        variant="ghost"
        size="icon"
        class="mr-2"
        :class="{ 'bg-accent': isOpenPostSlider }"
        @click="togglePostSlider"
        title="切换内容管理"
      >
        <PanelLeftOpen v-if="!isOpenPostSlider" class="h-4 w-4" />
        <PanelLeftClose v-else class="h-4 w-4" />
      </Button>

      <!-- 汉堡菜单按钮 -->
      <Menubar class="menubar border-0 p-0">
        <MenubarMenu>
          <MenubarTrigger class="p-0">
            <Button variant="outline" size="icon">
              <Menu class="size-4" />
            </Button>
          </MenubarTrigger>
          <MenubarContent align="start">
            <FileDropdown :as-sub="true" @open-editor-state="handleOpenEditorState" />
            <FormatDropdown :as-sub="true" />
            <EditDropdown :as-sub="true" />
            <StyleDropdown :as-sub="true" />
            <SettingsDropdown :as-sub="true" />
            <HelpDropdown :as-sub="true" @open-about="handleOpenAbout" @open-fund="handleOpenFund" />
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>

    <!-- 右侧操作区 -->
    <div class="space-x-2 flex flex-wrap items-center mr-5">
      <!-- 预览模式 -->
      <div class="hidden md:flex items-center space-x-2">
        <Monitor class="h-4 w-4 text-muted-foreground" />
        <label class="preview-switch">
          <input
            :checked="previewWidth === 'w-full'"
            type="checkbox"
            @change="() => previewWidthChanged(previewWidth === 'w-full' ? 'w-[375px]' : 'w-full')"
          >
          <div class="preview-slider">
            <span>移动端</span>
            <span>电脑端</span>
          </div>
        </label>
      </div>

      <!-- 深色模式 -->
      <div class="hidden md:flex items-center space-x-2">
        <component :is="isDark ? 'span' : 'span'" class="text-xs">
          ☀️
        </component>
        <div class="toggle-wrapper">
          <input
            :checked="isDark"
            type="checkbox"
            class="toggle-checkbox"
            @change="toggleDarkMode"
          >
          <div class="toggle-container">
            <div class="toggle-button">
              <div class="toggle-button-circles-container">
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
              </div>
            </div>
          </div>
        </div>
        <span class="text-xs">🌑</span>
      </div>

      <!-- CSS编辑器 -->
      <div class="hidden md:flex items-center space-x-2">
        <Code class="h-4 w-4 text-muted-foreground" />
        <div class="toggle-wrapper">
          <input
            :checked="isShowCssEditor"
            type="checkbox"
            class="toggle-checkbox"
            @change="toggleCssEditor"
          >
          <div class="toggle-container">
            <div class="toggle-button">
              <div class="toggle-button-circles-container">
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
                <div class="toggle-button-circle" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 复制按钮 -->
      <button class="copy-btn" @click="copy">
        <span class="copy-text">复制</span>
        <span class="copy-svg-icon">
          <svg fill="white" viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M280 64h40c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128C0 92.7 28.7 64 64 64h40 9.6C121 27.5 153.3 0 192 0s71 27.5 78.4 64H280zM64 112c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16H320c8.8 0 16-7.2 16-16V128c0-8.8-7.2-16-16-16H304v24c0 13.3-10.7 24-24 24H192 104c-13.3 0-24-10.7-24-24V112H64zm128-8a24 24 0 1 0 0-48 24 24 0 1 0 0 48z" />
          </svg>
        </span>
      </button>

      <!-- 样式面板按钮 - 手绘风格 -->
      <button
        class="theme-button ml-2"
        @click="toggleRightSlider"
        title="切换样式面板"
      >
        <svg
          class="button-cosm"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          fill="#000000"
          width="128"
          height="128"
          viewBox="0 0 256 256"
          id="Flat"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M243.07324,157.43945c-1.2334-1.47949-23.18847-27.34619-60.46972-41.05859-1.67579-17.97412-8.25293-34.36328-18.93653-46.87158C149.41309,52.8208,128.78027,44,104,44,54.51074,44,22.10059,88.57715,20.74512,90.4751a3.99987,3.99987,0,0,0,6.50781,4.65234C27.5625,94.6958,58.68359,52,104,52c22.36816,0,40.89648,7.85107,53.584,22.70508,8.915,10.437,14.65625,23.9541,16.65528,38.894A133.54185,133.54185,0,0,0,136,108c-25.10742,0-46.09473,6.48486-60.69434,18.75391-12.65234,10.63379-19.91015,25.39355-19.91015,40.49463a43.61545,43.61545,0,0,0,12.69336,31.21923C76.98438,207.3208,89.40234,212,104,212c23.98047,0,44.37305-9.4668,58.97461-27.37744,12.74512-15.6333,20.05566-37.145,20.05566-59.01953,0-.1128-.001-.22559-.001-.33838,33.62988,13.48486,53.62207,36.96631,53.89746,37.2959a4.00015,4.00015,0,0,0,6.14648-5.1211ZM104,204c-27.89746,0-40.60449-19.05078-40.60449-36.75146C63.39551,142.56592,86.11621,116,136,116a124.37834,124.37834,0,0,1,38.97266,6.32617q.05712,1.63038.05761,3.27686C175.03027,177.07129,139.29785,204,104,204Z"
          ></path>
        </svg>
        <svg
          class="highlight"
          viewBox="0 0 144.75738 77.18431"
          preserveAspectRatio="none"
        >
          <g transform="translate(-171.52826,-126.11624) scale(0.6)">
            <g
              fill="none"
              stroke-width="8"
              stroke-linecap="round"
              stroke-miterlimit="10"
            >
              <path
                d="M180.02826,169.45123c0,0 12.65228,-25.55115 24.2441,-25.66863c6.39271,-0.06479 -5.89143,46.12943 4.90937,50.63857c10.22345,4.2681 24.14292,-52.38336 37.86455,-59.80493c3.31715,-1.79413 -5.35094,45.88889 -0.78872,58.34589c5.19371,14.18125 33.36934,-58.38221 36.43049,-56.91633c4.67078,2.23667 -0.06338,44.42744 5.22574,47.53647c6.04041,3.55065 19.87185,-20.77286 19.87185,-20.77286"
              ></path>
            </g>
          </g>
        </svg>
        主题设置
      </button>






    </div>
  </header>

  <!-- 对话框组件，嵌套菜单无法正常挂载，需要提取层级 -->
  <AboutDialog :visible="aboutDialogVisible" @close="aboutDialogVisible = false" />
  <FundDialog :visible="fundDialogVisible" @close="fundDialogVisible = false" />
  <EditorStateDialog :visible="editorStateDialogVisible" @close="editorStateDialogVisible = false" />
  <AIImageGeneratorPanel v-model:open="uiStore.aiImageDialogVisible" />

  <!-- SVG滤镜定义 -->
  <svg height="0" width="0">
    <filter id="handDrawnNoise">
      <feTurbulence
        result="noise"
        numOctaves="8"
        baseFrequency="0.1"
        type="fractalNoise"
      ></feTurbulence>
      <feDisplacementMap
        yChannelSelector="G"
        xChannelSelector="R"
        scale="3"
        in2="noise"
        in="SourceGraphic"
      ></feDisplacementMap>
    </filter>
    <filter id="handDrawnNoise2">
      <feTurbulence
        result="noise"
        numOctaves="8"
        baseFrequency="0.1"
        seed="1010"
        type="fractalNoise"
      ></feTurbulence>
      <feDisplacementMap
        yChannelSelector="G"
        xChannelSelector="R"
        scale="3"
        in2="noise"
        in="SourceGraphic"
      ></feDisplacementMap>
    </filter>

    <filter id="handDrawnNoiset">
      <feTurbulence
        result="noise"
        numOctaves="8"
        baseFrequency="0.1"
        type="fractalNoise"
      ></feTurbulence>
      <feDisplacementMap
        yChannelSelector="G"
        xChannelSelector="R"
        scale="6"
        in2="noise"
        in="SourceGraphic"
      ></feDisplacementMap>
    </filter>
    <filter id="handDrawnNoiset2">
      <feTurbulence
        result="noise"
        numOctaves="8"
        baseFrequency="0.1"
        seed="1010"
        type="fractalNoise"
      ></feTurbulence>
      <feDisplacementMap
        yChannelSelector="G"
        xChannelSelector="R"
        scale="6"
        in2="noise"
        in="SourceGraphic"
      ></feDisplacementMap>
    </filter>
  </svg>
</template>

<style lang="less" scoped>
.menubar {
  user-select: none;
}

kbd {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #a8a8a8;
  padding: 1px 4px;
  border-radius: 2px;
}

@media (max-width: 768px) {
  .menubar {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;

    > * {
      width: 100%;
      justify-content: flex-start;
    }
  }
}

/* CSS 编辑器开关样式 */
.toggle-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border-radius: 0.5em;
  padding: 0.125em;
  background-image: linear-gradient(to bottom, #d5d5d5, #e8e8e8);
  box-shadow: 0 1px 1px rgb(255 255 255 / 0.6);
  font-size: 1em;
}

.toggle-checkbox {
  appearance: none;
  position: absolute;
  z-index: 1;
  border-radius: inherit;
  width: 100%;
  height: 100%;
  font: inherit;
  opacity: 0;
  cursor: pointer;
}

.toggle-container {
  display: flex;
  align-items: center;
  position: relative;
  border-radius: 0.375em;
  width: 3em;
  height: 1.5em;
  background-color: #e8e8e8;
  box-shadow:
    inset 0 0 0.0625em 0.125em rgb(255 255 255 / 0.2),
    inset 0 0.0625em 0.125em rgb(0 0 0 / 0.4);
  transition: background-color 0.4s linear;
}

.toggle-checkbox:checked + .toggle-container {
  background-color: #06c05f;
}

.toggle-button {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 0.0625em;
  border-radius: 0.3125em;
  width: 1.375em;
  height: 1.375em;
  background-color: #e8e8e8;
  box-shadow:
    inset 0 -0.0625em 0.0625em 0.125em rgb(0 0 0 / 0.1),
    inset 0 -0.125em 0.0625em rgb(0 0 0 / 0.2),
    inset 0 0.1875em 0.0625em rgb(255 255 255 / 0.3),
    0 0.125em 0.125em rgb(0 0 0 / 0.5);
  transition: left 0.4s;
}

.toggle-checkbox:checked + .toggle-container > .toggle-button {
  left: 1.5625em;
}

.toggle-button-circles-container {
  display: grid;
  grid-template-columns: repeat(3, min-content);
  gap: 0.125em;
  position: absolute;
  margin: 0 auto;
}

.toggle-button-circle {
  border-radius: 50%;
  width: 0.125em;
  height: 0.125em;
  background-image: radial-gradient(circle at 50% 0, #f5f5f5, #c4c4c4);
}

/* 预览模式开关样式 */
.preview-switch {
  font-size: 10px;
  position: relative;
  display: inline-block;
  width: 100px;
  height: 2em;
}

.preview-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  color: #000;
  font-weight: 600;
  border-radius: 30px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  transition: 0.4s;
}

.preview-slider:before {
  position: absolute;
  content: '移动端';
  height: 90%;
  width: 48%;
  left: 2%;
  border-radius: 20px;
  background-color: white;
  color: green;
  display: grid;
  align-content: center;
  justify-content: center;
  box-shadow:
    0 1px 1px 0 rgba(0, 0, 0, 0.2),
    0 2px 4px 0 rgba(0, 0, 0, 0.2),
    0 -1px 0 0 rgba(0, 0, 0, 0.1) inset,
    0 -1.31em 1.31em -1.31em rgba(0, 0, 0, 0.3) inset,
    0 0 1px 0 rgba(0, 0, 0, 0.1);
  text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.15);
  transition: 0.4s;
}

.preview-slider:after {
  content: '';
  position: absolute;
  top: -7px;
  left: -7px;
  right: -7px;
  bottom: -7px;
  border-radius: 1.71em;
  background-image: linear-gradient(0deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.1));
  z-index: -1;
}

.preview-switch input:checked + .preview-slider {
  background-color: #06c05f;
  color: #fff;
}

.preview-switch input:checked + .preview-slider:before {
  content: '电脑端';
  transform: translateX(100%);
  color: green;
}

.preview-switch input {
  display: none;
}

/* 复制按钮样式 */
.copy-btn {
  width: 100px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border: none;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.164);
  cursor: pointer;
}

.copy-text {
  width: 65%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background-color: rgb(2, 153, 153);
  font-size: 14px;
  transition: background-color 0.3s;
}

.copy-svg-icon {
  width: 35%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background-color: teal;
  transition: background-color 0.3s;
}

.copy-btn:hover .copy-text {
  background-color: rgb(0, 133, 133);
}

.copy-btn:hover .copy-svg-icon {
  background-color: rgb(0, 105, 105);
}

/* 手绘风格主题按钮样式 */
.theme-button {
  text-align: center;
  transition: 0.3s ease-in-out;
  cursor: pointer;
  background-color: transparent;
  filter: url(#handDrawnNoise);
  display: inline-flex;
  align-items: center;
  user-select: none;
  font-family: "Courier New", monospace;
  font-size: 0.8rem;
  font-weight: bold;
  padding: 0.5em;
  border-width: 0px;
  border-radius: 1rem;
  box-shadow: #33333366 2px 2px 0 1px;
  animation: idle 1s infinite ease-in-out;
  position: relative;
}

.theme-button .highlight {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  fill: rgba(255, 225, 0, 0.5);
  stroke: rgba(255, 225, 0, 0.5);
  stroke-width: 10;
  stroke-linecap: round;
  pointer-events: none;
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  transition: stroke-dashoffset 0.5s ease-in-out;
}

@keyframes idle {
  0% {
    filter: url(#handDrawnNoise);
  }
  50% {
    rotate: 2.5deg;
    filter: url(#handDrawnNoise2);
  }
  100% {
    filter: url(#handDrawnNoise);
  }
}

.theme-button .button-cosm {
  fill: #33333366;
  transition: 0.3s ease-out;
  scale: 0.2;
  position: absolute;
  translate: calc(-100% + 8px) 0.2rem;
}

.theme-button:hover {
  font-weight: bold;
  border-width: 0px;
  border-radius: 1rem;
  rotate: -2.5deg;
  animation: hover 2.5s infinite ease-in-out;
}

.theme-button:hover .highlight {
  stroke-dashoffset: 0;
}

.theme-button:active .highlight {
  stroke-dashoffset: 1000;
  animation:
    highlight 5s infinite,
    col 0.5s forwards;
  stroke: #bc4e2666;
}

@keyframes col {
  0% {
    stroke: rgba(255, 225, 0, 0.5);
  }
  100% {
    stroke: #1c98eb66;
  }
}

@keyframes highlight {
  0% {
    stroke-dashoffset: 0;
  }
  25% {
    stroke-dashoffset: 1000;
  }
  50% {
    stroke-dashoffset: 1000;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes hover {
  0% {
    rotate: 0deg;
    filter: url(#handDrawnNoise);
    translate: 0 0px;
  }
  25% {
    rotate: -1deg;
    filter: url(#handDrawnNoise2);
    translate: 0 -2px;
  }
  50% {
    rotate: 0deg;
    filter: url(#handDrawnNoise);
    translate: 0 2px;
  }
  75% {
    rotate: -1deg;
    filter: url(#handDrawnNoise2);
    translate: 0 -2px;
  }
  100% {
    rotate: 0deg;
    filter: url(#handDrawnNoise);
    translate: 0 0px;
  }
}

.theme-button:hover .button-cosm {
  rotate: -15deg;
  translate: calc(-100% + 6px) 0.3rem;
}

.theme-button:active .button-cosm {
  fill: #333333f1;
  rotate: -135deg;
  translate: calc(-100% + 15px) 0.1rem;
  animation: none;
}

.theme-button:active {
  font-weight: bold;
  border-width: 0px;
  border-radius: 1rem;
  box-shadow: inset #333333f1 2px 2px 0 1px;
  rotate: -2.5deg;
  animation: active 1s infinite ease-in-out;
}

@keyframes active {
  0% {
    filter: url(#handDrawnNoiset);
    translate: 0 -1px;
  }
  25% {
    rotate: -3deg;
  }
  50% {
    filter: url(#handDrawnNoiset2);
    translate: 0 1px;
  }
  66% {
    rotate: 1.5deg;
  }
  100% {
    filter: url(#handDrawnNoiset);
    translate: 0 -1px;
  }
}
</style>
