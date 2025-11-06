<script setup lang="ts">
import { Settings } from 'lucide-vue-next'
import {
  MenubarCheckboxItem,
  MenubarContent,
  MenubarMenu,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar'
import SettingsPanel from '../settings/SettingsPanel.vue'

/* -------------------- props -------------------- */
const props = defineProps<{
  asSub?: boolean
}>()

/* -------------------- reactive state -------------------- */
const settingsPanelVisible = ref(false)

/* -------------------- 操作函数 -------------------- */
function openSettingsPanel() {
  settingsPanelVisible.value = true
}
</script>

<template>
  <!-- 桌面端菜单 - 直接点击打开设置面板 -->
  <MenubarMenu v-if="!asSub">
    <MenubarTrigger class="menubar-trigger" @click="openSettingsPanel()">
      设置
    </MenubarTrigger>
  </MenubarMenu>

  <!-- 移动端子菜单 -->
  <MenubarSub v-else>
    <MenubarSubTrigger>
      <Settings class="mr-2 h-4 w-4" />
      <span>设置</span>
    </MenubarSubTrigger>
    <MenubarSubContent>
      <MenubarCheckboxItem @click="openSettingsPanel()">
        <Settings class="mr-2 h-4 w-4" />
        <span>偏好设置</span>
      </MenubarCheckboxItem>
    </MenubarSubContent>
  </MenubarSub>

  <!-- 设置面板 -->
  <SettingsPanel v-model:open="settingsPanelVisible" />
</template>


