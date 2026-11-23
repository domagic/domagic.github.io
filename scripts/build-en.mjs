#!/usr/bin/env node
/**
 * 英文数据集构建：以中文 dataset（已过 G0-G4 门）为骨架，按 slug 用 content-en/ 的英文
 * Markdown 覆盖 title / summary / contentMd / tags.name / profile / archive 文案。
 * slug、type、date、visibility、status、academicMeta 全部沿用中文骨架，保证深链、筛选、
 * 归档年份与中英完全一致。任一英文缺稿或残留中文即整次失败（fail-closed）。
 *
 * 用法：node scripts/build-en.mjs <zh-dataset.json> <content-en-dir> <out-en-dataset.json>
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'

const [, , srcArg, dirArg, outArg] = process.argv
if (!srcArg || !dirArg || !outArg) {
  console.error('BUILD_EN_FAIL: 用法 node scripts/build-en.mjs <zh-dataset.json> <content-en-dir> <out-en-dataset.json>')
  process.exit(1)
}
const ZH = resolve(srcArg)
const EN_DIR = resolve(dirArg)
const OUT = resolve(outArg)
const errors = []
const fail = (m) => errors.push(m)

function splitFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!m) return { meta: {}, contentMd: raw }
  const meta = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/)
    if (!kv) continue
    let v = kv[2].trim()
    if (v.startsWith('[') && v.endsWith(']')) {
      meta[kv[1]] = v.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    } else {
      meta[kv[1]] = v.replace(/^["']|["']$/g, '')
    }
  }
  return { meta, contentMd: raw.slice(m[0].length) }
}

function hasChinese(s) {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(s)
}

/** 去掉数学定界符内的内容再做中文检查（公式里的 \text{} 允许保留专有名词） */
function stripMath(s) {
  return s.replace(/\$\$[\s\S]*?\$\$/g, ' ').replace(/\$[^$\n]*\$/g, ' ')
}

const zh = JSON.parse(readFileSync(ZH, 'utf8'))
if (zh.schema !== 'domagic-static-export/v1') fail(`schema 不匹配: ${zh.schema}`)

// 扫描英文语料（扁平目录，按文件名遍历）
const en = new Map()
function walk(cur) {
  for (const ent of readdirSync(cur, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (ent.name === 'assets') continue
      walk(join(cur, ent.name))
      continue
    }
    if (!ent.name.toLowerCase().endsWith('.md') || ent.name.startsWith('_')) continue
    const raw = readFileSync(join(cur, ent.name), 'utf8')
    const { meta, contentMd } = splitFrontMatter(raw)
    const slug = meta.slug
    if (!slug) { fail(`英文稿缺少 slug: ${ent.name}`); continue }
    if (en.has(slug)) fail(`英文稿 slug 重复: ${slug}`)
    if (hasChinese(stripMath(meta.title ?? ''))) fail(`英文 title 残留中文: ${ent.name}`)
    if (hasChinese(stripMath(meta.summary ?? ''))) fail(`英文 summary 残留中文: ${ent.name}`)
    if (hasChinese(stripMath(contentMd))) fail(`英文正文残留中文: ${ent.name}`)
    en.set(slug, { meta, contentMd, file: ent.name })
  }
}
walk(EN_DIR)

const enPosts = zh.posts.map((p) => {
  const e = en.get(p.slug)
  if (!e) { fail(`英文缺稿: ${p.slug}`); return p }
  const tagNames = {}
  for (const token of Array.isArray(e.meta.tags) ? e.meta.tags : []) {
    const [slug, ...rest] = String(token).split('|')
    if (slug) tagNames[slug] = rest.join('|').trim()
  }
  const tags = p.tags.map((t) => {
    const name = tagNames[t.slug]
    if (!name) fail(`英文稿 ${p.slug} 缺少标签 ${t.slug} 的英文名`)
    if (hasChinese(name)) fail(`英文稿 ${p.slug} 标签 ${t.slug} 残留中文`)
    return { ...t, name: name ?? t.name }
  })
  return {
    ...p,
    title: e.meta.title ?? p.title,
    summary: e.meta.summary ?? p.summary,
    tags,
    contentMd: e.contentMd,
    academicMeta: p.academicMeta && e.meta.venue
      ? { ...p.academicMeta, venue: e.meta.venue }
      : p.academicMeta,
  }
})

for (const slug of en.keys()) if (!zh.posts.some((p) => p.slug === slug)) fail(`英文稿 slug 在中文数据集中不存在: ${slug}`)

if (errors.length) {
  console.error(`BUILD_EN_FAIL errors=${errors.length}`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

/** 契约 v1.2 限制 summary ≤500 字符；英文译文比中文长，按词边界安全截断。 */
function clipSummary(s) {
  if (typeof s !== 'string' || s.length <= 500) return s
  const head = s.slice(0, 497)
  const cut = head.lastIndexOf(' ')
  return (cut > 350 ? head.slice(0, cut) : head) + '…'
}
for (const p of enPosts) p.summary = clipSummary(p.summary)

const bySlug = new Map(enPosts.map((p) => [p.slug, p]))
const enTags = zh.tags.map((t) => {
  // 取任意文章里该 slug 的英文标签名
  const hit = enPosts.find((p) => p.tags.some((x) => x.slug === t.slug))
  const name = hit?.tags.find((x) => x.slug === t.slug)?.name
  return { ...t, name: name ?? t.name }
})
const enArchive = zh.archive.map((y) => ({
  ...y,
  posts: y.posts.map((p) => ({ ...p, title: bySlug.get(p.slug)?.title ?? p.title })),
}))
const out = {
  ...zh,
  profile: {
    ...zh.profile,
    headline: 'Researcher',
    bio: 'In data, a little magic.',
    location: 'Hangzhou',
  },
  posts: enPosts,
  tags: enTags,
  archive: enArchive,
}
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8')
console.log(`BUILD_EN_OK posts=${enPosts.length} tags=${enTags.length} archiveYears=${enArchive.length}`)
