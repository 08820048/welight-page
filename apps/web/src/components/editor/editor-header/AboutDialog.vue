<script setup lang="ts">
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([`close`])

function onUpdate(val: boolean) {
  if (!val) {
    emit(`close`)
  }
}

const links = [
  { label: `官网`, url: `https://waer.ltd` },
  { label: `博客`, url: `https://ilikexff.cn` },
  { label: `Q群`, url: `https://qun.qq.com/universal-share/share?ac=1&authKey=U4EFNYA9KuxK3OOQJQRfmzrfpwn3NM%2BHScNavJLkDXANe7H%2BONEQvGMvVI2LRrx2&busi_data=eyJncm91cENvZGUiOiIxMDcxNTU4ODAzIiwidG9rZW4iOiI3N2krQUx6VTVoTXVwOVRBRU52djl6R3k2VDYyNWR1RXl4bk92S2Y5SzNWVTBrUTlmeitCNEN6OS92KzZoMElqIiwidWluIjoiMjIxNzAyMTU2MyJ9&data=xN0g96ZxEMQlgiGFEWHsx8x0rZ0Qz9zmsBlJXrOxz6m1DVOYht3OeVZLFTMy6bGTC-Nc4yxMX25CDwocSJMQRLkcxdIUz6736qxlkysN8AE&svctype=5&tempid=h5_group_info` },
]

function onRedirect(url: string) {
  window.open(url, `_blank`)
}
</script>

<template>
  <Dialog :open="props.visible" @update:open="onUpdate">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>关于</DialogTitle>
      </DialogHeader>
      <div class="text-center">
        <h3>Welight 公众号排版网页版本</h3>
        <p>扫码关注公众号[TechGame前沿]，游戏科技资讯每日推送。</p>
        <img
          class="mx-auto my-5"
          src="https://images.waer.ltd/notes/202509282306627.jpg"
          alt="TechGame"
          style="width: 40%"
        >
      </div>
      <DialogFooter class="sm:justify-evenly flex flex-wrap gap-2">
        <Button
          v-for="link in links"
          :key="link.url"
          @click="onRedirect(link.url)"
        >
          {{ link.label }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
