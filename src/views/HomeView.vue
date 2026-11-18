<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api, CATEGORY_LABELS, CATEGORY_PATHS, type Category, type PostSummary, type Profile } from '@/api'
import { FEATURED_SLUGS } from '@/config/site'
import { useSeo } from '@/composables/useSeo'
import { mdToPlainText } from '@/utils/text'
import SealStamp from '@/components/SealStamp.vue'
import SectionHead from '@/components/SectionHead.vue'
import PostIndexItem from '@/components/PostIndexItem.vue'

useSeo({ title: '首页' })

const profile = ref<Profile | null>(null)
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
    const [p, all] = await Promise.all([api.getProfile(), api.listPosts({ pageSize: 50 })])
    profile.value = p
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
  <div>
    <section class="hero page">
      <div class="hero__text">
        <p class="hero__eyebrow mono rise">Personal Site · Est. 2026</p>
        <h1 class="hero__title rise" style="animation-delay: 0.08s">
          在管理与数据之间，<br />做一点<em>魔法</em>。
        </h1>
        <p class="hero__bio rise" style="animation-delay: 0.16s">
          {{ profile ? mdToPlainText(profile.bio) : '研究、博客、观点与学术内容。' }}
        </p>
        <div class="hero__actions rise" style="animation-delay: 0.24s">
          <RouterLink to="/blog" class="hero__btn hero__btn--primary">开始阅读</RouterLink>
          <RouterLink to="/about" class="hero__btn">了解我</RouterLink>
        </div>
        <p class="hero__affil mono rise" style="animation-delay: 0.3s">
          {{ profile?.affiliation ?? '浙江大学管理学院' }}
        </p>
      </div>
      <div class="hero__side">
        <span class="hero__vertical" aria-hidden="true">格物致知</span>
        <SealStamp animated :char="profile?.sealChar ?? '魔'" />
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

    <section class="page section">
      <blockquote class="pullquote rise">
        <p>「好的研究应当既能解释世界，<br />也能改善日常。」</p>
        <cite class="mono">— Magic</cite>
      </blockquote>
    </section>
  </div>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  align-items: center;
  padding-top: clamp(3rem, 8vh, 6rem);
  padding-bottom: clamp(2.5rem, 6vh, 4.5rem);
  min-height: 62vh;
}

.hero__eyebrow {
  color: var(--cinnabar-deep);
  margin-bottom: 1.2rem;
}

.hero__title {
  font-family: var(--font-serif-sc);
  font-size: clamp(2.2rem, 5.5vw, 3.9rem);
  letter-spacing: 0.01em;
}

.hero__title em {
  font-style: normal;
  color: var(--cinnabar-deep);
  position: relative;
}

.hero__bio {
  margin-top: 1.4rem;
  max-width: 34rem;
  color: var(--ink-soft);
  font-size: 1.02rem;
  /* T7-③：预留 bio 高度（占位→真实文本不撑高 hero），消除首屏 CLS。桌面 2 行≈86px。 */
  min-height: 5.375rem;
}

.hero__actions {
  margin-top: 2rem;
  display: flex;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.hero__btn {
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  padding: 0.6rem 1.7rem;
  color: var(--ink);
  text-decoration: none;
  transition: all 0.25s var(--ease-out);
}

.hero__btn:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar-deep);
  text-decoration: none;
}

.hero__btn--primary {
  background: var(--cinnabar);
  border-color: var(--cinnabar);
  color: #f6f1e7;
}

.hero__btn--primary:hover {
  background: var(--cinnabar-deep);
  color: #f6f1e7;
}

.hero__affil {
  margin-top: 2.2rem;
  color: var(--ink-faint);
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
  color: var(--ink-faint);
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

.pullquote {
  margin: 2rem 0 0;
  padding: 2.5rem 1rem;
  text-align: center;
}

.pullquote p {
  font-family: var(--font-serif-sc);
  font-weight: 600;
  font-size: clamp(1.4rem, 3.2vw, 2.1rem);
  line-height: 1.8;
}

.pullquote cite {
  display: block;
  margin-top: 1.2rem;
  color: var(--ink-faint);
  font-style: normal;
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
  grid-template-columns: 2.6rem 7.2rem 1fr 2rem;
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
  .hero {
    grid-template-columns: 1fr;
    min-height: auto;
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
  /* T7-③：移动端首屏预留高度（bio 3 行≈114px；精选 3 卡堆叠≈788px；索引 6 行×213px≈1278px）。 */
  .hero__bio {
    min-height: 7.125rem;
  }
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