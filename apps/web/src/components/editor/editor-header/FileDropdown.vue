<script setup lang="ts">
import { Download, FileCode, FileCog, FileText, Upload, Monitor } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editor'
import { useExportStore } from '@/stores/export'
import { usePostStore } from '@/stores/post'
import { openInDesktop } from '@/utils/desktopBridge'

const props = withDefaults(defineProps<{
  asSub?: boolean
}>(), {
  asSub: false,
})

const emit = defineEmits([`openEditorState`])

const { asSub } = toRefs(props)

const editorStore = useEditorStore()
const exportStore = useExportStore()
const postStore = usePostStore()

const importMarkdownContent = useImportMarkdownContent()

function openEditorStateDialog() {
  emit(`openEditorState`)
}

// Export functions
function exportEditorContent2HTML() {
  exportStore.exportEditorContent2HTML()
}

function exportEditorContent2PureHTML() {
  exportStore.exportEditorContent2PureHTML(editorStore.getContent())
}

function exportEditorContent2MD() {
  exportStore.exportEditorContent2MD(editorStore.getContent())
}

function downloadAsCardImage() {
  exportStore.downloadAsCardImage()
}

// 在桌面版中打开
async function openInDesktopApp() {
  const content = editorStore.getContent()
  const currentPost = postStore.currentPost
  const filename = currentPost?.title || 'untitled'

  await openInDesktop(content, filename)
}

function exportEditorContent2PDF() {
  exportStore.exportEditorContent2PDF()
}
</script>

<template>
  <!-- 作为 MenubarSub 使用 -->
  <MenubarSub v-if="asSub">
    <MenubarSubTrigger>
      文件
    </MenubarSubTrigger>
    <MenubarSubContent>
      <MenubarItem @click="importMarkdownContent()">
        <Upload class="mr-2 size-4" />
        导入 .md
      </MenubarItem>
      <MenubarSeparator />
      <MenubarItem @click="openInDesktopApp()">
        <Monitor class="mr-2 size-4" />
        在桌面版中打开
      </MenubarItem>
      <MenubarItem @click="exportEditorContent2MD()">
        <Download class="mr-2 size-4" />
        导出 .md
      </MenubarItem>
      <MenubarItem @click="exportEditorContent2HTML()">
        <FileCode class="mr-2 size-4" />
        导出 .html
      </MenubarItem>
      <MenubarItem @click="exportEditorContent2PureHTML()">
        <FileCode class="mr-2 size-4" />
        导出 .html（无样式）
      </MenubarItem>
      <MenubarItem @click="exportEditorContent2PDF()">
        <FileText class="mr-2 size-4" />
        导出 .pdf
      </MenubarItem>
      <MenubarItem @click="downloadAsCardImage()">
        <Download class="mr-2 size-4" />
        导出 .png
      </MenubarItem>
      <MenubarSeparator />
      <MenubarItem @click="openEditorStateDialog()">
        <FileCog class="mr-2 size-4" />
        导入/导出项目配置
      </MenubarItem>
    </MenubarSubContent>
  </MenubarSub>

  <!-- 作为 MenubarMenu 使用（默认） -->
  <MenubarMenu v-else>
    <MenubarTrigger>
      文件
    </MenubarTrigger>
    <MenubarContent align="start">
      <MenubarItem @click="importMarkdownContent()">
        <Upload class="mr-2 size-4" />
        导入 .md
      </MenubarItem>
      <MenubarSeparator />
      <MenubarItem @click="openInDesktopApp()">
        <Monitor class="mr-2 size-4" />
        在桌面版中打开
      </MenubarItem>
      <MenubarItem @click="exportEditorContent2MD()">
        <Download class="mr-2 size-4" />
        导出 .md
      </MenubarItem>
      <MenubarItem @click="exportEditorContent2HTML()">
        <FileCode class="mr-2 size-4" />
        导出 .html
      </MenubarItem>
      <MenubarItem @click="exportEditorContent2PureHTML()">
        <FileCode class="mr-2 size-4" />
        导出 .html（无样式）
      </MenubarItem>
      <MenubarItem @click="exportEditorContent2PDF()">
        <FileText class="mr-2 size-4" />
        导出 .pdf
      </MenubarItem>
      <MenubarItem @click="downloadAsCardImage()">
        <Download class="mr-2 size-4" />
        导出 .png
      </MenubarItem>
      <MenubarSeparator />
      <MenubarItem @click="openEditorStateDialog()">
        <FileCog class="mr-2 size-4" />
        导入/导出项目配置
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</template>
