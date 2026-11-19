import {
  ApiError,
  type ApiClient,
  type ArchiveYear,
  type Paged,
  type Post,
  type PostInput,
  type PostQuery,
  type PostSummary,
  type Session,
  type SessionUser,
  type Tag,
  type TagRef,
} from '../types'
import { createStorage, type KeyValueStorage } from '../storage'
import { mockPosts, mockProfile, mockTagDirectory } from './fixtures'

// T5a：mock 语义对齐冻结契约 v1 —— 双令牌+轮换+复用吊销、公开端点对私密/草稿 404、
// 管理数据走 admin 语义、标签 slug 化、错误码与 details 结构一致。
const DB_KEY = 'domagic.mock.db.v2'
const SESSIONS_KEY = 'domagic.mock.sessions.v2' // 模拟服务端令牌注册表
const CLIENT_REFRESH_KEY = 'domagic.mock.refresh.v1' // 模拟客户端 localStorage（仅 refreshToken）
const DEMO_USER = 'admin'
const DEMO_PASS = 'magic-demo'
const ACCESS_TTL_MS = 15 * 60 * 1000
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CONTENT_MD_MAX = 200_000
const TAGS_MAX = 10

interface MockDb {
  posts: Post[]
  tags: Record<string, string>
}

interface TokenRecord {
  kind: 'access' | 'refresh'
  familyId: string
  expiresAt: number
  user: SessionUser
  used?: boolean
}

function estimateReadingMinutes(content: string): number {
  const chars = content.replace(/\s/g, '').length
  return Math.max(1, Math.round(chars / 400))
}

function slugify(title: string): string {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return ascii || `post-${Date.now().toString(36)}`
}

function publicSummary(post: Post): PostSummary {
  return {
    id: post.slug,
    slug: post.slug,
    category: post.category,
    title: post.title,
    excerpt: post.excerpt,
    tags: post.tags,
    visibility: 'public',
    status: 'published',
    publishedAt: post.publishedAt,
    readingMinutes: post.readingMinutes,
    academicMeta: post.academicMeta ?? null,
  }
}

function adminSummary(post: Post): PostSummary {
  return {
    id: post.id,
    slug: post.slug,
    category: post.category,
    title: post.title,
    excerpt: '',
    tags: [],
    visibility: post.visibility,
    status: post.status,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
  }
}

export interface MockOptions {
  storage?: KeyValueStorage
  latencyMs?: number
}

export function createMockClient(options: MockOptions = {}): ApiClient {
  const storage = options.storage ?? createStorage()
  const latency = options.latencyMs ?? 120
  let accessToken: string | null = null
  const listeners = new Set<(authenticated: boolean) => void>()

  function emit(authenticated: boolean): void {
    for (const listener of listeners) listener(authenticated)
  }

  function loadDb(): MockDb {
    const raw = storage.getItem(DB_KEY)
    if (raw) {
      try {
        return JSON.parse(raw) as MockDb
      } catch {
        // corrupted cache: reseed
      }
    }
    const db: MockDb = { posts: structuredClone(mockPosts), tags: { ...mockTagDirectory } }
    storage.setItem(DB_KEY, JSON.stringify(db))
    return db
  }

  function saveDb(db: MockDb): void {
    storage.setItem(DB_KEY, JSON.stringify(db))
  }

  function loadSessions(): Record<string, TokenRecord> {
    try {
      return JSON.parse(storage.getItem(SESSIONS_KEY) ?? '{}') as Record<string, TokenRecord>
    } catch {
      return {}
    }
  }

  function saveSessions(sessions: Record<string, TokenRecord>): void {
    storage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  }

  function clearTokens(): void {
    accessToken = null
    storage.removeItem(CLIENT_REFRESH_KEY)
  }

  function issuePair(
    sessions: Record<string, TokenRecord>,
    user: SessionUser,
    familyId: string,
  ): Session {
    const now = Date.now()
    const access = `mock-at-${crypto.randomUUID()}`
    const refresh = `mock-rt-${crypto.randomUUID()}`
    sessions[access] = { kind: 'access', familyId, expiresAt: now + ACCESS_TTL_MS, user }
    sessions[refresh] = { kind: 'refresh', familyId, expiresAt: now + REFRESH_TTL_MS, user }
    saveSessions(sessions)
    accessToken = access
    storage.setItem(CLIENT_REFRESH_KEY, refresh)
    return {
      accessToken: access,
      expiresAt: now + ACCESS_TTL_MS,
      refreshToken: refresh,
      refreshExpiresAt: now + REFRESH_TTL_MS,
      user,
      // 演示账号无首登强制改密状态（v1.1 形状对齐）
      mustChangePassword: false,
    }
  }

  /** 刷新即轮换；检测旧 refreshToken 复用 → 吊销整个令牌家族（契约 §认证） */
  function rotate(): Session {
    const token = storage.getItem(CLIENT_REFRESH_KEY)
    if (!token) throw new ApiError(401, 'UNAUTHORIZED', '缺少刷新凭据，请重新登录')
    const sessions = loadSessions()
    const record = sessions[token]
    if (!record || record.kind !== 'refresh' || record.expiresAt < Date.now()) {
      clearTokens()
      emit(false)
      throw new ApiError(401, 'UNAUTHORIZED', '登录已失效，请重新登录')
    }
    if (record.used) {
      for (const [key, value] of Object.entries(sessions)) {
        if (value.familyId === record.familyId) delete sessions[key]
      }
      saveSessions(sessions)
      clearTokens()
      emit(false)
      throw new ApiError(401, 'UNAUTHORIZED', '检测到刷新令牌复用，会话已吊销')
    }
    record.used = true
    const session = issuePair(sessions, record.user, record.familyId)
    emit(true)
    return session
  }

  function currentUser(): SessionUser | null {
    if (!accessToken) return null
    const record = loadSessions()[accessToken]
    if (!record || record.kind !== 'access' || record.expiresAt < Date.now()) return null
    return record.user
  }

  function requireUser(): SessionUser {
    const user = currentUser()
    if (!user) throw new ApiError(401, 'UNAUTHORIZED', '登录已失效，请重新登录')
    return user
  }

  async function delay(): Promise<void> {
    if (latency > 0) await new Promise((r) => setTimeout(r, latency))
  }

  function resolveTags(db: MockDb, slugs: string[]): TagRef[] {
    return slugs.map((slug) => {
      if (!db.tags[slug]) db.tags[slug] = slug
      return { slug, name: db.tags[slug] }
    })
  }

  function validateWrite(
    category: Post['category'],
    visibility: Post['visibility'],
    input: { coverImageUrl?: string | null; academicMeta?: Post['academicMeta'] },
  ): void {
    if (visibility === 'private' && input.coverImageUrl) {
      throw new ApiError(422, 'VALIDATION_ERROR', '私密内容不允许设置封面图', {
        details: [{ field: 'coverImageUrl', message: '私密内容不允许设置封面图' }],
      })
    }
    if (input.academicMeta && category !== 'academic') {
      throw new ApiError(422, 'VALIDATION_ERROR', 'academicMeta 仅学术类型可携带', {
        details: [{ field: 'academicMeta', message: '仅 type=academic 的文章可携带学术元数据' }],
      })
    }
  }

  /** 契约 v1.2 语义：contentMd ≤ 200000、tags ≤ 10、draft 禁止携带 publishedAt（422） */
  function validateImportConstraints(
    status: Post['status'],
    data: { content?: string; tags?: string[]; publishedAt?: string | null },
  ): void {
    if (data.content !== undefined && data.content.length > CONTENT_MD_MAX) {
      throw new ApiError(400, 'VALIDATION_ERROR', '请求参数校验失败', {
        details: [{ field: 'contentMd', message: `contentMd must be shorter than or equal to ${CONTENT_MD_MAX} characters` }],
      })
    }
    if (data.tags !== undefined && data.tags.length > TAGS_MAX) {
      throw new ApiError(400, 'VALIDATION_ERROR', '请求参数校验失败', {
        details: [{ field: 'tags', message: `tags must contain no more than ${TAGS_MAX} elements` }],
      })
    }
    if (status !== 'published' && data.publishedAt) {
      throw new ApiError(422, 'VALIDATION_ERROR', '草稿不允许携带发布时间', {
        details: [{ field: 'publishedAt', message: 'publishedAt 仅 status=published 可携带' }],
      })
    }
  }

  return {
    async getProfile() {
      await delay()
      return structuredClone(mockProfile)
    },

    async listPosts(query: PostQuery = {}): Promise<Paged<PostSummary>> {
      await delay()
      const db = loadDb()
      const user = currentUser()
      const admin = query.scope === 'admin' || (query.category === 'diary' && !!user)
      if (query.scope === 'admin' && !user) {
        throw new ApiError(401, 'UNAUTHORIZED', '登录已失效，请重新登录')
      }
      let items = admin
        ? [...db.posts]
        : db.posts.filter((p) => p.visibility === 'public' && p.status === 'published')
      if (query.category) items = items.filter((p) => p.category === query.category)
      if (query.tag) items = items.filter((p) => p.tags.some((t) => t.slug === query.tag))
      if (admin && query.status) items = items.filter((p) => p.status === query.status)
      if (admin && query.visibility) items = items.filter((p) => p.visibility === query.visibility)
      if (query.q) {
        const q = query.q.toLowerCase()
        // 契约：q 仅 ILIKE title/summary
        items = items.filter((p) => [p.title, p.excerpt].some((f) => f.toLowerCase().includes(q)))
      }
      items.sort((a, b) =>
        admin
          ? (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')
          : (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''),
      )
      const page = Math.max(1, query.page ?? 1)
      const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 10))
      const start = (page - 1) * pageSize
      return {
        items: items.slice(start, start + pageSize).map(admin ? adminSummary : publicSummary),
        total: items.length,
        page,
        pageSize,
      }
    },

    async getPost(slug: string) {
      await delay()
      const db = loadDb()
      const post = db.posts.find((p) => p.slug === slug)
      const user = currentUser()
      // 契约红线：公开端点对私密/草稿与不存在同样返回 404，不泄露存在性
      if (!post || (!user && (post.visibility === 'private' || post.status === 'draft'))) {
        throw new ApiError(404, 'NOT_FOUND', '文章不存在')
      }
      return structuredClone(post)
    },

    async getAdminPost(id: string) {
      await delay()
      requireUser()
      const post = loadDb().posts.find((p) => p.id === id)
      if (!post) throw new ApiError(404, 'NOT_FOUND', '文章不存在')
      return structuredClone(post)
    },

    async createPost(input: PostInput) {
      await delay()
      requireUser()
      // 模拟网络边界的 JSON 序列化，剥离调用方可能传入的响应式代理
      const data = JSON.parse(JSON.stringify(input)) as PostInput
      const db = loadDb()
      const now = new Date().toISOString()
      const category = data.category
      const visibility = data.visibility ?? (category === 'diary' ? 'private' : 'public')
      const status = data.status ?? 'draft'
      const slug = data.slug?.trim() || slugify(data.title)
      if (!SLUG_PATTERN.test(slug)) {
        throw new ApiError(422, 'VALIDATION_ERROR', 'slug 格式不合法', {
          details: [{ field: 'slug', message: '仅允许小写字母、数字与连字符' }],
        })
      }
      validateWrite(category, visibility, data)
      validateImportConstraints(status, data)
      if (db.posts.some((p) => p.slug === slug)) {
        throw new ApiError(409, 'CONFLICT', '该 slug 已存在，请更换')
      }
      const post: Post = {
        id: `p-${Date.now().toString(36)}`,
        slug,
        category,
        title: data.title,
        excerpt: data.excerpt || data.content.slice(0, 200),
        content: data.content,
        tags: resolveTags(db, data.tags ?? []),
        visibility,
        status,
        publishedAt: status === 'published' ? (data.publishedAt ?? now) : null,
        updatedAt: now,
        readingMinutes: estimateReadingMinutes(data.content),
        academicMeta: category === 'academic' ? (data.academicMeta ?? null) : null,
      }
      db.posts.unshift(post)
      saveDb(db)
      return structuredClone(post)
    },

    async updatePost(id: string, input: Partial<PostInput>) {
      await delay()
      requireUser()
      const data = JSON.parse(JSON.stringify(input)) as Partial<PostInput>
      const db = loadDb()
      const post = db.posts.find((p) => p.id === id)
      if (!post) throw new ApiError(404, 'NOT_FOUND', '文章不存在')
      if (data.slug && data.slug !== post.slug) {
        if (!SLUG_PATTERN.test(data.slug)) {
          throw new ApiError(422, 'VALIDATION_ERROR', 'slug 格式不合法', {
            details: [{ field: 'slug', message: '仅允许小写字母、数字与连字符' }],
          })
        }
        if (db.posts.some((p) => p.slug === data.slug)) {
          throw new ApiError(409, 'CONFLICT', '该 slug 已存在，请更换')
        }
      }
      const category = data.category ?? post.category
      const visibility = data.visibility ?? post.visibility
      const status = data.status ?? post.status
      validateWrite(category, visibility, {
        coverImageUrl: 'coverImageUrl' in data ? data.coverImageUrl : undefined,
        academicMeta: 'academicMeta' in data ? data.academicMeta : post.academicMeta,
      })
      validateImportConstraints(status, data)
      const { tags, ...rest } = data
      Object.assign(post, rest, {
        category,
        visibility,
        status,
        updatedAt: new Date().toISOString(),
        readingMinutes: estimateReadingMinutes(data.content ?? post.content),
      })
      if (tags) post.tags = resolveTags(db, tags)
      if (status === 'draft') post.publishedAt = null
      else if (!post.publishedAt) post.publishedAt = new Date().toISOString()
      if (category !== 'academic') post.academicMeta = null
      saveDb(db)
      return structuredClone(post)
    },

    async deletePost(id: string) {
      await delay()
      requireUser()
      const db = loadDb()
      const index = db.posts.findIndex((p) => p.id === id)
      if (index === -1) throw new ApiError(404, 'NOT_FOUND', '文章不存在')
      db.posts.splice(index, 1)
      saveDb(db)
    },

    async listTags(): Promise<Tag[]> {
      await delay()
      const db = loadDb()
      const counts = new Map<string, number>()
      // 契约：postCount 恒为公开已发布计数，与登录态无关
      for (const post of db.posts) {
        if (post.visibility !== 'public' || post.status !== 'published') continue
        for (const tag of post.tags) counts.set(tag.slug, (counts.get(tag.slug) ?? 0) + 1)
      }
      return Object.entries(db.tags)
        .map(([slug, name]) => ({ slug, name, count: counts.get(slug) ?? 0 }))
        .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug))
    },

    async createTag(input): Promise<Tag> {
      await delay()
      requireUser()
      const name = input.name?.trim()
      if (!name || name.length > 80) {
        throw new ApiError(400, 'VALIDATION_ERROR', '请求参数校验失败', {
          details: [{ field: 'name', message: 'name 长度需在 1-80 字符之间' }],
        })
      }
      const slug = input.slug?.trim() || slugify(name)
      if (!SLUG_PATTERN.test(slug) || slug.length > 80) {
        throw new ApiError(400, 'VALIDATION_ERROR', '请求参数校验失败', {
          details: [{ field: 'slug', message: '仅允许小写字母、数字与连字符' }],
        })
      }
      const db = loadDb()
      if (db.tags[slug]) throw new ApiError(409, 'CONFLICT', '该标签 slug 已存在')
      db.tags[slug] = name
      saveDb(db)
      return { slug, name, count: 0 }
    },

    async getArchive(): Promise<ArchiveYear[]> {
      await delay()
      const db = loadDb()
      // 契约：仅公开已发布；年份降序，年内 publishedAt 降序
      const byYear = new Map<number, ArchiveYear>()
      for (const post of db.posts) {
        if (post.visibility !== 'public' || post.status !== 'published' || !post.publishedAt) continue
        const year = new Date(post.publishedAt).getFullYear()
        const group = byYear.get(year) ?? { year, count: 0, posts: [] }
        group.count += 1
        group.posts.push({
          slug: post.slug,
          title: post.title,
          category: post.category,
          publishedAt: post.publishedAt,
        })
        byYear.set(year, group)
      }
      const years = [...byYear.values()].sort((a, b) => b.year - a.year)
      for (const group of years) {
        group.posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      }
      return years
    },

    async login(username: string, password: string): Promise<Session> {
      await delay()
      if (username !== DEMO_USER || password !== DEMO_PASS) {
        throw new ApiError(401, 'UNAUTHORIZED', '用户名或密码错误（演示账号见登录页提示）')
      }
      const user: SessionUser = { id: 'u-owner', name: 'Magic', role: 'owner' }
      const session = issuePair(loadSessions(), user, `fam-${crypto.randomUUID()}`)
      emit(true)
      return session
    },

    async changePassword(currentPassword: string, newPassword: string) {
      await delay()
      requireUser()
      if (newPassword.length < 12 || newPassword.length > 128) {
        throw new ApiError(400, 'VALIDATION_ERROR', '请求参数校验失败', {
          details: [
            { field: 'newPassword', message: 'newPassword must be longer than or equal to 12 characters' },
          ],
        })
      }
      if (currentPassword !== DEMO_PASS) {
        throw new ApiError(401, 'UNAUTHORIZED', '当前密码不正确')
      }
      if (newPassword === currentPassword) {
        throw new ApiError(422, 'VALIDATION_ERROR', '新密码不能与当前密码相同')
      }
      // v1.1 语义：撤销该用户全部会话（mock 仅演示账号一个用户）；演示口令本身不持久化
      saveSessions({})
      clearTokens()
      emit(false)
      return { mustChangePassword: false as const }
    },

    async logout() {
      await delay()
      const token = storage.getItem(CLIENT_REFRESH_KEY)
      if (token) {
        const sessions = loadSessions()
        delete sessions[token]
        saveSessions(sessions)
      }
      clearTokens()
      emit(false)
    },

    async me() {
      await delay()
      return requireUser()
    },

    async restoreSession(): Promise<Session | null> {
      await delay()
      if (!storage.getItem(CLIENT_REFRESH_KEY)) return null
      try {
        return rotate()
      } catch {
        return null
      }
    },

    subscribeAuth(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}