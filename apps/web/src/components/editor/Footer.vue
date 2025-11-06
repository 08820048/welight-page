<script setup lang="ts">
import { useRenderStore } from '@/stores/render'

const renderStore = useRenderStore()
const { readingTime } = storeToRefs(renderStore)
</script>

<template>
  <footer
    class="flex select-none items-center justify-between px-5 py-2 text-xs"
  >
    <!-- 左侧：数据统计信息 -->
    <div class="space-x-2">
      <span> {{ readingTime.words }} 个词 </span>
      <span> {{ readingTime.chars }} 个字符 </span>
      <span> 阅读大约需 {{ readingTime.minutes }} 分钟 </span>
    </div>

    <!-- 中间：版权信息 -->
    <div class="flex-1 text-center text-gray-500 dark:text-gray-400">
      <span>Powered by Welight | 智能高效的公众号文章创作&排版体验</span>
    </div>

    <!-- 右侧：预留空间 -->
    <div class="w-0"></div>
  </footer>
</template>
