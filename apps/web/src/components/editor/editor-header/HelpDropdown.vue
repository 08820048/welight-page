<script setup lang="ts">
const props = withDefaults(defineProps<{
  asSub?: boolean
}>(), {
  asSub: false,
})

const emit = defineEmits([`openAbout`])

const { asSub } = toRefs(props)

function openAboutDialog() {
  emit(`openAbout`)
}

function openDesktopDownload() {
  window.open('https://waer.ltd/download', '_blank')
}
</script>

<template>
  <!-- 作为 MenubarSub 使用 -->
  <MenubarSub v-if="asSub">
    <MenubarSubTrigger>
      帮助
    </MenubarSubTrigger>
    <MenubarSubContent align="start">
      <MenubarCheckboxItem @click="openAboutDialog()">
        关于
      </MenubarCheckboxItem>
      <MenubarCheckboxItem @click="openDesktopDownload()">
        桌面版下载
      </MenubarCheckboxItem>
    </MenubarSubContent>
  </MenubarSub>

  <!-- 作为 MenubarMenu 使用（默认） -->
  <MenubarMenu v-else>
    <MenubarTrigger>帮助</MenubarTrigger>
    <MenubarContent align="start">
      <MenubarCheckboxItem @click="openAboutDialog()">
        <span>关于</span>
      </MenubarCheckboxItem>
      <MenubarCheckboxItem @click="openDesktopDownload()">
        <span>桌面版下载</span>
      </MenubarCheckboxItem>
    </MenubarContent>
  </MenubarMenu>
</template>
