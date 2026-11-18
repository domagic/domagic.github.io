import { describe, expect, it, vi } from 'vitest'
import { ApiError, type PostInput } from '../src/api/types'
import { createHttpClient } from '../src/api/http/httpClient'
import { createStorage, type KeyValueStorage } from '../src/api/storage'

const BASE = 'https://api.example.test'
const REFRESH_KEY = 'domagic.refresh.v1'

interface Call {
  url: string
  method: string
  headers: Record<string, string>
  body?: Record<string, unknown>
}

interface StubResponse {
  status: number
  body?: unknown
  headers?: Record<string, string>
}

function stub(responder: (call: Call) => StubResponse) {
  const calls: Call[] = []
  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: Call = {
      url: String(input),
      method: init?.method ?? 'GET',
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined,
    }
    calls.push(call)
    const r = responder(call)
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), {
      status: r.status,
      headers: { 'Content-Type': 'application/json', ...(r.headers ?? {}) },
    })
  })
  return { calls, fetchImpl: fetchImpl as unknown as typeof fetch }
}

/** 记录写入的 storage：用于断言 accessToken 永不落盘 */
function recordingStorage(): KeyValueStorage & { writes: [string, string][] } {
  const inner = createStorage()
  const writes: [string, string][] = []
  return {
    writes,
    getItem: (k) => inner.getItem(k),
    setItem: (k, v) => {
      writes.push([k, v])
      inner.setItem(k, v)
    },
    removeItem: (k) => inner.removeItem(k),
  }
}

const wireSummary = {
  slug: 'hello-world',
  type: 'blog',
  title: '你好世界',
  summary: '一篇摘要',
  tags: [{ slug: 'methodology', name: '方法论' }],
  coverImageUrl: null,
  publishedAt: '2026-10-28T09:00:00+08:00',
  readingTimeMinutes: 8,
}
const wireDetail = {
  ...wireSummary,
  contentMd: '# 正文',
  academicMeta: null,
  updatedAt: '2026-10-30T10:00:00+08:00',
}
const wireList = { items: [wireSummary], meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 } }
const wireAdminSummary = {
  id: 'a1',
  slug: 'hello-world',
  type: 'blog',
  title: '你好世界',
  visibility: 'public',
  status: 'published',
  publishedAt: '2026-10-28T09:00:00+08:00',
  createdAt: '2026-10-27T09:00:00+08:00',
  updatedAt: '2026-10-30T10:00:00+08:00',
}
const wireAdminDetail = {
  ...wireAdminSummary,
  summary: '一篇摘要',
  contentMd: '# 正文',
  tags: [{ slug: 'methodology', name: '方法论' }],
  coverImageUrl: null,
  academicMeta: null,
}
const wireAdminList = {
  items: [wireAdminSummary],
  meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
}
const wireProfile = {
  displayName: 'lcg_magic',
  headline: '管理科学与工程 · 科研工作者',
  bio: '在管理与数据之间做一点魔法。',
  avatarUrl: null,
  location: '杭州',
  socialLinks: [{ label: 'GitHub', url: 'https://github.com/domagic' }],
  updatedAt: '2026-10-01T00:00:00Z',
}
const wireLogin = {
  accessToken: 'at-1',
  tokenType: 'Bearer',
  expiresIn: 900,
  refreshToken: 'rt-1',
  refreshExpiresIn: 2592000,
  user: { id: 'u1', username: 'admin', displayName: 'lcg_magic' },
}
const wireRefresh = {
  accessToken: 'at-2',
  tokenType: 'Bearer',
  expiresIn: 900,
  refreshToken: 'rt-2',
  refreshExpiresIn: 2592000,
}
const wireMe = { id: 'u1', username: 'admin', displayName: 'lcg_magic', lastLoginAt: null }
const errBody = (code: string, message: string, extra?: object) => ({
  error: { code, message, requestId: 'req-1', ...extra },
})

function ok(body: unknown): StubResponse {
  return { status: 200, body }
}

async function login(client: ReturnType<typeof createHttpClient>) {
  return client.login('admin', 'secret')
}

describe('httpClient 路径与查询（冻结契约 v1）', () => {
  it('全部请求带 /api/v1 前缀；公开查询剥离 status/visibility', async () => {
    const { calls, fetchImpl } = stub(() => ok(wireList))
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await client.listPosts({ category: 'blog', status: 'draft', visibility: 'private', q: '因果', tag: 'methodology' })
    expect(calls).toHaveLength(1)
    const url = new URL(calls[0].url)
    expect(url.pathname).toBe('/api/v1/posts')
    expect(url.searchParams.get('type')).toBe('blog')
    expect(url.searchParams.get('q')).toBe('因果')
    expect(url.searchParams.get('tag')).toBe('methodology')
    expect(url.searchParams.get('status')).toBeNull()
    expect(url.searchParams.get('visibility')).toBeNull()
  })

  it('profile/tags 端点与字段映射（displayName/headline/bio/postCount）', async () => {
    const { calls, fetchImpl } = stub((call) =>
      call.url.endsWith('/profile')
        ? ok(wireProfile)
        : ok({ items: [{ id: 't1', slug: 'methodology', name: '方法论', description: null, postCount: 2 }] }),
    )
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    const profile = await client.getProfile()
    expect(profile.name).toBe('lcg_magic')
    expect(profile.title).toBe('管理科学与工程 · 科研工作者')
    expect(profile.bio).toContain('魔法')
    expect(profile.links[0].url).toBe('https://github.com/domagic')
    expect(profile.sealChar).toBe('魔') // 前端静态展示配置
    const tags = await client.listTags()
    expect(tags[0]).toEqual({ slug: 'methodology', name: '方法论', count: 2 })
    expect(new URL(calls[1].url).pathname).toBe('/api/v1/tags')
  })

  it('公开列表映射 items+meta 分页与字段（type→category 等）', async () => {
    const { fetchImpl } = stub(() => ok(wireList))
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    const result = await client.listPosts()
    expect(result).toMatchObject({ total: 1, page: 1, pageSize: 10 })
    const item = result.items[0]
    expect(item.id).toBe('hello-world')
    expect(item.category).toBe('blog')
    expect(item.excerpt).toBe('一篇摘要')
    expect(item.readingMinutes).toBe(8)
    expect(item.tags).toEqual([{ slug: 'methodology', name: '方法论' }])
    expect(item.visibility).toBe('public')
    expect(item.status).toBe('published')
  })

  it('公开详情映射 contentMd 与 academicMeta', async () => {
    const { fetchImpl } = stub(() => ok({ ...wireDetail, type: 'academic', academicMeta: { authors: ['lcg_magic'], year: 2026 } }))
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    const post = await client.getPost('hello-world')
    expect(post.content).toBe('# 正文')
    expect(post.academicMeta?.authors).toEqual(['lcg_magic'])
  })

  it('登录态日记列表走 /admin/posts；访客日记走公开 /posts', async () => {
    const { calls, fetchImpl } = stub((call) => {
      if (call.url.endsWith('/auth/login')) return ok(wireLogin)
      return call.url.includes('/admin/posts') ? ok(wireAdminList) : ok(wireList)
    })
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await client.listPosts({ category: 'diary' })
    expect(new URL(calls[0].url).pathname).toBe('/api/v1/posts')
    await login(client)
    await client.listPosts({ category: 'diary' })
    expect(new URL(calls[2].url).pathname).toBe('/api/v1/admin/posts')
    await client.listPosts({ scope: 'admin', status: 'draft' })
    const adminUrl = new URL(calls[3].url)
    expect(adminUrl.pathname).toBe('/api/v1/admin/posts')
    expect(adminUrl.searchParams.get('status')).toBe('draft')
  })

  it('访客 scope=admin 直接 401，不发请求', async () => {
    const { calls, fetchImpl } = stub(() => ok(wireList))
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await expect(client.listPosts({ scope: 'admin' })).rejects.toMatchObject({ status: 401 })
    expect(calls).toHaveLength(0)
  })
})

describe('httpClient 写入白名单（契约外字段一律不发送）', () => {
  it('create：字段映射且不带 pinned；非学术丢弃 academicMeta；私密丢弃封面', async () => {
    const { calls, fetchImpl } = stub((call) => {
      if (call.url.endsWith('/auth/login')) return ok(wireLogin)
      return ok(wireAdminDetail)
    })
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await login(client)
    const input = {
      title: '标题',
      slug: 'my-post',
      category: 'blog',
      excerpt: '摘要',
      content: '# 正文',
      tags: ['methodology'],
      visibility: 'private',
      status: 'draft',
      coverImageUrl: 'https://example.com/c.jpg',
      academicMeta: { authors: ['x'] },
      pinned: true,
    } as unknown as PostInput
    await client.createPost(input)
    const body = calls[1].body!
    expect(calls[1].method).toBe('POST')
    expect(new URL(calls[1].url).pathname).toBe('/api/v1/admin/posts')
    expect(body).toEqual({
      type: 'blog',
      title: '标题',
      contentMd: '# 正文',
      visibility: 'private',
      status: 'draft',
      tags: ['methodology'],
      slug: 'my-post',
      summary: '摘要',
    })
    expect(body).not.toHaveProperty('pinned')
    expect(body).not.toHaveProperty('academicMeta')
    expect(body).not.toHaveProperty('coverImageUrl')
  })

  it('create：学术类型保留 academicMeta，公开内容保留封面', async () => {
    const { calls, fetchImpl } = stub((call) =>
      call.url.endsWith('/auth/login') ? ok(wireLogin) : ok(wireAdminDetail),
    )
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await login(client)
    await client.createPost({
      title: '论文',
      category: 'academic',
      excerpt: '',
      content: 'x',
      tags: [],
      visibility: 'public',
      status: 'published',
      coverImageUrl: 'https://example.com/c.jpg',
      academicMeta: { authors: ['lcg_magic'] },
    })
    expect(calls[1].body).toMatchObject({
      type: 'academic',
      coverImageUrl: 'https://example.com/c.jpg',
      academicMeta: { authors: ['lcg_magic'] },
    })
    expect(calls[1].body).not.toHaveProperty('summary') // 空摘要不发送，走后端缺省
  })

  it('update：PATCH 仅发送变更字段（excerpt→summary）', async () => {
    const { calls, fetchImpl } = stub((call) =>
      call.url.endsWith('/auth/login') ? ok(wireLogin) : ok(wireAdminDetail),
    )
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await login(client)
    await client.updatePost('a1', { excerpt: '新摘要' })
    expect(calls[1].method).toBe('PATCH')
    expect(new URL(calls[1].url).pathname).toBe('/api/v1/admin/posts/a1')
    expect(calls[1].body).toEqual({ summary: '新摘要' })
  })

  it('delete：DELETE /admin/posts/{id} 且 204 无体', async () => {
    const { calls, fetchImpl } = stub((call) =>
      call.url.endsWith('/auth/login') ? ok(wireLogin) : { status: 204 },
    )
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await login(client)
    await client.deletePost('a1')
    expect(calls[1].method).toBe('DELETE')
    expect(new URL(calls[1].url).pathname).toBe('/api/v1/admin/posts/a1')
  })
})

describe('httpClient 双令牌与 401 刷新（ADR-004）', () => {
  it('login：accessToken 仅存内存，refreshToken 落 localStorage', async () => {
    const storage = recordingStorage()
    const { calls, fetchImpl } = stub(() => ok(wireLogin))
    const client = createHttpClient(BASE, { fetchImpl, storage })
    const session = await login(client)
    expect(session.user).toEqual({ id: 'u1', name: 'lcg_magic', role: 'owner' })
    expect(session.refreshExpiresAt).toBeGreaterThan(session.expiresAt)
    expect(calls[0].body).toEqual({ username: 'admin', password: 'secret' })
    expect(storage.getItem(REFRESH_KEY)).toBe('rt-1')
    for (const [key, value] of storage.writes) {
      expect(value).not.toContain('at-1')
      expect(key).not.toContain('access')
    }
  })

  it('登录后的请求携带 Bearer accessToken', async () => {
    const { calls, fetchImpl } = stub((call) =>
      call.url.endsWith('/auth/login') ? ok(wireLogin) : ok(wireAdminList),
    )
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await login(client)
    await client.listPosts({ scope: 'admin' })
    expect(calls[1].headers.Authorization).toBe('Bearer at-1')
  })

  it('401 → 刷新一次 → 重放原请求；轮换后的 refreshToken 落盘', async () => {
    const storage = createStorage()
    const { calls, fetchImpl } = stub((call) => {
      if (call.url.endsWith('/auth/login')) return ok(wireLogin)
      if (call.url.endsWith('/auth/refresh')) return ok(wireRefresh)
      if (call.headers.Authorization === 'Bearer at-1') {
        return { status: 401, body: errBody('UNAUTHORIZED', '令牌过期') }
      }
      return ok(wireAdminList)
    })
    const client = createHttpClient(BASE, { fetchImpl, storage })
    await login(client)
    const result = await client.listPosts({ scope: 'admin' })
    expect(result.total).toBe(1)
    const refreshCalls = calls.filter((c) => c.url.endsWith('/auth/refresh'))
    expect(refreshCalls).toHaveLength(1)
    expect(refreshCalls[0].body).toEqual({ refreshToken: 'rt-1' })
    expect(calls[calls.length - 1].headers.Authorization).toBe('Bearer at-2')
    expect(storage.getItem(REFRESH_KEY)).toBe('rt-2')
  })

  it('并发 401 共享单次刷新（排队），全部重放成功', async () => {
    const { calls, fetchImpl } = stub((call) => {
      if (call.url.endsWith('/auth/login')) return ok(wireLogin)
      if (call.url.endsWith('/auth/refresh')) return ok(wireRefresh)
      if (call.headers.Authorization === 'Bearer at-1') {
        return { status: 401, body: errBody('UNAUTHORIZED', '令牌过期') }
      }
      return ok(wireAdminList)
    })
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await login(client)
    const results = await Promise.all([
      client.listPosts({ scope: 'admin' }),
      client.listPosts({ scope: 'admin' }),
      client.listPosts({ scope: 'admin' }),
    ])
    expect(results.every((r) => r.total === 1)).toBe(true)
    expect(calls.filter((c) => c.url.endsWith('/auth/refresh'))).toHaveLength(1)
  })

  it('刷新失败 → 清空令牌并通知订阅者，原请求抛 401', async () => {
    const storage = createStorage()
    const { fetchImpl } = stub((call) => {
      if (call.url.endsWith('/auth/login')) return ok(wireLogin)
      return { status: 401, body: errBody('UNAUTHORIZED', '会话失效') }
    })
    const client = createHttpClient(BASE, { fetchImpl, storage })
    const events: boolean[] = []
    client.subscribeAuth((authed) => events.push(authed))
    await login(client)
    await expect(client.listPosts({ scope: 'admin' })).rejects.toMatchObject({ status: 401 })
    expect(storage.getItem(REFRESH_KEY)).toBeNull()
    expect(events).toEqual([true, false])
  })

  it('登录 401 不触发刷新', async () => {
    const { calls, fetchImpl } = stub(() => ({
      status: 401,
      body: errBody('UNAUTHORIZED', '用户名或密码错误'),
    }))
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await expect(client.login('admin', 'bad')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
    expect(calls.filter((c) => c.url.endsWith('/auth/refresh'))).toHaveLength(0)
  })

  it('logout：携带 Bearer 与 refreshToken 体，最终本地清空', async () => {
    const storage = createStorage()
    const { calls, fetchImpl } = stub((call) => {
      if (call.url.endsWith('/auth/login')) return ok(wireLogin)
      return { status: 204 }
    })
    const client = createHttpClient(BASE, { fetchImpl, storage })
    await login(client)
    await client.logout()
    const logoutCall = calls.find((c) => c.url.endsWith('/auth/logout'))!
    expect(logoutCall.method).toBe('POST')
    expect(logoutCall.body).toEqual({ refreshToken: 'rt-1' })
    expect(logoutCall.headers.Authorization).toBe('Bearer at-1')
    expect(storage.getItem(REFRESH_KEY)).toBeNull()
  })

  it('restoreSession：refresh 轮换 + me；无凭据返回 null 且零请求', async () => {
    const storage = createStorage()
    storage.setItem(REFRESH_KEY, 'rt-0')
    const { calls, fetchImpl } = stub((call) => {
      if (call.url.endsWith('/auth/refresh')) {
        expect(call.body).toEqual({ refreshToken: 'rt-0' })
        return ok(wireRefresh)
      }
      return ok(wireMe)
    })
    const client = createHttpClient(BASE, { fetchImpl, storage })
    const session = await client.restoreSession()
    expect(session?.user.name).toBe('lcg_magic')
    expect(session?.accessToken).toBe('at-2')
    expect(storage.getItem(REFRESH_KEY)).toBe('rt-2')
    expect(calls.map((c) => new URL(c.url).pathname)).toEqual([
      '/api/v1/auth/refresh',
      '/api/v1/auth/me',
    ])

    const empty = stub(() => ok(wireMe))
    const guest = createHttpClient(BASE, { fetchImpl: empty.fetchImpl, storage: createStorage() })
    expect(await guest.restoreSession()).toBeNull()
    expect(empty.calls).toHaveLength(0)
  })
})

describe('httpClient 门禁回退与错误处理', () => {
  it('访客私密 slug：公开 404 直接抛出，不做管理扫描', async () => {
    const { calls, fetchImpl } = stub(() => ({
      status: 404,
      body: errBody('NOT_FOUND', '文章不存在'),
    }))
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await expect(client.getPost('diary-secret')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
    expect(calls).toHaveLength(1)
  })

  it('登录态私密 slug：公开 404 → 管理列表定位 id → 管理详情', async () => {
    const secretAdmin = {
      ...wireAdminSummary,
      id: 'a9',
      slug: 'diary-secret',
      type: 'diary',
      visibility: 'private',
      status: 'published',
    }
    const { calls, fetchImpl } = stub((call) => {
      const path = new URL(call.url).pathname
      if (path === '/api/v1/auth/login') return ok(wireLogin)
      if (path === '/api/v1/posts/diary-secret') return { status: 404, body: errBody('NOT_FOUND', '文章不存在') }
      if (path === '/api/v1/admin/posts') {
        return ok({ items: [secretAdmin], meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 } })
      }
      if (path === '/api/v1/admin/posts/a9') {
        return ok({ ...wireAdminDetail, ...secretAdmin, summary: '私密', contentMd: '# 秘密', tags: [] })
      }
      return { status: 404, body: errBody('NOT_FOUND', '文章不存在') }
    })
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await login(client)
    const post = await client.getPost('diary-secret')
    expect(post.id).toBe('a9')
    expect(post.visibility).toBe('private')
    expect(post.content).toBe('# 秘密')
    const paths = calls.map((c) => new URL(c.url).pathname)
    expect(paths).toEqual([
      '/api/v1/auth/login',
      '/api/v1/posts/diary-secret',
      '/api/v1/admin/posts',
      '/api/v1/admin/posts/a9',
    ])
  })

  it('429 读取 Retry-After 秒数', async () => {
    const { fetchImpl } = stub(() => ({
      status: 429,
      body: errBody('RATE_LIMITED', '尝试过于频繁'),
      headers: { 'Retry-After': '30' },
    }))
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    const err = await client.login('admin', 'x').catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(429)
    expect(err.code).toBe('RATE_LIMITED')
    expect(err.retryAfterSeconds).toBe(30)
  })

  it('422 details[].field 与 requestId 透传', async () => {
    const { fetchImpl } = stub((call) =>
      call.url.endsWith('/auth/login')
        ? ok(wireLogin)
        : {
            status: 422,
            body: errBody('VALIDATION_ERROR', '字段校验失败', {
              details: [{ field: 'summary', message: '摘要过长' }],
            }),
          },
    )
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await login(client)
    const err = await client
      .createPost({
        title: 'x',
        category: 'blog',
        excerpt: 'x',
        content: 'x',
        tags: [],
        visibility: 'public',
        status: 'published',
      })
      .catch((e) => e)
    expect(err.details).toEqual([{ field: 'summary', message: '摘要过长' }])
    expect(err.requestId).toBe('req-1')
  })

  it('非契约错误体（如 Prism 校验错误）按状态码回退错误码', async () => {
    const { fetchImpl } = stub(() => ({
      status: 400,
      body: { type: 'https://stoplight.io/prism/errors#UNPROCESSABLE_ENTITY', detail: 'bad request' },
    }))
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    const err = await client.getProfile().catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(400)
    expect(err.code).toBe('VALIDATION_ERROR')
  })

  it('网络异常映射为 NETWORK_ERROR', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed')
    }) as unknown as typeof fetch
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await expect(client.getProfile()).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  })
})

describe('httpClient 归档（冻结契约 v1 /archive）', () => {
  it('GET /api/v1/archive：type→category 映射，保持年份分组形状', async () => {
    const wireArchive = {
      items: [
        {
          year: 2026,
          count: 2,
          posts: [
            { slug: 'post-a', title: '文章A', type: 'blog', publishedAt: '2026-11-02T10:30:00Z' },
            { slug: 'post-b', title: '文章B', type: 'academic', publishedAt: '2026-09-15T08:00:00Z' },
          ],
        },
        { year: 2025, count: 1, posts: [{ slug: 'post-c', title: '文章C', type: 'opinion', publishedAt: '2025-12-01T00:00:00Z' }] },
      ],
    }
    const { calls, fetchImpl } = stub(() => ok(wireArchive))
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    const years = await client.getArchive()
    expect(new URL(calls[0].url).pathname).toBe('/api/v1/archive')
    expect(years).toHaveLength(2)
    expect(years[0].year).toBe(2026)
    expect(years[0].count).toBe(2)
    expect(years[0].posts[0]).toEqual({
      slug: 'post-a',
      title: '文章A',
      category: 'blog',
      publishedAt: '2026-11-02T10:30:00Z',
    })
    expect(years[1].posts[0].category).toBe('opinion')
  })
})

describe('httpClient v1.1 首登强制改密（增补 A）', () => {
  it('login 映射 mustChangePassword=true；v1 服务端缺省字段按 false', async () => {
    const forced = stub(() => ok({ ...wireLogin, mustChangePassword: true }))
    const c1 = createHttpClient(BASE, { fetchImpl: forced.fetchImpl, storage: createStorage() })
    expect((await login(c1)).mustChangePassword).toBe(true)

    const legacy = stub(() => ok(wireLogin))
    const c2 = createHttpClient(BASE, { fetchImpl: legacy.fetchImpl, storage: createStorage() })
    expect((await login(c2)).mustChangePassword).toBe(false)
  })

  it('changePassword：POST /auth/password 白名单体 + Bearer；成功后清空双令牌并通知', async () => {
    const storage = recordingStorage()
    const { calls, fetchImpl } = stub((call) =>
      call.url.endsWith('/auth/login') ? ok(wireLogin) : ok({ mustChangePassword: false }),
    )
    const client = createHttpClient(BASE, { fetchImpl, storage })
    const events: boolean[] = []
    client.subscribeAuth((authed) => events.push(authed))
    await login(client)
    const result = await client.changePassword('old-secret', 'new-secret-123')
    expect(result).toEqual({ mustChangePassword: false })
    const call = calls[1]
    expect(call.method).toBe('POST')
    expect(new URL(call.url).pathname).toBe('/api/v1/auth/password')
    expect(call.headers.Authorization).toBe('Bearer at-1')
    expect(call.body).toEqual({ currentPassword: 'old-secret', newPassword: 'new-secret-123' })
    // 服务端已撤销全部 refresh：本地 refreshToken 必须清空，accessToken 不落盘
    expect(storage.getItem(REFRESH_KEY)).toBeNull()
    expect(events).toEqual([true, false])
  })

  it('changePassword 400：details[].field 透传，令牌保留', async () => {
    const storage = createStorage()
    const { fetchImpl } = stub((call) =>
      call.url.endsWith('/auth/login')
        ? ok(wireLogin)
        : {
            status: 400,
            body: errBody('VALIDATION_ERROR', '请求参数校验失败', {
              details: [
                { field: 'newPassword', message: 'newPassword must be longer than or equal to 12 characters' },
              ],
            }),
          },
    )
    const client = createHttpClient(BASE, { fetchImpl, storage })
    await login(client)
    const err = await client.changePassword('old', 'short').catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(400)
    expect(err.details).toEqual([
      { field: 'newPassword', message: 'newPassword must be longer than or equal to 12 characters' },
    ])
    expect(storage.getItem(REFRESH_KEY)).toBe('rt-1')
  })

  it('changePassword 422：新旧密码相同', async () => {
    const { fetchImpl } = stub((call) =>
      call.url.endsWith('/auth/login')
        ? ok(wireLogin)
        : { status: 422, body: errBody('VALIDATION_ERROR', '新密码不能与当前密码相同') },
    )
    const client = createHttpClient(BASE, { fetchImpl, storage: createStorage() })
    await login(client)
    await expect(client.changePassword('same-secret-12', 'same-secret-12')).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
    })
  })

  it('changePassword 401：当前密码错误（访问令牌有效时不误清会话）', async () => {
    const storage = createStorage()
    const { calls, fetchImpl } = stub((call) => {
      if (call.url.endsWith('/auth/login')) return ok(wireLogin)
      if (call.url.endsWith('/auth/refresh')) return ok(wireRefresh)
      return { status: 401, body: errBody('UNAUTHORIZED', '当前密码不正确') }
    })
    const client = createHttpClient(BASE, { fetchImpl, storage })
    await login(client)
    await expect(client.changePassword('wrong', 'new-secret-123')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
    // 401 触发一次透明刷新重放（访问令牌过期兜底），会话本身保留
    expect(calls.filter((c) => c.url.endsWith('/auth/refresh'))).toHaveLength(1)
    expect(storage.getItem(REFRESH_KEY)).toBe('rt-2')
  })

  it('restoreSession：mustChangePassword 恒为 false（/auth/me 不携带，403 门禁兜底）', async () => {
    const storage = createStorage()
    storage.setItem(REFRESH_KEY, 'rt-0')
    const { fetchImpl } = stub((call) =>
      call.url.endsWith('/auth/refresh') ? ok(wireRefresh) : ok(wireMe),
    )
    const client = createHttpClient(BASE, { fetchImpl, storage })
    const session = await client.restoreSession()
    expect(session?.mustChangePassword).toBe(false)
  })
})