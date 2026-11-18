import {
  ApiError,
  type AcademicMeta,
  type ApiClient,
  type ArchiveYear,
  type Category,
  type Paged,
  type Post,
  type PostInput,
  type PostQuery,
  type PostStatus,
  type PostSummary,
  type Profile,
  type SessionUser,
  type Tag,
  type TagRef,
  type ValidationDetail,
  type Visibility,
} from '../types'
import { createStorage, type KeyValueStorage } from '../storage'
import { PROFILE_DISPLAY } from '../../config/site'

/**
 * 冻结契约 v1（shared/T1-后端设计/openapi.v1.json）的 http 适配层。
 * 事实源以 OpenAPI 为准：分页线上形状为 {items, meta}；Profile 简介字段为 bio。
 * 视图层继续使用内部模型（category/excerpt/content/readingMinutes），双向映射在此完成。
 *
 * 认证（ADR-004）：accessToken 仅存内存；refreshToken 存 localStorage；
 * 401 → 单次刷新（并发排队共享同一 Promise）→ 重放原请求一次；刷新失败清空令牌并通知订阅者。
 */

const TIMEOUT_MS = 10_000
const API = '/api/v1'
const REFRESH_KEY = 'domagic.refresh.v1'
const ADMIN_SCAN_MAX_PAGES = 20

interface WireTagRef {
  slug: string
  name: string
}
interface WirePostSummary {
  slug: string
  type: Category
  title: string
  summary: string
  tags: WireTagRef[]
  coverImageUrl?: string | null
  publishedAt: string
  readingTimeMinutes: number
}
interface WirePostDetail extends WirePostSummary {
  contentMd: string
  academicMeta?: AcademicMeta | null
  updatedAt: string
}
interface WireAdminSummary {
  id: string
  slug: string
  type: Category
  title: string
  visibility: Visibility
  status: PostStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}
interface WireAdminPost extends WireAdminSummary {
  summary: string
  contentMd: string
  tags: WireTagRef[]
  coverImageUrl?: string | null
  academicMeta?: AcademicMeta | null
}
interface WireMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}
interface WireList<T> {
  items: T[]
  meta: WireMeta
}
interface WireProfile {
  displayName: string
  headline: string
  bio: string
  avatarUrl?: string | null
  location?: string | null
  socialLinks: { label: string; url: string }[]
  updatedAt: string
}
interface WireTag {
  id: string
  slug: string
  name: string
  description?: string | null
  postCount: number
}
interface WireArchivePostRef {
  slug: string
  title: string
  type: Category
  publishedAt: string
}
interface WireArchiveYear {
  year: number
  count: number
  posts: WireArchivePostRef[]
}
interface WireAuthUser {
  id: string
  username: string
  displayName: string
}
interface WireLogin extends WireRefresh {
  user: WireAuthUser
  /** v1.1 增补 A；对 v1 服务端缺省按 false 处理 */
  mustChangePassword?: boolean
}
interface WireRefresh {
  accessToken: string
  tokenType: string
  expiresIn: number
  refreshToken: string
  refreshExpiresIn: number
}
interface WireMe extends WireAuthUser {
  lastLoginAt?: string | null
}
interface WireError {
  error?: {
    code?: string
    message?: string
    details?: ValidationDetail[]
    requestId?: string
  }
}

export interface HttpClientOptions {
  storage?: KeyValueStorage
  fetchImpl?: typeof fetch
}

function fallbackCode(status: number): string {
  switch (status) {
    case 400:
    case 422:
      return 'VALIDATION_ERROR'
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 409:
      return 'CONFLICT'
    case 429:
      return 'RATE_LIMITED'
    default:
      return 'HTTP_ERROR'
  }
}

export function createHttpClient(baseUrl: string, options: HttpClientOptions = {}): ApiClient {
  const base = baseUrl.replace(/\/+$/, '')
  const storage = options.storage ?? createStorage()
  const doFetch: typeof fetch = options.fetchImpl ?? ((input, init) => fetch(input, init))

  let accessToken: string | null = null
  let accessExpiresAt = 0
  let refreshInflight: Promise<boolean> | null = null
  const listeners = new Set<(authenticated: boolean) => void>()
  const slugToId = new Map<string, string>()

  function emit(authenticated: boolean): void {
    for (const listener of listeners) listener(authenticated)
  }

  function getRefreshToken(): string | null {
    return storage.getItem(REFRESH_KEY)
  }

  function clearTokens(): void {
    accessToken = null
    accessExpiresAt = 0
    storage.removeItem(REFRESH_KEY)
    emit(false)
  }

  function storeTokens(access: string, expiresIn: number, refresh: string): void {
    accessToken = access
    accessExpiresAt = Date.now() + expiresIn * 1000
    storage.setItem(REFRESH_KEY, refresh)
    emit(true)
  }

  async function raw(
    path: string,
    init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
  ): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      return await doFetch(`${base}${path}`, {
        method: init.method ?? 'GET',
        signal: controller.signal,
        headers: {
          ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...init.headers,
        },
        ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
      })
    } catch {
      throw new ApiError(0, 'NETWORK_ERROR', '网络请求失败，请检查连接后重试')
    } finally {
      clearTimeout(timer)
    }
  }

  async function toApiError(res: Response): Promise<ApiError> {
    const body = (await res.json().catch(() => null)) as WireError | null
    const retryAfter = res.headers.get('Retry-After')
    const retryAfterSeconds =
      retryAfter !== null && /^\d+$/.test(retryAfter) ? Number(retryAfter) : undefined
    const e = body?.error
    return new ApiError(
      res.status,
      e?.code ?? fallbackCode(res.status),
      e?.message ?? `请求失败（${res.status}）`,
      { details: e?.details, requestId: e?.requestId, retryAfterSeconds },
    )
  }

  /** 单次刷新：并发 401 共享同一 Promise；成功轮换双令牌，失败清空并通知 */
  function refreshTokens(): Promise<boolean> {
    if (refreshInflight) return refreshInflight
    refreshInflight = (async () => {
      const refreshToken = getRefreshToken()
      if (!refreshToken) return false
      let res: Response
      try {
        res = await raw(`${API}/auth/refresh`, { method: 'POST', body: { refreshToken } })
      } catch {
        clearTokens()
        return false
      }
      if (!res.ok) {
        clearTokens()
        return false
      }
      const data = (await res.json().catch(() => null)) as WireRefresh | null
      if (!data?.accessToken || !data?.refreshToken) {
        clearTokens()
        return false
      }
      storeTokens(data.accessToken, data.expiresIn, data.refreshToken)
      return true
    })().finally(() => {
      refreshInflight = null
    })
    return refreshInflight
  }

  async function request<T>(
    path: string,
    init: { method?: string; body?: unknown; auth?: boolean; retried?: boolean } = {},
  ): Promise<T> {
    const res = await raw(path, init)
    const isAuthEndpoint = path === `${API}/auth/login` || path === `${API}/auth/refresh`
    if (
      res.status === 401 &&
      init.auth !== false &&
      !init.retried &&
      !isAuthEndpoint &&
      getRefreshToken()
    ) {
      const refreshed = await refreshTokens()
      if (refreshed) return request<T>(path, { ...init, retried: true })
    }
    if (res.status === 204) return undefined as T
    if (!res.ok) throw await toApiError(res)
    return (await res.json().catch(() => null)) as T
  }

  // ---------- 线上形状 → 内部模型 ----------

  function mapTagRefs(tags: WireTagRef[] | undefined): TagRef[] {
    return (tags ?? []).map((t) => ({ slug: t.slug, name: t.name }))
  }

  function mapPublicSummary(w: WirePostSummary): PostSummary {
    return {
      id: w.slug,
      slug: w.slug,
      category: w.type,
      title: w.title,
      excerpt: w.summary,
      tags: mapTagRefs(w.tags),
      visibility: 'public',
      status: 'published',
      publishedAt: w.publishedAt,
      readingMinutes: w.readingTimeMinutes,
    }
  }

  function mapPublicDetail(w: WirePostDetail): Post {
    return {
      ...mapPublicSummary(w),
      content: w.contentMd,
      updatedAt: w.updatedAt,
      academicMeta: w.academicMeta ?? null,
    }
  }

  function mapAdminSummary(w: WireAdminSummary): PostSummary {
    return {
      id: w.id,
      slug: w.slug,
      category: w.type,
      title: w.title,
      excerpt: '',
      tags: [],
      visibility: w.visibility,
      status: w.status,
      publishedAt: w.publishedAt,
      updatedAt: w.updatedAt,
    }
  }

  function mapAdminDetail(w: WireAdminPost): Post {
    slugToId.set(w.slug, w.id)
    return {
      id: w.id,
      slug: w.slug,
      category: w.type,
      title: w.title,
      excerpt: w.summary,
      content: w.contentMd,
      tags: mapTagRefs(w.tags),
      visibility: w.visibility,
      status: w.status,
      publishedAt: w.publishedAt,
      updatedAt: w.updatedAt,
      academicMeta: w.academicMeta ?? null,
    }
  }

  function mapPaged<W, I>(w: WireList<W>, map: (item: W) => I): Paged<I> {
    return {
      items: w.items.map(map),
      total: w.meta.total,
      page: w.meta.page,
      pageSize: w.meta.pageSize,
    }
  }

  function mapProfile(w: WireProfile): Profile {
    return {
      name: w.displayName,
      handle: PROFILE_DISPLAY.handle,
      title: w.headline,
      affiliation: PROFILE_DISPLAY.affiliation,
      bio: w.bio,
      location: w.location ?? '',
      email: PROFILE_DISPLAY.email,
      sealChar: PROFILE_DISPLAY.sealChar,
      research: [...PROFILE_DISPLAY.research],
      links: w.socialLinks.map((l) => ({ label: l.label, url: l.url })),
      timeline: PROFILE_DISPLAY.timeline.map((t) => ({ ...t })),
      avatarUrl: w.avatarUrl ?? null,
    }
  }

  function mapTag(w: WireTag): Tag {
    return { slug: w.slug, name: w.name, count: w.postCount }
  }

  function mapUser(w: WireAuthUser): SessionUser {
    return { id: w.id, name: w.displayName || w.username, role: 'owner' }
  }

  // ---------- 内部模型 → 线上形状（白名单，契约外字段一律不发送） ----------

  function toCreateWire(input: PostInput): Record<string, unknown> {
    const wire: Record<string, unknown> = {
      type: input.category,
      title: input.title,
      contentMd: input.content,
      visibility: input.visibility,
      status: input.status,
      tags: input.tags,
    }
    if (input.slug) wire.slug = input.slug
    if (input.excerpt) wire.summary = input.excerpt
    // 契约：publishedAt 仅 status=published 合法（draft 携带 → 422），非发布态一律不发送
    if (input.status === 'published' && input.publishedAt) wire.publishedAt = input.publishedAt
    if (input.category === 'academic' && input.academicMeta) wire.academicMeta = input.academicMeta
    if (input.visibility !== 'private' && input.coverImageUrl) wire.coverImageUrl = input.coverImageUrl
    return wire
  }

  function toUpdateWire(input: Partial<PostInput>): Record<string, unknown> {
    const wire: Record<string, unknown> = {}
    if (input.category !== undefined) wire.type = input.category
    if (input.title !== undefined) wire.title = input.title
    if (input.excerpt !== undefined) wire.summary = input.excerpt
    if (input.content !== undefined) wire.contentMd = input.content
    if (input.slug) wire.slug = input.slug
    if (input.visibility !== undefined) wire.visibility = input.visibility
    if (input.status !== undefined) wire.status = input.status
    if (input.tags !== undefined) wire.tags = input.tags
    if (input.publishedAt !== undefined && input.status !== 'draft') {
      wire.publishedAt = input.publishedAt
    }
    if (input.category === 'academic' && input.academicMeta !== undefined) {
      wire.academicMeta = input.academicMeta
    }
    if (input.visibility !== 'private' && input.coverImageUrl !== undefined) {
      wire.coverImageUrl = input.coverImageUrl
    }
    return wire
  }

  function listQueryParams(query: PostQuery, admin: boolean): string {
    const params = new URLSearchParams()
    if (query.category) params.set('type', query.category)
    if (query.tag) params.set('tag', query.tag)
    if (query.q) params.set('q', query.q)
    if (admin) {
      if (query.status) params.set('status', query.status)
      if (query.visibility) params.set('visibility', query.visibility)
    }
    params.set('page', String(Math.max(1, query.page ?? 1)))
    params.set('pageSize', String(Math.min(50, Math.max(1, query.pageSize ?? 10))))
    return params.toString()
  }

  async function getAdminPost(id: string): Promise<Post> {
    const w = await request<WireAdminPost>(`${API}/admin/posts/${encodeURIComponent(id)}`)
    return mapAdminDetail(w)
  }

  /** 登录态下按 slug 查找管理端详情：先命中缓存，再分页扫描管理列表（个人规模上限 20 页） */
  async function findAdminBySlug(slug: string): Promise<Post | null> {
    const cached = slugToId.get(slug)
    if (cached) {
      try {
        return await getAdminPost(cached)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) slugToId.delete(slug)
        else throw e
      }
    }
    for (let page = 1; page <= ADMIN_SCAN_MAX_PAGES; page++) {
      const res = await listPosts({ scope: 'admin', page, pageSize: 50 })
      const hit = res.items.find((p) => p.slug === slug)
      if (hit) return getAdminPost(hit.id)
      if (page >= Math.max(1, Math.ceil(res.total / 50))) break
    }
    return null
  }

  async function listPosts(query: PostQuery = {}): Promise<Paged<PostSummary>> {
    const authed = accessToken !== null
    if (query.scope === 'admin' && !authed) {
      throw new ApiError(401, 'UNAUTHORIZED', '需要登录后访问管理列表')
    }
    const admin = query.scope === 'admin' || (authed && query.category === 'diary')
    const qs = listQueryParams(query, admin)
    if (admin) {
      const w = await request<WireList<WireAdminSummary>>(`${API}/admin/posts?${qs}`)
      return mapPaged(w, mapAdminSummary)
    }
    const w = await request<WireList<WirePostSummary>>(`${API}/posts?${qs}`)
    return mapPaged(w, mapPublicSummary)
  }

  async function me(): Promise<SessionUser> {
    const w = await request<WireMe>(`${API}/auth/me`)
    return mapUser(w)
  }

  return {
    getProfile: async () => mapProfile(await request<WireProfile>(`${API}/profile`)),

    listPosts,

    getPost: async (slug) => {
      try {
        const w = await request<WirePostDetail>(`${API}/posts/${encodeURIComponent(slug)}`)
        return mapPublicDetail(w)
      } catch (e) {
        // 公开端点对 private/draft 与不存在一律 404；登录态回退管理端点，访客直接抛出
        if (e instanceof ApiError && e.status === 404 && accessToken) {
          const adminPost = await findAdminBySlug(slug)
          if (adminPost) return adminPost
        }
        throw e
      }
    },

    getAdminPost,

    createPost: async (input) => {
      const w = await request<WireAdminPost>(`${API}/admin/posts`, {
        method: 'POST',
        body: toCreateWire(input),
      })
      return mapAdminDetail(w)
    },

    updatePost: async (id, input) => {
      const w = await request<WireAdminPost>(`${API}/admin/posts/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: toUpdateWire(input),
      })
      return mapAdminDetail(w)
    },

    deletePost: async (id) => {
      await request<void>(`${API}/admin/posts/${encodeURIComponent(id)}`, { method: 'DELETE' })
      for (const [slug, cachedId] of slugToId) {
        if (cachedId === id) slugToId.delete(slug)
      }
    },

    listTags: async () => {
      const w = await request<{ items: WireTag[] }>(`${API}/tags`)
      return w.items.map(mapTag)
    },

    createTag: async (input) => {
      const body: Record<string, unknown> = { name: input.name }
      if (input.slug) body.slug = input.slug
      if (input.description) body.description = input.description
      const w = await request<WireTag>(`${API}/admin/tags`, { method: 'POST', body })
      return mapTag(w)
    },

    getArchive: async (): Promise<ArchiveYear[]> => {
      const w = await request<{ items: WireArchiveYear[] }>(`${API}/archive`)
      return w.items.map((y) => ({
        year: y.year,
        count: y.count,
        posts: y.posts.map((p) => ({
          slug: p.slug,
          title: p.title,
          category: p.type,
          publishedAt: p.publishedAt,
        })),
      }))
    },

    login: async (username, password) => {
      const w = await request<WireLogin>(`${API}/auth/login`, {
        method: 'POST',
        body: { username, password },
        auth: false,
      })
      storeTokens(w.accessToken, w.expiresIn, w.refreshToken)
      return {
        accessToken: w.accessToken,
        expiresAt: Date.now() + w.expiresIn * 1000,
        refreshToken: w.refreshToken,
        refreshExpiresAt: Date.now() + w.refreshExpiresIn * 1000,
        user: mapUser(w.user),
        mustChangePassword: w.mustChangePassword ?? false,
      }
    },

    changePassword: async (currentPassword, newPassword) => {
      const w = await request<{ mustChangePassword: false }>(`${API}/auth/password`, {
        method: 'POST',
        body: { currentPassword, newPassword },
      })
      // 服务端已撤销该用户全部 refresh token：本地双令牌立即作废（v1.1 增补 §2.2）
      clearTokens()
      return { mustChangePassword: w.mustChangePassword ?? false }
    },

    logout: async () => {
      const refreshToken = getRefreshToken()
      try {
        if (refreshToken) {
          // 尽力撤销服务端 refresh（401 时 request 内部会先尝试刷新再重放）；失败不阻塞本地清理
          await request<void>(`${API}/auth/logout`, {
            method: 'POST',
            body: { refreshToken },
          }).catch(() => undefined)
        }
      } finally {
        clearTokens()
      }
    },

    me,

    restoreSession: async () => {
      if (!getRefreshToken()) return null
      const refreshed = await refreshTokens()
      if (!refreshed || !accessToken) return null
      try {
        const user = await me()
        return {
          accessToken,
          expiresAt: accessExpiresAt,
          refreshToken: getRefreshToken() ?? '',
          refreshExpiresAt: 0,
          user,
          // /auth/me 不返回 mustChangePassword（v1.1）；恢复会话的强制改密由管理端 403 门禁兜底
          mustChangePassword: false,
        }
      } catch {
        clearTokens()
        return null
      }
    },

    subscribeAuth: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}