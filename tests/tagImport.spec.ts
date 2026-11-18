import { describe, expect, it } from 'vitest'
import { ApiError } from '../src/api/types'
import { createMockClient } from '../src/api/mock/mockClient'
import { createStorage } from '../src/api/storage'
import { parseImportFile, toPostInput } from '../src/utils/mdImport'

async function loggedInClient() {
  const client = createMockClient({ storage: createStorage(), latencyMs: 0 })
  await client.login('admin', 'magic-demo')
  return client
}

describe('mockClient.createTag（契约 POST /admin/tags 语义）', () => {
  it('中文标签两步创建：先建 {name:数学, slug:math} 再引用，名称保留', async () => {
    const client = await loggedInClient()
    const tag = await client.createTag({ name: '数学', slug: 'math' })
    expect(tag).toMatchObject({ slug: 'math', name: '数学', count: 0 })
    const post = await client.createPost({
      title: '矩阵笔记',
      slug: 'matrix-notes',
      category: 'blog',
      excerpt: '',
      content: '正文 $x$',
      tags: ['math'],
      visibility: 'public',
      status: 'draft',
    })
    expect(post.tags).toEqual([{ slug: 'math', name: '数学' }])
    const tags = await client.listTags()
    expect(tags.find((t) => t.slug === 'math')?.name).toBe('数学')
  })

  it('重复 slug → 409 CONFLICT（导入流程视为已存在并复用）', async () => {
    const client = await loggedInClient()
    await client.createTag({ name: '数学', slug: 'math' })
    await expect(client.createTag({ name: '数学二', slug: 'math' })).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    })
  })

  it('中文直接作 slug → 400（必须 ASCII slug）', async () => {
    const client = await loggedInClient()
    await expect(client.createTag({ name: '数学', slug: '数学' })).rejects.toMatchObject({
      status: 400,
    })
  })

  it('未登录 → 401', async () => {
    const client = createMockClient({ storage: createStorage(), latencyMs: 0 })
    await expect(client.createTag({ name: 'x', slug: 'x' })).rejects.toMatchObject({ status: 401 })
  })
})

describe('mockClient 导入映射约束（publishedAt / contentMd / tags 上限）', () => {
  const input = (over: Record<string, unknown> = {}) => ({
    title: '导入文章',
    slug: 'import-post',
    category: 'blog' as const,
    excerpt: '',
    content: '正文',
    tags: [],
    visibility: 'public' as const,
    status: 'published' as const,
    ...over,
  })

  it('published + publishedAt：发布时间按 front-matter date 落库', async () => {
    const client = await loggedInClient()
    const post = await client.createPost(input({ publishedAt: '2026-11-13T08:00:00.000Z' }))
    expect(post.publishedAt).toBe('2026-11-13T08:00:00.000Z')
  })

  it('draft + publishedAt → 422（契约语义）', async () => {
    const client = await loggedInClient()
    await expect(
      client.createPost(input({ status: 'draft', publishedAt: '2026-11-13T08:00:00.000Z' })),
    ).rejects.toMatchObject({ status: 422 })
  })

  it('contentMd > 200000 → 400；tags > 10 → 400', async () => {
    const client = await loggedInClient()
    await expect(client.createPost(input({ content: 'x'.repeat(200_001) }))).rejects.toMatchObject({
      status: 400,
    })
    await expect(
      client.createPost(input({ tags: Array.from({ length: 11 }, (_, i) => `t${i}`) })),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('重复 slug → 409；PATCH 覆盖后内容更新且 slug 不变（skip-or-PATCH 路径）', async () => {
    const client = await loggedInClient()
    const first = await client.createPost(input())
    await expect(client.createPost(input({ content: '新正文' }))).rejects.toMatchObject({
      status: 409,
      code: 'CONFLICT',
    })
    const patched = await client.updatePost(first.id, input({ content: '新正文 $y$' }))
    expect(patched.slug).toBe('import-post')
    expect(patched.content).toBe('新正文 $y$')
    const list = await client.listPosts({ scope: 'admin', pageSize: 50 })
    expect(list.items.filter((p) => p.slug === 'import-post').length).toBe(1)
  })

  it('端到端映射：parseImportFile → toPostInput → createPost（中文标题显式 slug + 两步标签）', async () => {
    const client = await loggedInClient()
    const raw = '---\ntitle: 中文标题无拉丁字符\ntags: [数学]\ndate: 2026-11-13\n---\n正文 $x$'
    const draft = parseImportFile(raw, 'cn.md')
    expect(draft.slug).toMatch(/^blog-\d{8}-[a-z0-9]+$/)
    draft.tags[0].slug = 'math'
    await client.createTag({ name: '数学', slug: 'math' }).catch((e: unknown) => {
      if (!(e instanceof ApiError && e.status === 409)) throw e
    })
    const post = await client.createPost(toPostInput(draft))
    expect(post.slug).toBe(draft.slug)
    expect(post.status).toBe('draft')
    expect(post.publishedAt).toBeNull()
    expect(post.tags).toEqual([{ slug: 'math', name: '数学' }])
    expect(post.content).toBe('正文 $x$')
  })
})