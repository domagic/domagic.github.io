<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ApiError, api, CATEGORY_LABELS, CATEGORY_PATHS, type Post } from '@/api'
import { useSeo } from '@/composables/useSeo'
import { formatDateZh } from '@/utils/format'
import MarkdownView from '@/components/MarkdownView.vue'

interface TocItem { id: string; text: string; level: 2 | 3 }

const route = useRoute()
const post = ref<Post | null>(null)
const error = ref('')
const loading = ref(true)
// 文章目录：仅学术类文章展示左侧粘性目录；MarkdownView 渲染后回填
const toc = ref<TocItem[]>([])
const showToc = computed(() => post.value?.category === 'academic' && toc.value.length > 0)

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
    error.value = e instanceof ApiError ? e.message : '加载失败，请稍后重试'
    useSeo({ title: '文章不存在' })
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.slug,
  (slug) => {
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
  <div class="page post-page">
    <p v-if="loading" class="state mono" role="status">Loading…</p>
    <div v-else-if="error" class="state" role="alert">
      <p class="state__error">{{ error }}</p>
      <RouterLink to="/">返回首页</RouterLink>
    </div>
    <article v-else-if="post" class="post" :class="{ 'post--with-toc': showToc }">
      <header class="post__header">
        <RouterLink :to="CATEGORY_PATHS[post.category]" class="post__category mono">
          {{ CATEGORY_LABELS[post.category] }}
        </RouterLink>
        <h1 class="post__title">{{ post.title }}</h1>
        <div class="post__meta mono">
          <time v-if="post.publishedAt" :datetime="post.publishedAt">{{ formatDateZh(post.publishedAt) }}</time>
          <span v-if="post.visibility === 'private'" class="post__badge">私密</span>
          <span v-if="post.status === 'draft'" class="post__badge">草稿</span>
        </div>
        <div class="post__tags">
          <span v-for="tag in post.tags" :key="tag.slug" class="post__tag">#{{ tag.name }}</span>
        </div>
      </header>
      <div class="post__layout">
        <!-- 学术文章左侧目录：点击平滑跳转到对应章节，桌面端 sticky 跟随滚动 -->
        <aside v-if="showToc" class="post__toc" aria-label="文章目录">
          <p class="post__toc-title mono">目录 / Contents</p>
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
          <section v-if="post.academicMeta" class="post__academic" aria-label="学术元数据">
            <h2 class="post__academic-title">学术信息</h2>
            <dl class="post__academic-list">
              <div v-if="post.academicMeta.authors.length">
                <dt>作者</dt>
                <dd>{{ post.academicMeta.authors.join('、') }}</dd>
              </div>
              <div v-if="post.academicMeta.venue">
                <dt>发表 / 场合</dt>
                <dd>{{ post.academicMeta.venue }}</dd>
              </div>
              <div v-if="post.academicMeta.year">
                <dt>年份</dt>
                <dd>{{ post.academicMeta.year }}</dd>
              </div>
              <div v-if="post.academicMeta.doi">
                <dt>DOI</dt>
                <dd>
                  <a :href="`https://doi.org/${post.academicMeta.doi}`" rel="noopener noreferrer" target="_blank">{{ post.academicMeta.doi }}</a>
                </dd>
              </div>
              <div v-if="post.academicMeta.pdfUrl">
                <dt>全文</dt>
                <dd>
                  <a :href="post.academicMeta.pdfUrl" rel="noopener noreferrer" target="_blank">PDF 下载</a>
                </dd>
              </div>
            </dl>
          </section>
          <footer class="post__footer">
            <RouterLink :to="CATEGORY_PATHS[post.category]">← 返回{{ CATEGORY_LABELS[post.category] }}</RouterLink>
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
  max-width: 44rem;
  margin: 0 auto;
}

/* 学术文章：加宽容器，左侧放粘性目录，右侧为正文 */
.post--with-toc {
  max-width: 68rem;
}

.post__layout {
  display: block;
}

.post--with-toc .post__layout {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 2.5rem;
  align-items: start;
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

.post__main {
  min-width: 0;
}

.post__header {
  margin-bottom: 2.4rem;
}

.post__category {
  color: var(--cinnabar-deep);
}

.post__title {
  font-size: clamp(1.7rem, 4vw, 2.5rem);
  margin-top: 0.8rem;
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

.post__academic {
  margin-top: 2.4rem;
  border: 1px solid var(--line);
  border-left: 3px solid var(--cinnabar);
  border-radius: 4px;
  padding: 1.1rem 1.3rem;
  background: var(--paper-elev);
}

.post__academic-title {
  font-size: 1rem;
  margin-bottom: 0.7rem;
}

.post__academic-list {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-size: 0.9rem;
}

.post__academic-list > div {
  display: flex;
  gap: 0.8rem;
}

.post__academic-list dt {
  color: var(--ink-faint);
  min-width: 5.5rem;
  flex-shrink: 0;
}

.post__academic-list dd {
  margin: 0;
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

/* 窄屏：目录改为正文顶部的可折叠面板，避免挤压正文 */
@media (max-width: 900px) {
  .post--with-toc .post__layout {
    display: block;
  }
  .post__toc {
    position: static;
    max-height: none;
    margin-bottom: 1.8rem;
  }
}
</style>