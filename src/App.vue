<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { routeScroll } from '@/router'

// 新视图进入前执行路由暂存的滚动定位：此时旧视图（out-in 模式下）已淡出卸载，
// 新视图 DOM 已插入但尚未进入动画，瞬时归顶不会被用户看到中间过程，也不会让旧首页
// 露出首屏 hero。这样从「精选/最新」点进文章直接显示文章顶部，无闪现。
function onBeforeEnter() {
  const p = routeScroll.pending
  if (!p) return
  routeScroll.pending = null
  window.scrollTo({ top: p.top, left: p.left, behavior: 'instant' } as ScrollToOptions)
}
</script>

<template>
  <a href="#main" class="skip-link">跳到主要内容</a>
  <AppHeader />
  <main id="main">
    <RouterView v-slot="{ Component }">
      <Transition name="route" mode="out-in" @before-enter="onBeforeEnter">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>
  <AppFooter />
</template>