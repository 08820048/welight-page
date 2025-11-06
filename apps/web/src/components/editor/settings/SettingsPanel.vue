<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import AIConfig from '@/components/ai/chat-box/AIConfig.vue'
import AIImageConfig from '@/components/ai/image-generator/AIImageConfig.vue'

/* -------------------- props / emits -------------------- */
const props = defineProps<{
  open: boolean
}>()
const emit = defineEmits(['update:open'])

/* -------------------- reactive state -------------------- */
const dialogVisible = ref(props.open)
const activeCategory = ref('ai')

// Panel is a fixed square
const panelSize = ref(720)

/* -------------------- dialog state sync -------------------- */
watch(() => props.open, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:open', val)
})

/* -------------------- 设置分类 -------------------- */
const categories = [
  {
    id: 'ai',
    label: 'AI配置',
    description: '配置AI聊天和图像生成服务'
  }
]

/* -------------------- 操作函数 -------------------- */
function selectCategory(categoryId: string) {
  activeCategory.value = categoryId
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
                'text-muted-foreground': activeCategory !== category.id
              }"
              @click="selectCategory(category.id)"
            >
              <div class="font-medium text-sm">{{ category.label }}</div>
              <div class="text-xs text-muted-foreground mt-0.5">
                {{ category.description }}
              </div>
            </button>
          </div>
        </div>

        <!-- 右侧设置内容 -->
        <div class="flex-1 overflow-y-auto min-w-0">
          <div class="p-4">
            <!-- AI配置 -->
            <div v-if="activeCategory === 'ai'" class="space-y-4">
              <div>
                <h3 class="text-base font-semibold mb-2">AI配置</h3>
                <p class="text-xs text-muted-foreground mb-4">
                  配置AI聊天助手和图像生成服务的参数
                </p>
              </div>

              <!-- AI聊天配置 -->
              <div class="space-y-4">
                <div class="border rounded-lg p-3">
                  <h4 class="text-sm font-medium mb-2 flex items-center gap-2">
                    <div class="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    AI聊天助手
                  </h4>
                  <AIConfig :hide-title="true" />
                </div>

                <!-- AI图像生成配置 -->
                <div class="border rounded-lg p-3">
                  <h4 class="text-sm font-medium mb-2 flex items-center gap-2">
                    <div class="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
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


