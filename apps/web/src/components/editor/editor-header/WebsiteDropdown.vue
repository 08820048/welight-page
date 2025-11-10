<script setup lang="ts">
import { Globe, Palette } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const props = withDefaults(defineProps<{
  asSub?: boolean
}>(), {
  asSub: false,
})

const { asSub } = toRefs(props)
const router = useRouter()

function openWebsite() {
  window.open('https://waer.ltd/', '_blank')
}

function goToThemePreview() {
  router.push('/themes')
}
</script>

<template>
  <!-- 作为 MenubarSub 使用 -->
  <MenubarSub v-if="asSub">
    <MenubarSubTrigger>
      <Globe class="mr-2 h-4 w-4" />
      <span>官网</span>
    </MenubarSubTrigger>
    <MenubarSubContent align="start">
      <MenubarCheckboxItem @click="openWebsite()">
        <Globe class="mr-2 h-4 w-4" />
        <span>访问官网</span>
      </MenubarCheckboxItem>
      <MenubarCheckboxItem @click="goToThemePreview()">
        <Palette class="mr-2 h-4 w-4" />
        <span>主题预览</span>
      </MenubarCheckboxItem>
    </MenubarSubContent>
  </MenubarSub>

  <!-- 作为 MenubarMenu 使用（默认） -->
  <MenubarMenu v-else>
    <MenubarTrigger>官网</MenubarTrigger>
    <MenubarContent align="start">
      <MenubarCheckboxItem @click="openWebsite()">
        <Globe class="mr-2 h-4 w-4" />
        <span>访问官网</span>
      </MenubarCheckboxItem>
      <MenubarCheckboxItem @click="goToThemePreview()">
        <Palette class="mr-2 h-4 w-4" />
        <span>主题预览</span>
      </MenubarCheckboxItem>
    </MenubarContent>
  </MenubarMenu>
</template>
