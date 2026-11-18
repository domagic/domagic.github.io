<script setup lang="ts">
import { ref, watch } from 'vue'
import { renderMarkdown } from '@/utils/markdown'
import { hasMath, renderMarkdownWithMath } from '@/utils/math'

const props = defineProps<{ source: string }>()
const html = ref('')
// 竞态守卫：源快速变化（如后台预览输入）时只采纳最后一次渲染结果
let renderToken = 0

watch(
  () => props.source,
  async (src) => {
    const current = ++renderToken
    const source = src ?? ''
    // 先同步渲染 prose：无数学文章零 KaTeX 加载、零等待
    html.value = renderMarkdown(source)
    if (!hasMath(source)) return
    try {
      // 仅含数学的文章页才懒加载 KaTeX 样式与引擎（首页/列表不引入）
      await import('@/styles/katex.css')
      const withMath = await renderMarkdownWithMath(source)
      if (current === renderToken) html.value = withMath
    } catch {
      // 降级：引擎/样式加载失败时保留已渲染的 prose（TeX 以原文呈现），不崩页
      if (current === renderToken) html.value = renderMarkdown(source)
    }
  },
  { immediate: true },
)
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- 已经 DOMPurify sanitize -->
  <div class="markdown" v-html="html"></div>
</template>

<style>
.markdown {
  font-size: 1.02rem;
  line-height: 1.9;
}

.markdown h2 {
  font-size: 1.45rem;
  margin: 2.2rem 0 0.9rem;
  padding-left: 0.8rem;
  border-left: 3px solid var(--cinnabar);
}

.markdown h3 {
  font-size: 1.15rem;
  margin: 1.8rem 0 0.7rem;
}

.markdown p {
  margin: 0.9rem 0;
}

.markdown ul,
.markdown ol {
  margin: 0.9rem 0;
  padding-left: 1.6rem;
}

.markdown li {
  margin: 0.35rem 0;
}

.markdown blockquote {
  margin: 1.6rem 0;
  padding: 1rem 1.4rem;
  background: var(--cinnabar-wash);
  border-left: 3px solid var(--cinnabar);
  font-family: var(--font-serif-sc);
  font-size: 1.08rem;
}

.markdown code {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: var(--paper-deep);
  padding: 0.15em 0.4em;
  border-radius: 4px;
}

.markdown pre {
  background: var(--paper-deep);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 1rem 1.2rem;
  overflow-x: auto;
}

.markdown pre code {
  background: none;
  padding: 0;
}

.markdown a {
  color: var(--cinnabar-deep);
}

.markdown strong {
  color: var(--cinnabar-deep);
}

.markdown hr {
  border: none;
  border-top: 1px solid var(--line-strong);
  margin: 2rem 0;
}

/* F3 数学渲染：宽公式（矩阵等）在窄屏内部横向滚动，避免整页横向溢出 */
.markdown .math-block {
  margin: 1.5rem 0;
  padding: 0.3rem 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--line-strong) var(--paper-deep);
}

.markdown .math-block::-webkit-scrollbar {
  height: 6px;
}

.markdown .math-block::-webkit-scrollbar-track {
  background: var(--paper-deep);
  border-radius: 3px;
}

.markdown .math-block::-webkit-scrollbar-thumb {
  background: var(--line-strong);
  border-radius: 3px;
}

.markdown .math-block::-webkit-scrollbar-thumb:hover {
  background: var(--cinnabar);
}

.markdown .math-block .katex-display {
  margin: 0;
}

.markdown .math-inline {
  white-space: nowrap;
}

.markdown .katex {
  font-size: 1.05em;
}

/* 数学渲染失败时 KaTeX 的错误色文本仍可读 */
.markdown .katex-error {
  color: var(--cinnabar-deep);
  font-family: var(--font-mono);
  font-size: 0.9em;
}
</style>