import { describe, expect, it } from 'vitest'
import {
  parseFrontMatter,
  parseImportFile,
  generateSlug,
  slugifyLatin,
  toPostInput,
  validateDraft,
  CONTENT_MD_MAX,
  SLUG_PATTERN,
} from '../src/utils/mdImport'

const FIXED_DATE = new Date('2026-11-13T08:00:00.000Z')
const FIXED_RAND = () => 'ab12'
const opts = { now: FIXED_DATE, rand: FIXED_RAND }

const BODY = [
  '# 矩阵与运算',
  '',
  String.raw`行内公式 $A \in \mathbb{R}^{m \times n}$ 与 $\lambda$ 混排。`,
  '',
  '$$',
  String.raw`\begin{aligned} A &= \text{值 $y$ 域} \\ B &= A^{\mathsf T} A \end{aligned}`,
  '$$',
  '',
].join('\n')

const FM = [
  '---',
  'title: 矩阵与运算（P1-3 合成）',
  'slug: p13-matrix-import',
  'type: blog',
  'tags: [math, linear-algebra]',
  'date: 2026-11-13T08:00:00.000Z',
  'visibility: public',
  'status: published',
  '---',
  '',
].join('\n')

describe('parseFrontMatter（对齐参考 verify-md-import.cjs）', () => {
  it('解析扁平 key:value 与内联列表；正文零变换保留（含 TeX 反斜杠）', () => {
    const { meta, contentMd } = parseFrontMatter(FM + BODY)
    expect(meta.title).toBe('矩阵与运算（P1-3 合成）')
    expect(meta.tags).toEqual(['math', 'linear-algebra'])
    expect(contentMd).toBe(BODY)
    expect(contentMd).toContain(String.raw`\text{值 $y$ 域}`)
  })

  it('无 front-matter 时全文作为正文', () => {
    const { meta, contentMd } = parseFrontMatter(BODY)
    expect(meta).toEqual({})
    expect(contentMd).toBe(BODY)
  })

  it('支持 CRLF 行尾与引号剥离', () => {
    const raw = '---\r\ntitle: " quoted title "\r\ntags: ["a", \'b\']\r\n---\r\nbody'
    const { meta, contentMd } = parseFrontMatter(raw)
    expect(meta.title).toBe(' quoted title ')
    expect(meta.tags).toEqual(['a', 'b'])
    expect(contentMd).toBe('body')
  })
})

describe('generateSlug：中文标题显式生成（参考 V27/V33 约束）', () => {
  it('纯中文标题 → {type}-YYYYMMDD-xxxx', () => {
    const slug = generateSlug('中文标题无拉丁字符', 'blog', FIXED_DATE, FIXED_RAND)
    expect(slug).toBe('blog-20261113-ab12')
    expect(SLUG_PATTERN.test(slug)).toBe(true)
  })

  it('中英混合标题不退化为拉丁片段（避免 V33 的 degenerate slug）', () => {
    const slug = generateSlug('中文标题无 Slug', 'blog', FIXED_DATE, FIXED_RAND)
    expect(slug).not.toBe('slug')
    expect(slug).toBe('slug-20261113-ab12')
  })

  it('纯 ASCII 标题直接 slug 化', () => {
    expect(generateSlug('Hello World: A Study', 'blog', FIXED_DATE, FIXED_RAND)).toBe('hello-world-a-study')
  })

  it('空拉丁结果回退 type 前缀', () => {
    expect(generateSlug('!!!', 'opinion', FIXED_DATE, FIXED_RAND)).toBe('opinion-20261113-ab12')
    expect(slugifyLatin('  --ABC--  ')).toBe('abc')
  })
})

describe('parseImportFile：契约默认值与映射约束', () => {
  it('完整 front-matter：显式 slug/标签/发布时间原样映射', () => {
    const draft = parseImportFile(FM + BODY, 'matrix.md', opts)
    expect(draft.slug).toBe('p13-matrix-import')
    expect(draft.type).toBe('blog')
    expect(draft.status).toBe('published')
    expect(draft.visibility).toBe('public')
    expect(draft.publishedAt).toBe('2026-11-13T08:00:00.000Z')
    expect(draft.tags).toEqual([
      { name: 'math', slug: 'math', needsCreate: false },
      { name: 'linear-algebra', slug: 'linear-algebra', needsCreate: false },
    ])
    expect(draft.contentMd).toBe(BODY)
    expect(validateDraft(draft)).toEqual({})
  })

  it('缺省默认：type=blog / status=draft / visibility=public；draft 不携带 publishedAt', () => {
    const draft = parseImportFile('---\ntitle: 无状态文章\ndate: 2026-11-13\n---\n正文', 'a.md', opts)
    expect(draft.type).toBe('blog')
    expect(draft.status).toBe('draft')
    expect(draft.visibility).toBe('public')
    expect(draft.publishedAt).toBeNull()
    expect(draft.warnings.some((w) => w.includes('publishedAt'))).toBe(true)
  })

  it('diary 缺省可见性为 private', () => {
    const draft = parseImportFile('---\ntitle: 日记\ntype: diary\n---\n正文', 'd.md', opts)
    expect(draft.visibility).toBe('private')
  })

  it('中文标题无显式 slug → 前端显式生成合法 slug', () => {
    const draft = parseImportFile('---\ntitle: 中文标题无拉丁字符\n---\n正文', 'cn.md', opts)
    expect(draft.slug).toBe('blog-20261113-ab12')
    expect(validateDraft(draft).slug).toBeUndefined()
  })

  it('中文标签标记 needsCreate 且要求补全 slug（两步创建）', () => {
    const draft = parseImportFile('---\ntitle: t\ntags: [数学, math]\n---\nbody', 't.md', opts)
    expect(draft.tags[0]).toEqual({ name: '数学', slug: '', needsCreate: true })
    expect(draft.tags[1].needsCreate).toBe(false)
    expect(validateDraft(draft).tags).toBeTruthy()
    draft.tags[0].slug = 'math-cn'
    expect(validateDraft(draft).tags).toBeUndefined()
  })

  it('非法 type/status/visibility 回退默认并给出警告', () => {
    const draft = parseImportFile(
      '---\ntitle: t\ntype: weird\nstatus: unknown\nvisibility: secret\n---\nbody',
      'x.md',
      opts,
    )
    expect(draft.type).toBe('blog')
    expect(draft.status).toBe('draft')
    expect(draft.visibility).toBe('public')
    expect(draft.warnings.length).toBeGreaterThanOrEqual(3)
  })

  it('缺少 title 回退文件名；无法解析的 date 忽略并警告', () => {
    const draft = parseImportFile('---\ndate: not-a-date\nstatus: published\n---\nbody', 'fallback-name.md', opts)
    expect(draft.title).toBe('fallback-name')
    expect(draft.publishedAt).toBeNull()
    expect(draft.warnings.some((w) => w.includes('无法解析'))).toBe(true)
  })
})

describe('validateDraft：契约上限', () => {
  const base = () => parseImportFile(FM + BODY, 'm.md', opts)

  it('contentMd 超过 200000 字符阻断', () => {
    const draft = base()
    draft.contentMd = 'x'.repeat(CONTENT_MD_MAX + 1)
    expect(validateDraft(draft).contentMd).toContain(String(CONTENT_MD_MAX))
    draft.contentMd = 'x'.repeat(CONTENT_MD_MAX)
    expect(validateDraft(draft).contentMd).toBeUndefined()
  })

  it('标题 >200、摘要 >500、标签 >10、非法 slug 阻断', () => {
    const draft = base()
    draft.title = 't'.repeat(201)
    draft.summary = 's'.repeat(501)
    draft.slug = 'Invalid Slug'
    draft.tags = Array.from({ length: 11 }, (_, i) => ({ name: `t${i}`, slug: `t${i}`, needsCreate: false }))
    const errors = validateDraft(draft)
    expect(errors.title).toBeTruthy()
    expect(errors.summary).toBeTruthy()
    expect(errors.slug).toBeTruthy()
    expect(errors.tags).toBeTruthy()
  })

  it('空正文阻断', () => {
    const draft = base()
    draft.contentMd = '   '
    expect(validateDraft(draft).contentMd).toBeTruthy()
  })
})

describe('toPostInput：overrides last + publishedAt 门禁', () => {
  const draft = () => parseImportFile(FM + BODY, 'm.md', opts)

  it('默认映射为 PostInput（slug/category/tags slug 数组）', () => {
    const input = toPostInput(draft())
    expect(input).toMatchObject({
      title: '矩阵与运算（P1-3 合成）',
      slug: 'p13-matrix-import',
      category: 'blog',
      content: BODY,
      tags: ['math', 'linear-algebra'],
      visibility: 'public',
      status: 'published',
      publishedAt: '2026-11-13T08:00:00.000Z',
    })
  })

  it('overrides 覆盖 front-matter（最后生效）', () => {
    const input = toPostInput(draft(), { slug: 'override-slug', visibility: 'private' })
    expect(input.slug).toBe('override-slug')
    expect(input.visibility).toBe('private')
  })

  it('override 改为 draft 后 publishedAt 被门禁清除（防 422）', () => {
    const input = toPostInput(draft(), { status: 'draft' })
    expect(input.status).toBe('draft')
    expect(input.publishedAt).toBeNull()
  })

  it('draft 草稿即使 front-matter 带 date 也不携带 publishedAt', () => {
    const d = parseImportFile('---\ntitle: t\ndate: 2026-11-13\n---\nbody', 'a.md', opts)
    expect(toPostInput(d).publishedAt).toBeNull()
  })
})