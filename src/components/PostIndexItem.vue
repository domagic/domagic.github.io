<script setup lang="ts">
import { computed } from 'vue'
import { CATEGORY_LABELS, CATEGORY_PATHS, type PostSummary } from '@/api'
import { formatDate, indexNumber } from '@/utils/format'

const props = defineProps<{ post: PostSummary; index?: number }>()

const to = computed(() => `${CATEGORY_PATHS[props.post.category]}/${props.post.slug}`)
</script>

<template>
  <article class="item">
    <span v-if="index !== undefined" class="item__index mono" aria-hidden="true">{{ indexNumber(index + 1) }}</span>
    <time class="item__date mono" :datetime="post.publishedAt ?? undefined">{{ formatDate(post.publishedAt) }}</time>
    <div class="item__body">
      <RouterLink :to="to" class="item__title">
        <h3>{{ post.title }}</h3>
      </RouterLink>
      <p class="item__excerpt">{{ post.excerpt }}</p>
      <div class="item__meta">
        <span class="item__category">{{ CATEGORY_LABELS[post.category] }}</span>
        <span v-if="post.visibility === 'private'" class="item__lock">私密</span>
        <span v-if="post.status === 'draft'" class="item__lock">草稿</span>
        <span class="item__tags">{{ post.tags.map((t) => `#${t.name}`).join(' ') }}</span>
        <span v-if="post.readingMinutes" class="item__reading mono">{{ post.readingMinutes }} min</span>
      </div>
    </div>
    <RouterLink :to="to" class="item__arrow" :aria-label="`阅读：${post.title}`">→</RouterLink>
  </article>
</template>

<style scoped>
.item {
  display: grid;
  grid-template-columns: 2.6rem 7.2rem 1fr 2rem;
  gap: 1.25rem;
  align-items: start;
  padding: 1.4rem 0.4rem;
  border-bottom: 1px solid var(--line);
  transition: background-color 0.25s var(--ease-out);
}

.item:hover {
  background: var(--cinnabar-wash);
}

.item__index {
  color: var(--ink-faint);
  padding-top: 0.35rem;
}

.item__date {
  color: var(--ink-soft);
  padding-top: 0.35rem;
}

.item__title {
  color: var(--ink);
  text-decoration: none;
}

.item__title h3 {
  font-size: 1.18rem;
  font-weight: 700;
  transition: color 0.2s var(--ease-out);
}

.item__title:hover h3 {
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
  font-weight: 500;
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
  .item__index {
    display: none;
  }
  .item__date {
    grid-column: 1 / -1;
    padding-top: 0;
  }
}
</style>