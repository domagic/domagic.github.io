#!/usr/bin/env node
// P6 C6 门检 harness（契约 v0.3.1，承 v0.3 冻结口径：G1′–G5′＋G7′；G6′ I18N 比对退役；G8′ docs 镜像增补）。
// v0.3 增量（R26）：attribution enum 收拢 ['team']（example 全机件退役）；team.fixture 键在场即 G7′ REJECT（fail-closed）。
// v0.3.1 增量（R30）：G8′ docs/==dist/ 逐字节全等＋docs/CNAME trim==qinluolab.com＋docs/.nojekyll 在场；build＋push 双相 fail-closed。
// 零 npm 依赖（Node 内置）。fm 解析＝B1 splitFrontMatter 语义＋v0.2 §2.1 引号感知列表切分（R14 正则逐字冻结，不变）。
// 用法：node tools/gate-harness.mjs --root <dir> [--report <path>] [--phase build|push] [--gitleaks <bin>]
// exit 0＝全绿（WARN 允许）；exit 1＝任一 REJECT_RUN（失败先落对账表再退出）。
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync, mkdtempSync, rmSync } from 'node:fs'
import { join, relative, basename, extname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'

const argv = process.argv.slice(2)
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d)
const ROOT = arg('--root', process.cwd())
const PHASE = arg('--phase', 'push')
const REPORT = arg('--report', join(ROOT, 'harness-report.json'))
if (!['build', 'push'].includes(PHASE)) { console.error('BAD_PHASE ' + PHASE); process.exit(1) }
const CONTENT = join(ROOT, 'content')
const SRC = join(ROOT, 'src')
const DIST = join(ROOT, 'dist')
const LANGS = ['zh', 'en']
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const IMG_EXT = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tif', '.tiff', '.avif']
const gates = {}
for (const g of ['G1′', 'G2′', 'G3′', 'G4′', 'G5′', 'G7′', 'G8′']) gates[g] = { status: 'PASS', checks: 0, violations: [] }
const warnings = []
const missingTranslations = []
const perFile = []
let scanned = 0
const gate = (id) => (gates[id] ??= { status: 'PASS', checks: 0, violations: [] })
const fail = (id, path, reason) => { const g = gate(id); g.status = 'REJECT'; g.violations.push({ path, reason }) }
const check = (id, path, ok, reason) => { gate(id).checks++; if (!ok) fail(id, path, reason); return ok }
const verdict = (path, v, g, reason) => perFile.push({ path, verdict: v, gate: g ?? null, reason: reason ?? null })

// —— B1 splitFrontMatter 逐字对齐＋v0.2 引号感知列表切分（仅引号外逗号）——
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
      meta[kv[1]] = v.slice(1, -1).split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    } else {
      meta[kv[1]] = v.replace(/^["']|["']$/g, '')
    }
  }
  return { meta, body: raw.slice(m[0].length) }
}
const isISODate = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(s + 'T00:00:00Z')
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}
const isInt = (s) => /^-?\d+$/.test(String(s).trim())
const bilingual = (o) => o && typeof o === 'object' && LANGS.every((l) => typeof o[l] === 'string' && o[l].trim().length > 0)

// —— content 树分类（G2′）——
const entries = [] // {rel, abs, kind: about|member|publication|team|exempt|unknown, lang, base}
function walk(dir, relBase) {
  for (const ent of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const rel = relBase ? relBase + '/' + ent.name : ent.name
    const abs = join(dir, ent.name)
    if (ent.isDirectory()) {
      if (relBase === '' && (ent.name === 'members' || ent.name === 'publications')) { walk(abs, ent.name); continue }
      fail('G2′', 'content/' + rel, '未知目录（白名单仅 members/ publications/）')
      verdict('content/' + rel, 'REJECT', 'G2′', '未知目录')
      continue
    }
    scanned++
    const bn = ent.name
    if (bn.startsWith('_') || /^readme(\.|$)/i.test(bn)) { entries.push({ rel, abs, kind: 'exempt' }); verdict('content/' + rel, 'EXEMPT', null, '_前缀/readme 豁免'); continue }
    const ext = extname(bn).toLowerCase()
    if (ext === '.tex' || ext === '.docx') { fail('G2′', 'content/' + rel, '原始 tex/docx 显式拒（I2 待 v2.0）'); verdict('content/' + rel, 'REJECT', 'G2′', 'tex/docx'); continue }
    if (IMG_EXT.includes(ext)) { fail('G3′', 'content/' + rel, 'I1 无图片面：图片文件在场'); verdict('content/' + rel, 'REJECT', 'G3′', '图片文件'); continue }
    if (ext !== '.md' && ext !== '.json') { fail('G2′', 'content/' + rel, '扩展名仅 md/json'); verdict('content/' + rel, 'REJECT', 'G2′', '扩展名'); continue }
    if (relBase === '' && bn === 'team.json') { entries.push({ rel, abs, kind: 'team' }); continue }
    const lm = bn.match(/^(.*)\.(zh|en)\.md$/)
    if (!lm) { fail('G2′', 'content/' + rel, '未知路径/命名（须 <base>.{zh,en}.md 或 team.json）'); verdict('content/' + rel, 'REJECT', 'G2′', '命名'); continue }
    const base = lm[1], lang = lm[2]
    let kind = null
    if (relBase === '' && base === 'about') kind = 'about'
    else if (relBase === 'members') kind = 'member'
    else if (relBase === 'publications') kind = 'publication'
    if (!kind) { fail('G2′', 'content/' + rel, '未知路径（白名单布局外）'); verdict('content/' + rel, 'REJECT', 'G2′', '布局'); continue }
    entries.push({ rel, abs, kind, lang, base })
  }
}
if (!existsSync(CONTENT)) { fail('G2′', 'content/', 'content/ 缺省'); }
else walk(CONTENT, '')

// —— 逐 md 门检（G1′/G3′/G4′）——
const parsed = []
for (const e of entries) {
  if (e.kind === 'exempt') continue
  if (e.kind === 'team') continue
  const rel = 'content/' + e.rel
  if (IMG_EXT.includes(extname(e.abs).toLowerCase())) { fail('G3′', rel, 'I1 无图片面：图片文件在场'); verdict(rel, 'REJECT', 'G3′', '图片文件'); continue }
  const raw = readFileSync(e.abs, 'utf8')
  const { meta, body } = splitFrontMatter(raw)
  parsed.push({ ...e, meta, body, rel })
  let bad = null
  // G1′
  check('G1′', rel, meta.visibility === 'public', 'visibility 缺失或非 public')
  if (e.kind === 'member') check('G1′', rel, ['placeholder', 'confirmed'].includes(meta.status), 'members status 须 placeholder|confirmed')
  else check('G1′', rel, meta.status === 'published', 'status 须 published（发布轴）')
  // G3′ 正文图引用
  check('G3′', rel, !/!\[[^\]]*\]\(/.test(body) && !/<img\b/i.test(body) && !/data:image/i.test(body), '正文图引用/data:image 在场（I1 无图片面）')
  // G4′ 公共
  check('G4′', rel, typeof meta.title === 'string' && meta.title.trim().length > 0, 'title 必填非空')
  check('G4′', rel, meta.lang === e.lang, 'lang 与文件名后缀不一致')
  check('G4′', rel, isISODate(meta.date ?? ''), 'date 必填且 ISO 合法')
  if (e.kind === 'member') {
    check('G4′', rel, meta.id === e.base, 'id 与 basename 不一致')
    check('G4′', rel, SLUG_RE.test(meta.id ?? ''), 'id 格式非法')
    check('G4′', rel, typeof meta.name === 'string' && meta.name.trim().length > 0, 'name 必填')
    check('G4′', rel, Object.prototype.hasOwnProperty.call(meta, 'title_line'), 'title_line 必填（可空串）')
    check('G4′', rel, isInt(meta.order ?? ''), 'order 必填整数')
    check('G3′', rel, !Object.prototype.hasOwnProperty.call(meta, 'photo'), 'photo 给值即拒（I1 无图片面；null 语义＝缺省）')
  }
  if (e.kind === 'publication') {
    check('G4′', rel, meta.slug === e.base, 'slug 与 basename 不一致')
    check('G4′', rel, SLUG_RE.test(meta.slug ?? ''), 'slug 格式非法')
    check('G4′', rel, Array.isArray(meta.authors) && meta.authors.length > 0 && meta.authors.every((a) => a.trim().length > 0), 'authors 必填非空列表')
    check('G4′', rel, meta.attribution === 'team', 'attribution 缺失/非法（fail-closed；v0.3 enum=[team]，example 退役 R26）')
    check('G4′', rel, ['paper', 'paper-note', 'project', 'talk'].includes(meta.kind), 'kind 缺失/非法（fail-closed）')
    if (meta.year !== undefined) check('G4′', rel, isInt(meta.year), 'year 须整数')
  }
  if (gates['G1′']?.violations.some((v) => v.path === rel) || gates['G3′']?.violations.some((v) => v.path === rel) || gates['G4′']?.violations.some((v) => v.path === rel)) bad = 'REJECT'
  verdict(rel, bad ?? 'PASS', bad ? 'G1′/G3′/G4′' : null, bad ? '见 violations' : null)
}
// 配对/唯一性/order（G4′）
const byBase = {}
for (const p of parsed) (byBase[p.kind + ':' + p.base] ??= []).push(p)
for (const key of Object.keys(byBase)) {
  const group = byBase[key]
  const missing = LANGS.filter((l) => !group.some((p) => p.lang === l))
  if (missing.length) { missingTranslations.push({ entry: key, missing }); warnings.push('缺译 WARN（V4 I1 宽容）: ' + key + ' 缺 ' + missing.join(',')) }
}
const seenId = new Map(), seenSlug = new Map(), orderById = new Map(), orderByValue = new Map()
for (const p of parsed) {
  if (p.kind === 'member') {
    const id = p.meta.id
    if (seenId.has(id) && seenId.get(id) !== p.base) fail('G4′', p.rel, '成员 id 跨条目重复: ' + id)
    seenId.set(id, p.base)
    if (orderById.has(id)) {
      if (orderById.get(id) !== p.meta.order) fail('G4′', p.rel, '同成员 zh/en order 不一致')
    } else orderById.set(id, p.meta.order)
    const ov = String(p.meta.order)
    if (orderByValue.has(ov) && orderByValue.get(ov) !== id) fail('G4′', p.rel, 'order 跨成员重复（按 id 计）: ' + ov)
    else orderByValue.set(ov, id)
  }
  if (p.kind === 'publication') {
    const s = p.meta.slug
    if (seenSlug.has(s) && seenSlug.get(s) !== p.base) fail('G4′', p.rel, 'slug 跨条目重复: ' + s)
    seenSlug.set(s, p.base)
  }
}
// about 必需
for (const l of LANGS) if (!parsed.some((p) => p.kind === 'about' && p.lang === l)) { /* 缺译 WARN 已记；about 全缺＝G2′ 布局拒 */ }
if (!parsed.some((p) => p.kind === 'about')) fail('G2′', 'content/about.*.md', 'about 对全缺（核心面必需）')
if (!existsSync(join(CONTENT, 'members'))) fail('G2′', 'content/members/', 'members/ 缺省（核心面必需）')

// —— G5′ 密钥＋产物面 ——
function resolveGitleaks() {
  const cand = [arg('--gitleaks', null), process.env.GITLEAKS_PATH, 'gitleaks'].filter(Boolean)
  for (const c of cand) {
    const r = spawnSync(c, ['version'], { encoding: 'utf8' })
    if (!r.error && r.status === 0) return c
  }
  return null
}
const GL = resolveGitleaks()
if (!GL) fail('G5′', '(scanner)', 'gitleaks 不可用＝fail-closed（扫不了≠干净）；--gitleaks 或 GITLEAKS_PATH 指定')
else {
  const tmp = mkdtempSync(join(tmpdir(), 'ql-gate-'))
  for (const dir of [CONTENT, SRC, DIST]) {
    if (!existsSync(dir)) continue
    const rp = join(tmp, 'gl.json')
    const r = spawnSync(GL, ['detect', '--no-git', '--source', dir, '--report-format', 'json', '--report-path', rp, '--exit-code', '0', '--redact'], { encoding: 'utf8' })
    if (r.error) { fail('G5′', relative(ROOT, dir), 'gitleaks 执行失败: ' + r.error.message); continue }
    check('G5′', relative(ROOT, dir), true, 'gitleaks 扫描执行')
    if (existsSync(rp)) {
      let findings = []
      try { findings = JSON.parse(readFileSync(rp, 'utf8') || '[]') } catch { fail('G5′', relative(ROOT, dir), 'gitleaks 报告不可解析') }
      for (const f of findings) fail('G5′', f.File ?? relative(ROOT, dir), 'gitleaks 命中 rule=' + (f.RuleID ?? '?') + ' line=' + (f.StartLine ?? '?') + '（match 已 redact）')
    }
  }
  rmSync(tmp, { recursive: true, force: true })
}
// QL_DATA 内容字段 data:image 复扫（不盲扫 dist JS 全文）
let QL = null
const dataJs = join(DIST, 'assets', 'data.js')
if (existsSync(dataJs)) {
  scanned++
  const txt = readFileSync(dataJs, 'utf8')
  const m = txt.match(/window\.QL_DATA\s*=\s*([\s\S]*?);\s*$/)
  if (!m) fail('G5′', 'dist/assets/data.js', 'QL_DATA 注入形不可解析')
  else {
    try { QL = JSON.parse(m[1]) } catch { fail('G5′', 'dist/assets/data.js', 'QL_DATA JSON 不可解析') }
  }
  if (QL) {
    const leaves = []
    const push = (v, path) => { if (typeof v === 'string') leaves.push([path, v]); else if (Array.isArray(v)) v.forEach((x, i) => push(x, path + '[' + i + ']')); else if (v && typeof v === 'object') for (const k of Object.keys(v)) push(v[k], path + '.' + k) }
    push(QL.about, 'about'); push(QL.members, 'members'); push(QL.publications, 'publications'); push(QL.team, 'team'); push(QL.home, 'home')
    for (const [path, s] of leaves) if (/data:image/i.test(s)) fail('G5′', 'dist/assets/data.js:' + path, 'QL_DATA 内容字段 data:image 命中')
  }
}

// —— G7′ team/home 形状与状态标记（G6′ 退役，R7）——
gates['G6′'] = { status: 'RETIRED', checks: 0, violations: [], reason: 'R7：I18N 比对形态退役，首页数据化单一来源' }
const teamPath = join(CONTENT, 'team.json')
let team = null
if (!existsSync(teamPath)) fail('G7′', 'content/team.json', 'team.json 缺省（权威载体必需）')
else {
  scanned++
  try { team = JSON.parse(readFileSync(teamPath, 'utf8')) } catch { fail('G7′', 'content/team.json', 'team.json JSON 不可解析') }
}
if (team) {
  const T = 'content/team.json'
  check('G7′', T, ['0.2', '0.3'].includes(team.contractVersion), 'contractVersion 须 0.2|0.3（v0.3 过渡期：C5 content team.json 冻结 0.2，标记升位另批）')
  check('G7′', T, !Object.prototype.hasOwnProperty.call(team, 'fixture'), 'team.fixture 键在场（R26 退役：演示数据禁入正式站，fail-closed）')
  for (const k of ['name', 'couplet', 'mission']) check('G7′', T, bilingual(team[k]), k + ' 双语非空必填')
  const enums = { nameStatus: ['confirmed', 'provisional'], coupletStatus: ['confirmed', 'draft'], missionStatus: ['confirmed', 'draft'] }
  for (const k of Object.keys(enums)) check('G7′', T, team[k] && LANGS.every((l) => enums[k].includes(team[k][l])), k + ' 状态标记缺失/枚举非法')
  check('G7′', T, Array.isArray(team.langs) && LANGS.every((l) => team.langs.includes(l)), 'langs 须含 zh/en')
  check('G7′', T, team.langs?.includes(team.defaultLang), 'defaultLang 须∈langs')
  const memberIds = [...new Set(parsed.filter((p) => p.kind === 'member').map((p) => p.meta.id))].sort()
  check('G7′', T, Array.isArray(team.memberOrder) && [...team.memberOrder].sort().join('|') === memberIds.join('|'), 'memberOrder 与 members id 集合不一致')
  const home = team.home
  check('G7′', T, home && typeof home === 'object', 'home 块缺失（R8）')
  if (home && typeof home === 'object') {
    check('G7′', T, bilingual(home.hero?.eyebrow), 'home.hero.eyebrow 双语非空')
    check('G7′', T, bilingual(home.hero?.mission), 'home.hero.mission 双语非空')
    check('G7′', T, Array.isArray(home.teasers) && home.teasers.length > 0, 'home.teasers 须非空数组')
    const tids = new Set()
    for (const t of home.teasers ?? []) {
      const tp = T + '.teasers[' + (t?.id ?? '?') + ']'
      check('G7′', tp, SLUG_RE.test(t?.id ?? ''), 'teaser id 格式非法')
      check('G7′', tp, !tids.has(t?.id), 'teaser id 重复')
      tids.add(t?.id)
      check('G7′', tp, typeof t?.enabled === 'boolean', 'teaser enabled 须 JSON 布尔')
      check('G7′', tp, bilingual(t?.title), 'teaser title 双语非空')
      check('G7′', tp, bilingual(t?.text), 'teaser text 双语非空')
    }
  }
  if (PHASE === 'push') {
    if (!QL) fail('G7′', 'dist/assets/data.js', 'push 阶段 dist 数据面缺省/不可解析（先 build 再推）')
    else {
      const expectTeam = { ...team }; delete expectTeam.home; delete expectTeam.note
      const diffPath = (a, b, p) => {
        if (a === b) return null
        if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return p
        const ks = new Set([...Object.keys(a), ...Object.keys(b)])
        for (const k of ks) { const d = diffPath(a[k], b[k], p + '.' + k); if (d) return d }
        return null
      }
      const d1 = diffPath(QL.team, expectTeam, 'QL_DATA.team')
      check('G7′', 'dist/assets/data.js', !d1, 'QL_DATA.team 与 team.json 映射不一致: ' + (d1 ?? ''))
      const d2 = diffPath(QL.home, team.home, 'QL_DATA.home')
      check('G7′', 'dist/assets/data.js', !d2, 'QL_DATA.home 与 team.json.home 不一致: ' + (d2 ?? ''))
      check('G7′', 'dist/assets/data.js', !(QL.team && Object.prototype.hasOwnProperty.call(QL.team, 'fixture')), 'QL_DATA.team.fixture 键在场（R26 退役，fail-closed）')
    }
  }
}
verdict('content/team.json', team && gates['G7′'].status === 'PASS' ? 'PASS' : 'REJECT', 'G7′', null)

// —— G8′ docs 镜像（R30：Pages 源=master /docs；v0.3.1 增补，build＋push 双相 fail-closed）——
const DOCS = join(ROOT, 'docs')
const distExists = existsSync(DIST)
const docsExists = existsSync(DOCS)
const listFiles = (dir, base = '') => readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1)).flatMap((e) => e.isDirectory() ? listFiles(join(dir, e.name), base ? base + '/' + e.name : e.name) : [base ? base + '/' + e.name : e.name])
if (!distExists) {
  check('G8′', 'docs/', !docsExists, 'dist 缺席而 docs 在场（无镜像源＝不可核验，fail-closed）')
} else {
  if (check('G8′', 'docs/', docsExists, 'docs/ 缺省（R30 镜像必需，fail-closed）')) {
    const distFiles = listFiles(DIST)
    const docsFiles = listFiles(DOCS)
    scanned += docsFiles.length
    const extras = docsFiles.filter((f) => !distFiles.includes(f))
    check('G8′', 'docs/', extras.length === 2 && extras.includes('CNAME') && extras.includes('.nojekyll'), 'docs 额外文件须恰为 CNAME＋.nojekyll: ' + (extras.join(',') || '(无)'))
    for (const f of distFiles) {
      const dp = join(DOCS, f)
      check('G8′', 'docs/' + f, existsSync(dp) && readFileSync(dp).equals(readFileSync(join(DIST, f))), 'docs 与 dist 逐字节不一致/缺件（镜像须全等）')
    }
    const cname = join(DOCS, 'CNAME')
    check('G8′', 'docs/CNAME', existsSync(cname) && readFileSync(cname, 'utf8').trim() === 'qinluolab.com', 'CNAME 缺失或内容 trim 后≠qinluolab.com')
    check('G8′', 'docs/.nojekyll', existsSync(join(DOCS, '.nojekyll')), '.nojekyll 缺省（Pages 须绕过 Jekyll）')
  }
}
verdict('docs/', gates['G8′'].status === 'PASS' ? 'PASS' : 'REJECT', 'G8′', null)

// —— 对账表双输出：失败先落表再 exit 1 ——
const rejected = Object.values(gates).filter((g) => g.status === 'REJECT').length
const memberPairs = new Set(parsed.filter((p) => p.kind === 'member').map((p) => p.base)).size
const pubPairs = new Set(parsed.filter((p) => p.kind === 'publication').map((p) => p.base)).size
const report = {
  runAt: new Date().toISOString(), root: ROOT, phase: PHASE, contract: 'v0.3.1',
  gates, scanned, planned: 2 + memberPairs * 2 + pubPairs * 2 + 1, rejected,
  warnings, missingTranslations, perFile,
}
mkdirSync(join(REPORT, '..'), { recursive: true })
writeFileSync(REPORT, JSON.stringify(report, null, 2) + '\n', 'utf8')
console.log('HARNESS ' + (rejected ? 'REJECT_RUN' : 'ALL_GREEN') + ' phase=' + PHASE + ' scanned=' + scanned + ' planned=' + report.planned + ' rejectedGates=' + rejected + ' warnings=' + warnings.length)
for (const id of ['G1′', 'G2′', 'G3′', 'G4′', 'G5′', 'G6′', 'G7′', 'G8′']) {
  const g = gates[id]
  console.log('  ' + id + ' ' + (g?.status ?? 'PASS') + ' checks=' + (g?.checks ?? 0) + ' violations=' + (g?.violations.length ?? 0))
  for (const v of g?.violations ?? []) console.log('    ! ' + v.path + ' :: ' + v.reason)
}
for (const w of warnings) console.log('  WARN ' + w)
console.log('  report=' + REPORT)
process.exit(rejected ? 1 : 0)