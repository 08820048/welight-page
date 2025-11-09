<script setup lang="ts">
import type { EditorView } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'
import { Bold, Code, Heading1, Heading2, Heading3, Italic, Link as LinkIcon, List, ListOrdered, Quote, Sparkles, Strikethrough } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { applyHeading, formatBold, formatCode, formatItalic, formatLink, formatOrderedList, formatStrikethrough, formatUnorderedList } from '@welight/shared/editor/format'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useUIStore } from '@/stores/ui'
import { AIPolishPopover } from '@/components/ai/tool-box'
import { toast } from '@/utils/toast'

const props = defineProps<{
  editorView?: EditorView | null
  container?: HTMLElement | null
}>()

const uiStore = useUIStore()
const { isMobile } = storeToRefs(uiStore)

// visibility & position
const visible = ref(false)
const top = ref(0)
const left = ref(0)
const selectedText = ref('')
const wrapperEl = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
type AIPreset = 'optimize' | 'summarize' | 'spellcheck' | 'translate-zh' | 'translate-en'
const lastMenuWidth = ref(360)

// AI states for output panel
const aiOpen = ref(false)
const aiPresetAction = ref<AIPreset>('optimize')
const aiRef = ref<any>(null)

// helpers
function getView(): EditorView | null {
  return props.editorView ?? null
}

function getSelectionText(view: EditorView) {
  const sel = view.state.selection.main
  return view.state.doc.sliceString(sel.from, sel.to)
}

function computePosition(view: EditorView) {
  const sel = view.state.selection.main
  if (sel.empty) return false
  const from = view.coordsAtPos(sel.from)
  const to = view.coordsAtPos(sel.to)
  const container = wrapperEl.value || (view.dom.parentElement as HTMLElement)
  if (!from || !to || !container) return false

  const containerRect = container.getBoundingClientRect()
  const cx = (Math.min(from.left, to.left) + Math.max(from.right, to.right)) / 2
  const cyTop = Math.min(from.top, to.top)

  let width = menuRef.value?.offsetWidth || lastMenuWidth.value || 360
  const x = cx - containerRect.left - width / 2
  const y = cyTop - containerRect.top - 44 // 44px above selection

  left.value = Math.max(8, Math.min(x, containerRect.width - width - 8))
  top.value = Math.max(8, y)
  selectedText.value = getSelectionText(view)

  nextTick(() => {
    const actual = menuRef.value?.offsetWidth || 0
    if (actual && Math.abs(actual - width) > 1) {
      lastMenuWidth.value = actual
      const nx = cx - containerRect.left - actual / 2
      left.value = Math.max(8, Math.min(nx, containerRect.width - actual - 8))
    }
  })

  return true
}

function maybeShow() {
  const view = getView()
  if (!view) return
  const sel = view.state.selection.main
  if (sel.empty) {
    visible.value = false
    return
  }
  // 首次显示：先让 DOM 挂载，再基于真实宽度定位
  if (!visible.value) {
    visible.value = true
    nextTick(() => {
      if (getView()) computePosition(getView()!)
    })
  }
  else {
    computePosition(view)
  }
}

function hide() {
  visible.value = false
}

function onKeyup() { maybeShow() }
function onMouseup() { maybeShow() }
function onScroll() { if (visible.value) maybeShow() }
function onResize() { if (visible.value) maybeShow() }

onMounted(() => {
  const view = getView()
  const container = (props.container as HTMLElement) || (view?.dom.parentElement as HTMLElement) || null
  wrapperEl.value = container
  if (view) {
    view.dom.addEventListener('keyup', onKeyup)
    view.dom.addEventListener('mouseup', onMouseup)
  }
  container?.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onResize)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide()
  })
})

onBeforeUnmount(() => {
  const view = getView()
  const container = wrapperEl.value
  if (view) {
    view.dom.removeEventListener('keyup', onKeyup)
    view.dom.removeEventListener('mouseup', onMouseup)
  }
  container?.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onResize)
})

// actions
function withView(action: (view: EditorView) => void) {
  const view = getView()
  if (!view) return
  action(view)
  view.focus()
  // keep selection menu visible but reposition
  nextTick(() => maybeShow())
}

function h1() { withView(v => applyHeading(v, 1)) }
function h2() { withView(v => applyHeading(v, 2)) }
function h3() { withView(v => applyHeading(v, 3)) }
function bold() { withView(v => formatBold(v)) }
function italic() { withView(v => formatItalic(v)) }
function strike() { withView(v => formatStrikethrough(v)) }
function link() { withView(v => formatLink(v)) }
function ilCode() { withView(v => formatCode(v)) }
function ul() { withView(v => formatUnorderedList(v)) }
function ol() { withView(v => formatOrderedList(v)) }
function quote() {
  withView((view) => {
    const sel = view.state.selection
    const ranges = sel.ranges
    const changes: { from: number, to: number, insert: string }[] = []
    for (const r of ranges) {
      const fromLine = view.state.doc.lineAt(r.from)
      const toLine = view.state.doc.lineAt(r.to)
      for (let lineNum = fromLine.number; lineNum <= toLine.number; lineNum++) {
        const line = view.state.doc.line(lineNum)
        const text = view.state.doc.sliceString(line.from, line.to)
        const updated = text.startsWith('> ')
          ? text.replace(/^>\s+/, '')
          : `> ${text}`
        changes.push({ from: line.from, to: line.to, insert: updated })
      }
    }
    if (changes.length)
      view.dispatch({ changes, selection: EditorSelection.range(ranges[0].from, ranges[0].to) })
  })
}

function runAIQuick(action: AIPreset) {
  const view = getView()
  if (!view) return
  const sel = view.state.selection.main
  if (sel.empty) {
    toast.error('请先选择文本')
    return
  }
  const text = view.state.doc.sliceString(sel.from, sel.to)
  if (!text.trim()) {
    toast.error('选中文本为空')
    return
  }
  selectedText.value = text
  aiPresetAction.value = action
  aiOpen.value = true
}
</script>

<template>
  <div v-if="visible" class="absolute z-50" :style="{ top: `${top}px`, left: `${left}px` }">
    <div ref="menuRef" class="flex items-center gap-1 rounded-xl border bg-background/95 px-2 py-1 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80">
      <button class="p-2 hover:bg-muted rounded-md text-xs font-medium" @click="h1">H1</button>
      <button class="p-2 hover:bg-muted rounded-md text-xs font-medium" @click="h2">H2</button>
      <button class="p-2 hover:bg-muted rounded-md text-xs font-medium" @click="h3">H3</button>
      <span class="mx-1 h-5 w-px bg-border" />
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="bold"><Bold class="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="italic"><Italic class="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="strike"><Strikethrough class="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="link"><LinkIcon class="h-4 w-4" /></Button>
      <span class="mx-1 h-5 w-px bg-border" />
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="ul"><List class="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="ol"><ListOrdered class="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="quote"><Quote class="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="ilCode"><Code class="h-4 w-4" /></Button>
      <!-- AI 功能已隐藏 -->
      <!-- <span class="mx-1 h-5 w-px bg-border" />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="h-8 w-8 text-primary" title="AI 工具">
            <Sparkles class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" class="min-w-40">
          <DropdownMenuItem @click="runAIQuick('optimize')">优化文本</DropdownMenuItem>
          <DropdownMenuItem @click="runAIQuick('summarize')">文章总结</DropdownMenuItem>
          <DropdownMenuItem @click="runAIQuick('spellcheck')">错别字纠正</DropdownMenuItem>
          <DropdownMenuItem @click="runAIQuick('translate-zh')">翻译为中文</DropdownMenuItem>
          <DropdownMenuItem @click="runAIQuick('translate-en')">翻译为英文</DropdownMenuItem>
          <DropdownMenuItem @click="uiStore.toggleAIImageDialog(true)">AI 生图</DropdownMenuItem>
          <DropdownMenuItem @click="uiStore.toggleAIDialog(true)">AI 对话</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> -->
    </div>
  </div>
  <AIPolishPopover
    ref="aiRef"
    v-model:open="aiOpen"
    :selected-text="selectedText"
    :is-mobile="isMobile"
    :preset-action="aiPresetAction"
    :autorun="true"
    :auto-replace="false"
  />

</template>

<style scoped>
/***** keep menu readable *****/
</style>

