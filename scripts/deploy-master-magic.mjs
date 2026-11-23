#!/usr/bin/env node
// 在 GitHub Actions 内把 dist/ 构建产物同步到 master:/docs/magic/ 与 master:/src/magic/。
// 只改这两个子目录，不碰团队站根文件、CNAME、404、.nojekyll、/qiny/。
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const API = process.env.GITHUB_API_URL || 'https://api.github.com'
const REPO = process.env.GITHUB_REPOSITORY || 'domagic/domagic.github.io'

const argv = process.argv.slice(2)
function arg(name, fallback = '') {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : fallback
}
const DRY_RUN = argv.includes('--dry-run')
const TOKEN = process.env.GITHUB_TOKEN
if (!DRY_RUN && !TOKEN) throw new Error('GITHUB_TOKEN missing')

const SOURCE = path.resolve(arg('--source', 'dist'))
const BRANCH = arg('--branch', 'master')
const MESSAGE = arg('--message', `deploy magic: ${process.env.GITHUB_SHA || ''}`.trim())
const PREFIXES = ['docs/magic', 'src/magic']

if (!fs.existsSync(SOURCE)) throw new Error('source not found: ' + SOURCE)

const headers = {
  Authorization: 'Bearer ' + TOKEN,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
}

async function api(method, url, body, tries = 6) {
  let last
  for (let i = 0; i < tries; i++) {
    const r = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await r.text()
    if (r.ok) return text ? JSON.parse(text) : {}
    last = new Error(`${method} ${url} -> ${r.status} ${text.slice(0, 300)}`)
    last.status = r.status
    if (r.status === 429 || r.status >= 500) {
      await new Promise((res) => setTimeout(res, 1000 * (i + 1)))
      continue
    }
    if (r.status === 409 || r.status === 422) return last
    throw last
  }
  throw last
}

function blobSha(buf) {
  return crypto.createHash('sha1').update('blob ' + buf.length + '\0').update(buf).digest('hex')
}

function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name)
    if (e.isDirectory()) walk(abs, base, out)
    else out.push(path.relative(base, abs).split(path.sep).join('/'))
  }
  return out
}

function rewrite(rel, s) {
  const original = s
  if (rel === 'index.html') {
    s = s.replaceAll('"/assets/', '"/magic/assets/').replaceAll('"/favicon.svg', '"/magic/favicon.svg')
    const tag = '<script type="module" crossorigin'
    if (!s.includes('/magic/assets/ql-redirect.js')) {
      if (s.includes(tag)) {
        s = s.replace(tag, '<script src="/magic/assets/ql-redirect.js"></script>\n    ' + tag)
      } else {
        throw new Error('index.html 未找到模块脚本标签，无法注入路由还原脚本')
      }
    }
  } else if (rel === '404.html') {
    s = s.replaceAll('"/assets/', '"/magic/assets/').replaceAll('"/favicon.svg', '"/magic/favicon.svg')
  } else if (/^assets\/katex-.*\.css$/.test(rel)) {
    s = s.replaceAll('url(/assets/', 'url(/magic/assets/')
  } else if (rel.endsWith('.js')) {
    s = s.replaceAll('`/media/', '`/magic/media/')
  } else if (rel === 'media/manifest.json') {
    s = s.replaceAll('"/media/', '"/magic/media/')
  } else if (rel === 'robots.txt') {
    s = s.replace('https://domagic.github.io/sitemap.xml', 'https://qinluolab.com/magic/sitemap.xml')
    s = s.replaceAll('Disallow: /', 'Disallow: /magic/')
  } else if (rel === 'sitemap.xml') {
    s = s.replaceAll('https://domagic.github.io/', 'https://qinluolab.com/magic/')
  }

  // Vite 压缩后的 history 函数名每次构建可能变化，用通用匹配避免漏改路由 base。
  if (/^assets\/index-.*\.js$/.test(rel)) {
    const re = /history:([A-Za-z_$][\w$]*)\("\/"\)/g
    const hits = s.match(re) || []
    if (hits.length > 1) throw new Error(rel + ' 路由 base 命中数异常: ' + hits.length)
    if (hits.length === 1) s = s.replace(re, (_m, fn) => `history:${fn}("/magic/")`)
    else if (/createWebHistory|WebHistory|history:/.test(s) && !/history:[A-Za-z_$][\w$]*\("\/magic\/"\)/.test(s)) {
      console.warn('WARN 未识别路由 base 写法，请人工检查 ' + rel + ' 的 createWebHistory base')
    }
  }

  // Vite modulepreload 辅助函数把相对依赖拼到 BASE_URL（原为 "/"）。
  if (rel.endsWith('.js')) {
    const re = /return"\/"\+([A-Za-z_$][\w$]*)/g
    const hits = s.match(re) || []
    if (hits.length > 1) throw new Error(rel + ' preload base 命中数异常: ' + hits.length)
    if (hits.length === 1) s = s.replace(re, (_m, v) => `return"/magic/"+${v}`)
  }

  if (s !== original) console.log('REWRITE ' + rel)
  return s
}

function finalCheck(rel, s) {
  const bad = [
    'src="/assets/',
    'href="/assets/',
    'url(/assets/',
    '`/media/',
    '"/media/',
    'src="/favicon.svg',
    'href="/favicon.svg',
    'https://domagic.github.io/',
    'return"/"+',
  ]
  for (const k of bad) {
    if (s.includes(k)) throw new Error(rel + ' 仍含未改写的绝对路径: ' + k)
  }
  if (/^assets\/index-.*\.js$/.test(rel) && /history:[A-Za-z_$][\w$]*\("\/"\)/.test(s)) {
    throw new Error(rel + ' 仍含未改写的路由 base')
  }
}

function buildLocalFiles() {
  const files = new Map()
  const rels = walk(SOURCE).filter((r) => r !== 'CNAME' && r !== '.nojekyll')
  for (const rel of rels) {
    let buf = fs.readFileSync(path.join(SOURCE, rel))
    if (/\.(html|js|css|xml|txt|json|svg)$/i.test(rel)) {
      let s = buf.toString('utf8')
      s = rewrite(rel, s)
      finalCheck(rel, s)
      buf = Buffer.from(s, 'utf8')
    }
    for (const prefix of PREFIXES) files.set(prefix + '/' + rel, buf)
  }
  const redirect = Buffer.from(
    "(function(){try{var q=new URLSearchParams(location.search).get('redirect');if(q&&q.indexOf('/magic/')===0){history.replaceState(null,'',q)}}catch(e){}})();\n",
    'utf8'
  )
  for (const prefix of PREFIXES) files.set(prefix + '/assets/ql-redirect.js', redirect)
  return files
}

const uploaded = new Set()
async function uploadBlob(buf, sha) {
  if (uploaded.has(sha)) return
  await api('POST', `${API}/repos/${REPO}/git/blobs`, {
    content: buf.toString('base64'),
    encoding: 'base64',
  })
  uploaded.add(sha)
  await new Promise((res) => setTimeout(res, 120))
}

async function commitOnce(files) {
  const branch = await api('GET', `${API}/repos/${REPO}/branches/${BRANCH}`)
  if (branch instanceof Error) throw branch
  const baseCommit = branch.commit.sha
  const baseTree = branch.commit.commit.tree.sha
  const treeResp = await api('GET', `${API}/repos/${REPO}/git/trees/${baseTree}?recursive=1`)
  if (treeResp instanceof Error) throw treeResp
  if (treeResp.truncated) throw new Error('master tree truncated，拒绝提交')

  const remote = new Map(treeResp.tree.filter((x) => x.type === 'blob').map((x) => [x.path, x.sha]))
  const localSet = new Set(files.keys())
  const changed = []
  const blobs = new Map()
  for (const [p, buf] of files) {
    const sha = blobSha(buf)
    blobs.set(sha, buf)
    if (remote.get(p) !== sha) changed.push({ path: p, sha })
  }
  const deletable = (p) => PREFIXES.some((prefix) => p.startsWith(prefix + '/'))
  const removed = [...remote.keys()].filter((p) => !localSet.has(p) && deletable(p))
  console.log(`LOCAL=${localSet.size} CHANGED=${changed.length} REMOVED=${removed.length}`)
  if (!changed.length && !removed.length) return { ok: true, sha: baseCommit }

  const remoteShas = new Set(remote.values())
  const needUpload = []
  for (const [sha, buf] of blobs) {
    if (!changed.some((c) => c.sha === sha)) continue
    if (remoteShas.has(sha)) continue
    needUpload.push({ sha, buf })
  }
  console.log('UPLOAD_BLOBS=' + needUpload.length)
  await Promise.all(
    Array.from({ length: 3 }, async () => {
      while (needUpload.length) {
        const item = needUpload.shift()
        await uploadBlob(item.buf, item.sha)
      }
    })
  )

  const entries = [
    ...changed.map((c) => ({ path: c.path, mode: '100644', type: 'blob', sha: c.sha })),
    ...removed.map((p) => ({ path: p, mode: '100644', type: 'blob', sha: null })),
  ]
  let treeResult
  for (let i = 0; i < entries.length; i += 800) {
    const part = entries.slice(i, i + 800)
    treeResult = await api('POST', `${API}/repos/${REPO}/git/trees`, {
      base_tree: treeResult ? treeResult.sha : baseTree,
      tree: part,
    })
    if (treeResult instanceof Error) throw treeResult
  }
  const commit = await api('POST', `${API}/repos/${REPO}/git/commits`, {
    message: MESSAGE,
    tree: treeResult.sha,
    parents: [baseCommit],
  })
  if (commit instanceof Error) throw commit

  const patched = await api('PATCH', `${API}/repos/${REPO}/git/refs/heads/${BRANCH}`, {
    sha: commit.sha,
    force: false,
  })
  if (patched instanceof Error) return patched
  console.log('MASTER=' + commit.sha)
  return { ok: true, sha: commit.sha }
}

async function main() {
  const files = buildLocalFiles()
  if (DRY_RUN) {
    console.log('DRY_RUN_OK files=' + files.size)
    return
  }
  for (let attempt = 1; attempt <= 4; attempt++) {
    const result = await commitOnce(files)
    if (result.ok) return
    if (attempt === 4) throw result
    console.warn(`ref moved, retry ${attempt + 1}/4: ${result.message}`)
    await new Promise((res) => setTimeout(res, 1500 * attempt))
  }
}
main().catch((e) => {
  console.error('DEPLOY_MASTER_MAGIC_FAIL ' + e.message)
  process.exit(1)
})
