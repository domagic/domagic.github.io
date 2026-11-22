<script setup lang="ts">
import { ref } from 'vue'
import { ApiError, api, CATEGORY_LABELS, CATEGORY_PATHS, type ArchiveYear } from '@/api'
import { useSeo } from '@/composables/useSeo'
import SectionHead from '@/components/SectionHead.vue'
import EmptyState from '@/components/EmptyState.vue'

useSeo({ title: '归档', description: '全部公开文章按年份归档。' })

const years = ref<ArchiveYear[]>([])
const loading = ref(false)
const error = ref('')

function monthDay(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    years.value = await api.getArchive()
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败，请稍后重试'
    years.value = []
  } finally {
    loading.value = false
  }
}

void load()
</script>

<template>
  <div class="page archive">
    <SectionHead kicker="Archive" title="归档" note="公开文章按年份整理；私密内容不在归档中出现。" />

    <p v-if="error" class="archive__error" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="archive__loading mono" role="status">Loading…</p>

    <EmptyState v-else-if="years.length === 0" title="还没有公开文章" note="发布后的文章会按年份出现在这里" />

    <div v-else class="archive__years">
      <section v-for="group in years" :key="group.year" class="archive__year" :aria-label="`${group.year} 年文章`">
        <div class="archive__year-rail">
          <span class="archive__year-num">{{ group.year }}</span>
          <span class="archive__year-count mono">{{ group.count }} 篇</span>
        </div>
        <ol class="archive__list">
          <li v-for="post in group.posts" :key="post.slug" class="archive__entry">
            <span class="archive__date mono">{{ monthDay(post.publishedAt) }}</span>
            <span class="archive__type" :data-type="post.category">{{ CATEGORY_LABELS[post.category] }}</span>
            <RouterLink class="archive__title" :to="`${CATEGORY_PATHS[post.category]}/${post.slug}`">
              {{ post.title }}
            </RouterLink>
          </li>
        </ol>
      </section>
    </div>
  </div>
</template>

<style scoped>
.archive {
  padding-top: 3rem;
  min-height: 55vh;
}

.archive__error {
  color: var(--cinnabar-deep);
  padding: 1rem 0;
}

.archive__loading {
  color: var(--ink-faint);
  padding: 2rem 0;
}

.archive__years {
  display: flex;
  flex-direction: column;
  gap: 2.6rem;
  max-width: 56rem;
}

.archive__year {
  display: grid;
  grid-template-columns: 8.5rem 1fr;
  gap: 1.6rem;
}

.archive__year-rail {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3rem;
  padding-top: 0.15rem;
  border-right: 1px solid var(--line);
  padding-right: 1.2rem;
}

.archive__year-num {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 2.4rem;
  line-height: 1;
  color: var(--ink);
  font-variant-numeric: lining-nums;
}

.archive__year-count {
  color: var(--ink-faint);
  font-size: 0.72rem;
}

.archive__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.archive__entry {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 0.9rem;
  padding: 0.55rem 0 0.55rem 1.1rem;
  border-bottom: 1px dashed var(--line);
}

.archive__entry::before {
  content: '';
  position: absolute;
  left: 0;
  top: 1.05rem;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--cinnabar);
  opacity: 0.75;
}

.archive__date {
  color: var(--ink-faint);
  font-size: 0.78rem;
  flex-shrink: 0;
}

.archive__type {
  flex-shrink: 0;
  font-size: 0.7rem;
  color: var(--ink-soft);
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  padding: 0.05rem 0.5rem;
}

.archive__type[data-type='academic'],
.archive__type[data-type='group'] {
  color: var(--cinnabar-deep);
  border-color: var(--cinnabar);
}

.archive__title {
  color: var(--ink);
  text-decoration: none;
  font-size: 0.98rem;
  line-height: 1.5;
}

.archive__title:hover {
  color: var(--cinnabar-deep);
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 640px) {
  .archive__year {
    grid-template-columns: 1fr;
    gap: 0.7rem;
  }

  .archive__year-rail {
    flex-direction: row;
    align-items: baseline;
    justify-content: flex-start;
    border-right: none;
    border-bottom: 1px solid var(--line);
    padding: 0 0 0.4rem;
    gap: 0.8rem;
  }

  .archive__year-num {
    font-size: 1.7rem;
  }

  .archive__entry {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
}
</style>