#!/usr/bin/env node
/**
 * P2-B2：将 LuoCG P2-B1 导出 JSON 同步为前端 static 数据源。
 * 用法：node scripts/sync-static-data.mjs <export.json> [--allow-placeholder] [--assets-manifest <manifest.json>]
 *
 * 校验（前端侧防泄漏兜底，导出侧门禁以 B1 为准）：
 * - schema = domagic-static-export/v1；profile/posts/tags/archive 形状与契约 v1.2 公开线形一致
 * - 递归拒绝任何 *_enc / password / secret / token 类键；拒绝 visibility=private / status=draft
 * - slug 格式、contentMd≤200000、title≤200、summary≤500、tags≤10
 * - 占位数据（placeholder=true）默认拒绝写入，防止占位内容进入 republish 产物
 * - v1.2 随文图片：--assets-manifest 提供时校验媒体清单（字段 relPath/sha256/bytes/mime，
 *   与 LuoCG R1 封版单互锁）并规范化写入 public/media/manifest.json（随 vite 进 dist，供
 *   postbuild 断链门消费）；未提供时清除残留 manifest，保证纯文本 run 与图片 run 无状态串扰。
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const TARGET = resolve(ROOT, 'src/api/static/data/dataset.json')
const MEDIA_MANIFEST_OUT = join(ROOT, 'public/media/manifest.json')
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TYPES = new Set(['blog', 'opinion', 'diary', 'academic', 'group'])
const FORBIDDEN_KEY = /(_enc$|password|secret|token|privatekey|encryptionkey)/i

// —— 契约 v1.2 §1-A.5 守卫常量 ——
const ASSET_MAX_SINGLE = 5 * 1024 * 1024 // 单图 ≤5 MiB
const ASSET_MAX_COUNT = 300 // 每 run 全站 ≤300 张
const ASSET_MAX_TOTAL = 150 * 1024 * 1024 // 总字节 ≤150 MiB
// 图片唯一合法面：<栏目>/assets/<一层图片目录>/<文件>.<位图扩展>（小写）。
// R1 实测口径（QinY 本地 import:content --dry-run @00dada8，2026-11-19）：
// import CLI 的 relPath 以 contentDir 为基准，实形不含 content/ 前缀；
// 契约 §1-A 源树写法含之前缀作可选容忍（两写法同映射，语义不变，口径归 Manager 裁定）。
const ASSET_REL_PATH = /^(?:content\/)?(blog|opinion|academic|group)\/assets\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+\.(?:png|jpe?g|gif|webp))$/
const SHA256_HEX = /^[0-9a-f]{64}$/
const MIME_BY_EXT = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }

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
const manifestArgIdx = process.argv.indexOf('--assets-manifest')
const manifestPath = manifestArgIdx >= 0 ? process.argv[manifestArgIdx + 1] : undefined
if (manifestArgIdx >= 0 && !manifestPath) fail('--assets-manifest 缺少路径参数')
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

// —— v1.2 随文图片 manifest：形状校验 + 规范化透传（断链与字节级断言在 postbuild 门执行）——
let assetCount = 0
let assetBytes = 0
if (manifestPath) {
  let manifestRaw
  try {
    manifestRaw = JSON.parse(readFileSync(resolve(manifestPath), 'utf8'))
  } catch (e) {
    fail(`无法读取/解析媒体清单：${e.message}`)
  }
  const assets = Array.isArray(manifestRaw) ? manifestRaw : manifestRaw.assets
  if (!Array.isArray(assets)) fail('媒体清单必须为数组或含 assets 数组字段')
  if (assets.length > ASSET_MAX_COUNT) fail(`媒体清单超限：${assets.length} 张 > ${ASSET_MAX_COUNT}`)
  scanKeys(manifestRaw, '$media')

  const seen = new Set()
  const normalized = []
  let total = 0
  for (const [i, a] of assets.entries()) {
    const at = `media.assets[${i}]`
    if (!a || typeof a !== 'object') fail(`${at} 必须为对象`)
    const extraKeys = Object.keys(a).filter((k) => !['relPath', 'sha256', 'bytes', 'mime'].includes(k))
    if (extraKeys.length) fail(`${at} 含互锁字段之外的键：${extraKeys.join(',')}`)
    if (typeof a.relPath !== 'string' || !ASSET_REL_PATH.test(a.relPath)) {
      fail(`${at}.relPath 不符合 assets/ 目录约定（一层目录+位图扩展白名单，小写）：${a.relPath}`)
    }
    if (seen.has(a.relPath)) fail(`${at}.relPath 重复：${a.relPath}`)
    seen.add(a.relPath)
    if (typeof a.sha256 !== 'string' || !SHA256_HEX.test(a.sha256)) fail(`${at}.sha256 非 64 位小写 hex`)
    const ext = a.relPath.slice(a.relPath.lastIndexOf('.') + 1)
    if (a.mime !== MIME_BY_EXT[ext]) fail(`${at}.mime 与扩展名不一致：${a.mime} ≠ ${MIME_BY_EXT[ext]}`)
    if (!Number.isInteger(a.bytes) || a.bytes <= 0) fail(`${at}.bytes 必须为正整数`)
    if (a.bytes > ASSET_MAX_SINGLE) fail(`${at}.bytes 超单图上限 5 MiB：${a.bytes}`)
    total += a.bytes
    if (total > ASSET_MAX_TOTAL) fail(`媒体清单总字节超上限 150 MiB：${total}`)
    const [, section, dir, file] = ASSET_REL_PATH.exec(a.relPath)
    normalized.push({ ...a, urlPath: `/media/${section}/${dir}/${file}` })
  }
  assetCount = normalized.length
  assetBytes = total
  mkdirSync(dirname(MEDIA_MANIFEST_OUT), { recursive: true })
  writeFileSync(
    MEDIA_MANIFEST_OUT,
    JSON.stringify({ schema: 'domagic-site-media/v1', assets: normalized }, null, 2) + '\n',
    'utf8',
  )
} else if (existsSync(MEDIA_MANIFEST_OUT)) {
  // 无图 run：清除残留 manifest，防止 postbuild 断链门对过期清单误报/漏报
  rmSync(MEDIA_MANIFEST_OUT)
}

console.log(
  `SYNC_STATIC_DATA_OK posts=${data.posts.length} tags=${data.tags.length} archiveYears=${data.archive.length} placeholder=${data.placeholder === true}` +
    (manifestPath ? ` mediaAssets=${assetCount} mediaBytes=${assetBytes}` : ''),
)