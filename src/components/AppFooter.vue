<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { FOOTER_QUOTE, PROFILE_DISPLAY } from '@/config/site'
import SealStamp from './SealStamp.vue'
import { useI18n } from '@/i18n'

const { t, isEn } = useI18n()

</script>

<template>
  <footer class="footer">
    <div class="page footer__inner">
      <div class="footer__lead">
        <div class="footer__brand">
          <SealStamp :char="PROFILE_DISPLAY.sealChar" size="sm" class="footer__seal" />
          <div class="footer__brand-text">
            <p class="footer__latin">Magic</p>
            <p class="footer__tagline">{{ t('footer.tagline') }}</p>
          </div>
        </div>
        <blockquote v-if="FOOTER_QUOTE.text" class="footer__quote">
          <p>「{{ isEn ? t('footer.quote') : FOOTER_QUOTE.text }}」</p>
        </blockquote>
      </div>
      <nav class="footer__nav" :aria-label="t('nav.about')">
        <RouterLink to="/blog">{{ t('nav.blog') }}</RouterLink>
        <RouterLink to="/opinions">{{ t('nav.opinions') }}</RouterLink>
        <RouterLink to="/academic">{{ t('nav.academic') }}</RouterLink>
        <RouterLink to="/about">{{ t('nav.about') }}</RouterLink>
        <RouterLink to="/privacy">{{ t('footer.privacy') }}</RouterLink>
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
  gap: 1.6rem;
}

/* 品牌区（印章 + Magic）与金句同排；窄屏下自动上下堆叠 */
.footer__lead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
  padding-bottom: 1.6rem;
  border-bottom: 1px solid var(--line);
}

.footer__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.footer__seal {
  flex: 0 0 auto;
}

.footer__brand-text {
  min-width: 0;
}

.footer__quote {
  margin: 0;
  text-align: right;
}

.footer__quote p {
  font-family: var(--font-serif-sc);
  font-weight: 600;
  font-size: clamp(1.05rem, 2vw, 1.35rem);
  line-height: 1.7;
  color: var(--ink-soft);
}

.footer__latin {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.6rem;
  line-height: 1.2;
}

.footer__tagline {
  color: var(--ink-soft);
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

@media (max-width: 640px) {
  .footer__lead {
    align-items: flex-start;
    gap: 1rem;
  }
  .footer__quote {
    text-align: left;
  }
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