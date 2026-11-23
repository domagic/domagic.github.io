<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useSeo } from '@/composables/useSeo'
import SealStamp from '@/components/SealStamp.vue'

import { useI18n } from '@/i18n'
const { t, isEn } = useI18n()
useSeo({ title: isEn.value ? 'Page not found' : '页面不存在' })
</script>

<template>
  <div class="page nf">
    <SealStamp char="失" />
    <h1 class="nf__title">{{ isEn ? '404 · This page was hidden by magic' : '404 · 这一页被魔法藏起来了' }}</h1>
    <p class="nf__note">{{ isEn ? 'The address may have changed, or the page never existed.' : '地址可能已改变，或者内容从未存在。' }}</p>
    <RouterLink to="/" class="nf__cta">{{ t('nav.home') }}</RouterLink>
  </div>
</template>

<style scoped>
.nf {
  padding-top: 5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  min-height: 60vh;
}

.nf__title {
  font-size: 1.5rem;
}

.nf__note {
  color: var(--ink-soft);
}

.nf__cta {
  margin-top: 0.6rem;
  background: var(--cinnabar);
  color: #f6f1e7;
  padding: 0.55rem 1.6rem;
  border-radius: 999px;
}

.nf__cta:hover {
  background: var(--cinnabar-deep);
  text-decoration: none;
}
</style>