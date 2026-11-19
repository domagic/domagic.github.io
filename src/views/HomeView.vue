<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api, CATEGORY_LABELS, CATEGORY_PATHS, type Category, type PostSummary } from '@/api'
import { FEATURED_SLUGS, HOME_CONFIG } from '@/config/site'
import { useSeo } from '@/composables/useSeo'
import SealStamp from '@/components/SealStamp.vue'
import SectionHead from '@/components/SectionHead.vue'
import PostIndexItem from '@/components/PostIndexItem.vue'

useSeo({ title: '首页' })

// 科技风配色注入为 CSS 变量，后续只需改 config/site.ts 的 HOME_CONFIG.palette 即可换色。
const themeVars = computed(() => {
  if (HOME_CONFIG.theme !== 'tech-dark') return {}
  const p = HOME_CONFIG.palette
  return {
    '--home-deep': p.deep,
    '--home-deep-2': p.deep2,
    '--home-surface': p.surface,
    '--home-accent': p.accent,
  } as Record<string, string>
})

const featured = ref<PostSummary[]>([])
const recent = ref<PostSummary[]>([])
const counts = ref<Record<Exclude<Category, 'diary'>, number>>({ blog: 0, opinion: 0, academic: 0 })
// T7-③：首屏异步区域（精选/最新索引/bio）以骨架占位预留高度，避免数据到达后撑高页面导致 CLS。
const loading = ref(true)

const categories: { key: Exclude<Category, 'diary'>; desc: string }[] = [
  { key: 'blog', desc: '方法、工具与长篇思考' },
  { key: 'opinion', desc: '对学术与行业的立场' },
  { key: 'academic', desc: '论文、报告与项目' },
]

onMounted(async () => {
  try {
    const all = await api.listPosts({ pageSize: 50 })
    // 契约 v1 无 pinned 字段：精选位由前端静态配置 FEATURED_SLUGS 驱动
    featured.value = FEATURED_SLUGS.map((slug) => all.items.find((post) => post.slug === slug))
      .filter((post): post is PostSummary => Boolean(post))
      .slice(0, 3)
    recent.value = all.items.slice(0, 6)
    for (const key of Object.keys(counts.value) as Exclude<Category, 'diary'>[]) {
      counts.value[key] = all.items.filter((post) => post.category === key).length
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home" :class="`home--${HOME_CONFIG.theme}`" :style="themeVars">
    <section class="hero" :class="`hero--${HOME_CONFIG.theme}`">
      <!-- 科技感装饰层：网格 + 光晕 + 流线 + 粒子，全部纯 CSS 动画，可在配置里切换主题 -->
      <div class="hero__fx" aria-hidden="true">
        <span class="hero__grid"></span>
        <span class="hero__glow hero__glow--a"></span>
        <span class="hero__glow hero__glow--b"></span>
        <span class="hero__beam"></span>
        <span class="hero__particles"></span>
      </div>
      <div class="hero__inner page">
        <div class="hero__text">
          <p v-if="HOME_CONFIG.eyebrow" class="hero__eyebrow mono rise">{{ HOME_CONFIG.eyebrow }}</p>
          <h1 class="hero__title rise" style="animation-delay: 0.08s">
            {{ HOME_CONFIG.titleLead }}<em>{{ HOME_CONFIG.titleAccent }}</em>
          </h1>
          <p v-if="HOME_CONFIG.bio" class="hero__bio rise" style="animation-delay: 0.16s">
            {{ HOME_CONFIG.bio }}
          </p>
          <div class="hero__actions rise" style="animation-delay: 0.24s">
            <RouterLink :to="HOME_CONFIG.primaryAction.to" class="hero__btn hero__btn--primary">{{ HOME_CONFIG.primaryAction.label }}</RouterLink>
            <RouterLink :to="HOME_CONFIG.secondaryAction.to" class="hero__btn">{{ HOME_CONFIG.secondaryAction.label }}</RouterLink>
          </div>
          <p v-if="HOME_CONFIG.affiliation" class="hero__affil mono rise" style="animation-delay: 0.3s">
            {{ HOME_CONFIG.affiliation }}
          </p>
        </div>
        <div class="hero__side">
          <span v-if="HOME_CONFIG.vertical" class="hero__vertical" aria-hidden="true">{{ HOME_CONFIG.vertical }}</span>
          <SealStamp v-if="HOME_CONFIG.sealChar" animated :char="HOME_CONFIG.sealChar" />
        </div>
      </div>
    </section>

    <section v-if="loading || featured.length" class="page section">
      <SectionHead kicker="Featured" title="精选" note="编辑精选的长文与重要进展" />
      <div class="featured">
        <template v-if="loading">
          <div v-for="i in 3" :key="`fs-${i}`" class="featured__card featured__card--sk" aria-hidden="true">
            <span class="sk sk--sm"></span>
            <span class="sk sk--title"></span>
            <span class="sk"></span>
            <span class="sk"></span>
            <span class="sk sk--sm sk--more"></span>
          </div>
        </template>
        <template v-else>
          <RouterLink
            v-for="(post, i) in featured"
            :key="post.id"
            :to="`${CATEGORY_PATHS[post.category]}/${post.slug}`"
            class="featured__card rise"
            :style="{ animationDelay: `${i * 0.08}s` }"
          >
            <span class="featured__category mono">{{ CATEGORY_LABELS[post.category] }}</span>
            <h3 class="featured__title">{{ post.title }}</h3>
            <p class="featured__excerpt">{{ post.excerpt }}</p>
            <span class="featured__more">阅读全文 →</span>
          </RouterLink>
        </template>
      </div>
    </section>

    <section class="page section">
      <SectionHead kicker="Index" title="最新索引">
        <template #action>
          <RouterLink to="/blog" class="section-more">全部文章 →</RouterLink>
        </template>
      </SectionHead>
      <div class="index-list">
        <template v-if="loading">
          <article v-for="i in 6" :key="`is-${i}`" class="item item--sk" aria-hidden="true">
            <span class="item__index mono"></span>
            <span class="item__date sk sk--sm"></span>
            <div class="item__body">
              <span class="sk sk--title"></span>
              <span class="sk"></span>
              <span class="sk sk--sm sk--meta"></span>
            </div>
            <span class="item__arrow"></span>
          </article>
        </template>
        <PostIndexItem v-else v-for="(post, i) in recent" :key="post.id" :post="post" :index="i" />
      </div>
    </section>

    <section class="page section">
      <SectionHead kicker="Sections" title="三个抽屉" note="博客、观点与学术，各归其位" />
      <div class="drawers">
        <RouterLink
          v-for="(c, i) in categories"
          :key="c.key"
          :to="CATEGORY_PATHS[c.key]"
          class="drawer rise"
          :style="{ animationDelay: `${i * 0.07}s` }"
        >
          <span class="drawer__count mono">{{ String(counts[c.key]).padStart(2, '0') }}</span>
          <h3 class="drawer__title">{{ CATEGORY_LABELS[c.key] }}</h3>
          <p class="drawer__desc">{{ c.desc }}</p>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 首页自成层叠上下文：封面深色 → 平滑过渡 → 内容浅色，颜色全部来自 HOME_CONFIG.palette */
.home {
  position: relative;
  isolation: isolate;
}

.home--tech-dark {
  /* 首页范围内覆盖纸感变量，使下方内容与科技封面协调（后期换色只需改 config） */
  --paper-elev: #ffffff;
  --paper-deep: #e4eaf4;
  --cinnabar: var(--home-accent);
  --cinnabar-deep: var(--home-accent);
  --cinnabar-wash: rgba(79, 70, 229, 0.1);
  --line: rgba(30, 50, 90, 0.12);
  --line-strong: rgba(30, 50, 90, 0.26);
  background: var(--home-surface);
  color: var(--ink);
}

/* 全宽背景场：封面深色在底部渐隐为内容浅色，消除原来的硬切与刺眼对比 */
.home--tech-dark::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -2;
  /* 两端渐变：顶部由内容浅色渐入深色（衔接 sticky 页头），底部由深色渐出到内容浅色，消除上下硬切 */
  background: linear-gradient(
    180deg,
    var(--home-surface) 0,
    var(--home-deep-2) 13vh,
    var(--home-deep) calc(62vh - 160px),
    var(--home-surface) calc(62vh + 70px),
    var(--home-surface) 100%
  );
  pointer-events: none;
}

.hero {
  position: relative;
  overflow: hidden;
}

.hero__inner {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  align-items: center;
  min-height: 62vh;
  /* 顶部留出渐入区（13vh），文字落在深色带上，避免浅色区文字看不清 */
  padding-top: clamp(5rem, 16vh, 9rem);
  padding-bottom: clamp(2.5rem, 6vh, 4.5rem);
}

/* ================= 深色 AI 科技风（默认 theme=tech-dark） ================= */
.hero--tech-dark {
  /* 深色由全宽背景场提供，此处保持透明，让封面与内容区无缝衔接 */
  background: transparent;
  color: #e8eefc;
}

/* 装饰层在封面底部渐隐，避免光晕出现在变浅的过渡区 */
.hero--tech-dark .hero__fx {
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 16%, #000 62%, transparent 100%);
  mask-image: linear-gradient(180deg, transparent 0%, #000 16%, #000 62%, transparent 100%);
}

.hero--tech-dark .hero__eyebrow {
  color: #6ee7ff;
  letter-spacing: 0.24em;
}

.hero--tech-dark .hero__title {
  text-shadow: 0 2px 26px rgba(80, 140, 255, 0.28);
}

.hero--tech-dark .hero__title em {
  background: linear-gradient(92deg, #67e8f9 0%, #818cf8 45%, #f0abfc 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero--tech-dark .hero__bio {
  color: #b9c6e6;
}

.hero--tech-dark .hero__btn {
  border-color: rgba(160, 190, 255, 0.38);
  color: #e8eefc;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(6px);
}

.hero--tech-dark .hero__btn:hover {
  border-color: #67e8f9;
  color: #fff;
  box-shadow: 0 0 22px rgba(103, 232, 249, 0.25);
}

.hero--tech-dark .hero__btn--primary {
  background: linear-gradient(92deg, #2563eb, #7c3aed);
  border-color: transparent;
  color: #fff;
}

.hero--tech-dark .hero__btn--primary:hover {
  background: linear-gradient(92deg, #3b82f6, #8b5cf6);
  color: #fff;
}

.hero--tech-dark .hero__affil {
  color: #8fa2c9;
}

.hero--tech-dark .hero__vertical {
  color: rgba(160, 190, 255, 0.55);
}

/* 科技感装饰层 */
.hero__fx {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.hero__grid {
  position: absolute;
  inset: -2px;
  background-image:
    linear-gradient(rgba(120, 160, 255, 0.09) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 160, 255, 0.09) 1px, transparent 1px);
  background-size: 46px 46px;
  mask-image: radial-gradient(ellipse at 70% 40%, #000 0%, transparent 78%);
  -webkit-mask-image: radial-gradient(ellipse at 70% 40%, #000 0%, transparent 78%);
  animation: gridDrift 24s linear infinite;
}

.hero__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.55;
  animation: floatGlow 12s ease-in-out infinite alternate;
}

.hero__glow--a {
  width: 340px;
  height: 340px;
  top: -80px;
  right: 8%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.7), transparent 70%);
}

.hero__glow--b {
  width: 300px;
  height: 300px;
  bottom: -90px;
  left: 4%;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.65), transparent 70%);
  animation-delay: -6s;
}

.hero__beam {
  position: absolute;
  top: 0;
  left: -30%;
  width: 45%;
  height: 100%;
  background: linear-gradient(100deg, transparent, rgba(103, 232, 249, 0.07), transparent);
  transform: skewX(-18deg);
  animation: beamSweep 9s ease-in-out infinite;
}

.hero__particles {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 12% 22%, rgba(160, 210, 255, 0.9), transparent),
    radial-gradient(2px 2px at 28% 68%, rgba(160, 210, 255, 0.7), transparent),
    radial-gradient(1.5px 1.5px at 52% 30%, rgba(230, 200, 255, 0.8), transparent),
    radial-gradient(2px 2px at 68% 76%, rgba(160, 210, 255, 0.75), transparent),
    radial-gradient(1.5px 1.5px at 84% 44%, rgba(160, 210, 255, 0.85), transparent),
    radial-gradient(1.5px 1.5px at 40% 86%, rgba(230, 200, 255, 0.7), transparent);
  background-size: 420px 320px;
  animation: twinkle 6s ease-in-out infinite alternate;
}

@keyframes gridDrift {
  from { background-position: 0 0; }
  to { background-position: 46px 46px; }
}

@keyframes floatGlow {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to { transform: translate3d(24px, 18px, 0) scale(1.12); }
}

@keyframes beamSweep {
  0%, 100% { left: -40%; }
  50% { left: 120%; }
}

@keyframes twinkle {
  from { opacity: 0.45; }
  to { opacity: 0.95; }
}

/* ================= 浅纸感经典风（后期可切换 theme=classic） ================= */
.hero--classic {
  background: transparent;
  color: var(--ink);
}

.hero--classic .hero__eyebrow { color: var(--cinnabar-deep); margin-bottom: 1.2rem; }
.hero--classic .hero__title em { font-style: normal; color: var(--cinnabar-deep); }
.hero--classic .hero__bio { color: var(--ink-soft); }
.hero--classic .hero__btn { border: 1px solid var(--line-strong); color: var(--ink); }
.hero--classic .hero__btn:hover { border-color: var(--cinnabar); color: var(--cinnabar-deep); }
.hero--classic .hero__btn--primary { background: var(--cinnabar); border-color: var(--cinnabar); color: #f6f1e7; }
.hero--classic .hero__affil { color: var(--ink-faint); }
.hero--classic .hero__vertical { color: var(--ink-faint); }
.hero--classic .hero__fx { display: none; }

/* ================= 共用 ================= */
.hero__eyebrow { margin-bottom: 1.2rem; }

.hero__title {
  font-family: var(--font-serif-sc);
  font-size: clamp(2.2rem, 5.5vw, 3.9rem);
  letter-spacing: 0.01em;
}

.hero__title em {
  font-style: normal;
  position: relative;
}

.hero__bio {
  margin-top: 1.4rem;
  max-width: 34rem;
  font-size: 1.02rem;
}

.hero__actions {
  margin-top: 2rem;
  display: flex;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.hero__btn {
  border-radius: 999px;
  padding: 0.6rem 1.7rem;
  text-decoration: none;
  transition: all 0.25s var(--ease-out);
}

.hero__btn:hover { text-decoration: none; }

.hero__affil {
  margin-top: 2.2rem;
}

.hero__side {
  display: flex;
  align-items: center;
  gap: 1.6rem;
}

.hero__vertical {
  writing-mode: vertical-rl;
  font-family: var(--font-serif-sc);
  font-weight: 600;
  font-size: 1.5rem;
  letter-spacing: 0.5em;
}

.section {
  padding-top: 2.8rem;
}

.section-more {
  font-size: 0.88rem;
  white-space: nowrap;
}

.featured {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.2rem;
  /* T7-③：预留精选区高度（桌面单行 3 卡≈250px），骨架与真实卡片同高，数据到达不位移。 */
  min-height: 15.625rem;
}

.featured__card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1.5rem 1.4rem;
  background: var(--paper-elev);
  border: 1px solid var(--line);
  border-radius: 6px;
  text-decoration: none;
  color: var(--ink);
  transition: transform 0.3s var(--ease-out), box-shadow 0.3s var(--ease-out);
  /* 卡片定高（实测 250px）：骨架与真实卡片一致，避免精选区 CLS。 */
  min-height: 15.625rem;
}

.featured__card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-soft);
  text-decoration: none;
}

.featured__category {
  color: var(--cinnabar-deep);
}

.featured__title {
  font-size: 1.12rem;
  font-weight: 700;
}

.featured__excerpt {
  color: var(--ink-soft);
  font-size: 0.88rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.featured__more {
  margin-top: auto;
  font-size: 0.85rem;
  color: var(--cinnabar-deep);
}

.drawers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.2rem;
}

.drawer {
  position: relative;
  padding: 1.6rem 1.3rem 1.4rem;
  border-top: 2px solid var(--line-strong);
  text-decoration: none;
  color: var(--ink);
  transition: border-color 0.3s var(--ease-out), background-color 0.3s var(--ease-out);
}

.drawer:hover {
  border-top-color: var(--cinnabar);
  background: var(--cinnabar-wash);
  text-decoration: none;
}

.drawer__count {
  color: var(--ink-faint);
  font-size: 0.85rem;
}

.drawer__title {
  font-size: 1.5rem;
  margin-top: 0.5rem;
}

.drawer__desc {
  margin-top: 0.5rem;
  color: var(--ink-soft);
  font-size: 0.88rem;
}

/* T7-③：首屏异步区域骨架占位（静态，无动画以避免 TBT）。与真实内容同布局同高，数据到达零位移。 */
.index-list {
  /* 桌面 6 行×133px≈798px；移动端在下方媒体查询覆盖为 1278px。 */
  min-height: 49.875rem;
}

/* 仅首页索引行定高（与骨架同高，消除 CLS）；不影响其他页面的 PostIndexItem 自然行高。 */
.index-list :deep(.item) {
  min-height: 8.3125rem;
}

.sk {
  display: block;
  height: 0.8rem;
  border-radius: 4px;
  background: var(--paper-deep);
}

.sk--sm {
  width: 40%;
  height: 0.7rem;
}

.sk--title {
  width: 82%;
  height: 1.1rem;
}

.sk--more {
  width: 30%;
  margin-top: auto;
}

.sk--meta {
  width: 55%;
}

.featured__card--sk {
  justify-content: flex-start;
}

.item--sk {
  display: grid;
  grid-template-columns: 2.6rem 11rem 1fr 2rem;
  gap: 1.25rem;
  align-items: start;
  padding: 1.4rem 0.4rem;
  border-bottom: 1px solid var(--line);
  min-height: 8.3125rem;
}

.item--sk .item__body {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

@media (max-width: 900px) {
  .featured {
    grid-template-columns: 1fr;
  }
  .drawers {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .hero__inner {
    grid-template-columns: 1fr;
    min-height: 52vh;
  }
  .home--tech-dark::before {
    background: linear-gradient(
      180deg,
      var(--home-surface) 0,
      var(--home-deep-2) 11vh,
      var(--home-deep) calc(52vh - 120px),
      var(--home-surface) calc(52vh + 60px),
      var(--home-surface) 100%
    );
  }
  .hero__side {
    flex-direction: row-reverse;
    justify-content: flex-end;
  }
  .hero__vertical {
    font-size: 1.1rem;
  }
  .drawers {
    grid-template-columns: 1fr;
  }
  /* T7-③：移动端首屏预留高度（精选 3 卡堆叠≈788px；索引 6 行×213px≈1278px）。bio 默认隐藏，不再预留。 */
  .featured {
    min-height: 49.25rem;
  }
  .index-list {
    min-height: 79.875rem;
  }
  .index-list :deep(.item) {
    min-height: 13.3125rem;
  }
  .item--sk {
    grid-template-columns: 1fr 2rem;
    gap: 0.5rem;
    min-height: 13.3125rem;
  }
  .item--sk .item__index {
    display: none;
  }
  .item--sk .item__date {
    grid-column: 1 / -1;
  }
}
</style>