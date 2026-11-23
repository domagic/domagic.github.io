<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ApiError,
  api,
  CATEGORY_LABELS,
  type Category,
  type PostSummary,
  type Tag,
} from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useSeo } from '@/composables/useSeo'
import SectionHead from '@/components/SectionHead.vue'
import PostIndexItem from '@/components/PostIndexItem.vue'
import TagChip from '@/components/TagChip.vue'
import Pager from '@/components/Pager.vue'
import EmptyState from '@/components/EmptyState.vue'

const route = useRoute()
const auth = useAuthStore()

const category = computed(() => (route.meta.category as Category) ?? 'blog')

const items = ref<PostSummary[]>([])
const tags = ref<Tag[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 8
const q = ref('')
const activeTag = ref('')
const loading = ref(false)
const error = ref('')

const descriptions: Record<Category, string> = {
  blog: '方法、工具与长篇思考。',
  opinion: '对学术生态与行业趋势的明确立场。',
  diary: '写给自己的私人记录，仅本人可见。',
  academic: '论文、报告与项目进展。',
  group: '每周组会报告与讨论记录。',
}

useSeo({ title: CATEGORY_LABELS[category.value], description: descriptions[category.value] })

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await api.listPosts({
      category: category.value,
      status: 'published',
      tag: activeTag.value || undefined,
      q: q.value.trim() || undefined,
      page: page.value,
      pageSize,
    })
    items.value = result.items
    total.value = result.total
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : '加载失败，请稍后重试'
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function loadTags() {
  tags.value = await api.listTags()
}

watch(
  () => route.meta.category,
  () => {
    page.value = 1
    q.value = ''
    activeTag.value = ''
    useSeo({ title: CATEGORY_LABELS[category.value], description: descriptions[category.value] })
    void load()
    void loadTags()
  },
)

watch([page, activeTag], () => void load())
watch(
  () => auth.isAuthenticated,
  () => {
    void load()
    void loadTags()
  },
)

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(q, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    void load()
  }, 300)
})

function selectTag(slug: string) {
  activeTag.value = activeTag.value === slug ? '' : slug
  page.value = 1
}

void load()
void loadTags()
</script>

<template>
  <div class="page section-page">
    <SectionHead
      :title="CATEGORY_LABELS[category]"
      :note="descriptions[category]"
    />

    <div class="filters">
      <label class="filters__search">
        <span class="visually-hidden">搜索{{ CATEGORY_LABELS[category] }}</span>
        <input v-model="q" type="search" :placeholder="`搜索${CATEGORY_LABELS[category]}…`" />
      </label>
      <div class="filters__tags" role="group" aria-label="按标签筛选">
        <TagChip
          v-for="tag in tags.slice(0, 10)"
          :key="tag.slug"
          :name="tag.name"
          :count="tag.count"
          :active="activeTag === tag.slug"
          @select="selectTag(tag.slug)"
        />
      </div>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="loading mono" role="status">Loading…</p>

    <template v-else>
      <EmptyState
        v-if="items.length === 0"
        title="没有匹配的文章"
        note="换个关键词或标签试试"
      />
      <div v-else>
        <PostIndexItem
          v-for="(post, i) in items"
          :key="post.id"
          :post="post"
          :index="(page - 1) * pageSize + i"
        />
      </div>
      <Pager :page="page" :page-size="pageSize" :total="total" @change="page = $event" />
    </template>
  </div>
</template>

<style scoped>
.section-page {
  padding-top: 3rem;
  min-height: 55vh;
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin-bottom: 1.2rem;
}

.filters__search input {
  width: 100%;
  max-width: 26rem;
  background: var(--paper-elev);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.55rem 1.2rem;
}

.filters__search input:focus {
  border-color: var(--cinnabar);
  outline: none;
}

.filters__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.error {
  color: var(--cinnabar-deep);
  padding: 1rem 0;
}

.loading {
  color: var(--ink-faint);
  padding: 2rem 0;
}
</style>