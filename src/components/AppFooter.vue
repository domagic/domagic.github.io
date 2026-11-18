<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="footer">
    <div class="page footer__inner">
      <div class="footer__brand">
        <p class="footer__latin">Do Magic</p>
        <p class="footer__tagline">在管理与数据之间，做一点魔法。</p>
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
  margin-top: 5rem;
  border-top: 1px solid var(--line);
  background: var(--paper-deep);
}

.footer__inner {
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
  display: grid;
  gap: 1.4rem;
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