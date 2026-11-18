import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { ApiError } from '../src/api/types'
import { createMockClient } from '../src/api/mock/mockClient'
import { createStorage } from '../src/api/storage'

const REFRESH_KEY = 'domagic.mock.refresh.v1'

function freshClient() {
  return createMockClient({ storage: createStorage(), latencyMs: 0 })
}

async function loggedInClient() {
  const client = freshClient()
  await client.login('admin', 'magic-demo')
  return client
}

describe('mockClient 双令牌认证（契约 v1 语义）', () => {
  it('登录返回双令牌会话，refresh 有效期长于 access', async () => {
    const client = freshClient()
    const session = await client.login('admin', 'magic-demo')
    expect(session.accessToken).toBeTruthy()
    expect(session.refreshToken).toBeTruthy()
    expect(session.refreshToken).not.toBe(session.accessToken)
    expect(session.user.role).toBe('owner')
    expect(session.expiresAt).toBeGreaterThan(Date.now())
    expect(session.refreshExpiresAt).toBeGreaterThan(session.expiresAt)
  })

  it('错误凭据返回 401 UNAUTHORIZED', async () => {
    const client = freshClient()
    await expect(client.login('admin', 'wrong')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
  })

  it('未登录调用 me 返回 401', async () => {
    const client = freshClient()
    await expect(client.me()).rejects.toBeInstanceOf(ApiError)
  })

  it('登出后会话失效且无法恢复', async () => {
    const client = await loggedInClient()
    await client.logout()
    await expect(client.me()).rejects.toMatchObject({ status: 401 })
    expect(await client.restoreSession()).toBeNull()
  })

  it('页面刷新后可用 refreshToken 恢复会话并轮换', async () => {
    const storage = createStorage()
    const a = createMockClient({ storage, latencyMs: 0 })
    const session = await a.login('admin', 'magic-demo')
    const b = createMockClient({ storage, latencyMs: 0 })
    const restored = await b.restoreSession()
    expect(restored?.user.role).toBe('owner')
    expect(restored?.refreshToken).not.toBe(session.refreshToken)
    expect(storage.getItem(REFRESH_KEY)).toBe(restored?.refreshToken)
    expect((await b.me()).role).toBe('owner')
  })

  it('旧 refreshToken 复用 → 整个令牌家族吊销', async () => {
    const storage = createStorage()
    const a = createMockClient({ storage, latencyMs: 0 })
    await a.login('admin', 'magic-demo')
    const oldRefresh = storage.getItem(REFRESH_KEY)!
    const b = createMockClient({ storage, latencyMs: 0 })
    await b.restoreSession() // 正常轮换，oldRefresh 标记已用
    storage.setItem(REFRESH_KEY, oldRefresh) // 模拟攻击者重放旧令牌
    const c = createMockClient({ storage, latencyMs: 0 })
    expect(await c.restoreSession()).toBeNull()
    await expect(b.me()).rejects.toMatchObject({ status: 401 }) // 家族内 access 一并吊销
  })

  it('刷新失败通过 subscribeAuth 通知视图层', async () => {
    const storage = createStorage()
    const client = createMockClient({ storage, latencyMs: 0 })
    const events: boolean[] = []
    client.subscribeAuth((authed) => events.push(authed))
    await client.login('admin', 'magic-demo')
    storage.setItem(REFRESH_KEY, 'forged-token')
    const fresh = createMockClient({ storage, latencyMs: 0 })
    const freshEvents: boolean[] = []
    fresh.subscribeAuth((authed) => freshEvents.push(authed))
    expect(await fresh.restoreSession()).toBeNull()
    expect(freshEvents).toContain(false)
  })
})

describe('mockClient 私密内容门禁（公开端点 404 语义）', () => {
  it('访客日记列表返回空的公开结果，不泄露条目', async () => {
    const client = freshClient()
    const result = await client.listPosts({ category: 'diary' })
    expect(result.total).toBe(0)
    expect(result.items).toHaveLength(0)
  })

  it('访客公开列表不含私密与草稿，id 即 slug', async () => {
    const client = freshClient()
    const result = await client.listPosts({ pageSize: 50 })
    expect(result.items.length).toBeGreaterThan(0)
    for (const post of result.items) {
      expect(post.visibility).toBe('public')
      expect(post.status).toBe('published')
      expect(post.id).toBe(post.slug)
    }
  })

  it('访客读取私密详情与不存在文章返回同样的 404', async () => {
    const client = freshClient()
    const privateErr = await client.getPost('diary-2026-11-01').catch((e) => e)
    const missingErr = await client.getPost('no-such-post').catch((e) => e)
    expect(privateErr).toMatchObject({ status: 404, code: 'NOT_FOUND' })
    expect(missingErr).toMatchObject({ status: 404, code: 'NOT_FOUND' })
    expect(privateErr.message).toBe(missingErr.message)
  })

  it('登录后可见日记（含草稿），草稿 publishedAt 为 null', async () => {
    const client = await loggedInClient()
    const result = await client.listPosts({ category: 'diary', pageSize: 50 })
    expect(result.total).toBeGreaterThanOrEqual(3)
    const draft = result.items.find((p) => p.status === 'draft')
    expect(draft).toBeTruthy()
    expect(draft?.publishedAt).toBeNull()
  })

  it('登录后可读取私密详情', async () => {
    const client = await loggedInClient()
    const post = await client.getPost('diary-2026-11-01')
    expect(post.visibility).toBe('private')
  })

  it('访客 scope=admin 一律 401', async () => {
    const client = freshClient()
    await expect(client.listPosts({ scope: 'admin' })).rejects.toMatchObject({ status: 401 })
  })
})

describe('mockClient 内容 CRUD', () => {
  it('创建文章：标签 slug 解析为 TagRef，可读取', async () => {
    const client = await loggedInClient()
    const post = await client.createPost({
      title: '测试文章',
      category: 'blog',
      excerpt: '摘要',
      content: '# 你好\n\n正文内容',
      tags: ['methodology'],
      visibility: 'public',
      status: 'published',
    })
    expect(post.slug).toBeTruthy()
    expect(post.readingMinutes).toBeGreaterThanOrEqual(1)
    expect(post.tags).toEqual([{ slug: 'methodology', name: '方法论' }])
    const fetched = await client.getPost(post.slug)
    expect(fetched.title).toBe('测试文章')
  })

  it('日记缺省私密草稿，摘要缺省取正文前 200 字', async () => {
    const client = await loggedInClient()
    const post = await client.createPost({
      title: '默认值日记',
      category: 'diary',
      content: '很长的一段日记正文'.repeat(30),
      tags: [],
    } as unknown as Parameters<typeof client.createPost>[0])
    expect(post.visibility).toBe('private')
    expect(post.status).toBe('draft')
    expect(post.publishedAt).toBeNull()
    expect(post.excerpt.length).toBeLessThanOrEqual(200)
  })

  it('slug 冲突返回 409 CONFLICT', async () => {
    const client = await loggedInClient()
    await expect(
      client.createPost({
        title: '冲突',
        slug: 'causal-inference-notes',
        category: 'blog',
        excerpt: '',
        content: 'x',
        tags: [],
        visibility: 'public',
        status: 'published',
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
  })

  it('私密内容带封面图返回 422 且 details 定位字段', async () => {
    const client = await loggedInClient()
    const err = await client
      .createPost({
        title: '私密封面',
        category: 'diary',
        excerpt: '',
        content: 'x',
        tags: [],
        visibility: 'private',
        status: 'draft',
        coverImageUrl: 'https://example.com/cover.jpg',
      })
      .catch((e) => e)
    expect(err).toMatchObject({ status: 422, code: 'VALIDATION_ERROR' })
    expect(err.details?.[0]?.field).toBe('coverImageUrl')
  })

  it('非学术类型携带 academicMeta 返回 422', async () => {
    const client = await loggedInClient()
    const err = await client
      .createPost({
        title: '错误元数据',
        category: 'blog',
        excerpt: '',
        content: 'x',
        tags: [],
        visibility: 'public',
        status: 'published',
        academicMeta: { authors: ['x'] },
      })
      .catch((e) => e)
    expect(err).toMatchObject({ status: 422 })
    expect(err.details?.[0]?.field).toBe('academicMeta')
  })

  it('学术类型可携带 academicMeta', async () => {
    const client = await loggedInClient()
    const post = await client.createPost({
      title: '学术测试',
      category: 'academic',
      excerpt: '',
      content: 'x',
      tags: [],
      visibility: 'public',
      status: 'published',
      academicMeta: { authors: ['lcg_magic'], year: 2026 },
    })
    expect(post.academicMeta?.authors).toEqual(['lcg_magic'])
  })

  it('更新字段生效；转草稿清空 publishedAt，再发布补时间', async () => {
    const client = await loggedInClient()
    const updated = await client.updatePost('p01', { title: '新标题', status: 'draft' })
    expect(updated.title).toBe('新标题')
    expect(updated.publishedAt).toBeNull()
    const republished = await client.updatePost('p01', { status: 'published' })
    expect(republished.publishedAt).toBeTruthy()
  })

  it('getAdminPost 按 id 返回完整内容，访客 401', async () => {
    const client = await loggedInClient()
    const post = await client.getAdminPost('p08')
    expect(post.content).toContain('雨后的操场')
    await expect(freshClient().getAdminPost('p08')).rejects.toMatchObject({ status: 401 })
  })

  it('删除文章后详情 404', async () => {
    const client = await loggedInClient()
    await client.deletePost('p03')
    await expect(client.getPost('writing-workflow-2026')).rejects.toMatchObject({ status: 404 })
  })

  it('接受 Vue 响应式对象作为输入（模拟网络序列化边界）', async () => {
    const client = await loggedInClient()
    const input = reactive({
      title: '响应式输入',
      category: 'blog' as const,
      excerpt: '',
      content: '正文',
      tags: ['essay'],
      visibility: 'public' as const,
      status: 'published' as const,
    })
    const post = await client.createPost(input)
    expect(post.title).toBe('响应式输入')
    const updated = await client.updatePost(post.id, reactive({ title: '响应式修改' }))
    expect(updated.title).toBe('响应式修改')
  })

  it('未登录写操作一律 401', async () => {
    const guest = freshClient()
    const input = {
      title: 'x',
      category: 'blog' as const,
      excerpt: '',
      content: 'x',
      tags: [],
      visibility: 'public' as const,
      status: 'published' as const,
    }
    await expect(guest.createPost(input)).rejects.toMatchObject({ status: 401 })
    await expect(guest.updatePost('p01', { title: 'hack' })).rejects.toMatchObject({ status: 401 })
    await expect(guest.deletePost('p01')).rejects.toMatchObject({ status: 401 })
  })
})

describe('mockClient 列表查询（契约排序与过滤）', () => {
  it('分类筛选与分页', async () => {
    const client = freshClient()
    const page1 = await client.listPosts({ category: 'blog', page: 1, pageSize: 2 })
    expect(page1.items).toHaveLength(2)
    expect(page1.total).toBe(4)
    const page2 = await client.listPosts({ category: 'blog', page: 2, pageSize: 2 })
    expect(page2.items).toHaveLength(2)
    expect(page1.items[0].id).not.toBe(page2.items[0].id)
  })

  it('q 仅命中标题与摘要，不搜正文', async () => {
    const client = freshClient()
    const hit = await client.listPosts({ q: '因果' })
    expect(hit.total).toBe(2) // p01 与 p12 的标题
    const bodyOnly = await client.listPosts({ q: 'SUTVA' }) // 仅出现在 p04 正文
    expect(bodyOnly.total).toBe(0)
  })

  it('标签按 slug 筛选', async () => {
    const client = freshClient()
    const result = await client.listPosts({ tag: 'methodology' })
    expect(result.total).toBe(2)
    expect(result.items.every((p) => p.tags.some((t) => t.slug === 'methodology'))).toBe(true)
  })

  it('公开列表按 publishedAt 降序（无置顶概念）', async () => {
    const client = freshClient()
    const result = await client.listPosts({ pageSize: 50 })
    const dates = result.items.map((p) => p.publishedAt ?? '')
    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates)
    expect(result.items[0].slug).toBe('causal-inference-notes')
  })

  it('管理列表按 updatedAt 降序且含私密草稿', async () => {
    const client = await loggedInClient()
    const result = await client.listPosts({ scope: 'admin', pageSize: 50 })
    expect(result.total).toBe(12)
    const dates = result.items.map((p) => p.updatedAt ?? '')
    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates)
    expect(result.items[0].slug).toBe('diary-2026-11-01')
  })

  it('标签计数恒为公开已发布口径，与登录态无关', async () => {
    const guest = freshClient()
    const owner = await loggedInClient()
    const guestTags = await guest.listTags()
    const ownerTags = await owner.listTags()
    expect(guestTags.find((t) => t.slug === 'life')?.count).toBe(0)
    expect(guestTags.find((t) => t.slug === 'methodology')?.count).toBe(2)
    expect(ownerTags).toEqual(guestTags)
  })
})

describe('mockClient 归档（契约 /archive 语义）', () => {
  it('仅公开已发布；年份降序、年内 publishedAt 降序；count 与条目一致', async () => {
    const client = freshClient()
    const years = await client.getArchive()
    expect(years.length).toBeGreaterThan(0)
    const yearNums = years.map((y) => y.year)
    expect([...yearNums].sort((a, b) => b - a)).toEqual(yearNums)
    const publicList = await client.listPosts({ pageSize: 50 })
    const publicSlugs = new Set(publicList.items.map((p) => p.slug))
    const archiveTotal = years.reduce((sum, y) => sum + y.count, 0)
    expect(archiveTotal).toBe(publicList.total)
    for (const group of years) {
      expect(group.count).toBe(group.posts.length)
      const dates = group.posts.map((p) => p.publishedAt)
      expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates)
      for (const post of group.posts) {
        expect(publicSlugs.has(post.slug)).toBe(true) // 私密/草稿不入归档
        expect(new Date(post.publishedAt).getFullYear()).toBe(group.year)
      }
    }
  })
})

describe('mockClient v1.1 改密（增补 A 形状对齐）', () => {
  it('登录会话携带 mustChangePassword=false（演示账号无强制改密）', async () => {
    const client = freshClient()
    const session = await client.login('admin', 'magic-demo')
    expect(session.mustChangePassword).toBe(false)
  })

  it('改密成功 → 全部会话撤销、本地令牌清空、需重新登录', async () => {
    const storage = createStorage()
    const a = createMockClient({ storage, latencyMs: 0 })
    await a.login('admin', 'magic-demo')
    const b = createMockClient({ storage, latencyMs: 0 })
    await b.restoreSession() // 第二个设备会话
    const events: boolean[] = []
    a.subscribeAuth((authed) => events.push(authed))
    const result = await a.changePassword('magic-demo', 'brand-new-secret-12')
    expect(result).toEqual({ mustChangePassword: false })
    expect(storage.getItem(REFRESH_KEY)).toBeNull()
    expect(events).toEqual([false])
    await expect(a.me()).rejects.toMatchObject({ status: 401 })
    await expect(b.me()).rejects.toMatchObject({ status: 401 })
    expect(await b.restoreSession()).toBeNull()
  })

  it('当前密码错误 → 401；新密码过短 → 400+details（校验顺序与后端 DTO 一致）', async () => {
    const client = await loggedInClient()
    await expect(client.changePassword('wrong', 'brand-new-secret-12')).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })
    const short = await client.changePassword('magic-demo', 'short').catch((e) => e)
    expect(short.status).toBe(400)
    expect(short.details[0].field).toBe('newPassword')
    // 演示口令仅 10 位：新旧相同分支先被长度校验拦截（400），422 分支由真实后端 e2e 覆盖
    await expect(client.changePassword('magic-demo', 'magic-demo')).rejects.toMatchObject({
      status: 400,
    })
  })

  it('未登录改密 → 401', async () => {
    const client = freshClient()
    await expect(client.changePassword('x', 'brand-new-secret-12')).rejects.toMatchObject({
      status: 401,
    })
  })
})