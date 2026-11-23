<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ApiError,
  api,
  CATEGORY_LABELS,
  CATEGORY_PATHS,
  MUST_CHANGE_PASSWORD_MESSAGE,
  type Category,
  type PostInput,
  type PostSummary,
  type PostStatus,
} from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useSeo } from '@/composables/useSeo'
import { formatDate } from '@/utils/format'
import MarkdownView from '@/components/MarkdownView.vue'
import EmptyState from '@/components/EmptyState.vue'
import AdminImport from '@/components/AdminImport.vue'

useSeo({ title: '内容管理' })

const auth = useAuthStore()
const router = useRouter()

type Tab = 'overview' | 'posts' | 'editor' | 'import'
const tab = ref<Tab>('overview')
const posts = ref<PostSummary[]>([])
const loading = ref(false)
const error = ref('')
const notice = ref('')
const filterCategory = ref<Category | ''>('')
const filterStatus = ref<PostStatus | ''>('')
const deletingId = ref<string | null>(null)
const editingId = ref<string | null>(null)
const saving = ref(false)
const previewOn = ref(true)

const form = reactive<PostInput>({
  title: '',
  slug: '',
  category: 'blog',
  excerpt: '',
  content: '',
  tags: [],
  visibility: 'public',
  status: 'published',
})
const tagsText = ref('')
const fieldErrors = ref<Record<string, string>>({})
const cooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

const FIELD_LABELS: Record<string, string> = {
  title: '标题',
  slug: 'Slug',
  type: '分类',
  summary: '摘要',
  contentMd: '正文',
  tags: '标签',
  visibility: '可见性',
  status: '状态',
  coverImageUrl: '封面图',
  academicMeta: '学术元数据',
}

function startCooldown(seconds: number) {
  cooldown.value = Math.max(1, seconds)
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})

const filtered = computed(() =>
  posts.value.filter(
    (p) =>
      (!filterCategory.value || p.category === filterCategory.value) &&
      (!filterStatus.value || p.status === filterStatus.value),
  ),
)

const stats = computed(() => {
  const byCategory = (c: Category) => posts.value.filter((p) => p.category === c).length
  return {
    total: posts.value.length,
    blog: byCategory('blog'),
    opinion: byCategory('opinion'),
    academic: byCategory('academic'),
    drafts: posts.value.filter((p) => p.status === 'draft').length,
    private: posts.value.filter((p) => p.visibility === 'private').length,
  }
})

// 日记板块已下线：管理端分类选项排除 diary（契约 Category 类型保持不变，仅 UI 收敛）
const categoryOptions = computed(() =>
  (Object.entries(CATEGORY_LABELS) as [Category, string][]).filter(([key]) => key !== 'diary'),
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await api.listPosts({ pageSize: 50, scope: 'admin' })
    posts.value = result.items
  } catch (e) {
    handleError(e)
  } finally {
    loading.value = false
  }
}

function handleError(e: unknown) {
  fieldErrors.value = {}
  // v1.1 增补 §3.3：强制改密门禁（恢复会话无 mustChangePassword 字段时的兜底路径）
  if (
    e instanceof ApiError &&
    e.status === 403 &&
    e.message === MUST_CHANGE_PASSWORD_MESSAGE
  ) {
    auth.markMustChangePassword()
    void router.push('/change-password')
    return
  }
  if (e instanceof ApiError && e.status === 401) {
    auth.clear()
    void router.push({ path: '/login', query: { redirect: '/admin' } })
    return
  }
  if (e instanceof ApiError && e.status === 429) {
    startCooldown(e.retryAfterSeconds ?? 30)
    error.value = '请求过于频繁，请稍后再试'
    return
  }
  if (e instanceof ApiError && e.details?.length) {
    for (const detail of e.details) {
      fieldErrors.value[detail.field] = detail.message
    }
  }
  error.value = e instanceof ApiError ? e.message : '操作失败，请稍后重试'
}

function resetForm() {
  editingId.value = null
  fieldErrors.value = {}
  Object.assign(form, {
    title: '',
    slug: '',
    category: 'blog',
    excerpt: '',
    content: '',
    tags: [],
    visibility: 'public',
    status: 'published',
  })
  tagsText.value = ''
}

function startCreate() {
  resetForm()
  tab.value = 'editor'
}

function startEdit(post: PostSummary) {
  error.value = ''
  fieldErrors.value = {}
  void (async () => {
    try {
      const full = await api.getAdminPost(post.id)
      editingId.value = full.id
      Object.assign(form, {
        title: full.title,
        slug: full.slug,
        category: full.category,
        excerpt: full.excerpt,
        content: full.content,
        tags: full.tags.map((t) => t.slug),
        visibility: full.visibility,
        status: full.status,
      })
      tagsText.value = full.tags.map((t) => t.slug).join(', ')
      tab.value = 'editor'
    } catch (e) {
      handleError(e)
    }
  })()
}

async function save() {
  error.value = ''
  notice.value = ''
  fieldErrors.value = {}
  if (cooldown.value > 0) return
  if (!form.title.trim() || !form.content.trim()) {
    error.value = '标题与正文不能为空'
    return
  }
  form.tags = tagsText.value
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
  saving.value = true
  try {
    if (editingId.value) {
      await api.updatePost(editingId.value, { ...form })
      notice.value = '已保存修改'
    } else {
      await api.createPost({ ...form })
      notice.value = '已创建文章'
    }
    await load()
    tab.value = 'posts'
    resetForm()
  } catch (e) {
    handleError(e)
  } finally {
    saving.value = false
  }
}

async function confirmDelete(id: string) {
  error.value = ''
  notice.value = ''
  try {
    await api.deletePost(id)
    deletingId.value = null
    notice.value = '已删除'
    await load()
  } catch (e) {
    handleError(e)
  }
}

async function logout() {
  await auth.logout()
  void router.push('/')
}

function onImported(payload: { created: number; updated: number; skipped: number; failed: number }) {
  notice.value = `md 导入完成：新建 ${payload.created} · 覆盖 ${payload.updated} · 跳过 ${payload.skipped} · 失败 ${payload.failed}`
  void load()
}

onMounted(load)
</script>

<template>
  <div class="page admin">
    <header class="admin__header">
      <div>
        <h1>内容管理</h1>
        <p class="admin__user">已登录：{{ auth.user?.name }}（{{ auth.user?.role }}）</p>
      </div>
      <div class="admin__header-actions">
        <button type="button" class="admin__btn admin__btn--primary" @click="startCreate">写文章</button>
        <button type="button" class="admin__btn" @click="logout">退出登录</button>
      </div>
    </header>

    <nav class="admin__tabs" aria-label="管理视图切换">
      <button type="button" :class="{ active: tab === 'overview' }" @click="tab = 'overview'">概览</button>
      <button type="button" :class="{ active: tab === 'posts' }" @click="tab = 'posts'">文章</button>
      <button type="button" :class="{ active: tab === 'editor' }" @click="tab = 'editor'">
        {{ editingId ? '编辑' : '新建' }}
      </button>
      <button type="button" :class="{ active: tab === 'import' }" @click="tab = 'import'">导入 md</button>
    </nav>

    <p v-if="notice" class="admin__notice" role="status">{{ notice }}</p>
    <p v-if="error" class="admin__error" role="alert">{{ error }}</p>
    <p v-for="(msg, field) in fieldErrors" :key="field" class="admin__error admin__error--field" role="alert">
      {{ FIELD_LABELS[field] ?? field }}：{{ msg }}
    </p>

    <section v-if="tab === 'overview'" class="admin__stats" aria-label="内容统计">
      <div class="stat"><span class="stat__num">{{ stats.total }}</span><span class="stat__label">全部</span></div>
      <div class="stat"><span class="stat__num">{{ stats.blog }}</span><span class="stat__label">博客</span></div>
      <div class="stat"><span class="stat__num">{{ stats.opinion }}</span><span class="stat__label">观点</span></div>
      <div class="stat"><span class="stat__num">{{ stats.academic }}</span><span class="stat__label">学术</span></div>
      <div class="stat"><span class="stat__num">{{ stats.drafts }}</span><span class="stat__label">草稿</span></div>
      <div class="stat"><span class="stat__num">{{ stats.private }}</span><span class="stat__label">私密</span></div>
    </section>

    <section v-else-if="tab === 'posts'">
      <div class="admin__filters">
        <label>
          分类
          <select v-model="filterCategory">
            <option value="">全部</option>
            <option v-for="[key, label] in categoryOptions" :key="key" :value="key">{{ label }}</option>
          </select>
        </label>
        <label>
          状态
          <select v-model="filterStatus">
            <option value="">全部</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
        </label>
      </div>

      <p v-if="loading" class="mono" role="status">Loading…</p>
      <EmptyState v-else-if="filtered.length === 0" title="没有文章" note="点击右上角「写文章」开始" />
      <div v-else class="admin__table-wrap">
        <table class="admin__table">
          <thead>
            <tr>
              <th scope="col">标题</th>
              <th scope="col">分类</th>
              <th scope="col">可见性</th>
              <th scope="col">状态</th>
              <th scope="col">更新于</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in filtered" :key="post.id">
              <td>
                <RouterLink :to="`${CATEGORY_PATHS[post.category]}/${post.slug}`">{{ post.title }}</RouterLink>
              </td>
              <td>{{ CATEGORY_LABELS[post.category] }}</td>
              <td>{{ post.visibility === 'private' ? '私密' : '公开' }}</td>
              <td>{{ post.status === 'draft' ? '草稿' : '已发布' }}</td>
              <td class="mono">{{ formatDate(post.updatedAt) }}</td>
              <td class="admin__row-actions">
                <button type="button" @click="startEdit(post)">编辑</button>
                <template v-if="deletingId === post.id">
                  <button type="button" class="danger" @click="confirmDelete(post.id)">确认删除</button>
                  <button type="button" @click="deletingId = null">取消</button>
                </template>
                <button v-else type="button" class="danger" @click="deletingId = post.id">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <AdminImport v-else-if="tab === 'import'" @imported="onImported" />

    <section v-else class="admin__editor">
      <form @submit.prevent="save">
        <div class="admin__form-grid">
          <label class="field field--wide">
            <span>标题 *</span>
            <input v-model="form.title" type="text" required />
          </label>
          <label class="field">
            <span>Slug（留空自动生成）</span>
            <input v-model="form.slug" type="text" placeholder="my-post" />
          </label>
          <label class="field">
            <span>分类</span>
            <select v-model="form.category">
              <option v-for="[key, label] in categoryOptions" :key="key" :value="key">{{ label }}</option>
            </select>
          </label>
          <label class="field">
            <span>可见性</span>
            <select v-model="form.visibility">
              <option value="public">公开</option>
              <option value="private">私密（仅本人）</option>
            </select>
          </label>
          <label class="field">
            <span>状态</span>
            <select v-model="form.status">
              <option value="published">发布</option>
              <option value="draft">草稿</option>
            </select>
          </label>
          <label class="field field--wide">
            <span>标签 slug（逗号分隔，小写字母/数字/连字符）</span>
            <input v-model="tagsText" type="text" placeholder="methodology, essay" />
          </label>
          <label class="field field--wide">
            <span>摘要</span>
            <textarea v-model="form.excerpt" rows="2"></textarea>
          </label>
        </div>

        <div class="admin__editor-head">
          <span>正文（Markdown）*</span>
          <button type="button" class="admin__btn" @click="previewOn = !previewOn">
            {{ previewOn ? '关闭预览' : '打开预览' }}
          </button>
        </div>
        <div class="admin__editor-body" :class="{ 'admin__editor-body--split': previewOn }">
          <textarea v-model="form.content" rows="16" required aria-label="正文 Markdown"></textarea>
          <div v-if="previewOn" class="admin__preview" aria-label="预览">
            <MarkdownView :source="form.content || '*暂无内容*'" />
          </div>
        </div>

        <div class="admin__editor-actions">
          <button type="submit" class="admin__btn admin__btn--primary" :disabled="saving || cooldown > 0">
            {{ cooldown > 0 ? `请稍候（${cooldown}s）` : saving ? '保存中…' : editingId ? '保存修改' : '创建文章' }}
          </button>
          <button type="button" class="admin__btn" @click="resetForm">清空</button>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.admin {
  padding-top: 2.6rem;
  min-height: 60vh;
}

.admin__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.admin__kicker {
  color: var(--cinnabar-deep);
}

.admin__header h1 {
  font-size: 1.9rem;
  margin-top: 0.4rem;
}

.admin__user {
  color: var(--ink-soft);
  font-size: 0.9rem;
  margin-top: 0.3rem;
}

.admin__header-actions {
  display: flex;
  gap: 0.6rem;
}

.admin__btn {
  border: 1px solid var(--line-strong);
  background: none;
  border-radius: 999px;
  padding: 0.45rem 1.2rem;
  color: var(--ink);
  font-size: 0.9rem;
  transition: all 0.2s var(--ease-out);
}

.admin__btn:hover:not(:disabled) {
  border-color: var(--cinnabar);
  color: var(--cinnabar-deep);
}

.admin__btn--primary {
  background: var(--cinnabar);
  border-color: var(--cinnabar);
  color: #f6f1e7;
}

.admin__btn--primary:hover:not(:disabled) {
  background: var(--cinnabar-deep);
  color: #f6f1e7;
}

.admin__btn:disabled {
  opacity: 0.6;
}

.admin__tabs {
  display: flex;
  gap: 0.4rem;
  margin: 1.6rem 0;
  border-bottom: 1px solid var(--line);
}

.admin__tabs button {
  background: none;
  border: none;
  padding: 0.6rem 1.1rem;
  color: var(--ink-soft);
  font-size: 0.95rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.admin__tabs button.active {
  color: var(--cinnabar-deep);
  border-bottom-color: var(--cinnabar);
  font-weight: 500;
}

.admin__notice {
  color: var(--gold);
  padding: 0.6rem 0;
}

.admin__error {
  color: var(--cinnabar-deep);
  padding: 0.6rem 0;
}

.admin__error--field {
  padding: 0.15rem 0;
  font-size: 0.88rem;
}

.admin__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: 1rem;
}

.stat {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 1.2rem 1rem;
  background: var(--paper-elev);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stat__num {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
}

.stat__label {
  color: var(--ink-soft);
  font-size: 0.85rem;
}

.admin__filters {
  display: flex;
  gap: 1.2rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.admin__filters label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--ink-soft);
}

.admin__filters select,
.field select,
.field input,
.field textarea {
  background: var(--paper-elev);
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  padding: 0.45rem 0.7rem;
}

.admin__table-wrap {
  overflow-x: auto;
}

.admin__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}

.admin__table th,
.admin__table td {
  text-align: left;
  padding: 0.7rem 0.8rem;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

.admin__table th {
  color: var(--ink-faint);
  font-weight: 500;
  font-size: 0.8rem;
}

.admin__table td:first-child {
  white-space: normal;
  min-width: 12rem;
}

.admin__row-actions button {
  background: none;
  border: none;
  color: var(--cinnabar-deep);
  font-size: 0.85rem;
  padding: 0.2rem 0.4rem;
}

.admin__row-actions .danger {
  color: var(--cinnabar-deep);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.admin__form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.88rem;
  color: var(--ink-soft);
}

.field--wide {
  grid-column: 1 / -1;
}

.admin__editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 1.4rem 0 0.6rem;
  font-size: 0.88rem;
  color: var(--ink-soft);
}

.admin__editor-body {
  display: grid;
  gap: 1rem;
}

.admin__editor-body--split {
  grid-template-columns: 1fr 1fr;
}

.admin__editor-body textarea {
  background: var(--paper-elev);
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  padding: 0.8rem;
  font-family: var(--font-mono);
  font-size: 0.88rem;
  line-height: 1.7;
  resize: vertical;
}

.admin__preview {
  border: 1px dashed var(--line-strong);
  border-radius: 4px;
  padding: 0.8rem 1rem;
  max-height: 32rem;
  overflow-y: auto;
}

.admin__editor-actions {
  display: flex;
  gap: 0.7rem;
  margin-top: 1.2rem;
}

@media (max-width: 760px) {
  .admin__form-grid,
  .admin__editor-body--split {
    grid-template-columns: 1fr;
  }
}
</style>