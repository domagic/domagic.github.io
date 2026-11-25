<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORY_LABELS, CATEGORY_PATHS, type PostSummary } from '@/api'

import { formatDate, indexNumber } from '@/utils/format'
import { useI18n } from '@/i18n'

const { t, isEn } = useI18n()

const props = defineProps<{ post: PostSummary; index?: number }>()

const to = computed(() => `${CATEGORY_PATHS[props.post.category]}/${props.post.slug}`)

// 学术列表项快速检索信息：第一作者、期刊/会议、年份
const academic = computed(() => props.post.academicMeta ?? null)
const firstAuthor = computed(() => {
  const authors = academic.value?.authors ?? []
  if (!authors.length) return ''
  return authors.length > 1 ? `${authors[0]} et al.` : authors[0]
})
</script>

<template>
  <RouterLink :to="to" class="item" :aria-label="(isEn ? 'Read: ' : '阅读：') + post.title">
    <div class="item__lead">
      <span v-if="index !== undefined" class="item__index mono" aria-hidden="true">{{ indexNumber(index + 1) }}</span>
      <span class="item__category mono">{{ isEn ? t('nav.' + (post.category === 'opinion' ? 'opinions' : post.category)) : CATEGORY_LABELS[post.category] }}</span>
    </div>
    <div class="item__aside">
      <time class="item__date mono" :datetime="post.publishedAt ?? undefined">{{ formatDate(post.publishedAt) }}</time>
      <div v-if="academic" class="item__academic">
        <span v-if="firstAuthor" class="item__author">{{ firstAuthor }}</span>
        <span v-if="academic.venue" class="item__venue" :title="academic.venue">{{ academic.venue }}</span>
        <span v-if="academic.year" class="item__year mono">{{ academic.year }}</span>
      </div>
    </div>
    <div class="item__body">
      <div class="item__title">
        <h3>{{ post.title }}</h3>
      </div>
      <p class="item__excerpt">{{ post.excerpt }}</p>
      <div class="item__meta">
        <span v-if="post.visibility === 'private'" class="item__lock">{{ t('common.private') }}</span>
        <span v-if="post.status === 'draft'" class="item__lock">{{ t('common.draft') }}</span>
        <span class="item__tags">{{ post.tags.map((t) => `#${t.name}`).join(' ') }}</span>
      </div>
    </div>
    <span class="item__arrow" aria-hidden="true">→</span>
  </RouterLink>
</template>

<style scoped>
.item {
  display: grid;
  grid-template-columns: 2.6rem 11rem 1fr 2rem;
  gap: 1.25rem;
  align-items: start;
  padding: 1.4rem 0.4rem;
  border-bottom: 1px solid var(--line);
  transition: background-color 0.25s var(--ease-out);
  /* 整行可点击：去掉链接默认下划线与继承色，保留原有的文字配色 */
  color: inherit;
  text-decoration: none;
}

/* 左侧编号 + 文章类型（纵向堆叠），类型移到编号下方 */
.item__lead {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

/* 左侧日期 + 学术检索信息块 */
.item__aside {
  min-width: 0;
}

.item:hover {
  background: var(--cinnabar-wash);
}

.item__index {
  color: var(--ink-faint);
  padding-top: 0.35rem;
}

.item__date {
  display: block;
  color: var(--ink-soft);
  padding-top: 0.35rem;
}

.item__academic {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-top: 0.55rem;
  font-size: 0.76rem;
  line-height: 1.45;
}

.item__author {
  color: var(--ink);
  font-weight: 600;
}

.item__venue {
  color: var(--cinnabar-deep);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item__year {
  color: var(--ink-faint);
}

.item__title {
  color: var(--ink);
  text-decoration: none;
}

.item__title h3 {
  /* 列表标题略小于详情页标题，让索引页一屏可见更多条目 */
  font-size: clamp(1.05rem, 1.45vw, 1.2rem);
  font-weight: 700;
  transition: color 0.2s var(--ease-out);
}

.item:hover .item__title h3 {
  color: var(--cinnabar-deep);
}

.item__title:hover {
  text-decoration: none;
}

.item__excerpt {
  margin-top: 0.4rem;
  color: var(--ink-soft);
  font-size: 0.92rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item__meta {
  margin-top: 0.55rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.78rem;
  color: var(--ink-faint);
}

.item__category {
  color: var(--cinnabar-deep);
  font-weight: 600;
  font-size: 0.8rem;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.item__lock {
  border: 1px solid var(--line-strong);
  padding: 0 0.4rem;
  border-radius: 999px;
}

.item__arrow {
  color: var(--ink-faint);
  font-size: 1.2rem;
  padding-top: 0.3rem;
  text-decoration: none;
  transition: transform 0.25s var(--ease-out), color 0.25s var(--ease-out);
}

.item:hover .item__arrow {
  transform: translateX(4px);
  color: var(--cinnabar-deep);
}

@media (max-width: 640px) {
  .item {
    grid-template-columns: 1fr 2rem;
    gap: 0.5rem;
  }
  .item__lead {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0 0.6rem;
  }
  .item__index {
    display: none;
  }
  .item__aside {
    grid-column: 1 / -1;
  }
  .item__date {
    display: inline-block;
    padding-top: 0;
    margin-right: 0.8rem;
  }
  .item__academic {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.15rem 0.6rem;
    margin-top: 0.35rem;
  }
  .item__venue {
    -webkit-line-clamp: 1;
  }
}
</style>