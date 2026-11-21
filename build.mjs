#!/usr/bin/env node
// P6-B1 最小构建链：content/*.md → dist/assets/data.js ＋ src 静态件拷贝 → dist。
// B5/R30：dist 同产物逐字节镜像 docs/＋CNAME/.nojekyll（Pages 源=master /docs）；镜像失败即 build 失败。
// 零 npm 依赖（Node 内置模块）。用法：node build.mjs [--root <dir>]
import { readFileSync, writeFileSync, readdirSync, mkdirSync, cpSync, existsSync, rmSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const ROOT = resolve(process.argv.includes('--root') ? process.argv[process.argv.indexOf('--root') + 1] : dirname(fileURLToPath(import.meta.url)))

// 构建前置门（I1.5-2 / R15）：harness --phase build，exit≠0 不 build。tools 缺席＝fail-closed。
// gitleaks 解析序：随包 tools/gitleaks/ → --gitleaks/GITLEAKS_PATH/PATH（harness 内建）。
const glBundled = join(ROOT, 'tools', 'gitleaks', process.platform === 'win32' ? 'gitleaks.exe' : 'gitleaks')
const gateArgs = [join(ROOT, 'tools', 'gate-harness.mjs'), '--root', ROOT, '--phase', 'build']
if (existsSync(glBundled)) gateArgs.push('--gitleaks', glBundled)
const gate = spawnSync(process.execPath, gateArgs, { stdio: 'inherit', encoding: 'utf8' })
if (gate.error || gate.status !== 0) {
  console.error('GATE_REJECT 构建中止（harness --phase build exit≠0 或不可执行）')
  process.exit(1)
}
const CONTENT = join(ROOT, 'content')
const SRC = join(ROOT, 'src')
const DIST = join(ROOT, 'dist')
const warnings = []

function splitFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!m) return { meta: {}, body: raw }
  const meta = {}
  for (const line of m[1].split(/\r?\n/)) {
    if (/^\s*#/.test(line)) continue
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/)
    if (!kv) continue
    let v = kv[2].trim()
    if (v.startsWith('[') && v.endsWith(']')) {
      // R14：与 harness 契约正则逐字对齐（v0.2 §2.1 冻结语义：仅双引号保护逗号；单引号含逗号＝契约外不支持）。
      meta[kv[1]] = v.slice(1, -1).split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    } else {
      meta[kv[1]] = v.replace(/^["']|["']$/g, '')
    }
  }
  return { meta, body: raw.slice(m[0].length) }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
function inline(s) {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>')
}
// 最小 md 渲染（构建期）：先转义再变换；标题/段落/列表/引用/分隔线。
function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out = []
  let para = []
  let list = null // 'ul' | 'ol'
  let quote = []
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(esc(para.join(' ')))}</p>`); para = [] } }
  const flushList = () => { if (list) { out.push(`</${list}>`); list = null } }
  const flushQuote = () => { if (quote.length) { out.push(`<blockquote><p>${inline(esc(quote.join(' ')))}</p></blockquote>`); quote = [] } }
  const flushAll = () => { flushPara(); flushList(); flushQuote() }
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (/^\s*$/.test(line)) { flushAll(); continue }
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) { flushAll(); const l = h[1].length + 1; out.push(`<h${l}>${inline(esc(h[2]))}</h${l}>`); continue }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { flushAll(); out.push('<hr>'); continue }
    const q = line.match(/^>\s?(.*)$/)
    if (q) { flushPara(); flushList(); quote.push(q[1]); continue }
    const ul = line.match(/^[-*]\s+(.*)$/)
    if (ul) { flushPara(); flushQuote(); if (list !== 'ul') { flushList(); out.push('<ul>'); list = 'ul' } out.push(`<li>${inline(esc(ul[1]))}</li>`); continue }
    const ol = line.match(/^\d+\.\s+(.*)$/)
    if (ol) { flushPara(); flushQuote(); if (list !== 'ol') { flushList(); out.push('<ol>'); list = 'ol' } out.push(`<li>${inline(esc(ol[1]))}</li>`); continue }
    flushList(); flushQuote(); para.push(line.trim())
  }
  flushAll()
  return out.join('\n')
}

function readMdPair(dir, base, required) {
  const pair = {}
  for (const lang of ['zh', 'en']) {
    const p = join(dir, `${base}.${lang}.md`)
    if (!existsSync(p)) continue
    const { meta, body } = splitFrontMatter(readFileSync(p, 'utf8'))
    if (meta.lang && meta.lang !== lang) warnings.push(`${base}.${lang}.md: lang 字段与文件名不一致 (${meta.lang})`)
    pair[lang] = { meta, html: mdToHtml(body), title: meta.title ?? '' }
  }
  if (required && Object.keys(pair).length === 0) throw new Error(`缺少内容文件: ${dir}/${base}.{zh,en}.md`)
  for (const lang of ['zh', 'en']) if (!pair[lang]) warnings.push(`${base}: 缺 ${lang} 版（前端以「译文待补」兜底）`)
  return pair
}

// about
const aboutPair = readMdPair(CONTENT, 'about', true)
const about = {}
for (const lang of ['zh', 'en']) about[lang] = aboutPair[lang] ? { title: aboutPair[lang].title, html: aboutPair[lang].html } : null

// members（按 id 配对）
const membersDir = join(CONTENT, 'members')
const memberIds = [...new Set(readdirSync(membersDir).filter((f) => /\.(zh|en)\.md$/.test(f)).map((f) => f.replace(/\.(zh|en)\.md$/, '')))]
const members = memberIds.map((id) => {
  const pair = readMdPair(membersDir, id, true)
  const any = pair.zh ?? pair.en
  const m = any.meta
  const entry = {
    id,
    order: Number(m.order ?? 99),
    status: m.status ?? 'placeholder',
    photo: m.photo ?? null,
    name: { zh: pair.zh?.meta.name ?? pair.en?.meta.name ?? id, en: pair.en?.meta.name ?? pair.zh?.meta.name ?? id },
    titleLine: { zh: pair.zh?.meta.title_line ?? '', en: pair.en?.meta.title_line ?? '' },
    bio: { zh: pair.zh?.html ?? null, en: pair.en?.html ?? null },
  }
  return entry
}).sort((a, b) => a.order - b.order)

// publications（按 slug 配对）
// B4/v0.3：attribution enum 收拢 ['team']（example 全机件退役）；与 harness v0.3 双层防御。
const KIND_ENUM = ['paper', 'paper-note', 'project', 'talk']
const ATTR_ENUM = ['team']
function reqEnum(v, allowed, at) {
  if (typeof v !== 'string' || !allowed.includes(v)) throw new Error(`${at} 缺失或非法（必填 ∈ ${allowed.join('|')}）：${v}`)
  return v
}
const pubDir = join(CONTENT, 'publications')
const pubSlugs = existsSync(pubDir) ? [...new Set(readdirSync(pubDir).filter((f) => /\.(zh|en)\.md$/.test(f)).map((f) => f.replace(/\.(zh|en)\.md$/, '')))] : []
const publications = pubSlugs.map((slug) => {
  const pair = readMdPair(pubDir, slug, true)
  const any = pair.zh ?? pair.en
  const m = any.meta
  if (!Array.isArray(m.authors) || m.authors.length === 0) throw new Error(`publications/${slug}: authors 必填（如实逐字）`)
  return {
    slug,
    kind: reqEnum(m.kind, KIND_ENUM, `publications/${slug}.kind`),
    attribution: reqEnum(m.attribution, ATTR_ENUM, `publications/${slug}.attribution`),
    authors: m.authors,
    venue: m.venue ?? '',
    year: m.year ? Number(m.year) : null,
    date: m.date ?? '',
    doi: m.doi ?? null,
    title: { zh: pair.zh?.title ?? pair.en?.title ?? slug, en: pair.en?.title ?? pair.zh?.title ?? slug },
    summary: { zh: pair.zh?.html ?? null, en: pair.en?.html ?? null },
  }
}).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

// team.json 权威源 → QL_DATA.team＋QL_DATA.home（R8；I1.5/B2 数据化）
const teamRaw = JSON.parse(readFileSync(join(CONTENT, 'team.json'), 'utf8'))
// B4/v0.3：team.fixture 退役键在场即 throw（fail-closed，演示数据禁入正式站）。
if (Object.prototype.hasOwnProperty.call(teamRaw, 'fixture')) throw new Error('team.fixture 缺失或非法（v0.3 退役键须缺席，fail-closed）：在场')
function biStr(v, at) {
  if (!v || typeof v.zh !== 'string' || typeof v.en !== 'string' || !v.zh || !v.en) throw new Error(`${at} 必须为双语非空子对象 {zh,en}`)
  return { zh: v.zh, en: v.en }
}
const homeRaw = teamRaw.home
if (!homeRaw || !homeRaw.hero || !Array.isArray(homeRaw.teasers)) throw new Error('team.json home 块缺失（R8：hero＋teasers）')
const home = {
  hero: { eyebrow: biStr(homeRaw.hero.eyebrow, 'home.hero.eyebrow'), mission: biStr(homeRaw.hero.mission, 'home.hero.mission') },
  teasers: homeRaw.teasers.map((t, i) => {
    if (!t || typeof t.id !== 'string' || typeof t.enabled !== 'boolean') throw new Error(`home.teasers[${i}] id/enabled 必填`)
    return { id: t.id, enabled: t.enabled, title: biStr(t.title, `home.teasers[${i}].title`), text: biStr(t.text, `home.teasers[${i}].text`) }
  }),
}
const { home: _home, note: _note, ...team } = teamRaw
for (const k of ['name', 'couplet', 'mission']) biStr(team[k], `team.${k}`)

const data = { generatedAt: new Date().toISOString(), team, home, about, members, publications }
mkdirSync(join(DIST, 'assets'), { recursive: true })
cpSync(SRC, DIST, { recursive: true })
writeFileSync(join(DIST, 'assets', 'data.js'), 'window.QL_DATA = ' + JSON.stringify(data, null, 2) + ';\n', 'utf8')

// B5/R30：docs 镜像（GitHub Pages 分支源仅根或 /docs）＝同一次构建产物逐字节复制＋CNAME/.nojekyll。
// dist 行为与内容不变（离线入口保留）；镜像回验失败即 build 失败（fail-closed）。docs/ 由 build 生成勿手改。
const DOCS = join(ROOT, 'docs')
rmSync(DOCS, { recursive: true, force: true })
cpSync(DIST, DOCS, { recursive: true })
writeFileSync(join(DOCS, 'CNAME'), 'qinluolab.com\n', 'utf8')
writeFileSync(join(DOCS, '.nojekyll'), '', 'utf8')
function treeFiles(dir, base = dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) treeFiles(p, base, out)
    else out.push(relative(base, p).replace(/\\/g, '/'))
  }
  return out
}
const distFiles = treeFiles(DIST).sort()
const docsFiles = treeFiles(DOCS).sort()
if (JSON.stringify(docsFiles) !== JSON.stringify([...distFiles, 'CNAME', '.nojekyll'].sort())) throw new Error('docs 镜像文件集不等（fail-closed）')
for (const f of distFiles) {
  if (!readFileSync(join(DIST, f)).equals(readFileSync(join(DOCS, f)))) throw new Error(`docs 镜像逐字节不等: ${f}（fail-closed）`)
}
if (readFileSync(join(DOCS, 'CNAME'), 'utf8').trim() !== 'qinluolab.com') throw new Error('docs/CNAME 内容错（fail-closed）')
console.log(`BUILD_OK about=${Object.keys(about).filter((k) => about[k]).length} members=${members.length} publications=${publications.length} warnings=${warnings.length} docs=${docsFiles.length}`)
for (const w of warnings) console.log(`  ! ${w}`)
