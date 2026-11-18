#!/usr/bin/env node
/**
 * P2-B2：将 LuoCG P2-B1 导出 JSON 同步为前端 static 数据源。
 * 用法：node scripts/sync-static-data.mjs <export.json> [--allow-placeholder]
 *
 * 校验（前端侧防泄漏兜底，导出侧门禁以 B1 为准）：
 * - schema = domagic-static-export/v1；profile/posts/tags/archive 形状与契约 v1.2 公开线形一致
 * - 递归拒绝任何 *_enc / password / secret / token 类键；拒绝 visibility=private / status=draft
 * - slug 格式、contentMd≤200000、title≤200、summary≤500、tags≤10
 * - 占位数据（placeholder=true）默认拒绝写入，防止占位内容进入 republish 产物
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const TARGET = resolve(HERE, '../src/api/static/data/dataset.json')
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TYPES = new Set(['blog', 'opinion', 'diary', 'academic'])
const FORBIDDEN_KEY = /(_enc$|password|secret|token|privatekey|encryptionkey)/i

function fail(msg) {
  console.error(`SYNC_STATIC_DATA_FAIL: ${msg}`)
  process.exit(1)
}

function scanKeys(value, path) {
  if (Array.isArray(value)) {
    value.forEach((v, i) => scanKeys(v, `${path}[${i}]`))
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_KEY.test(k)) fail(`疑似敏感键 ${path}.${k}`)
      scanKeys(v, `${path}.${k}`)
    }
  }
}

const src = process.argv[2]
const allowPlaceholder = process.argv.includes('--allow-placeholder')
if (!src) fail('缺少导出 JSON 路径参数')

let data
try {
  data = JSON.parse(readFileSync(resolve(src), 'utf8'))
} catch (e) {
  fail(`无法读取/解析导出文件：${e.message}`)
}

if (data.schema !== 'domagic-static-export/v1') fail(`schema 不匹配：${data.schema}`)
if (data.placeholder === true && !allowPlaceholder) {
  fail('导出为占位数据（placeholder=true），禁止同步；真实导出就绪后重试')
}
if (typeof data.generatedAt !== 'string') fail('缺少 generatedAt')
scanKeys(data, '$')

const p = data.profile
if (!p || typeof p.displayName !== 'string' || typeof p.headline !== 'string' ||
    typeof p.bio !== 'string' || !Array.isArray(p.socialLinks) || typeof p.updatedAt !== 'string') {
  fail('profile 形状不符合契约（displayName/headline/bio/socialLinks/updatedAt）')
}

if (!Array.isArray(data.posts)) fail('posts 必须为数组')
const slugs = new Set()
for (const [i, post] of data.posts.entries()) {
  const at = `posts[${i}]`
  if (!SLUG.test(post.slug ?? '')) fail(`${at}.slug 格式不合法`)
  if (slugs.has(post.slug)) fail(`${at}.slug 重复：${post.slug}`)
  slugs.add(post.slug)
  if (!TYPES.has(post.type)) fail(`${at}.type 非法：${post.type}`)
  if (typeof post.title !== 'string' || post.title.length < 1 || post.title.length > 200) fail(`${at}.title 超限`)
  if (typeof post.summary !== 'string' || post.summary.length > 500) fail(`${at}.summary 超限`)
  if (typeof post.contentMd !== 'string' || post.contentMd.length < 1 || post.contentMd.length > 200000) fail(`${at}.contentMd 超限`)
  if (typeof post.publishedAt !== 'string' || Number.isNaN(Date.parse(post.publishedAt))) fail(`${at}.publishedAt 非法`)
  if (typeof post.updatedAt !== 'string') fail(`${at}.updatedAt 缺失`)
  if (!Number.isFinite(post.readingTimeMinutes)) fail(`${at}.readingTimeMinutes 缺失`)
  if (!Array.isArray(post.tags) || post.tags.length > 10) fail(`${at}.tags 超限`)
  for (const t of post.tags) {
    if (!SLUG.test(t.slug ?? '') || typeof t.name !== 'string') fail(`${at} 标签形状非法`)
  }
  if ('visibility' in post && post.visibility !== 'public') fail(`${at} 含非 public 内容`)
  if ('status' in post && post.status !== 'published') fail(`${at} 含非 published 内容`)
  if (post.academicMeta != null && post.type !== 'academic') fail(`${at} 非学术文章携带 academicMeta`)
}

if (!Array.isArray(data.tags)) fail('tags 必须为数组')
for (const [i, t] of data.tags.entries()) {
  if (!SLUG.test(t.slug ?? '') || typeof t.name !== 'string' || !Number.isFinite(t.postCount)) {
    fail(`tags[${i}] 形状非法`)
  }
}

if (!Array.isArray(data.archive)) fail('archive 必须为数组')
for (const [i, y] of data.archive.entries()) {
  if (!Number.isInteger(y.year) || !Number.isFinite(y.count) || !Array.isArray(y.posts)) {
    fail(`archive[${i}] 形状非法`)
  }
  for (const ref of y.posts) {
    if (!SLUG.test(ref.slug ?? '') || !TYPES.has(ref.type) || typeof ref.publishedAt !== 'string') {
      fail(`archive[${i}] 文章引用形状非法`)
    }
    if (!slugs.has(ref.slug)) fail(`archive[${i}] 引用了不存在于 posts 的 slug：${ref.slug}`)
  }
}

writeFileSync(TARGET, JSON.stringify(data, null, 2) + '\n', 'utf8')
console.log(`SYNC_STATIC_DATA_OK posts=${data.posts.length} tags=${data.tags.length} archiveYears=${data.archive.length} placeholder=${data.placeholder === true}`)