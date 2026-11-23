<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ApiError, api, CATEGORY_LABELS, CATEGORY_PATHS, type Post } from '@/api'
import { useSeo } from '@/composables/useSeo'

import { formatDate, formatDateZh } from '@/utils/format'
import MarkdownView from '@/components/MarkdownView.vue'
import { useI18n } from '@/i18n'

const { t, isEn, locale } = useI18n()

interface TocItem { id: string; text: string; level: 2 | 3 }

const route = useRoute()
const post = ref<Post | null>(null)
const error = ref('')
const loading = ref(true)
// 文章目录：学术类与博客类文章展示左侧粘性目录；MarkdownView 渲染后回填
const toc = ref<TocItem[]>([])
const showToc = computed(() =>
  (post.value?.category === 'academic' || post.value?.category === 'blog') && toc.value.length > 0,
)

async function load(slug: string) {
  loading.value = true
  error.value = ''
  post.value = null
  toc.value = []
  try {
    const result = await api.getPost(slug)
    post.value = result
    useSeo({ title: result.title, description: result.excerpt })
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('common.retry')
    useSeo({ title: t('post.notFound') })
  } finally {
    loading.value = false
  }
}

watch(
  () => [route.params.slug, locale.value] as const,
  ([slug]) => {
    if (typeof slug === 'string') void load(slug)
  },
  { immediate: true },
)

/**
 * 去掉正文开头与页面标题重复的一级标题，避免「双重标题」。
 * 只处理正文最开头（允许前导空行）的单个 # 标题，且仅在文字与标题一致时移除；
 * 正文内部的同级标题、或标题不一致的情况一律保留。这样所有文章文件都统一生效，
 * 无需逐篇依赖作者删除正文标题。
 */
const bodyContent = computed(() => {
  const raw = post.value?.content ?? ''
  const title = (post.value?.title ?? '').trim()
  if (!raw || !title) return raw
  const match = raw.match(/^(\s*)#\s+([^\n]+)\n?/)
  if (match && match[2].trim() === title) {
    return raw.slice(match[0].length).replace(/^\s*\n/, '')
  }
  return raw
})
</script>

<template>
  <div class="page post-page" :class="{ 'post-page--toc': showToc }">
    <p v-if="loading" class="state mono" role="status">{{ t('common.loading') }}</p>
    <div v-else-if="error" class="state" role="alert">
      <p class="state__error">{{ error }}</p>
      <RouterLink to="/">{{ isEn ? 'Back home' : '返回首页' }}</RouterLink>
    </div>
    <article v-else-if="post" class="post" :class="{ 'post--with-toc': showToc }">
      <!-- 带目录文章的分类标签放到左列第 1 行（标题左侧空白列），与目录同列对齐 -->
      <RouterLink
        v-if="showToc"
        :to="CATEGORY_PATHS[post.category]"
        class="post__category mono"
      >{{ isEn ? t('nav.' + (post.category === 'opinion' ? 'opinions' : post.category)) : CATEGORY_LABELS[post.category] }}</RouterLink>
      <header class="post__header">
        <RouterLink v-if="!showToc" :to="CATEGORY_PATHS[post.category]" class="post__category mono">
          {{ isEn ? t('nav.' + (post.category === 'opinion' ? 'opinions' : post.category)) : CATEGORY_LABELS[post.category] }}
        </RouterLink>
        <h1 class="post__title">{{ post.title }}</h1>
        <div class="post__meta mono">
          <time v-if="post.publishedAt" :datetime="post.publishedAt">{{ isEn ? formatDate(post.publishedAt) : formatDateZh(post.publishedAt) }}</time>
          <span v-if="post.visibility === 'private'" class="post__badge">{{ t('common.private') }}</span>
          <span v-if="post.status === 'draft'" class="post__badge">{{ t('common.draft') }}</span>
        </div>
        <div class="post__tags">
          <span v-for="tag in post.tags" :key="tag.slug" class="post__tag">#{{ tag.name }}</span>
        </div>
      </header>
      <div class="post__layout">
        <!-- 学术文章左侧目录：点击平滑跳转到对应章节，桌面端 sticky 跟随滚动 -->
        <aside v-if="showToc" class="post__toc" :aria-label="t('post.tocAria')">
          <p class="post__toc-title mono">{{ t('post.toc') }}</p>
          <nav class="post__toc-nav">
            <a
              v-for="item in toc"
              :key="item.id"
              :href="`#${item.id}`"
              class="post__toc-link"
              :class="{ 'post__toc-link--sub': item.level === 3 }"
            >{{ item.text }}</a>
          </nav>
        </aside>
        <div class="post__main">
          <MarkdownView :source="bodyContent" :section="post.category" @headings="(items) => (toc = items)" />
          <footer class="post__footer">
            <RouterLink :to="CATEGORY_PATHS[post.category]">← {{ t('common.back') }} {{ isEn ? t('nav.' + (post.category === 'opinion' ? 'opinions' : post.category)) : CATEGORY_LABELS[post.category] }}</RouterLink>
          </footer>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
.post-page {
  padding-top: 3.2rem;
  min-height: 60vh;
}

.post {
  /* 正文与标题共用的展示宽度：左右边界一致，标题按此宽度逐行两端对齐。 */
  --content-w: 60rem;
  max-width: var(--content-w);
  margin: 0 auto;
}

/* 带目录的文章页：容器铺满视口，使左侧目录贴合页面最左缘且左边界不变；
   正文占据一个水平居中的独立阅读区（左右等宽留白，使内容区垂直中心线与页面重合）。 */
.post-page--toc {
  max-width: none;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}

.post-page--toc .post {
  max-width: none;
  margin: 0;
}

.post__layout {
  display: block;
}

/* 三列网格直接建立在整个文章容器上：左右两列等宽（各 16.5rem），中间列天然
   水平居中于页面（其中线与页面中线重合）。目录放左列且左边界贴合页面左缘不变，
   右列留空仅作对称配重；标题/时间/标签与正文共用中间列，宽度上限一致（--content-w），
   因此标题右缘不会超出正文卡片右边界。正文列最大 60rem，窄屏自动收窄。 */
.post--with-toc {
  display: grid;
  grid-template-columns: 16.5rem minmax(0, 1fr) 16.5rem;
  align-items: start;
}

/* 布局壳退让为透明容器，让目录与正文成为上面网格的直接子项 */
.post--with-toc .post__layout {
  display: contents;
}

.post--with-toc .post__header,
.post--with-toc .post__main {
  grid-column: 2;
  width: 100%;
  max-width: var(--content-w, 60rem);
  margin-inline: auto;
}

.post--with-toc .post__header {
  grid-row: 1;
}

/* 分类标签放到左列第 1 行（标题左侧空白列），与目录同列左缘对齐，垂直对齐标题 */
.post--with-toc > .post__category {
  grid-column: 1;
  grid-row: 1;
  width: 15rem;
  align-self: start;
  padding-top: 0.35rem;
}

.post--with-toc .post__toc {
  grid-column: 1;
  grid-row: 2;
  width: 15rem;
}

.post--with-toc .post__main {
  grid-row: 2;
}

.post__toc {
  position: sticky;
  top: 6rem;
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
  padding: 1.1rem 1rem 1.2rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--paper-elev);
  scrollbar-width: thin;
}

.post__toc-title {
  color: var(--cinnabar-deep);
  font-weight: 600;
  margin-bottom: 0.9rem;
  padding-bottom: 0.7rem;
  border-bottom: 1px solid var(--line);
}

.post__toc-nav {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.post__toc-link {
  display: block;
  padding: 0.28rem 0.35rem;
  border-radius: 4px;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.45;
  text-decoration: none;
  transition: background-color 0.18s var(--ease-out), color 0.18s var(--ease-out);
}

.post__toc-link:hover {
  color: var(--cinnabar-deep);
  background: var(--cinnabar-wash);
  text-decoration: none;
}

.post__toc-link--sub {
  padding-left: 0.95rem;
  font-size: 0.78rem;
  color: var(--ink-faint);
}

/* 居中的毛玻璃正文卡片：半透明底 + 背景模糊 + 柔和发光边，
   与页面连续渐变融合，形成独立的正文展示区。横向扩展到与标题一致的 60rem。 */
.post__main {
  min-width: 0;
  max-width: var(--content-w, 60rem);
  position: relative;
  padding: clamp(1.5rem, 3vw, 2.5rem) clamp(1.35rem, 3vw, 2.6rem);
  background: color-mix(in srgb, var(--paper-elev) 76%, transparent);
  border: 1px solid color-mix(in srgb, var(--paper-elev) 58%, var(--line));
  border-radius: 16px;
  backdrop-filter: blur(16px) saturate(115%);
  -webkit-backdrop-filter: blur(16px) saturate(115%);
  box-shadow:
    0 24px 60px -32px rgba(26, 35, 56, 0.34),
    0 0 0 6px color-mix(in srgb, var(--paper-elev) 16%, transparent);
}

.post__header {
  margin-bottom: 2.4rem;
  /* 与正文卡片同一水平内边距，使标题/时间/标签文字与正文文字左缘对齐；
     右缘不超出正文卡片边框。 */
  padding-inline: clamp(1.35rem, 3vw, 2.6rem);
}

/* 分类标签（如「学术」）：放大到接近标题字号的量级，作为醒目的眉题。
   独占一行、与标题左缘对齐；左右边界不超出正文展示区。 */
.post__category {
  display: block;
  color: var(--cinnabar-deep);
  font-size: clamp(1.6rem, 3.2vw, 2.4rem);
  line-height: 1.2;
}

.post__title {
  /* 艺术衬线标题：字母大小一致、跨平台可用的经典字体栈，不受 variable-wonk 影响 */
  font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, 'Times New Roman', Georgia, serif;
  font-size: clamp(1.95rem, 4.4vw, 3rem);
  line-height: 1.25;
  letter-spacing: 0.01em;
  margin-top: 0.8rem;
  /* 左对齐：标题文字左缘与正文文字左缘对齐；标题区（post__header）的左右边界
     与正文卡片（post__main）一致，因此区域左右边界相同。一行放不下自动换行，
     文字自然结束、不再强行两端拉伸。 */
  text-align: left;
  /* 覆盖 base.css 全局 h1~h4 的 text-wrap:balance（会把文字均分到两行、每行只占
     一半宽度，视觉上标题显得比正文窄）。wrap 让每行填满容器宽度后再换行；
     注意：text-wrap 不认 normal（会被忽略并沿用 balance），必须用 wrap。 */
  text-wrap: wrap;
  overflow-wrap: break-word;
}

.post__meta {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  align-items: center;
  color: var(--ink-faint);
}

.post__badge {
  border: 1px solid var(--cinnabar);
  color: var(--cinnabar-deep);
  border-radius: 999px;
  padding: 0.05rem 0.6rem;
}

.post__tags {
  margin-top: 0.8rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.post__tag {
  color: var(--ink-soft);
  font-size: 0.85rem;
}

.post__footer {
  margin-top: 3rem;
  padding-top: 1.4rem;
  border-top: 1px solid var(--line);
}

.state {
  padding: 4rem 0;
  text-align: center;
  color: var(--ink-faint);
}

.state__error {
  color: var(--cinnabar-deep);
  margin-bottom: 1rem;
}

/* 窄屏：单列布局，目录改为正文顶部的面板，避免挤压正文；
   正文卡片水平居中于页面，左右留白对称。 */
@media (max-width: 900px) {
  .post--with-toc {
    display: block;
  }
  .post--with-toc .post__header,
  .post--with-toc .post__main {
    max-width: var(--content-w);
  }
  .post__toc {
    width: auto;
    max-width: var(--content-w);
    position: static;
    max-height: none;
    margin-bottom: 1.8rem;
  }
}
</style>