<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import SealStamp from './SealStamp.vue'

const auth = useAuthStore()
const theme = useThemeStore()
const menuOpen = ref(false)

const nav = [
  { to: '/', label: '首页' },
  { to: '/blog', label: '博客' },
  { to: '/opinions', label: '观点' },
  { to: '/academic', label: '学术' },
  { to: '/archive', label: '归档' },
  { to: '/about', label: '关于' },
]

// 标签栏实时系统时钟（精确到秒）：取本地系统时间，每秒刷新；组件卸载时清理定时器。
const clock = ref({ h: '00', m: '00', s: '00' })
let clockTimer: ReturnType<typeof setInterval> | null = null

function tick() {
  const d = new Date()
  clock.value = {
    h: String(d.getHours()).padStart(2, '0'),
    m: String(d.getMinutes()).padStart(2, '0'),
    s: String(d.getSeconds()).padStart(2, '0'),
  }
}

onMounted(() => {
  tick()
  clockTimer = setInterval(tick, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <header class="header">
    <div class="header__inner page">
      <div class="header__left">
        <span
          class="header__clock mono"
          role="timer"
          aria-live="off"
          :aria-label="`系统时间 ${clock.h}:${clock.m}:${clock.s}`"
        >
          <span>{{ clock.h }}</span><span class="header__clock-sep">:</span><span>{{ clock.m }}</span><span class="header__clock-sep">:</span><span class="header__clock-sec">{{ clock.s }}</span>
        </span>
        <RouterLink to="/" class="header__brand" @click="closeMenu">
          <SealStamp size="sm" />
          <span class="header__name">
            <span class="header__latin">Do Magic</span>
            <span class="header__sub mono">Magic</span>
          </span>
        </RouterLink>
      </div>

      <nav class="header__nav" aria-label="主导航">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="header__link"
          :aria-current="$route.path === item.to ? 'page' : undefined"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="header__actions">
        <button
          type="button"
          class="header__icon-btn"
          :aria-label="theme.theme === 'paper' ? '切换到墨色夜间模式' : '切换到纸色日间模式'"
          @click="theme.toggle()"
        >
          <span aria-hidden="true">{{ theme.theme === 'paper' ? '☾' : '☀' }}</span>
        </button>
        <RouterLink v-if="auth.isAuthenticated" to="/admin" class="header__cta">管理</RouterLink>
        <RouterLink v-else to="/login" class="header__cta">登录</RouterLink>
        <button
          type="button"
          class="header__icon-btn header__burger"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          aria-label="打开或关闭导航菜单"
          @click="menuOpen = !menuOpen"
        >
          <span aria-hidden="true">{{ menuOpen ? '✕' : '☰' }}</span>
        </button>
      </div>
    </div>

    <nav v-if="menuOpen" id="mobile-menu" class="header__mobile" aria-label="移动端导航">
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
}

.header__left {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
}

.header__clock {
  display: inline-flex;
  align-items: center;
  font-variant-numeric: tabular-nums;
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  padding-right: 0.9rem;
  border-right: 1px solid var(--line);
  user-select: none;
  white-space: nowrap;
}

.header__clock-sep {
  opacity: 0.45;
}

.header__clock-sec {
  color: var(--cinnabar-deep);
}

.header__brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  text-decoration: none;
  color: var(--ink);
}

.header__name {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.header__latin {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.05rem;
}

.header__sub {
  color: var(--ink-faint);
  font-size: 0.66rem;
}

.header__nav {
  display: flex;
  gap: 2.2rem;
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
}

@media (max-width: 480px) {
  /* 窄屏隐藏品牌文字、保留印章与时钟，确保实时时钟持续可见且不溢出 */
  .header__name {
    display: none;
  }
  .header__left {
    gap: 0.55rem;
  }
  .header__clock {
    font-size: 0.76rem;
    padding-right: 0.55rem;
  }
}
</style>