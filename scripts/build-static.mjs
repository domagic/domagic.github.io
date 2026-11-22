#!/usr/bin/env node
/**
 * P5-C1 终稿（v1.3 冻结版站点仓直发）内容构建器：content/ → dataset JSON + 随文图片 assets 清单。
 * 用法：node scripts/build-static.mjs [--content-dir content] --out-dataset <p> --out-assets <p> [--report]
 * 落位：站点仓 scripts/build-static.mjs（工程 commit）。Node 22 LTS，零运行时依赖。
 *
 * 门语义（全部 fail-closed，任一红＝整次构建失败 → workflow 中止 → 线上保持旧版，v1.3 A.2）：
 * - G0 profile 必含（content/profile.json，v1.3 A.1-2 增列；字段=ExportProfileView）。
 * - G1 在场硬门（A.2-2，D3 定案）：任一被扫描语料 status≠published 或 visibility≠public
 *   ＝ PRESENCE 整次拒（非剔除）。主防护仍是「草稿不进公开仓」行为红线（B 节）。
 * - G2 未知文件门（A.2-1，D6 定案）：三栏目白名单＝`*.md`（_前缀/readme 豁免，沿用
 *   scanContentDir）＋ assets/ 位图；`.tex` 显式拒绝（A.1-1 收窄拒收，author 侧转 md 口径）。
 * - G3 图片结构门（S4 语义平移）：一层图片目录、五类扩展严格小写、单图≤5MiB、
 *   总量≤300 张/≤150MiB、magic-vs-扩展一致（sniffImageMime 逐字沿用 LuoCG import-content.ts）。
 * - G4 元数据/形状门（planMdFile+baseValidations 语义沿用＋v1.3 收紧）：
 *   published 必须显式 date（A.1-3）；slug 重复全拒；其余 reject 即红，绝不部分上线。
 *
 * 组装语义逐字沿用 static-export.ts 纯函数族（comparePosts/deriveArchive/
 * computeGeneratedAt/normalizePost 键序/serialize 两空格+LF）。v1.3 A.1-3 采纳的
 * 确定性推导口径：tags.id=t-<slug>、description=null、updatedAt=publishedAt、
 * coverImageUrl=null、readingTimeMinutes=CJK/300＋拉丁词/200 ceil≥1。
 * --report：对账表（scanned/planned/rejected＋逐文件判定）追加写 $GITHUB_STEP_SUMMARY
 * （B2 dry-run 交互降级件，v1.3 A.2-3）。
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { join, resolve, dirname, relative, sep } from 'node:path'
import { createHash } from 'node:crypto'

const SCHEMA = 'domagic-static-export/v1'
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DIR_TYPES = ['blog', 'opinion', 'academic', 'group']
const IMG_EXT = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }
const ASSET_MAX_SINGLE = 5 * 1024 * 1024
const ASSET_MAX_COUNT = 300
const ASSET_MAX_TOTAL = 150 * 1024 * 1024
const KNOWN_MD_KEYS = new Set(['title', 'slug', 'type', 'tags', 'date', 'visibility', 'status', 'summary', 'authors', 'venue', 'year'])

function arg(name, required = false) {
  const i = process.argv.indexOf(name)
  if (i < 0) {
    if (required) { console.error(`FAIL: 缺少参数 ${name}`); process.exit(1) }
    return undefined
  }
  return process.argv[i + 1]
}
const REPORT = process.argv.includes('--report')
const CONTENT_DIR = resolve(arg('--content-dir') ?? 'content')
const OUT_DATASET = resolve(arg('--out-dataset', true))
const OUT_ASSETS = resolve(arg('--out-assets', true))

const errors = []
const warnings = []
const fail = (m) => { errors.push(m) }

// ---------- 逐字沿用（LuoCG content-import.ts） ----------
function splitFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!m) return { meta: {}, contentMd: raw }
  const meta = {}
  for (const line of m[1].split(/\r?\n/)) {
    if (/^\s*#/.test(line)) continue // front-matter 内 YAML 注释行（v1.3 A.1-3 采纳：对齐 YAML 方言）
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
const asList = (v) => (v === undefined ? [] : Array.isArray(v) ? v : v.split(',').map((s) => s.trim()).filter(Boolean))
function parseTagTokens(tokens) {
  const slugs = []; const names = {}; const errs = []
  for (const t of tokens) {
    const [slug, ...rest] = t.split('|')
    const name = rest.join('|').trim()
    const s = slug.trim()
    if (!SLUG_RE.test(s)) { errs.push(`tag-not-ascii-slug: "${t}"`); continue }
    if (!slugs.includes(s)) slugs.push(s)
    if (name) names[s] = name
  }
  return { slugs, names, errors: errs }
}
function sniffImageMime(head) {
  if (head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 && head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a) return 'image/png'
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image/jpeg'
  if (head.length >= 4 && head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x38) return 'image/gif'
  if (head.length >= 12 && head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  return 'unknown'
}
function buildAcademicMeta(src, reasons) {
  const before = reasons.length
  const authors = (src.authors ?? []).map((s) => s.trim()).filter(Boolean)
  if (authors.length === 0) { reasons.push('academicMeta-authors-missing (md: authors:)'); return undefined }
  if (authors.some((a) => a.length > 100)) reasons.push('academicMeta-author-over-100')
  let meta = { authors }
  if (src.venue !== undefined && src.venue !== '') {
    if (src.venue.length > 200) reasons.push('academicMeta-venue-over-200')
    else meta = { ...meta, venue: src.venue }
  }
  if (src.year !== undefined && src.year !== '') {
    const y = Number(src.year)
    if (!/^\d{4}$/.test(src.year) || !Number.isInteger(y) || y < 1900 || y > 2100) reasons.push(`academicMeta-year-invalid: ${src.year}`)
    else meta = { ...meta, year: y }
  }
  return reasons.length === before ? meta : undefined
}

// ---------- G1/G2/G4：语料扫描＋在场门＋元数据 ----------
const rel = (abs) => relative(CONTENT_DIR, abs).split(sep).join('/')
function scanCorpus() {
  const found = []
  const walk = (cur, dir) => {
    for (const ent of readdirSync(cur, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const abs = join(cur, ent.name)
      if (ent.isDirectory()) { if (ent.name !== 'assets') walk(abs, dir); continue }
      if (ent.name.startsWith('_') || /^readme\.md$/i.test(ent.name)) continue
      const lower = ent.name.toLowerCase()
      if (lower.endsWith('.tex')) { fail(`G2 tex 不入站点仓（author 侧转 md 口径，v1.3 A.1-1）: ${rel(abs)}`); continue }
      if (!lower.endsWith('.md')) { fail(`G2 未知文件（非白名单）: ${rel(abs)}`); continue }
      found.push({ relPath: rel(abs), dir, abs })
    }
  }
  for (const dir of DIR_TYPES) {
    const root = join(CONTENT_DIR, dir)
    let exists = true
    try { readdirSync(root) } catch { exists = false }
    if (exists) walk(root, dir)
  }
  return found
}

function readingTime(contentMd) {
  const cjk = (contentMd.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) ?? []).length
  const latin = (contentMd.replace(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g, ' ').match(/[A-Za-z0-9_'’-]+/g) ?? []).length
  return Math.max(1, Math.ceil(cjk / 300 + latin / 200))
}

function planMd({ relPath, dir, abs }) {
  const reasons = []
  const raw = readFileSync(abs, 'utf8')
  const { meta, contentMd } = splitFrontMatter(raw)
  for (const k of Object.keys(meta)) if (!KNOWN_MD_KEYS.has(k)) warnings.push(`${relPath}: unknown-front-matter-key: ${k}`)
  const status = meta.status ?? 'draft'
  const visibility = meta.visibility ?? 'public'
  // G1 在场硬门（最高优先级语义：先于一切格式判定点名）
  if (status !== 'published') { fail(`G1 PRESENCE 在场拒发 ${relPath}: status=${status}（草稿禁止进入站点仓发布流）`); return null }
  if (visibility !== 'public') { fail(`G1 PRESENCE 在场拒发 ${relPath}: visibility=${visibility}`); return null }
  const type = typeof meta.type === 'string' ? meta.type : dir
  if (!DIR_TYPES.includes(type)) reasons.push(`type-invalid: ${String(meta.type)}`)
  if (type !== dir) reasons.push(`folder-type-mismatch: dir=${dir} type=${type}`)
  const tags = parseTagTokens(asList(meta.tags))
  reasons.push(...tags.errors)
  if (tags.slugs.length > 10) reasons.push('tags-over-10')
  if (typeof meta.date !== 'string' || meta.date.length === 0) reasons.push('published-missing-date (纯文件形态 published 必须显式 date)')
  let publishedAt
  if (!reasons.includes('published-missing-date (纯文件形态 published 必须显式 date)')) {
    const d = new Date(meta.date)
    if (Number.isNaN(d.getTime())) reasons.push(`date-invalid: ${meta.date}`)
    else publishedAt = d.toISOString()
  }
  const title = typeof meta.title === 'string' ? meta.title : undefined
  const slug = typeof meta.slug === 'string' ? meta.slug : undefined
  const summary = typeof meta.summary === 'string' ? meta.summary : undefined
  if (title === undefined || title.length < 1 || title.length > 200) reasons.push('title-missing-or-over-200')
  if (!slug) reasons.push('slug-required')
  else if (!SLUG_RE.test(slug)) reasons.push(`slug-format: ${slug}`)
  if (summary !== undefined && summary.length > 500) reasons.push('summary-over-500')
  if (contentMd.length < 1 || Buffer.byteLength(contentMd, 'utf8') > 200000) reasons.push('contentMd-empty-or-over-200k')
  let academicMeta
  if (type === 'academic' && (meta.authors !== undefined || meta.venue !== undefined || meta.year !== undefined)) {
    academicMeta = buildAcademicMeta(
      { authors: asList(meta.authors), venue: typeof meta.venue === 'string' ? meta.venue : undefined, year: typeof meta.year === 'string' ? meta.year : undefined },
      reasons,
    )
  }
  if (reasons.length > 0) { reasons.forEach((r) => fail(`G4 ${relPath}: ${r}`)); return null }
  return { relPath, type, title, slug, summary, publishedAt, contentMd, tagSlugs: tags.slugs, tagNames: tags.names, academicMeta }
}

// ---------- G3：assets 登记＋结构门（逐字 scanAssetsDir + S4 语义） ----------
function scanAssets() {
  const out = []
  for (const dir of DIR_TYPES) {
    const root = join(CONTENT_DIR, dir, 'assets')
    let exists = true
    try { readdirSync(root) } catch { exists = false }
    if (!exists) continue
    const walk = (cur) => {
      for (const ent of readdirSync(cur, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
        const abs = join(cur, ent.name)
        if (ent.isDirectory()) { walk(abs); continue }
        if (ent.name.startsWith('_') || /^readme\.md$/i.test(ent.name)) continue
        out.push({ abs, relPath: rel(abs) })
      }
    }
    walk(root)
  }
  out.sort((a, b) => (a.relPath < b.relPath ? -1 : a.relPath > b.relPath ? 1 : 0))
  const entries = []
  let total = 0
  for (const { abs, relPath } of out) {
    const seg = relPath.split('/')
    if (!(seg.length === 4 && DIR_TYPES.includes(seg[0]) && seg[1] === 'assets')) {
      fail(`G3 assets 结构（一层图片目录）: ${relPath}`)
      continue
    }
    const extRaw = seg[3].lastIndexOf('.') >= 0 ? seg[3].slice(seg[3].lastIndexOf('.') + 1) : ''
    const ext = extRaw.toLowerCase()
    if (!IMG_EXT[extRaw]) { fail(`G3 非白名单扩展（严格小写位图）: ${relPath}`); continue }
    if (extRaw !== ext) { fail(`G3 扩展名非小写: ${relPath}`); continue }
    const buf = readFileSync(abs)
    const mime = sniffImageMime(buf.subarray(0, 16))
    if (mime !== IMG_EXT[ext]) { fail(`G3 magic-vs-扩展不一致或未知签名: ${relPath} (${mime})`); continue }
    if (buf.length > ASSET_MAX_SINGLE) { fail(`G3 单图超 5MiB: ${relPath} (${buf.length})`); continue }
    total += buf.length
    entries.push({ relPath, sha256: createHash('sha256').update(buf).digest('hex'), bytes: buf.length, mime })
  }
  if (entries.length > ASSET_MAX_COUNT) fail(`G3 assets 总数超 ${ASSET_MAX_COUNT}`)
  if (total > ASSET_MAX_TOTAL) fail(`G3 assets 总字节超 150MiB (${total})`)
  return entries
}

// ---------- 组装（逐字 static-export.ts 纯函数族） ----------
const comparePosts = (a, b) => (a.publishedAt !== b.publishedAt ? (a.publishedAt < b.publishedAt ? 1 : -1) : (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))

// ---------- --report 对账表（B2 dry-run 降级件 → GITHUB_STEP_SUMMARY） ----------
function writeReport(lines) {
  const body = lines.join('\n') + '\n'
  process.stdout.write(body)
  if (REPORT && process.env.GITHUB_STEP_SUMMARY) {
    try { writeFileSync(process.env.GITHUB_STEP_SUMMARY, body, { flag: 'a' }) } catch { /* summary 不可写不阻断构建判定 */ }
  }
}

function main() {
  for (const dir of DIR_TYPES) {
    try { readdirSync(join(CONTENT_DIR, dir)) } catch { fail(`G2 缺少栏目目录 content/${dir}/`) }
  }
  const corpus = scanCorpus()
  const posts = corpus.map(planMd).filter(Boolean)
  // slug 重复（annotateDuplicateSlugs 语义：重复全拒）
  const count = new Map()
  for (const p of posts) count.set(p.slug, (count.get(p.slug) ?? 0) + 1)
  for (const p of [...posts]) if (count.get(p.slug) > 1) { fail(`G4 slug 重复: ${p.slug} (${p.relPath})`); posts.splice(posts.indexOf(p), 1) }
  const assets = scanAssets()
  const profilePath = join(CONTENT_DIR, 'profile.json')
  let profile
  try {
    profile = JSON.parse(readFileSync(profilePath, 'utf8'))
  } catch (e) {
    fail(`G0 profile 缺失/不可解析（content/profile.json 必含，v1.3 A.1-2）: ${e.message}`)
  }
  // 对账表（先于判定输出：失败 run 的 owner 也能在摘要看到逐项拒因）
  const planned = new Set(posts.map((p) => p.relPath))
  const scanned = corpus.length + assets.length + 1
  const rejected = corpus.filter((c) => !planned.has(c.relPath)).length
  const reportLines = [
    '## Content build 对账（build-static · v1.3）',
    `scanned=${scanned} planned=${posts.length} rejected=${rejected} assets=${assets.length}`,
    '',
    '| 文件 | 判定 |',
    '|---|---|',
    ...corpus.map((c) => `| ${c.relPath} | ${planned.has(c.relPath) ? 'ok' : 'rejected'} |`),
    ...assets.map((a) => `| ${a.relPath} | ok (${a.bytes}B ${a.mime}) |`),
    `| profile.json | ${profile ? 'ok' : 'rejected'} |`,
  ]
  if (errors.length > 0) {
    reportLines.push('', '### 拒因（fail-closed，整次构建失败）', ...errors.map((e) => `- ${e}`))
    writeReport(reportLines)
    console.error(`BUILD_STATIC_FAIL errors=${errors.length}`)
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }
  const sorted = [...posts].sort(comparePosts)
  const tagNamesMap = {}; const tagOrder = []
  for (const p of sorted) {
    for (const s of p.tagSlugs) {
      if (!tagOrder.includes(s)) tagOrder.push(s)
      const n = p.tagNames[s]
      if (n !== undefined && tagNamesMap[s] === undefined) tagNamesMap[s] = n
      else if (n !== undefined && tagNamesMap[s] !== undefined && n !== tagNamesMap[s]) warnings.push(`tag-name-conflict: ${s}（首见为准）`)
    }
  }
  const counts = new Map()
  for (const p of sorted) for (const s of p.tagSlugs) counts.set(s, (counts.get(s) ?? 0) + 1)
  const outPosts = sorted.map((p) => {
    const post = {
      slug: p.slug,
      type: p.type,
      title: p.title,
      summary: p.summary ?? null,
      tags: p.tagSlugs.map((s) => ({ slug: s, name: tagNamesMap[s] ?? s })),
      coverImageUrl: null,
      publishedAt: p.publishedAt,
      readingTimeMinutes: readingTime(p.contentMd),
      contentMd: p.contentMd,
    }
    if (p.type === 'academic') post.academicMeta = p.academicMeta ? { ...p.academicMeta, doi: null, pdfUrl: null } : null
    post.updatedAt = p.publishedAt
    return post
  })
  const byYear = new Map()
  for (const p of outPosts) {
    const y = new Date(p.publishedAt).getUTCFullYear()
    const list = byYear.get(y) ?? []
    list.push({ slug: p.slug, title: p.title, type: p.type, publishedAt: p.publishedAt })
    byYear.set(y, list)
  }
  const archive = [...byYear.entries()].sort((a, b) => b[0] - a[0]).map(([year, ps]) => ({ year, count: ps.length, posts: ps }))
  let maxUp = profile.updatedAt ?? ''
  for (const p of outPosts) if (p.updatedAt > maxUp) maxUp = p.updatedAt
  const env = {
    schema: SCHEMA,
    generatedAt: maxUp,
    profile: {
      displayName: profile.displayName,
      headline: profile.headline,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl ?? null,
      location: profile.location ?? null,
      socialLinks: profile.socialLinks ?? [],
      updatedAt: profile.updatedAt,
    },
    posts: outPosts,
    tags: tagOrder.sort().map((s) => ({ id: `t-${s}`, slug: s, name: tagNamesMap[s] ?? s, description: null, postCount: counts.get(s) ?? 0 })),
    archive,
  }
  mkdirSync(dirname(OUT_DATASET), { recursive: true })
  writeFileSync(OUT_DATASET, JSON.stringify(env, null, 2) + '\n', 'utf8')
  writeFileSync(OUT_ASSETS, JSON.stringify({ assets }, null, 2) + '\n', 'utf8')
  writeReport(reportLines)
  writeReport([`BUILD_STATIC_OK posts=${outPosts.length} tags=${env.tags.length} assets=${assets.length} archiveYears=${archive.length}`])
  if (warnings.length) writeReport([`warnings=${warnings.length}`, ...warnings.map((w) => `  ! ${w}`)])
}
main()
