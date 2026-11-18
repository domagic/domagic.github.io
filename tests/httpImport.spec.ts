import { describe, expect, it, vi } from 'vitest'
import { createHttpClient } from '../src/api/http/httpClient'
import { createStorage } from '../src/api/storage'
import type { PostInput } from '../src/api/types'

const BASE = 'https://api.example.test'

interface Call {
  url: string
  method: string
  body?: Record<string, unknown>
}

function stub(responder: (call: Call) => { status: number; body?: unknown }) {
  const calls: Call[] = []
  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: Call = {
      url: String(input),
      method: init?.method ?? 'GET',
      body: init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined,
    }
    calls.push(call)
    const r = responder(call)
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), {
      status: r.status,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  return { calls, fetchImpl: fetchImpl as unknown as typeof fetch }
}

const wireLogin = {
  accessToken: 'at-1',
  tokenType: 'Bearer',
  expiresIn: 900,
  refreshToken: 'rt-1',
  refreshExpiresIn: 2_592_000,
  user: { id: 'u1', username: 'admin', displayName: 'Magic' },
  mustChangePassword: false,
}

const wireAdminDetail = {
  id: 'p1',
  slug: 'import-post',
  type: 'blog',
  title: '导入文章',
  visibility: 'public',
  status: 'published',
  publishedAt: '2026-11-13T08:00:00.000Z',
  createdAt: '2026-11-13T08:00:00.000Z',
  updatedAt: '2026-11-13T08:00:00.000Z',
  summary: '',
  contentMd: '正文',
  tags: [],
  coverImageUrl: null,
  academicMeta: null,
}

const wireTag = { id: 't1', slug: 'math', name: '数学', description: null, postCount: 0 }

function loggedIn(responder: (call: Call) => { status: number; body?: unknown }) {
  const s = stub((call) => {
    if (call.url.endsWith('/auth/login')) return { status: 200, body: wireLogin }
    return responder(call)
  })
  const client = createHttpClient(BASE, { storage: createStorage(), fetchImpl: s.fetchImpl })
  return { client, calls: s.calls, login: () => client.login('admin', 'magic-demo') }
}

const baseInput: PostInput = {
  title: '导入文章',
  slug: 'import-post',
  category: 'blog',
  excerpt: '',
  content: '正文',
  tags: ['math'],
  visibility: 'public',
  status: 'published',
}

describe('httpClient.createTag：POST /api/v1/admin/tags（冻结契约 v1.2）', () => {
  it('发送 {name, slug} 白名单体并映射响应', async () => {
    const { client, calls, login } = loggedIn((call) => {
      expect(call.url).toBe(`${BASE}/api/v1/admin/tags`)
      expect(call.method).toBe('POST')
      return { status: 201, body: wireTag }
    })
    await login()
    const tag = await client.createTag({ name: '数学', slug: 'math' })
    expect(tag).toEqual({ slug: 'math', name: '数学', count: 0 })
    const createCall = calls.find((c) => c.url.endsWith('/admin/tags'))
    expect(createCall?.body).toEqual({ name: '数学', slug: 'math' })
  })

  it('409 冲突原样抛出 ApiError（调用方复用已存在标签）', async () => {
    const { client, login } = loggedIn(() => ({
      status: 409,
      body: { error: { code: 'CONFLICT', message: 'tag slug exists' } },
    }))
    await login()
    await expect(client.createTag({ name: '数学', slug: 'math' })).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    })
  })
})

describe('httpClient publishedAt 线上映射（仅 published 发送）', () => {
  it('published + publishedAt → 请求体携带 publishedAt', async () => {
    const { client, calls, login } = loggedIn(() => ({ status: 201, body: wireAdminDetail }))
    await login()
    await client.createPost({ ...baseInput, publishedAt: '2026-11-13T08:00:00.000Z' })
    const call = calls.find((c) => c.url.endsWith('/admin/posts') && c.method === 'POST')
    expect(call?.body?.publishedAt).toBe('2026-11-13T08:00:00.000Z')
    expect(call?.body?.type).toBe('blog')
    expect(call?.body?.contentMd).toBe('正文')
    expect(call?.body?.tags).toEqual(['math'])
  })

  it('draft 即使携带 publishedAt 也不发送（防 422）', async () => {
    const { client, calls, login } = loggedIn(() => ({ status: 201, body: wireAdminDetail }))
    await login()
    await client.createPost({ ...baseInput, status: 'draft', publishedAt: '2026-11-13T08:00:00.000Z' })
    const call = calls.find((c) => c.url.endsWith('/admin/posts') && c.method === 'POST')
    expect(call?.body?.status).toBe('draft')
    expect(call?.body && 'publishedAt' in call.body).toBe(false)
  })

  it('PATCH 覆盖更新发送 contentMd 与 publishedAt（published 态）', async () => {
    const { client, calls, login } = loggedIn(() => ({ status: 200, body: wireAdminDetail }))
    await login()
    await client.updatePost('p1', { ...baseInput, publishedAt: '2026-11-13T08:00:00.000Z' })
    const call = calls.find((c) => c.method === 'PATCH')
    expect(call?.url).toBe(`${BASE}/api/v1/admin/posts/p1`)
    expect(call?.body?.contentMd).toBe('正文')
    expect(call?.body?.publishedAt).toBe('2026-11-13T08:00:00.000Z')
  })

  it('409 创建冲突原样抛出（不自动重试 POST）', async () => {
    const { client, calls, login } = loggedIn(() => ({
      status: 409,
      body: { error: { code: 'CONFLICT', message: 'slug exists' } },
    }))
    await login()
    await expect(client.createPost(baseInput)).rejects.toMatchObject({ status: 409 })
    const posts = calls.filter((c) => c.url.endsWith('/admin/posts') && c.method === 'POST')
    expect(posts.length).toBe(1)
  })
})