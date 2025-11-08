<script setup lang="ts">
import AIConfig from '@/components/ai/chat-box/AIConfig.vue'
import AIImageConfig from '@/components/ai/image-generator/AIImageConfig.vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUIStore } from '@/stores/ui'
import { addPrefix } from '@/utils'

/* -------------------- props / emits -------------------- */
const props = defineProps<{
  open: boolean
}>()
const emit = defineEmits([`update:open`])

/* -------------------- stores -------------------- */
const uiStore = useUIStore()
const { isEditOnLeft } = storeToRefs(uiStore)

/* -------------------- reactive state -------------------- */
const dialogVisible = ref(props.open)
const activeCategory = ref(`editor`)

// 默认复制格式
const copyMode = useStorage(addPrefix(`copyMode`), `txt`)

/* -------------------- dialog state sync -------------------- */
watch(() => props.open, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit(`update:open`, val)
})

/* -------------------- 设置分类 -------------------- */
const categories = [
  {
    id: `editor`,
    label: `编辑器`,
    description: `编辑器相关设置`,
  },
  {
    id: `ai`,
    label: `AI配置`,
    description: `配置AI聊天和图像生成服务`,
  },
]

/* -------------------- 操作函数 -------------------- */
function selectCategory(categoryId: string) {
  activeCategory.value = categoryId
}

function toggleEditPosition() {
  uiStore.toggleEditOnLeft()
}
</script>

<template>
  <Dialog v-model:open="dialogVisible">
    <DialogContent class="p-0 overflow-hidden rounded-lg flex flex-col w-[720px]! h-[720px]! min-w-[720px]! min-h-[720px]! max-w-[720px]! max-h-[720px]!">
      <!-- 顶部标题栏 -->
      <DialogHeader class="px-6 py-4 border-b">
        <DialogTitle class="text-xl font-semibold">
          设置
        </DialogTitle>
      </DialogHeader>

      <div class="flex flex-1 min-h-0">
        <!-- 左侧分类导航 -->
        <div class="w-40 shrink-0 border-r bg-muted/20 p-3">
          <div class="space-y-1">
            <button
              v-for="category in categories"
              :key="category.id"
              class="w-full text-left px-2 py-2 rounded-md text-sm transition-colors hover:bg-muted"
              :class="{
                'bg-muted font-medium': activeCategory === category.id,
                'text-muted-foreground': activeCategory !== category.id,
              }"
              @click="selectCategory(category.id)"
            >
              <div class="font-medium text-sm">
                {{ category.label }}
              </div>
              <div class="text-xs text-muted-foreground mt-0.5">
                {{ category.description }}
              </div>
            </button>
          </div>
        </div>

        <!-- 右侧设置内容 -->
        <div class="flex-1 overflow-y-auto min-w-0">
          <div class="p-4">
            <!-- 编辑器设置 -->
            <div v-if="activeCategory === 'editor'" class="space-y-4">
              <div>
                <h3 class="text-base font-semibold mb-2">
                  编辑器设置
                </h3>
                <p class="text-xs text-muted-foreground mb-4">
                  配置编辑器的行为和默认选项
                </p>
              </div>

              <div class="space-y-4">
                <!-- 编辑区位置 -->
                <div class="border rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="text-sm font-medium">
                        编辑区位置
                      </h4>
                      <p class="text-xs text-muted-foreground mt-1">
                        选择编辑区在左侧还是右侧
                      </p>
                    </div>
                    <div class="toggle-wrapper">
                      <input
                        :checked="!isEditOnLeft"
                        type="checkbox"
                        class="toggle-checkbox"
                        @change="toggleEditPosition"
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
                  <div class="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <span :class="{ 'font-medium text-foreground': isEditOnLeft }">左侧编辑</span>
                    <span>|</span>
                    <span :class="{ 'font-medium text-foreground': !isEditOnLeft }">右侧编辑</span>
                  </div>
                </div>

                <!-- 默认复制格式 -->
                <div class="border rounded-lg p-4">
                  <div>
                    <h4 class="text-sm font-medium mb-3">
                      默认复制格式
                    </h4>
                    <p class="text-xs text-muted-foreground mb-3">
                      选择点击复制按钮时使用的默认格式
                    </p>
                  </div>
                  <div class="space-y-3">
                    <div class="checkbox-wrapper">
                      <input
                        id="copy-txt"
                        :checked="copyMode === 'txt'"
                        type="checkbox"
                        class="check"
                        @change="copyMode = 'txt'"
                      >
                      <label for="copy-txt" class="label">
                        <svg width="45" height="45" viewBox="0 0 95 95">
                          <rect x="30" y="20" width="50" height="50" stroke="black" fill="none" />
                          <g transform="translate(0,-952.36222)">
                            <path d="m 56,963 c -102,122 6,9 7,9 17,-5 -66,69 -38,52 122,-77 -7,14 18,4 29,-11 45,-43 23,-4" stroke="red" stroke-width="3" fill="none" class="path1" />
                          </g>
                        </svg>
                        <span>公众号格式</span>
                      </label>
                    </div>
                    <div class="checkbox-wrapper">
                      <input
                        id="copy-md"
                        :checked="copyMode === 'md'"
                        type="checkbox"
                        class="check"
                        @change="copyMode = 'md'"
                      >
                      <label for="copy-md" class="label">
                        <svg width="45" height="45" viewBox="0 0 95 95">
                          <rect x="30" y="20" width="50" height="50" stroke="black" fill="none" />
                          <g transform="translate(0,-952.36222)">
                            <path d="m 56,963 c -102,122 6,9 7,9 17,-5 -66,69 -38,52 122,-77 -7,14 18,4 29,-11 45,-43 23,-4" stroke="red" stroke-width="3" fill="none" class="path1" />
                          </g>
                        </svg>
                        <span>MD 格式</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI配置 -->
            <div v-if="activeCategory === 'ai'" class="space-y-4">
              <div>
                <h3 class="text-base font-semibold mb-2">
                  AI配置
                </h3>
                <p class="text-xs text-muted-foreground mb-4">
                  配置AI聊天助手和图像生成服务的参数
                </p>
              </div>

              <!-- AI聊天配置 -->
              <div class="space-y-4">
                <div class="border rounded-lg p-3">
                  <h4 class="text-sm font-medium mb-2 flex items-center gap-2">
                    <div class="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    AI聊天助手
                  </h4>
                  <AIConfig :hide-title="true" />
                </div>

                <!-- AI图像生成配置 -->
                <div class="border rounded-lg p-3">
                  <h4 class="text-sm font-medium mb-2 flex items-center gap-2">
                    <div class="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    AI图像生成
                  </h4>
                  <AIImageConfig :hide-title="true" />
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* iOS 风格开关样式 */
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

/* 复选框样式 */
.checkbox-wrapper input[type='checkbox'] {
  visibility: hidden;
  display: none;
}

.checkbox-wrapper *,
.checkbox-wrapper ::after,
.checkbox-wrapper ::before {
  box-sizing: border-box;
  user-select: none;
}

.checkbox-wrapper {
  position: relative;
  display: block;
  overflow: hidden;
}

.checkbox-wrapper .label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-wrapper .check {
  width: 50px;
  height: 50px;
  position: absolute;
  opacity: 0;
}

.checkbox-wrapper .label svg {
  vertical-align: middle;
  flex-shrink: 0;
}

.checkbox-wrapper .path1 {
  stroke-dasharray: 400;
  stroke-dashoffset: 400;
  transition: 0.5s stroke-dashoffset;
  opacity: 0;
}

.checkbox-wrapper .check:checked + label svg g path {
  stroke-dashoffset: 0;
  opacity: 1;
}
</style>
