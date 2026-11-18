<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ApiError,
  api,
  MUST_CHANGE_PASSWORD_MESSAGE,
  type Category,
} from '@/api'
import { useAuthStore } from '@/stores/auth'
import MarkdownView from '@/components/MarkdownView.vue'
import {
  parseImportFile,
  readFileText,
  toPostInput,
  validateDraft,
  SLUG_PATTERN,
  CONTENT_MD_MAX,
  type ImportDraft,
} from '@/utils/mdImport'
import { createRateLimiter, withBackoff } from '@/utils/importQueue'

/**
 * P1-3：md 上传/拖拽 → front-matter 解析 → 可编辑预览 → 批量提交。
 * 复用冻结契约 v1.2 现有端点（POST /admin/posts、POST /admin/tags、PATCH /admin/posts/:id），
 * 零契约变更。节流 60 写/60s + 全局 120/min，429 退避；409 → 跳过或 PATCH，绝不重试 POST。
 */

const emit = defineEmits<{
  (e: 'imported', payload: { created: number; updated: number; skipped: number; failed: number }): void
}>()

const auth = useAuthStore()
const router = useRouter()

type RowState = 'ready' | 'running' | 'created' | 'updated' | 'skipped' | 'failed'
interface ImportRow {
  id: string
  draft: ImportDraft
  state: RowState
  message: string
}

const STATE_LABELS: Record<RowState, string> = {
  ready: '待导入',
  running: '提交中',
  created: '已创建',
  updated: '已覆盖',
  skipped: '已跳过',
  failed: '失败',
}

const rows = ref<ImportRow[]>([])
const selectedId = ref<string | null>(null)
const dragging = ref(false)
const reading = ref(false)
const running = ref(false)
const cancelled = ref(false)
const strategy = ref<'skip' | 'overwrite'>('skip')
const progress = ref({ done: 0, total: 0 })
const batchNotice = ref('')
const batchError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const newTagName = ref('')
const newTagSlug = ref('')
const previewOn = ref(true)

let rowSeq = 0

const selected = computed(() => rows.value.find((r) => r.id === selectedId.value) ?? null)
const selectedErrors = computed(() =>
  selected.value ? validateDraft(selected.value.draft) : {},
)
const readyCount = computed(
  () => rows.value.filter((r) => r.state === 'ready' || r.state === 'failed').length,
)
const summary = computed(() => {
  const count = (s: RowState) => rows.value.filter((r) => r.state === s).length
  return {
    created: count('created'),
    updated: count('updated'),
    skipped: count('skipped'),
    failed: count('failed'),
  }
})

const IMPORT_TYPE_OPTIONS: { value: Category; label: string }[] = [
  { value: 'blog', label: '博客' },
  { value: 'opinion', label: '观点' },
  { value: 'academic', label: '学术' },
  { value: 'diary', label: '日记（强制私密）' },
]

async function intake(files: File[]): Promise<void> {
  batchError.value = ''
  batchNotice.value = ''
  const accepted = files.filter((f) => /\.(md|markdown|txt)$/i.test(f.name))
  if (accepted.length === 0) {
    batchError.value = '仅支持 .md / .markdown / .txt 文件'
    return
  }
  reading.value = true
  try {
    for (const file of accepted) {
      try {
        const raw = await readFileText(file)
        const draft = parseImportFile(raw, file.name)
        if (rows.value.some((r) => r.draft.slug === draft.slug)) {
          draft.warnings.push('批次内存在相同 slug：提交时将按重复策略处理（跳过或覆盖）')
        }
        const row: ImportRow = { id: `imp-${++rowSeq}`, draft, state: 'ready', message: '' }
        rows.value.push(row)
        if (!selectedId.value) selectedId.value = row.id
      } catch (e) {
        batchError.value = e instanceof Error ? e.message : `读取文件失败：${file.name}`
      }
    }
  } finally {
    reading.value = false
  }
}

function onPick(event: Event): void {
  const input = event.target as HTMLInputElement
  void intake(Array.from(input.files ?? []))
  input.value = ''
}

function onDrop(event: DragEvent): void {
  dragging.value = false
  if (running.value) return
  void intake(Array.from(event.dataTransfer?.files ?? []))
}

function removeRow(id: string): void {
  if (running.value) return
  rows.value = rows.value.filter((r) => r.id !== id)
  if (selectedId.value === id) selectedId.value = rows.value[0]?.id ?? null
}

function clearAll(): void {
  if (running.value) return
  rows.value = []
  selectedId.value = null
  batchNotice.value = ''
  batchError.value = ''
  progress.value = { done: 0, total: 0 }
}

function onTypeChange(draft: ImportDraft): void {
  // 映射约束：diary → private（强制）；其余保持用户当前选择
  if (draft.type === 'diary') draft.visibility = 'private'
}

function onStatusChange(draft: ImportDraft): void {
  // 映射约束：date→publishedAt 仅当 status=published
  if (draft.status !== 'published') draft.publishedAt = null
}

function onPublishedAtInput(draft: ImportDraft, event: Event): void {
  const value = (event.target as HTMLInputElement).value.trim()
  draft.publishedAt = value || null
}

function removeTag(draft: ImportDraft, index: number): void {
  draft.tags.splice(index, 1)
}

function addTag(draft: ImportDraft): void {
  const name = newTagName.value.trim()
  if (!name) return
  const slug = newTagSlug.value.trim() || (SLUG_PATTERN.test(name) ? name : '')
  draft.tags.push({ name, slug, needsCreate: !SLUG_PATTERN.test(name) })
  newTagName.value = ''
  newTagSlug.value = ''
}

/** 409 覆盖路径：按 slug 扫描管理列表定位 id（只读，占全局节流窗口） */
async function findExistingId(slug: string, acquireRead: () => Promise<void>): Promise<string | null> {
  for (let page = 1; page <= 20; page++) {
    await acquireRead()
    const res = await api.listPosts({ scope: 'admin', page, pageSize: 50 })
    const hit = res.items.find((p) => p.slug === slug)
    if (hit) return hit.id
    if (page >= Math.max(1, Math.ceil(res.total / 50))) break
  }
  return null
}

async function runBatch(): Promise<void> {
  batchNotice.value = ''
  batchError.value = ''
  const targets = rows.value.filter((r) => r.state === 'ready' || r.state === 'failed')
  const eligible: ImportRow[] = []
  for (const row of targets) {
    const errors = validateDraft(row.draft)
    const fields = Object.keys(errors)
    if (fields.length > 0) {
      row.state = 'failed'
      row.message = `校验未通过：${fields.map((f) => errors[f]).join('；')}`
    } else {
      eligible.push(row)
    }
  }
  if (eligible.length === 0) {
    batchError.value = '没有可导入的文件（请先修正校验错误）'
    return
  }

  running.value = true
  cancelled.value = false
  progress.value = { done: 0, total: eligible.length }
  const limiter = createRateLimiter()
  const acquireRead = () => limiter.acquire('read')
  const ensuredTags = new Set<string>()
  const onWait = (ms: number) => {
    batchNotice.value = `触发限流，${Math.ceil(ms / 1000)}s 后自动重试…`
  }
  let aborted = false

  for (const row of eligible) {
    if (cancelled.value) {
      row.message = '已取消，未提交'
      continue
    }
    row.state = 'running'
    row.message = ''
    try {
      // 标签两步：非 ASCII 名先 POST /admin/tags {name, slug}，409 视为已存在直接复用
      for (const tag of row.draft.tags.filter((t) => t.needsCreate)) {
        if (ensuredTags.has(tag.slug)) continue
        await limiter.acquire('write')
        try {
          await withBackoff(() => api.createTag({ name: tag.name, slug: tag.slug }), { onWait })
        } catch (e) {
          if (!(e instanceof ApiError && e.status === 409)) throw e
        }
        ensuredTags.add(tag.slug)
      }

      const input = toPostInput(row.draft)
      await limiter.acquire('write')
      try {
        await withBackoff(() => api.createPost(input), { onWait })
        row.state = 'created'
        row.message = '已创建'
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 409)) throw e
        // 409 重复：跳过或 PATCH，绝不重试 POST
        if (strategy.value === 'skip') {
          row.state = 'skipped'
          row.message = 'slug 已存在，按策略跳过'
        } else {
          const id = await findExistingId(row.draft.slug, acquireRead)
          if (!id) throw e
          await limiter.acquire('write')
          await withBackoff(() => api.updatePost(id, input), { onWait })
          row.state = 'updated'
          row.message = 'slug 已存在，已覆盖更新（PATCH）'
        }
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        auth.clear()
        void router.push({ path: '/login', query: { redirect: '/admin' } })
        aborted = true
      } else if (
        e instanceof ApiError &&
        e.status === 403 &&
        e.message === MUST_CHANGE_PASSWORD_MESSAGE
      ) {
        auth.markMustChangePassword()
        void router.push('/change-password')
        aborted = true
      } else {
        row.state = 'failed'
        row.message = e instanceof ApiError ? `${e.status}：${e.message}` : '导入失败，请稍后重试'
      }
    }
    progress.value.done += 1
    if (aborted) {
      batchError.value = '会话失效，批量导入已中止；请重新登录后继续'
      break
    }
  }

  running.value = false
  batchNotice.value = ''
  const s = summary.value
  if (!aborted) {
    batchNotice.value = `批量导入完成：新建 ${s.created} · 覆盖 ${s.updated} · 跳过 ${s.skipped} · 失败 ${s.failed}`
  }
  emit('imported', s)
}
</script>

<template>
  <section class="import" aria-label="Markdown 批量导入">
    <div
      class="import__drop"
      :class="{ 'import__drop--active': dragging }"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <p class="import__drop-title">拖拽 Markdown 文件到此处</p>
      <p class="import__drop-or">或</p>
      <button
        type="button"
        class="import__btn import__btn--primary"
        :disabled="reading || running"
        @click="fileInput?.click()"
      >
        {{ reading ? '读取中…' : '选择文件（可多选）' }}
      </button>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        class="import__file-input"
        aria-label="选择 Markdown 文件"
        @change="onPick"
      />
      <p class="import__hint">
        支持 front-matter（title / slug / type / tags / date / status / visibility / summary）；
        正文原样保留（含 TeX 公式）；单文件正文 ≤ {{ CONTENT_MD_MAX.toLocaleString() }} 字符。
        默认：博客 · 草稿 · 公开（日记强制私密）。
      </p>
    </div>

    <p v-if="batchError" class="import__error" role="alert">{{ batchError }}</p>

    <template v-if="rows.length > 0">
      <div class="import__controls">
        <fieldset class="import__strategy">
          <legend>重复 slug 策略</legend>
          <label>
            <input v-model="strategy" type="radio" value="skip" :disabled="running" />
            跳过（保留现有文章）
          </label>
          <label>
            <input v-model="strategy" type="radio" value="overwrite" :disabled="running" />
            覆盖更新（PATCH）
          </label>
        </fieldset>
        <div class="import__actions">
          <button
            type="button"
            class="import__btn import__btn--primary"
            :disabled="running || readyCount === 0"
            @click="runBatch"
          >
            {{ running ? `导入中 ${progress.done}/${progress.total}` : `批量导入（${readyCount} 篇）` }}
          </button>
          <button
            v-if="running"
            type="button"
            class="import__btn"
            @click="cancelled = true"
          >
            取消剩余
          </button>
          <button type="button" class="import__btn" :disabled="running" @click="clearAll">清空列表</button>
        </div>
      </div>

      <p v-if="batchNotice" class="import__notice" role="status">{{ batchNotice }}</p>
      <p v-if="running" class="import__notice" role="status" aria-live="polite">
        正在导入 {{ progress.done }}/{{ progress.total }}（节流 60 写/分钟，429 自动退避）…
      </p>

      <ul class="import__list" aria-label="待导入文件列表">
        <li
          v-for="row in rows"
          :key="row.id"
          class="import__row"
          :class="[`import__row--${row.state}`, { 'import__row--selected': row.id === selectedId }]"
        >
          <button
            type="button"
            class="import__row-main"
            :aria-expanded="row.id === selectedId"
            @click="selectedId = row.id"
          >
            <span class="import__row-name mono">{{ row.draft.fileName }}</span>
            <span class="import__row-title">{{ row.draft.title }}</span>
            <span class="import__badge" :class="`import__badge--${row.state}`">{{ STATE_LABELS[row.state] }}</span>
          </button>
          <button
            type="button"
            class="import__row-remove"
            :disabled="running"
            :aria-label="`移除 ${row.draft.fileName}`"
            @click="removeRow(row.id)"
          >
            移除
          </button>
          <p v-if="row.message" class="import__row-msg">{{ row.message }}</p>
        </li>
      </ul>

      <div v-if="selected" class="import__detail">
        <h3 class="import__detail-title">预览与修正：{{ selected.draft.fileName }}</h3>
        <p v-for="(w, i) in selected.draft.warnings" :key="i" class="import__warning">{{ w }}</p>

        <div class="import__grid">
          <label class="import__field import__field--wide">
            <span>标题 *</span>
            <input v-model="selected.draft.title" type="text" :disabled="running" />
            <span v-if="selectedErrors.title" class="import__field-error">{{ selectedErrors.title }}</span>
          </label>
          <label class="import__field">
            <span>Slug *（中文标题已显式生成，可修正）</span>
            <input v-model="selected.draft.slug" type="text" class="mono" :disabled="running" />
            <span v-if="selectedErrors.slug" class="import__field-error">{{ selectedErrors.slug }}</span>
          </label>
          <label class="import__field">
            <span>分类</span>
            <select v-model="selected.draft.type" :disabled="running" @change="onTypeChange(selected.draft)">
              <option v-for="opt in IMPORT_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </label>
          <label class="import__field">
            <span>可见性</span>
            <select
              v-model="selected.draft.visibility"
              :disabled="running || selected.draft.type === 'diary'"
            >
              <option value="public">公开</option>
              <option value="private">私密（仅本人）</option>
            </select>
          </label>
          <label class="import__field">
            <span>状态</span>
            <select v-model="selected.draft.status" :disabled="running" @change="onStatusChange(selected.draft)">
              <option value="draft">草稿</option>
              <option value="published">发布</option>
            </select>
          </label>
          <label class="import__field">
            <span>发布时间（仅发布态；front-matter date{{ selected.draft.dateText ? `：${selected.draft.dateText}` : ' 缺省' }}）</span>
            <input
              type="text"
              class="mono"
              placeholder="2026-11-13T08:00:00.000Z"
              :value="selected.draft.publishedAt ?? ''"
              :disabled="running || selected.draft.status !== 'published'"
              @input="onPublishedAtInput(selected.draft, $event)"
            />
            <span v-if="selectedErrors.publishedAt" class="import__field-error">{{ selectedErrors.publishedAt }}</span>
          </label>
          <label class="import__field import__field--wide">
            <span>摘要</span>
            <textarea v-model="selected.draft.summary" rows="2" :disabled="running"></textarea>
            <span v-if="selectedErrors.summary" class="import__field-error">{{ selectedErrors.summary }}</span>
          </label>
        </div>

        <div class="import__tags">
          <p class="import__tags-head">
            标签（中文标签两步创建：先建标签再引用 slug）
            <span v-if="selectedErrors.tags" class="import__field-error">{{ selectedErrors.tags }}</span>
          </p>
          <table v-if="selected.draft.tags.length > 0" class="import__tag-table">
            <thead>
              <tr><th scope="col">名称</th><th scope="col">slug *</th><th scope="col">方式</th><th scope="col">操作</th></tr>
            </thead>
            <tbody>
              <tr v-for="(tag, i) in selected.draft.tags" :key="i">
                <td>{{ tag.name }}</td>
                <td>
                  <input
                    v-model="tag.slug"
                    type="text"
                    class="mono"
                    :aria-label="`标签 ${tag.name} 的 slug`"
                    :disabled="running"
                  />
                </td>
                <td class="import__tag-mode">{{ tag.needsCreate ? '先创建标签' : '直接引用' }}</td>
                <td>
                  <button type="button" class="import__link" :disabled="running" @click="removeTag(selected.draft, i)">
                    删除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="import__tag-add">
            <input v-model="newTagName" type="text" placeholder="标签名（如：数学）" aria-label="新标签名称" :disabled="running" />
            <input v-model="newTagSlug" type="text" class="mono" placeholder="slug（如：math）" aria-label="新标签 slug" :disabled="running" />
            <button type="button" class="import__btn" :disabled="running || !newTagName.trim()" @click="addTag(selected.draft)">
              添加标签
            </button>
          </div>
        </div>

        <div class="import__preview-head">
          <span>正文预览（{{ selected.draft.contentMd.length.toLocaleString() }} 字符，原样提交）</span>
          <button type="button" class="import__btn" @click="previewOn = !previewOn">
            {{ previewOn ? '关闭预览' : '打开预览' }}
          </button>
        </div>
        <span v-if="selectedErrors.contentMd" class="import__field-error">{{ selectedErrors.contentMd }}</span>
        <div v-if="previewOn" class="import__preview" aria-label="导入正文预览">
          <MarkdownView :source="selected.draft.contentMd || '*暂无内容*'" />
        </div>
        <details class="import__raw">
          <summary>查看 Markdown 原文</summary>
          <pre class="mono">{{ selected.draft.contentMd }}</pre>
        </details>
      </div>
    </template>
  </section>
</template>

<style scoped>
.import {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.import__drop {
  border: 1.5px dashed var(--line-strong);
  border-radius: 8px;
  background: var(--paper-elev);
  padding: 2rem 1.4rem;
  text-align: center;
  transition: border-color 0.2s var(--ease-out), background-color 0.2s var(--ease-out);
}

.import__drop--active {
  border-color: var(--cinnabar);
  background: color-mix(in srgb, var(--cinnabar) 6%, var(--paper-elev));
}

.import__drop-title {
  font-family: var(--font-serif-sc);
  font-weight: 700;
  font-size: 1.1rem;
}

.import__drop-or {
  color: var(--ink-faint);
  font-size: 0.85rem;
  margin: 0.4rem 0;
}

.import__file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.import__hint {
  margin-top: 0.9rem;
  color: var(--ink-soft);
  font-size: 0.82rem;
  line-height: 1.7;
}

.import__btn {
  border: 1px solid var(--line-strong);
  background: none;
  border-radius: 999px;
  padding: 0.45rem 1.2rem;
  color: var(--ink);
  font-size: 0.9rem;
  transition: all 0.2s var(--ease-out);
}

.import__btn:hover:not(:disabled) {
  border-color: var(--cinnabar);
  color: var(--cinnabar-deep);
}

.import__btn--primary {
  background: var(--cinnabar);
  border-color: var(--cinnabar);
  color: #f6f1e7;
}

.import__btn--primary:hover:not(:disabled) {
  background: var(--cinnabar-deep);
  color: #f6f1e7;
}

.import__btn:disabled {
  opacity: 0.6;
}

.import__controls {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.import__strategy {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.5rem 0.9rem 0.7rem;
  display: flex;
  gap: 1.1rem;
  font-size: 0.88rem;
  color: var(--ink-soft);
}

.import__strategy legend {
  font-size: 0.8rem;
  color: var(--ink-faint);
  padding: 0 0.3rem;
}

.import__strategy label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.import__actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.import__notice {
  color: var(--gold);
  font-size: 0.9rem;
}

.import__error {
  color: var(--cinnabar-deep);
  font-size: 0.9rem;
}

.import__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: 6px;
  max-height: 18rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--cinnabar) var(--paper-elev);
}

.import__row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 0.8rem;
  border-bottom: 1px solid var(--line);
}

.import__row:last-child {
  border-bottom: none;
}

.import__row--selected {
  background: color-mix(in srgb, var(--cinnabar) 5%, var(--paper-elev));
}

.import__row-main {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  color: var(--ink);
  font-size: 0.9rem;
  min-width: 0;
}

.import__row-name {
  color: var(--ink-faint);
  font-size: 0.78rem;
  flex-shrink: 0;
}

.import__row-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.import__badge {
  flex-shrink: 0;
  font-size: 0.74rem;
  border-radius: 999px;
  padding: 0.1rem 0.55rem;
  border: 1px solid var(--line-strong);
  color: var(--ink-soft);
}

.import__badge--created,
.import__badge--updated {
  border-color: var(--gold);
  color: var(--gold);
}

.import__badge--failed {
  border-color: var(--cinnabar-deep);
  color: var(--cinnabar-deep);
}

.import__badge--running {
  border-color: var(--celadon, var(--gold));
  color: var(--ink);
}

.import__row-remove {
  background: none;
  border: none;
  color: var(--cinnabar-deep);
  font-size: 0.82rem;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.import__row-msg {
  grid-column: 1 / -1;
  font-size: 0.8rem;
  color: var(--ink-soft);
}

.import__detail {
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--paper-elev);
  padding: 1.1rem 1.2rem;
}

.import__detail-title {
  font-size: 1.05rem;
  margin-bottom: 0.6rem;
}

.import__warning {
  color: var(--gold);
  font-size: 0.84rem;
  padding: 0.15rem 0;
}

.import__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.9rem;
  margin-top: 0.7rem;
}

.import__field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--ink-soft);
}

.import__field--wide {
  grid-column: 1 / -1;
}

.import__field input,
.import__field select,
.import__field textarea,
.import__tag-table input,
.import__tag-add input {
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  padding: 0.4rem 0.65rem;
  color: var(--ink);
  font-size: 0.88rem;
}

.import__field input:focus-visible,
.import__field select:focus-visible,
.import__field textarea:focus-visible,
.import__tag-table input:focus-visible,
.import__tag-add input:focus-visible,
.import__btn:focus-visible,
.import__row-main:focus-visible {
  outline: 2px solid var(--cinnabar);
  outline-offset: 1px;
}

.import__field-error {
  color: var(--cinnabar-deep);
  font-size: 0.8rem;
}

.import__tags {
  margin-top: 1rem;
}

.import__tags-head {
  font-size: 0.85rem;
  color: var(--ink-soft);
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.import__tag-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

.import__tag-table th,
.import__tag-table td {
  text-align: left;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--line);
}

.import__tag-table th {
  color: var(--ink-faint);
  font-weight: 500;
  font-size: 0.78rem;
}

.import__tag-mode {
  color: var(--ink-soft);
  white-space: nowrap;
}

.import__link {
  background: none;
  border: none;
  color: var(--cinnabar-deep);
  font-size: 0.82rem;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.import__tag-add {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.6rem;
  flex-wrap: wrap;
}

.import__preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin: 1.1rem 0 0.5rem;
  font-size: 0.85rem;
  color: var(--ink-soft);
}

.import__preview {
  border: 1px dashed var(--line-strong);
  border-radius: 4px;
  padding: 0.8rem 1rem;
  max-height: 28rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--cinnabar) var(--paper-elev);
}

.import__preview::-webkit-scrollbar,
.import__list::-webkit-scrollbar {
  width: 8px;
}

.import__preview::-webkit-scrollbar-track,
.import__list::-webkit-scrollbar-track {
  background: var(--paper-elev);
}

.import__preview::-webkit-scrollbar-thumb,
.import__list::-webkit-scrollbar-thumb {
  background: var(--cinnabar);
  border-radius: 4px;
}

.import__preview::-webkit-scrollbar-thumb:hover,
.import__list::-webkit-scrollbar-thumb:hover {
  background: var(--cinnabar-deep);
}

.import__raw {
  margin-top: 0.7rem;
  font-size: 0.84rem;
  color: var(--ink-soft);
}

.import__raw pre {
  max-height: 18rem;
  overflow: auto;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 0.7rem 0.9rem;
  font-size: 0.8rem;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  scrollbar-width: thin;
  scrollbar-color: var(--cinnabar) var(--paper-elev);
}

@media (max-width: 760px) {
  .import__grid {
    grid-template-columns: 1fr;
  }

  .import__controls {
    flex-direction: column;
    align-items: stretch;
  }

  .import__row-main {
    flex-wrap: wrap;
  }
}
</style>