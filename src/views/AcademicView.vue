<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, type PostSummary, type Profile } from '@/api'
import { useSeo } from '@/composables/useSeo'
import SectionHead from '@/components/SectionHead.vue'
import PostIndexItem from '@/components/PostIndexItem.vue'
import EmptyState from '@/components/EmptyState.vue'

useSeo({ title: '学术', description: '论文、学术报告与项目进展。' })

const posts = ref<PostSummary[]>([])
const profile = ref<Profile | null>(null)
const loading = ref(true)

onMounted(async () => {
  const [result, p] = await Promise.all([
    api.listPosts({ category: 'academic', status: 'published', pageSize: 50 }),
    api.getProfile(),
  ])
  posts.value = result.items
  profile.value = p
  loading.value = false
})
</script>

<template>
  <div class="page academic">
    <SectionHead kicker="Academic" title="学术" note="工作论文、报告与项目进展（当前为演示数据）" />

    <div v-if="profile" class="academic__areas">
      <span class="mono academic__areas-label">Research Areas</span>
      <ul>
        <li v-for="area in profile.research" :key="area">{{ area }}</li>
      </ul>
    </div>

    <p v-if="loading" class="mono academic__loading" role="status">Loading…</p>
    <EmptyState v-else-if="posts.length === 0" title="暂无学术内容" />
    <div v-else>
      <PostIndexItem v-for="(post, i) in posts" :key="post.id" :post="post" :index="i" />
    </div>
  </div>
</template>

<style scoped>
.academic {
  padding-top: 3rem;
  min-height: 55vh;
}

.academic__areas {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  flex-wrap: wrap;
  padding: 1rem 1.2rem;
  background: var(--paper-elev);
  border: 1px solid var(--line);
  border-radius: 6px;
  margin-bottom: 1.4rem;
}

.academic__areas-label {
  color: var(--gold);
}

.academic__areas ul {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  margin: 0;
  padding: 0;
  font-size: 0.92rem;
}

.academic__loading {
  color: var(--ink-faint);
  padding: 2rem 0;
}
</style>