<script setup lang="ts">

import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()



function customStyle() {
  uiStore.toggleShowCssEditor()
}
</script>

<template>
  <div class="theme-customizer space-y-4">


    <div class="space-y-2">
      <h2 class="text-sm font-medium">
        自定义 CSS 面板
      </h2>
      <div class="grid grid-cols-2 justify-items-center gap-2">
        <Button
          class="w-full" variant="outline" :class="{
            'border-black dark:border-white border-2': uiStore.isShowCssEditor,
          }" @click="!uiStore.isShowCssEditor && customStyle()"
        >
          开启
        </Button>
        <Button
          class="w-full" variant="outline" :class="{
            'border-black dark:border-white border-2': !uiStore.isShowCssEditor,
          }" @click="uiStore.isShowCssEditor && customStyle()"
        >
          关闭
        </Button>
      </div>
    </div>


  </div>
</template>
