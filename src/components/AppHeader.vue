<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useI18n } from '@/i18n'
import type { Locale } from '@/stores/locale'
import SealStamp from './SealStamp.vue'
import { PROFILE_DISPLAY } from '@/config/site'

const auth = useAuthStore()
const theme = useThemeStore()
const { t, isEn, locale, locales, setLocale } = useI18n()
const menuOpen = ref(false)
const langOpen = ref(false)

const nav = computed(() => [
  { to: '/', label: t('nav.home') },
  { to: '/blog', label: t('nav.blog') },
  { to: '/opinions', label: t('nav.opinions') },
  { to: '/academic', label: t('nav.academic') },
  { to: '/group', label: t('nav.group') },
  { to: '/archive', label: t('nav.archive') },
  { to: '/about', label: t('nav.about') },
])

function chooseLocale(code: Locale) {
  setLocale(code)
  langOpen.value = false
}
function closeLang(e: MouseEvent) {
  if (!(e.target as HTMLElement)?.closest?.('.header__lang')) langOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', closeLang)
})

onUnmounted(() => {
  document.removeEventListener('click', closeLang)
})

function closeMenu() {
  menuOpen.value = false
  langOpen.value = false
}
</script>

<template>
  <header class="header">
    <div class="header__inner page">
      <div class="header__left">
        <RouterLink to="/" class="header__brand" @click="closeMenu">
          <SealStamp :char="PROFILE_DISPLAY.sealChar" size="sm" />
          <span class="header__latin">Magic</span>
        </RouterLink>
      </div>

      <nav class="header__nav" :aria-label="t('nav.aria')">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="header__link"
          :aria-current="$route.path === item.to ? 'page' : undefined"
        >
          {{ item.label }}
        </RouterLink>
        <div class="header__lang">
          <button
            type="button"
            class="header__lang-toggle"
            :aria-label="t('lang.label')"
            :aria-expanded="langOpen"
            aria-haspopup="menu"
            @click="langOpen = !langOpen"
          >
            {{ t('lang.label') }}
          </button>
          <div v-if="langOpen" class="header__lang-menu" role="menu">
            <button
              v-for="l in locales"
              :key="l.code"
              type="button"
              class="header__lang-option"
              :class="{ 'is-active': locale === l.code }"
              role="menuitem"
              :lang="l.code"
              :aria-current="locale === l.code ? 'true' : undefined"
              @click="chooseLocale(l.code)"
            >
              {{ l.label }}
            </button>
          </div>
        </div>
        <a
          href="https://qinluolab.com/"
          class="header__team"
          :title="t('nav.team')"
        >
          <span class="header__team-icon" aria-hidden="true">⌂</span>
          <span>{{ t('nav.team') }}</span>
        </a>
      </nav>

      <div class="header__actions">
        <button
          type="button"
          class="header__icon-btn"
          :aria-label="theme.theme === 'paper' ? t('theme.toDark') : t('theme.toLight')"
          @click="theme.toggle()"
        >
          <span aria-hidden="true">{{ theme.theme === 'paper' ? '☾' : '☀' }}</span>
        </button>
        <RouterLink v-if="auth.isAuthenticated" to="/admin" class="header__cta">{{ t('nav.admin') }}</RouterLink>
        <RouterLink v-else to="/login" class="header__cta">{{ t('nav.login') }}</RouterLink>
        <button
          type="button"
          class="header__icon-btn header__burger"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          :aria-label="t('mobile.aria')"
          @click="menuOpen = !menuOpen"
        >
          <span aria-hidden="true">{{ menuOpen ? '✕' : '☰' }}</span>
        </button>
      </div>
    </div>

    <nav v-if="menuOpen" id="mobile-menu" class="header__mobile" :aria-label="t('mobile.aria')">
      <RouterLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="header__mobile-link"
        :aria-current="$route.path === item.to ? 'page' : undefined"
        @click="closeMenu"
      >
        {{ item.label }}
      </RouterLink>
      <div class="header__mobile-lang" role="group" :aria-label="t('lang.label')">
        <button
          v-for="l in locales"
          :key="l.code"
          type="button"
          class="header__mobile-lang-btn"
          :class="{ 'is-active': locale === l.code }"
          :lang="l.code"
          @click="chooseLocale(l.code)"
        >{{ l.label }}</button>
      </div>
      <a href="https://qinluolab.com/" class="header__mobile-team" @click="closeMenu">
        <span class="header__team-icon" aria-hidden="true">⌂</span>
        <span>{{ t('nav.team') }}</span>
        <span class="header__mobile-team-tag">{{ isEn ? t('nav.team') : '团队站' }}</span>
      </a>
    </nav>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--paper) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}

.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: 4.2rem;
  /* 页头不受正文 .page 的居中与宽留白约束，贴近视口左缘 */
  max-width: none;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}

.header__left {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
}

.header__brand {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  text-decoration: none;
  color: var(--ink);
}

.header__latin {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.05rem;
}

.header__nav {
  display: flex;
  gap: 3.4rem;
  padding-left: 1.5rem;
}

.header__link {
  position: relative;
  color: var(--ink-soft);
  text-decoration: none;
  font-size: 0.95rem;
  padding: 0.35rem 0.1rem;
}

.header__link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 2px;
  background: var(--cinnabar);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s var(--ease-out);
}

.header__link:hover::after,
.header__link[aria-current='page']::after {
  transform: scaleX(1);
}

.header__link[aria-current='page'] {
  color: var(--ink);
  font-weight: 500;
}

/* 语言：与导航文字同款的纯文字按钮 + 下拉菜单（同主站交互） */
.header__lang {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.header__lang-toggle {
  font-size: 0.95rem;
  letter-spacing: 0.06em;
  background: none;
  border: 0;
  border-bottom: 1px solid transparent;
  color: var(--ink-soft);
  padding: 0.35rem 0;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s, color 0.2s;
}
.header__lang-toggle:hover,
.header__lang-toggle[aria-expanded='true'] {
  color: var(--cinnabar-deep);
  border-bottom-color: var(--cinnabar-deep);
}
.header__lang-menu {
  position: absolute;
  top: calc(100% + 0.6rem);
  left: 0;
  z-index: 60;
  min-width: 9rem;
  padding: 0.35rem 0;
  background: var(--paper-elev, var(--paper));
  border: 1px solid var(--line);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.14);
}
.header__lang-option {
  display: block;
  width: 100%;
  text-align: left;
  font-size: 0.88rem;
  padding: 0.55rem 0.95rem;
  background: none;
  border: 0;
  border-left: 2px solid transparent;
  color: var(--ink);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.header__lang-option:hover {
  background: var(--cinnabar-wash);
}
.header__lang-option.is-active {
  color: var(--cinnabar-deep);
  border-left-color: var(--cinnabar);
  font-weight: 600;
}

/* 团队首页：站外入口，用朱红实心胶囊与站内文字导航明确区分 */
.header__team {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.42rem 0.95rem;
  border-radius: 999px;
  background: var(--cinnabar);
  color: #fff;
  font-size: 0.86rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.2s, transform 0.2s;
}

.header__team:hover {
  background: var(--cinnabar-deep);
  color: #fff;
  text-decoration: none;
  transform: translateY(-1px);
}

.header__team-icon {
  font-size: 1rem;
  line-height: 1;
}

.header__actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.header__icon-btn {
  background: none;
  border: 1px solid var(--line);
  border-radius: 999px;
  width: 2.2rem;
  height: 2.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  font-size: 1rem;
  transition: border-color 0.2s, color 0.2s;
}

.header__icon-btn:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar-deep);
}

.header__cta {
  border: 1px solid var(--line-strong);
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  color: var(--ink);
  text-decoration: none;
  font-size: 0.88rem;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.header__cta:hover {
  background: var(--cinnabar);
  border-color: var(--cinnabar);
  color: #f6f1e7;
  text-decoration: none;
}

.header__burger {
  display: none;
}

.header__mobile {
  display: none;
}

@media (max-width: 760px) {
  .header__nav {
    display: none;
  }
  .header__burger {
    display: inline-flex;
  }
  .header__mobile {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--line);
    padding: 0.6rem var(--space-page) 1rem;
    gap: 0.2rem;
  }
  .header__mobile-link {
    padding: 0.55rem 0.2rem;
    color: var(--ink);
    text-decoration: none;
    border-bottom: 1px dashed var(--line);
  }
  .header__mobile-link[aria-current='page'] {
    color: var(--cinnabar-deep);
    font-weight: 500;
  }
  .header__mobile-lang {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 0.2rem;
    border-bottom: 1px dashed var(--line);
  }
  .header__mobile-lang-btn {
    background: none;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 0.3rem 0.9rem;
    font-size: 0.85rem;
    color: var(--ink-soft);
    cursor: pointer;
  }
  .header__mobile-lang-btn.is-active {
    border-color: var(--cinnabar);
    color: var(--cinnabar-deep);
    font-weight: 600;
  }
  .header__mobile-team {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.5rem;
    padding: 0.6rem 0.9rem;
    border-radius: 999px;
    background: var(--cinnabar);
    color: #fff;
    font-weight: 600;
    text-decoration: none;
  }
  .header__mobile-team:hover {
    background: var(--cinnabar-deep);
    text-decoration: none;
  }
  .header__mobile-team-tag {
    margin-left: auto;
    font-size: 0.72rem;
    font-weight: 400;
    opacity: 0.85;
  }
}

@media (max-width: 480px) {
  /* 窄屏保留印章 + Magic，缩小字号避免溢出 */
  .header__left {
    gap: 0.55rem;
  }
  .header__latin {
    font-size: 0.95rem;
  }
}
</style>