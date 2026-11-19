<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { FOOTER_QUOTE } from '@/config/site'
</script>

<template>
  <footer class="footer">
    <!-- 顶部渐变：由内容浅色平滑过渡到底色，消除首页/各页内容区到页脚的硬切 -->
    <div class="footer__fade" aria-hidden="true"></div>
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
  /* 留出与渐变带（5rem）等高的空间，避免渐变遮盖正文内容 */
  margin-top: 5.5rem;
  background: var(--paper-deep);
}

/* 顶部渐变过渡带：从内容区浅色（paper）平滑过渡到底色（paper-deep），消除硬切 */
.footer__fade {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 5rem;
  transform: translateY(-100%);
  background: linear-gradient(180deg, var(--paper) 0%, var(--paper-deep) 100%);
  pointer-events: none;
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