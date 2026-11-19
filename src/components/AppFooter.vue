<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { FOOTER_QUOTE } from '@/config/site'
</script>

<template>
  <footer class="footer">
    <div class="page footer__inner">
      <blockquote v-if="FOOTER_QUOTE.text" class="footer__quote">
        <p>「{{ FOOTER_QUOTE.text }}」</p>
        <cite v-if="FOOTER_QUOTE.cite" class="mono">— {{ FOOTER_QUOTE.cite }}</cite>
      </blockquote>
      <div class="footer__brand">
        <p class="footer__latin">Do Magic</p>
        <p class="footer__tagline">在数据之中，做一点魔法。</p>
      </div>
      <nav class="footer__nav" aria-label="页脚导航">
        <RouterLink to="/blog">博客</RouterLink>
        <RouterLink to="/opinions">观点</RouterLink>
        <RouterLink to="/academic">学术</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
        <RouterLink to="/privacy">隐私声明</RouterLink>
      </nav>
      <p class="footer__copy mono">© 2026 Magic · Powered by GitHub Pages</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  margin-top: 4rem;
  /* 背景透明，直接坐在全页连续渐变上，不再有独立底色造成深浅跳变 */
  background: transparent;
  border-top: 1px solid var(--line);
}

.footer__inner {
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
  display: grid;
  gap: 1.4rem;
}

.footer__quote {
  text-align: center;
  padding: 0.5rem 1rem 1.6rem;
  margin: 0;
  border-bottom: 1px solid var(--line);
}

.footer__quote p {
  font-family: var(--font-serif-sc);
  font-weight: 600;
  font-size: clamp(1.4rem, 3.2vw, 2.1rem);
  line-height: 1.8;
}

.footer__quote cite {
  display: block;
  margin-top: 0.9rem;
  color: var(--ink-faint);
  font-style: normal;
}

.footer__latin {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.4rem;
}

.footer__tagline {
  color: var(--ink-soft);
  font-size: 0.9rem;
  margin-top: 0.3rem;
}

.footer__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1.4rem;
}

.footer__nav a {
  color: var(--ink-soft);
  font-size: 0.9rem;
}

.footer__copy {
  color: var(--ink-faint);
  font-size: 0.72rem;
}
</style>