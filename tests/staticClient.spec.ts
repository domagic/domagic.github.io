import { describe, expect, it } from 'vitest'
import { ApiError } from '../src/api/types'
import { createStaticClient, type StaticDataset } from '../src/api/static/staticClient'

// P2-B2：static 适配层单测。合成数据集覆盖契约公开线形（type/summary/contentMd/readingTimeMinutes）。
function makeDataset(): StaticDataset {
  return {
    schema: 'domagic-static-export/v1',
    generatedAt: '2026-11-14T00:00:00.000Z',
    profile: {
      displayName: 'Magic',
      headline: '研究者（合成）',
      bio: '**简介**（合成）',
      avatarUrl: null,
      location: '杭州',
      socialLinks: [{ label: 'GitHub', url: 'https://github.com/domagic' }],
      updatedAt: '2026-11-14T00:00:00.000Z',
    },
    posts: [
      {
        slug: 'older-blog',
        type: 'blog',
        title: '早间博客',
        summary: '关于平台的摘要',
        tags: [{ slug: 'platform', name: '平台' }],
        publishedAt: '2026-10-01T08:00:00.000Z',
        readingTimeMinutes: 2,
        contentMd: '正文含独特词 zzqp-platform-body',
        updatedAt: '2026-10-02T08:00:00.000Z',
      },
      {
        slug: 'newer-opinion',
        type: 'opinion',
        title: '新观点：治理',
        summary: '治理摘要',
        tags: [
          { slug: 'platform', name: '平台' },
          { slug: 'governance', name: '治理' },
        ],
        publishedAt: '2026-11-01T08:00:00.000Z',
        readingTimeMinutes: 3,
        contentMd: '观点正文',
        updatedAt: '2026-11-02T08:00:00.000Z',
      },
      {
        slug: 'academic-paper',
        type: 'academic',
        title: '因果推断笔记',
        summary: '学术摘要',
        tags: [{ slug: 'causal', name: '因果' }],
        publishedAt: '2026-11-05T08:00:00.000Z',
        readingTimeMinutes: 5,
        contentMd: '学术正文 $a^2+b^2=c^2$',
        academicMeta: { authors: ['Magic'], venue: '合成期刊', year: 2026, doi: null, pdfUrl: null },
        updatedAt: '2026-11-06T08:00:00.000Z',
      },
    ],
    tags: [
      { id: 't1', slug: 'platform', name: '平台', postCount: 2 },
      { id: 't2', slug: 'governance', name: '治理', postCount: 1 },
      { id: 't3', slug: 'causal', name: '因果', postCount: 1 },
    ],
    archive: [
      {
        year: 2026,
        count: 3,
        posts: [
          { slug: 'academic-paper', title: '因果推断笔记', type: 'academic', publishedAt: '2026-11-05T08:00:00.000Z' },
          { slug: 'newer-opinion', title: '新观点：治理', type: 'opinion', publishedAt: '2026-11-01T08:00:00.000Z' },
          { slug: 'older-blog', title: '早间博客', type: 'blog', publishedAt: '2026-10-01T08:00:00.000Z' },
        ],
      },
    ],
  }
}

describe('staticClient 公开读取', () => {
  it('列表按 publishedAt 降序（数据集乱序亦兜底排序），形状映射契约', async () => {
    const ds = makeDataset()
    ds.posts.reverse()
    const client = createStaticClient(ds)
    const res = await client.listPosts()
    expect(res.items.map((p) => p.slug)).toEqual(['academic-paper', 'newer-opinion', 'older-blog'])
    expect(res.total).toBe(3)
    expect(res.page).toBe(1)
    expect(res.pageSize).toBe(10)
    const first = res.items[0]
    expect(first.category).toBe('academic')
    expect(first.excerpt).toBe('学术摘要')
    expect(first.readingMinutes).toBe(5)
    expect(first.visibility).toBe('public')
    expect(first.status).toBe('published')
  })

  it('分类/标签过滤与分页（pageSize 钳制 1..50）', async () => {
    const client = createStaticClient(makeDataset())
    const opinion = await client.listPosts({ category: 'opinion' })
    expect(opinion.items.map((p) => p.slug)).toEqual(['newer-opinion'])
    const tagged = await client.listPosts({ tag: 'platform' })
    expect(tagged.total).toBe(2)
    const page2 = await client.listPosts({ page: 2, pageSize: 2 })
    expect(page2.items.map((p) => p.slug)).toEqual(['older-blog'])
    expect(page2.page).toBe(2)
    const clamped = await client.listPosts({ pageSize: 999 })
    expect(clamped.pageSize).toBe(50)
    const zero = await client.listPosts({ pageSize: 0 })
    expect(zero.pageSize).toBe(1)
  })

  it('q 仅检索 title/summary，不检索正文（契约 ILIKE 语义）', async () => {
    const client = createStaticClient(makeDataset())
    const bodyHit = await client.listPosts({ q: 'zzqp-platform-body' })
    expect(bodyHit.total).toBe(0)
    const titleHit = await client.listPosts({ q: '治理' })
    expect(titleHit.items.map((p) => p.slug)).toEqual(['newer-opinion'])
    const summaryHit = await client.listPosts({ q: '平台' })
    expect(summaryHit.items.map((p) => p.slug)).toEqual(['older-blog'])
  })

  it('详情映射 contentMd/academicMeta；未知 slug 404（私密/草稿不在导出中）', async () => {
    const client = createStaticClient(makeDataset())
    const post = await client.getPost('academic-paper')
    expect(post.content).toContain('$a^2+b^2=c^2$')
    expect(post.academicMeta?.authors).toEqual(['Magic'])
    expect(post.updatedAt).toBe('2026-11-06T08:00:00.000Z')
    const blog = await client.getPost('older-blog')
    expect(blog.academicMeta).toBeNull()
    await expect(client.getPost('private-diary-not-exported')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
  })

  it('profile 映射 displayName/headline/bio/socialLinks + 前端静态展示配置', async () => {
    const client = createStaticClient(makeDataset())
    const profile = await client.getProfile()
    expect(profile.name).toBe('Magic')
    expect(profile.title).toBe('研究者（合成）')
    expect(profile.bio).toBe('**简介**（合成）')
    expect(profile.location).toBe('杭州')
    expect(profile.links).toEqual([{ label: 'GitHub', url: 'https://github.com/domagic' }])
    expect(profile.handle).toBe('domagic')
    expect(profile.research.length).toBeGreaterThan(0)
  })

  it('tags postCount→count；archive type→category 透传', async () => {
    const client = createStaticClient(makeDataset())
    const tags = await client.listTags()
    expect(tags.find((t) => t.slug === 'platform')?.count).toBe(2)
    const archive = await client.getArchive()
    expect(archive[0].year).toBe(2026)
    expect(archive[0].posts[0].category).toBe('academic')
  })

  it('返回对象为快照：外部变更不污染后续读取', async () => {
    const client = createStaticClient(makeDataset())
    const post = await client.getPost('older-blog')
    post.title = '被篡改'
    post.tags.push({ slug: 'evil', name: 'evil' })
    const again = await client.getPost('older-blog')
    expect(again.title).toBe('早间博客')
    expect(again.tags).toHaveLength(1)
  })
})

describe('staticClient 只读与零认证面', () => {
  it('登录/改密/管理读写一律 403，me 401', async () => {
    const client = createStaticClient(makeDataset())
    const writes = [
      client.login('admin', 'whatever'),
      client.changePassword('a', 'b'),
      client.getAdminPost('x'),
      client.createPost({} as never),
      client.updatePost('x', {}),
      client.deletePost('x'),
      client.createTag({ name: 'x' }),
    ]
    for (const p of writes) {
      await expect(p).rejects.toBeInstanceOf(ApiError)
      await expect(p).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })
    }
    await expect(client.me()).rejects.toMatchObject({ status: 401 })
  })

  it('restoreSession 恒 null；logout 幂等；subscribeAuth 返回可调用退订', async () => {
    const client = createStaticClient(makeDataset())
    expect(await client.restoreSession()).toBeNull()
    await expect(client.logout()).resolves.toBeUndefined()
    const unsubscribe = client.subscribeAuth(() => undefined)
    expect(typeof unsubscribe).toBe('function')
    unsubscribe()
  })
})