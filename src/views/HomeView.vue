<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api, CATEGORY_LABELS, CATEGORY_PATHS, type Category, type PostSummary } from '@/api'
import { HOME_CONFIG, SEAL_VISIBLE } from '@/config/site'
import { useSeo } from '@/composables/useSeo'
import SealStamp from '@/components/SealStamp.vue'
import SectionHead from '@/components/SectionHead.vue'
import PostIndexItem from '@/components/PostIndexItem.vue'

useSeo({ title: '首页' })

// 强调色注入为 CSS 变量，后续只需改 config/site.ts 的 HOME_CONFIG.palette.accent 即可换色。
// 背景渐变由全局 styles/tokens.css 的 --page-top/mid/bottom 统一提供，全页一条、无分段跳变。
const themeVars = computed(() => {
  if (HOME_CONFIG.theme !== 'tech-light') return {}
  return { '--home-accent': HOME_CONFIG.palette.accent } as Record<string, string>
})

const featured = ref<PostSummary[]>([])
const recent = ref<PostSummary[]>([])
const counts = ref<Record<Exclude<Category, 'diary'>, number>>({ blog: 0, opinion: 0, academic: 0 })
// T7-③：首屏异步区域（精选/最新索引/bio）以骨架占位预留高度，避免数据到达后撑高页面导致 CLS。
const loading = ref(true)

// 封面 → 内容：首屏只显示封面，向下翻页到「精选」区。
const featuredRef = ref<HTMLElement | null>(null)
const contentIn = ref(false)
let scrollHandler: (() => void) | null = null
const revealListeners: [Window, string, EventListener][] = []

// 只有用户主动滚动才会揭幕。除 scroll 位置判定外，再叠加“真实滚动意图”事件（滚轮/触摸/翻页键）：
// 刷新时浏览器的滚动恢复只会派发 scroll 事件、不会派发这些事件，因此首屏始终只显示封面。
function onRevealIntent(e?: Event) {
  if (e && e.type === 'keydown') {
    const k = (e as KeyboardEvent).key
    if (!['PageDown', 'ArrowDown', 'ArrowUp', ' ', 'Spacebar', 'End'].includes(k)) return
  }
  contentIn.value = true
}
function addRevealListener(type: string) {
  const fn = onRevealIntent as EventListener
  window.addEventListener(type, fn, { passive: true })
  revealListeners.push([window, type, fn])
}

// “开始阅读”按钮：像翻页一样平滑滚动到「精选」区；sticky 页头高度由 scroll-margin-top 让开。
function goToContent() {
  contentIn.value = true
  featuredRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const categories: { key: Exclude<Category, 'diary'>; desc: string }[] = [
  { key: 'blog', desc: '方法、工具与长篇思考' },
  { key: 'opinion', desc: '对学术与行业的立场' },
  { key: 'academic', desc: '论文、报告与项目' },
]

onMounted(async () => {
  // 刷新 / F5 / Ctrl+F5 时禁用浏览器自带的滚动恢复，避免页面停在「精选」区而提前揭幕。
  // 回顶完全交给 router 的 scrollBehavior：首次加载 saved 为空 → 回到封面顶部；
  // 从文章回退时 saved 有值 → 恢复到离开前的「精选」位置。
  // 关键：这里绝不能再调 window.scrollTo(0,0)，否则会覆盖 router 回退时的位置恢复，
  // 导致从「精选/最新索引」点进文章后按回退，落不到原来的阅读位置。
  history.scrollRestoration = 'manual'
  // 仅首页启用 proximity 滚动吸附：封面与内容区各为一个翻页锚点，轻滑即可“翻页”；
  // 卸载时移除，其它路由不受影响（命名空间限定在 html.home-flip）。
  document.documentElement.classList.add('home-flip')
  // 只有在用户真正向下滚动后才揭幕内容区。之前用 IntersectionObserver(threshold .08)
  // 会因 svh 取整导致「精选」区在刷新时露出一角、观察器立刻判定相交而提前揭幕；
  // 改为滚动位置判定：scrollY 越过阈值即揭幕，首屏刷新（scrollY=0）时内容始终隐藏。
  scrollHandler = () => {
    if (window.scrollY > 24) contentIn.value = true
  }
  window.addEventListener('scroll', scrollHandler, { passive: true })
  // 回退到首页时 router 会恢复上次滚动位置，可能在监听器注册前就已触发 scroll，
  // 这里按当前 scrollY 主动补判一次，保证「精选」区直接可见而不是停在隐藏态。
  if (window.scrollY > 24) contentIn.value = true
  addRevealListener('wheel')
  addRevealListener('touchmove')
  addRevealListener('keydown')
  try {
    const all = await api.listPosts({ pageSize: 50 })
    // 精选 = 全站最新发布的 3 篇（跨栏目），不再依赖失效的演示 slug；
    // 最新索引 = 全站最新发布的文章（跨栏目，按发布日期降序）。
    featured.value = all.items.slice(0, 3)
    recent.value = all.items.slice(0, 6)
    for (const key of Object.keys(counts.value) as Exclude<Category, 'diary'>[]) {
      counts.value[key] = all.items.filter((post) => post.category === key).length
    }
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (scrollHandler) window.removeEventListener('scroll', scrollHandler)
  revealListeners.forEach(([target, type, fn]) => target.removeEventListener(type, fn))
  revealListeners.length = 0
  document.documentElement.classList.remove('home-flip')
  // 离开首页时恢复浏览器默认的滚动恢复行为，避免影响其它页面。
  history.scrollRestoration = 'auto'
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
            <button type="button" class="hero__btn hero__btn--primary" @click="goToContent">{{ HOME_CONFIG.primaryAction.label }}</button>
            <RouterLink :to="HOME_CONFIG.secondaryAction.to" class="hero__btn">{{ HOME_CONFIG.secondaryAction.label }}</RouterLink>
          </div>
          <button type="button" class="hero__scroll-hint" aria-label="向下翻页阅读" @click="goToContent">
            <span class="hero__scroll-hint-line" aria-hidden="true"></span>
          </button>
          <p v-if="HOME_CONFIG.affiliation" class="hero__affil mono rise" style="animation-delay: 0.3s">
            {{ HOME_CONFIG.affiliation }}
          </p>
        </div>
        <div class="hero__side">
          <span v-if="HOME_CONFIG.vertical" class="hero__vertical" aria-hidden="true">{{ HOME_CONFIG.vertical }}</span>
          <SealStamp v-if="SEAL_VISIBLE && HOME_CONFIG.sealChar" animated :char="HOME_CONFIG.sealChar" />
        </div>
      </div>
    </section>

    <section
      v-if="loading || featured.length"
      ref="featuredRef"
      class="page section content-section"
      :class="{ 'content-section--in': contentIn }"
    >
      <SectionHead title="精选" />
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
      <SectionHead title="最新">
        <template #action>
          <RouterLink to="/archive" class="section-more">全部文章 →</RouterLink>
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
      <SectionHead title="归类" />
      <div class="drawers">
        <RouterLink
          v-for="(c, i) in categories"
          :key="c.key"
          :to="CATEGORY_PATHS[c.key]"
          class="drawer rise"
          :style="{ animationDelay: `${i * 0.07}s` }"
        >
          <div class="drawer__head">
            <h3 class="drawer__title">{{ CATEGORY_LABELS[c.key] }}</h3>
            <span class="drawer__count" aria-hidden="true">{{ String(counts[c.key]).padStart(2, '0') }}</span>
          </div>
          <p class="drawer__desc">{{ c.desc }}</p>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* 首页与全站共用 body 上的同一条连续渐变，不再自带背景场，消除一切分段跳变 */
.home {
  position: relative;
  isolation: isolate;
}

.home--tech-light {
  /* 仅在首页把强调色指向科技蓝紫；背景保持透明，露出全页连续渐变 */
  --cinnabar: var(--home-accent);
  --cinnabar-deep: var(--home-accent);
  --cinnabar-wash: rgba(79, 70, 229, 0.1);
  color: var(--ink);
}

.hero {
  position: relative;
  overflow: hidden;
  scroll-snap-align: start;
  /* 页头 sticky 占 4.2rem：不加这条时，scroll-snap 会把 hero 的吸附点算成 scrollY=68，
     浏览器加载/刷新后自动吸附过去 → 页头被滚上去、首屏露出精选，并触发揭幕门控。
     加 scroll-margin-top 让吸附点回到 scrollY=0，首屏稳定只显示封面。 */
  scroll-margin-top: 4.2rem;
}

.hero__inner {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  align-items: center;
  /* 封面独占首屏：减去 sticky 页头高度，使「精选」恰好落在首屏之外。 */
  min-height: calc(100vh - 4.2rem);
  min-height: calc(100svh - 4.2rem);
  padding-top: clamp(3rem, 7vh, 5rem);
  padding-bottom: clamp(3rem, 7vh, 5rem);
}

/* 向下翻页提示：细红线胶囊 + 滚动小竖线，点击同“开始阅读”。 */
.hero__scroll-hint {
  position: absolute;
  left: 50%;
  bottom: 1.4rem;
  transform: translateX(-50%);
  width: 1.55rem;
  height: 2.5rem;
  display: flex;
  justify-content: center;
  padding: 0.5rem 0 0;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  z-index: 2;
  transition: border-color 0.25s var(--ease-out);
}

.hero__scroll-hint:hover {
  border-color: var(--home-accent);
}

.hero__scroll-hint-line {
  width: 2px;
  height: 0.62rem;
  border-radius: 2px;
  background: var(--home-accent, var(--cinnabar-deep));
  animation: hintScroll 1.8s ease-in-out infinite;
}

@keyframes hintScroll {
  0%, 100% { transform: translateY(0); opacity: 0.35; }
  50% { transform: translateY(0.7rem); opacity: 1; }
}

/* ================= 全浅色 AI 科技风（默认 theme=tech-light） ================= */
.hero--tech-light {
  /* 完全透明，文字用全站深墨色，与连续渐变自然融合 */
  background: transparent;
  color: var(--ink);
}

/* 装饰层仅在底部自然淡出，不做顶部渐入（顶部已是近白，无需衔接） */
.hero--tech-light .hero__fx {
  -webkit-mask-image: linear-gradient(180deg, #000 0%, #000 72%, transparent 100%);
  mask-image: linear-gradient(180deg, #000 0%, #000 72%, transparent 100%);
}

.hero--tech-light .hero__eyebrow {
  color: var(--home-accent);
  letter-spacing: 0.24em;
}

.hero--tech-light .hero__title {
  color: #111a30;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
}

.hero--tech-light .hero__title em {
  background: linear-gradient(92deg, #2563eb 0%, #7c3aed 52%, #9333ea 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero--tech-light .hero__bio {
  color: var(--ink-soft);
}

.hero--tech-light .hero__btn {
  border-color: var(--line-strong);
  color: var(--ink);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(6px);
}

.hero--tech-light .hero__btn:hover {
  border-color: var(--home-accent);
  color: var(--home-accent);
  box-shadow: 0 8px 22px rgba(79, 70, 229, 0.14);
}

.hero--tech-light .hero__btn--primary {
  background: linear-gradient(92deg, #2563eb, #7c3aed);
  border-color: transparent;
  color: #fff;
}

.hero--tech-light .hero__btn--primary:hover {
  background: linear-gradient(92deg, #3b82f6, #8b5cf6);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 10px 26px rgba(79, 70, 229, 0.3);
}

.hero--tech-light .hero__affil {
  color: var(--ink-faint);
}

.hero--tech-light .hero__vertical {
  color: #1b2440;
  /* 双层墨迹阴影：一层淡彩偏移模拟毛笔洇墨，一层极细描边强化笔锋 */
  text-shadow: 0.05em 0.05em 0 rgba(96, 116, 180, 0.22), 0 0 1px rgba(20, 30, 60, 0.35);
}

/* ---- 夜间模式适配：上面几处为浅底写死的颜色改为亮色，保证日/夜均可读 ----
   data-theme 由主题仓库挂在 <html> 上，故可用祖先选择器覆盖；仅覆盖有问题的属性，
   主按钮的蓝紫渐变、渐变高亮字本身在深色底已足够清晰，保持不变。 */
[data-theme='ink'] .hero--tech-light .hero__title {
  color: #eef1f8;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

[data-theme='ink'] .hero--tech-light .hero__title em {
  /* 去掉深色描边阴影，保留原本渐变高亮字的观感 */
  text-shadow: none;
}

[data-theme='ink'] .hero--tech-light .hero__eyebrow {
  color: #a5b4fc;
}

/* 次按钮：浅底时的半透明白底在深色底会变成灰块且浅色文字看不清，改成深色玻璃底 + 亮字 */
[data-theme='ink'] .hero--tech-light .hero__btn:not(.hero__btn--primary) {
  background: rgba(22, 25, 33, 0.72);
  border-color: rgba(232, 228, 218, 0.42);
  color: #f0eef0;
}

[data-theme='ink'] .hero--tech-light .hero__btn:not(.hero__btn--primary):hover {
  border-color: #a5b4fc;
  color: #a5b4fc;
}

/* 向下翻页胶囊：边框提亮，内部竖线由暗蓝改为亮蓝紫 */
[data-theme='ink'] .hero--tech-light .hero__scroll-hint {
  border-color: rgba(232, 228, 218, 0.55);
}

[data-theme='ink'] .hero--tech-light .hero__scroll-hint:hover {
  border-color: #a5b4fc;
}

[data-theme='ink'] .hero--tech-light .hero__scroll-hint-line {
  background: #a5b4fc;
}

[data-theme='ink'] .hero--tech-light .hero__vertical {
  color: #eceaf2;
  text-shadow: 0.05em 0.05em 0 rgba(150, 165, 240, 0.28), 0 0 1px rgba(255, 255, 255, 0.25);
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
    linear-gradient(rgba(79, 70, 229, 0.09) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 70, 229, 0.09) 1px, transparent 1px);
  background-size: 46px 46px;
  mask-image: radial-gradient(ellipse at 70% 40%, #000 0%, transparent 78%);
  -webkit-mask-image: radial-gradient(ellipse at 70% 40%, #000 0%, transparent 78%);
  animation: gridDrift 24s linear infinite;
}

.hero__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.4;
  animation: floatGlow 12s ease-in-out infinite alternate;
}

.hero__glow--a {
  width: 360px;
  height: 360px;
  top: -90px;
  right: 6%;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.5), transparent 70%);
}

.hero__glow--b {
  width: 320px;
  height: 320px;
  bottom: -100px;
  left: 2%;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.45), transparent 70%);
  animation-delay: -6s;
}

.hero__beam {
  position: absolute;
  top: 0;
  left: -30%;
  width: 45%;
  height: 100%;
  background: linear-gradient(100deg, transparent, rgba(79, 70, 229, 0.06), transparent);
  transform: skewX(-18deg);
  animation: beamSweep 9s ease-in-out infinite;
}

.hero__particles {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(2px 2px at 12% 22%, rgba(79, 70, 229, 0.45), transparent),
    radial-gradient(2px 2px at 28% 68%, rgba(37, 99, 235, 0.4), transparent),
    radial-gradient(1.5px 1.5px at 52% 30%, rgba(147, 51, 234, 0.42), transparent),
    radial-gradient(2px 2px at 68% 76%, rgba(79, 70, 229, 0.38), transparent),
    radial-gradient(1.5px 1.5px at 84% 44%, rgba(37, 99, 235, 0.45), transparent),
    radial-gradient(1.5px 1.5px at 40% 86%, rgba(147, 51, 234, 0.4), transparent);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  line-height: 1.75;
  border: 1px solid var(--line-strong);
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
  /* 毛笔行书艺术字：优先系统自带的行楷/楷体，渲染出毛笔提按的笔锋质感 */
  font-family: 'STXingkai', '华文行楷', 'STKaiti', 'KaiTi', '楷体', var(--font-serif-sc);
  font-weight: 400;
  /* 放大到与封面主视觉相称的尺寸，随视口收放 */
  font-size: clamp(2.6rem, 4.4vw, 3.6rem);
  letter-spacing: 0.18em;
  line-height: 1.06;
}

.section {
  padding-top: 2.8rem;
}

/* 封面 → 内容：向下翻页时内容区轻微上移淡入，形成“丝滑翻页”过渡。 */
.content-section {
  scroll-margin-top: 4.2rem;
  scroll-snap-align: start;
  opacity: 0;
  transform: translateY(2.5rem);
  transition: opacity 0.75s var(--ease-out), transform 0.75s var(--ease-out);
  will-change: opacity, transform;
}

.content-section--in {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .content-section {
    /* 保留首屏隐藏（opacity 仍由 .content-section--in 控制），只去掉位移与过渡动画 */
    transform: none;
    transition: none;
  }
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

/* 标题移到左上角，与右侧放大的艺术数字同一行 */
.drawer__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.drawer__title {
  font-size: 1.5rem;
  margin-top: 0;
}

/* 艺术数字：衬线斜体 + 醒目渐变色 + 描边高光，尺寸放大 */
.drawer__count {
  font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, 'Times New Roman', serif;
  font-size: clamp(2.6rem, 4.4vw, 3.4rem);
  font-style: italic;
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: -0.05em;
  background: linear-gradient(135deg, var(--cinnabar) 0%, var(--cinnabar-deep) 55%, #b0169b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: var(--cinnabar-deep); /* 渐变不支持时的回退色 */
  filter: drop-shadow(0 1px 1px rgba(67, 56, 202, 0.25));
  white-space: nowrap;
  user-select: none;
}

/* 渐变文字在不支持 background-clip 的浏览器里补一个可见描边 */
@supports not ((-webkit-background-clip: text) or (background-clip: text)) {
  .drawer__count {
    -webkit-text-fill-color: currentColor;
    color: var(--cinnabar-deep);
  }
}

.drawer__desc {
  margin-top: 0.85rem;
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
    min-height: calc(100vh - 4.2rem);
    min-height: calc(100svh - 4.2rem);
  }
  .hero__side {
    flex-direction: row-reverse;
    justify-content: flex-end;
  }
  .hero__actions {
    margin-bottom: 2.2rem;
  }
  .hero__vertical {
    font-size: 2rem;
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

<!-- 首页翻页吸附：proximity 仅在接近锚点时生效，不干扰阅读区的连续滚动。
     作用范围由 onMounted/onUnmounted 切换的 html.home-flip 类名限定，离开首页即失效。 -->
<style>
html.home-flip {
  scroll-snap-type: y proximity;
}
</style>