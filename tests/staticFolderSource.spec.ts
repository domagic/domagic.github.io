import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { parseImportFile, toPostInput } from '../src/utils/mdImport'
import { createStaticClient, type StaticDataset, type StaticWirePost } from '../src/api/static/staticClient'
import type { PostInput } from '../src/api/types'

/**
 * P4-C C3：文件夹来源内容 → static 渲染保证。
 * 链路：content/<板块>/*.md →（P1-3 已验收解析语义）parseImportFile/toPostInput
 * → 导出侧 wire 映射（published && public 过滤，contentMd 零变换）
 * → createStaticClient → 公开读取断言。
 * 导出器实现属 LuoCG B1/C2；本测试以契约 v1.2 公开线形模拟其映射口径，
 * schema 发布后如有差异由 sync-static-data.mjs 归一化吸收。
 */

const NOW = new Date('2026-11-14T00:00:00.000Z')
const OPTS = { now: NOW, rand: () => 'c3test' }

const BLOG_MD = `---
title: 矩阵与运算（文件夹来源·合成）
slug: folder-source-matrix
tags: [数学]
status: published
date: 2026-11-13T08:00:00.000Z
---
正文含行内 $a^2+b^2=c^2$ 与块级矩阵：

$$
\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}
$$

中文段落保真校验。
`

const ACADEMIC_MD = `---
title: 因果推断札记（文件夹来源·合成）
tags: [因果]
status: published
date: 2026-11-12T08:00:00.000Z
---
学术正文（无显式 type，由 content/academic/ 目录推断）。
`

const PRIVATE_MD = `---
title: 私密日记（不得导出）
type: diary
status: published
---
私密正文 SECRET-BODY-C3。
`

const DRAFT_MD = `---
title: 公开草稿（不得导出）
status: draft
---
草稿正文 DRAFT-BODY-C3。
`

/** 模拟 C2 扫描：目录推断板块（front-matter 显式 type 优先），复用 P1-3 解析。
 * 每文件独立 rand，避免确定性夹具下纯中文标题 slug 人为碰撞（真实环境 rand 随机 + 后端 409 唯一性兜底）。 */
function scanFile(raw: string, fileName: string, dirCategory: 'blog' | 'academic') {
  const suffix = fileName.includes('academic') ? 'aca1' : fileName.includes('secret') ? 'sec1' : fileName.includes('draft') ? 'dra1' : 'c3test'
  const draft = parseImportFile(raw, fileName, { now: NOW, rand: () => suffix })
  // 两步标签：中文标签先建 {name,slug} 再引用（P1-3 已验收语义）
  for (const tag of draft.tags) {
    if (tag.needsCreate && !tag.slug) tag.slug = tag.name === '数学' ? 'math' : 'causal'
  }
  const overrides = draft.type === 'blog' && dirCategory === 'academic' ? { category: 'academic' as const } : {}
  return toPostInput(draft, overrides)
}

/** 模拟导出器 wire 映射：仅 published && public；contentMd 逐字零变换 */
function exportWire(input: PostInput, tagNameBySlug: Record<string, string>): StaticWirePost | null {
  if (input.status !== 'published' || input.visibility !== 'public') return null
  if (input.category === 'diary') return null // diary 不进入静态导出（seq=366）
  return {
    slug: input.slug ?? '',
    type: input.category,
    title: input.title,
    summary: input.excerpt,
    tags: input.tags.map((slug) => ({ slug, name: tagNameBySlug[slug] ?? slug })),
    coverImageUrl: null,
    publishedAt: input.publishedAt ?? NOW.toISOString(),
    readingTimeMinutes: 1,
    contentMd: input.content,
    academicMeta: input.academicMeta ?? null,
    updatedAt: NOW.toISOString(),
  }
}

function sha256(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex')
}

function buildDataset(): StaticDataset {
  const tagNames: Record<string, string> = { math: '数学', causal: '因果' }
  const inputs = [
    scanFile(BLOG_MD, 'content/blog/matrix.md', 'blog'),
    scanFile(ACADEMIC_MD, 'content/academic/causal.md', 'academic'),
    scanFile(PRIVATE_MD, 'content/diary/secret.md', 'blog'),
    scanFile(DRAFT_MD, 'content/blog/draft.md', 'blog'),
  ]
  const posts = inputs.map((i) => exportWire(i, tagNames)).filter((p): p is StaticWirePost => p !== null)
  return {
    schema: 'domagic-static-export/v1',
    generatedAt: NOW.toISOString(),
    profile: {
      displayName: 'Magic',
      headline: '合成',
      bio: '合成',
      socialLinks: [],
      updatedAt: NOW.toISOString(),
    },
    posts,
    tags: [
      { id: 't-math', slug: 'math', name: '数学', postCount: 1 },
      { id: 't-causal', slug: 'causal', name: '因果', postCount: 1 },
    ],
    archive: [
      {
        year: 2026,
        count: posts.length,
        posts: posts.map((p) => ({ slug: p.slug, title: p.title, type: p.type, publishedAt: p.publishedAt })),
      },
    ],
  }
}

describe('C3 文件夹来源 → static 渲染保证', () => {
  it('contentMd 逐字保真（sha256 一致），KaTeX 行内/块级定界符零变换', async () => {
    const draft = parseImportFile(BLOG_MD, 'content/blog/matrix.md', OPTS)
    const client = createStaticClient(buildDataset())
    const post = await client.getPost('folder-source-matrix')
    expect(sha256(post.content)).toBe(sha256(draft.contentMd))
    expect(post.content).toContain('$a^2+b^2=c^2$')
    expect(post.content).toContain('\\begin{pmatrix}')
    expect(post.content).toContain('$$')
    expect(post.content).toContain('中文段落保真校验。')
  })

  it('中文标题显式 slug 可访问；中文标签 name 保真（两步创建语义）', async () => {
    const client = createStaticClient(buildDataset())
    const post = await client.getPost('folder-source-matrix')
    expect(post.title).toBe('矩阵与运算（文件夹来源·合成）')
    expect(post.tags).toEqual([{ slug: 'math', name: '数学' }])
    const list = await client.listPosts({ tag: 'math' })
    expect(list.items.map((p) => p.slug)).toEqual(['folder-source-matrix'])
    const tags = await client.listTags()
    expect(tags.find((t) => t.slug === 'math')?.name).toBe('数学')
  })

  it('目录推断板块：content/academic/ 缺省 type 推断为 academic；front-matter 显式优先', async () => {
    const client = createStaticClient(buildDataset())
    const post = await client.getPost('folder-source-matrix')
    expect(post.category).toBe('blog') // 显式 slug 文章保持 blog
    const list = await client.listPosts({ category: 'academic' })
    expect(list.total).toBe(1)
    expect(list.items[0].title).toBe('因果推断札记（文件夹来源·合成）')
  })

  it('date→publishedAt 仅 published 携带；列表按 publishedAt 降序', async () => {
    const client = createStaticClient(buildDataset())
    const post = await client.getPost('folder-source-matrix')
    expect(post.publishedAt).toBe('2026-11-13T08:00:00.000Z')
    const list = await client.listPosts()
    expect(list.items[0].slug).toBe('folder-source-matrix')
  })

  it('私密/draft/diary 零出现：不在列表、深链 404、正文标记词零泄漏', async () => {
    const dataset = buildDataset()
    expect(dataset.posts).toHaveLength(2)
    const client = createStaticClient(dataset)
    const list = await client.listPosts({ pageSize: 50 })
    expect(list.total).toBe(2)
    const serialized = JSON.stringify(dataset)
    expect(serialized).not.toContain('SECRET-BODY-C3')
    expect(serialized).not.toContain('DRAFT-BODY-C3')
    expect(serialized).not.toContain('私密日记（不得导出）')
    expect(serialized).not.toContain('公开草稿（不得导出）')
    // 私密/draft 的 slug 由 P1-3 语义生成，深链一律 404
    const privateDraft = parseImportFile(PRIVATE_MD, 'content/diary/secret.md', { now: NOW, rand: () => 'sec1' })
    const draftDraft = parseImportFile(DRAFT_MD, 'content/blog/draft.md', { now: NOW, rand: () => 'dra1' })
    for (const slug of [privateDraft.slug, draftDraft.slug]) {
      await expect(client.getPost(slug)).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })
    }
  })
})