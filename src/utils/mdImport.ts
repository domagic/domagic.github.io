import type { Category, PostInput, PostStatus, Visibility } from '@/api/types'

/**
 * P1-3 md 导入：front-matter 解析 + 契约 v1.2 映射（零契约变更）。
 * 解析与映射语义对齐 LuoCG 已核验参考 P4/evidence/scripts/verify-md-import.cjs
 * （parseFrontMatter + toCreateRequest，overrides last）：
 * - 正文自结束分隔符后原样保留（零变换，TeX 反斜杠不动）；
 * - 默认 type=blog / status=draft / visibility diary→private 否则 public；
 * - date→publishedAt 仅当最终 status=published（draft+publishedAt 会 422）；
 * - 中文标题必须显式生成 slug（后端自动生成对混合标题会退化，见参考 V27/V33）；
 * - 非 ASCII 标签名走两步：先 POST /admin/tags {name, slug} 再引用 slug。
 */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const CONTENT_MD_MAX = 200_000
export const TITLE_MAX = 200
export const SUMMARY_MAX = 500
export const SLUG_MAX = 160
export const TAG_SLUG_MAX = 80
export const TAGS_MAX = 10

const CATEGORIES: Category[] = ['blog', 'opinion', 'diary', 'academic', 'group']
const VISIBILITIES: Visibility[] = ['public', 'private']
const STATUSES: PostStatus[] = ['published', 'draft']

export type FrontMatterValue = string | string[]
export type FrontMatter = Record<string, FrontMatterValue>

/** 与参考脚本逐字对齐：扁平 key: value + 内联 [a, b] 列表；正文零变换 */
export function parseFrontMatter(raw: string): { meta: FrontMatter; contentMd: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!m) return { meta: {}, contentMd: raw }
  const meta: FrontMatter = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/)
    if (!kv) continue
    let v: FrontMatterValue = kv[2].trim()
    if (v.startsWith('[') && v.endsWith(']')) {
      v = v
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    } else {
      v = v.replace(/^["']|["']$/g, '')
    }
    meta[kv[1]] = v
  }
  return { meta, contentMd: raw.slice(m[0].length) }
}

export function slugifyLatin(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, '')
}

function defaultRand(): string {
  return Math.random().toString(36).slice(2, 6).padEnd(4, '0')
}

/**
 * 显式 slug 生成：纯 ASCII 标题直接 slug 化；
 * 含非 ASCII（中文/混合）标题一律生成 {拉丁片段|type}-YYYYMMDD-xxxx，
 * 避免后端自动生成的退化 slug（参考 V33：混合标题 → 'slug'）。
 */
export function generateSlug(
  title: string,
  type: Category,
  now: Date = new Date(),
  rand: () => string = defaultRand,
): string {
  const latin = slugifyLatin(title)
  const hasNonAscii = /[^\x00-\x7F]/.test(title)
  if (!hasNonAscii && latin) return latin
  const y = now.getFullYear()
  const mo = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${latin || type}-${y}${mo}${d}-${rand()}`
}

export interface ImportTag {
  /** 展示名（front-matter 原文，可为中文） */
  name: string
  /** 契约 slug；非 ASCII 名需用户在预览中补全 */
  slug: string
  /** true = 需要先 POST /admin/tags 两步创建 */
  needsCreate: boolean
}

export interface ImportDraft {
  fileName: string
  title: string
  slug: string
  type: Category
  visibility: Visibility
  status: PostStatus
  summary: string
  tags: ImportTag[]
  /** 仅 status=published 时非空（ISO 8601） */
  publishedAt: string | null
  /** front-matter date 原文（预览展示用） */
  dateText: string
  contentMd: string
  warnings: string[]
}

function asList(v: FrontMatterValue | undefined): string[] {
  if (v === undefined) return []
  const arr = Array.isArray(v) ? v : v.split(/[,，]/)
  return arr.map((s) => s.trim()).filter(Boolean)
}

function asText(v: FrontMatterValue | undefined): string {
  if (v === undefined) return ''
  return Array.isArray(v) ? v.join(', ') : v
}

export interface ParseOptions {
  now?: Date
  rand?: () => string
}

/** 单文件解析 → 可编辑导入草稿；映射约束与参考 toCreateRequest 一致 */
export function parseImportFile(
  raw: string,
  fileName: string,
  options: ParseOptions = {},
): ImportDraft {
  const { meta, contentMd } = parseFrontMatter(raw)
  const warnings: string[] = []

  let type: Category = 'blog'
  const metaType = asText(meta.type)
  if (metaType) {
    if ((CATEGORIES as string[]).includes(metaType)) type = metaType as Category
    else warnings.push(`未知分类「${metaType}」，已回退为 blog`)
  }

  const fallbackTitle = fileName.replace(/\.(md|markdown|txt)$/i, '')
  const title = asText(meta.title) || fallbackTitle
  if (!asText(meta.title)) warnings.push('front-matter 缺少 title，已使用文件名')

  let status: PostStatus = 'draft'
  const metaStatus = asText(meta.status)
  if (metaStatus) {
    if ((STATUSES as string[]).includes(metaStatus)) status = metaStatus as PostStatus
    else warnings.push(`未知状态「${metaStatus}」，已回退为 draft`)
  }

  let visibility: Visibility = type === 'diary' ? 'private' : 'public'
  const metaVisibility = asText(meta.visibility)
  if (metaVisibility) {
    if ((VISIBILITIES as string[]).includes(metaVisibility)) visibility = metaVisibility as Visibility
    else warnings.push(`未知可见性「${metaVisibility}」，已回退为 ${visibility}`)
  }

  const explicitSlug = asText(meta.slug)
  const slug = explicitSlug || generateSlug(title, type, options.now, options.rand)
  if (explicitSlug && !SLUG_PATTERN.test(explicitSlug)) {
    warnings.push(`front-matter slug「${explicitSlug}」不合法，请在预览中修正`)
  }

  const tags: ImportTag[] = asList(meta.tags).map((entry) => {
    if (SLUG_PATTERN.test(entry) && entry.length <= TAG_SLUG_MAX) {
      return { name: entry, slug: entry, needsCreate: false }
    }
    return { name: entry, slug: slugifyLatin(entry).slice(0, TAG_SLUG_MAX), needsCreate: true }
  })
  if (tags.some((t) => t.needsCreate && !t.slug)) {
    warnings.push('存在中文/非 ASCII 标签：请为每个标签补全 slug（先建标签再引用，两步提交）')
  }

  const dateText = asText(meta.date)
  let publishedAt: string | null = null
  if (dateText) {
    const parsed = new Date(dateText)
    if (Number.isNaN(parsed.getTime())) {
      warnings.push(`date「${dateText}」无法解析，已忽略`)
    } else if (status === 'published') {
      publishedAt = parsed.toISOString()
    } else {
      warnings.push('status 非 published：date 不映射为 publishedAt（契约 422 约束）')
    }
  }

  return {
    fileName,
    title,
    slug,
    type,
    visibility,
    status,
    summary: asText(meta.summary),
    tags,
    publishedAt,
    dateText,
    contentMd,
    warnings,
  }
}

/** 阻断性校验（提交前必须全部通过）；返回 field→message */
export function validateDraft(draft: ImportDraft): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!draft.title.trim()) errors.title = '标题不能为空'
  else if (draft.title.length > TITLE_MAX) errors.title = `标题不能超过 ${TITLE_MAX} 字符`
  if (!draft.slug.trim()) errors.slug = 'slug 不能为空（中文标题需显式生成）'
  else if (!SLUG_PATTERN.test(draft.slug)) errors.slug = 'slug 仅允许小写字母、数字与连字符'
  else if (draft.slug.length > SLUG_MAX) errors.slug = `slug 不能超过 ${SLUG_MAX} 字符`
  if (!draft.contentMd.trim()) errors.contentMd = '正文不能为空'
  else if (draft.contentMd.length > CONTENT_MD_MAX) {
    errors.contentMd = `正文 ${draft.contentMd.length} 字符，超过契约上限 ${CONTENT_MD_MAX}`
  }
  if (draft.summary.length > SUMMARY_MAX) errors.summary = `摘要不能超过 ${SUMMARY_MAX} 字符`
  if (draft.tags.length > TAGS_MAX) errors.tags = `标签最多 ${TAGS_MAX} 个`
  else if (draft.tags.some((t) => !SLUG_PATTERN.test(t.slug) || t.slug.length > TAG_SLUG_MAX)) {
    errors.tags = '每个标签都需要合法 slug（小写字母/数字/连字符；中文标签请补全）'
  }
  if (draft.status === 'published' && draft.publishedAt) {
    if (Number.isNaN(new Date(draft.publishedAt).getTime())) {
      errors.publishedAt = '发布时间格式不合法'
    }
  }
  return errors
}

/**
 * 草稿 → PostInput（http 适配层再映射为契约 CreatePostRequest）。
 * overrides last（与参考一致）；publishedAt 门禁在 overrides 之后再执行一次，
 * 保证任何覆盖组合下 draft 都不会携带 publishedAt。
 */
export function toPostInput(draft: ImportDraft, overrides: Partial<PostInput> = {}): PostInput {
  const base: PostInput = {
    title: draft.title,
    slug: draft.slug,
    category: draft.type,
    excerpt: draft.summary,
    content: draft.contentMd,
    tags: draft.tags.map((t) => t.slug),
    visibility: draft.visibility,
    status: draft.status,
    publishedAt: draft.publishedAt,
  }
  const merged = Object.assign(base, overrides)
  if (merged.status !== 'published') merged.publishedAt = null
  return merged
}

/** 读取 File 文本（FileReader，UTF-8） */
export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error(`读取文件失败：${file.name}`))
    reader.readAsText(file, 'utf-8')
  })
}