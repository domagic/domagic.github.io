import { copyFileSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const dist = join(process.cwd(), 'dist')
const siteUrl = 'https://domagic.github.io'

// GitHub Pages SPA 回退：未知路径返回 404.html，由前端路由接管渲染
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))

const routes = ['/', '/about', '/blog', '/opinions', '/academic', '/privacy']
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${siteUrl}${r}</loc></url>`).join('\n')}
</urlset>
`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)

// —— 契约 v1.2 §2.B 引用断链门 + 守卫断言（fail-closed，job2 产物内断言）——
// 三道检查：①manifest 每个资产在 dist 实体存在且 bytes/sha256 与清单一致（拷贝完整性）；
// ②dataset 正文每个 assets/ 相对引用按栏目映射后必须命中清单（断链=发布中止）；
// ③四级守卫复核：单图≤5MiB、单篇引用≤20、全站≤300 张且≤150MiB。
// 无 manifest 且无正文引用 = 纯文本 run，行为与既往逐字一致。
const ASSET_REF_IN_MD = /!\[[^\]]*\]\(\s*(assets\/[^\s)]+)(?:\s+[^)]*)?\)/g
const MEDIA_SINGLE_MAX = 5 * 1024 * 1024
const MEDIA_COUNT_MAX = 300
const MEDIA_TOTAL_MAX = 150 * 1024 * 1024
const PER_POST_MAX = 20

function mediaFail(msg) {
  console.error(`POSTBUILD_MEDIA_GATE_FAIL: ${msg}`)
  process.exit(1)
}

const datasetPath = join(process.cwd(), 'src/api/static/data/dataset.json')
const manifestPath = join(dist, 'media/manifest.json')
const dataset = JSON.parse(readFileSync(datasetPath, 'utf8'))

const refs = [] // { post: slug, category, ref: 'assets/<dir>/<file>' }
for (const post of dataset.posts ?? []) {
  let n = 0
  for (const m of post.contentMd?.matchAll(ASSET_REF_IN_MD) ?? []) {
    n++
    refs.push({ post: post.slug, category: post.type, ref: m[1] })
  }
  if (n > PER_POST_MAX) mediaFail(`单篇图片引用超限：posts[${post.slug}] ${n} > ${PER_POST_MAX}`)
}

if (!existsSync(manifestPath)) {
  if (refs.length > 0) {
    mediaFail(`正文含 ${refs.length} 处 assets/ 引用但 dist 无 media/manifest.json（清单缺失=断链）`)
  }
} else {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const assets = manifest.assets
  if (!Array.isArray(assets)) mediaFail('media/manifest.json 缺 assets 数组')
  if (assets.length > MEDIA_COUNT_MAX) mediaFail(`全站图片总数超限：${assets.length} > ${MEDIA_COUNT_MAX}`)
  const urlPaths = new Set()
  let total = 0
  for (const a of assets) {
    if (typeof a.urlPath !== 'string' || !a.urlPath.startsWith('/media/')) {
      mediaFail(`清单条目 urlPath 非法：${a.urlPath}`)
    }
    if (urlPaths.has(a.urlPath)) mediaFail(`清单 urlPath 重复：${a.urlPath}`)
    urlPaths.add(a.urlPath)
    if (!Number.isInteger(a.bytes) || a.bytes <= 0 || a.bytes > MEDIA_SINGLE_MAX) {
      mediaFail(`单图字节超限：${a.relPath} bytes=${a.bytes}`)
    }
    total += a.bytes
    if (total > MEDIA_TOTAL_MAX) mediaFail(`全站图片总字节超限 150 MiB：${total}`)
    const file = join(dist, ...a.urlPath.slice(1).split('/'))
    if (!existsSync(file)) mediaFail(`清单资产在 dist 缺失：${a.urlPath}`)
    if (statSync(file).size !== a.bytes) mediaFail(`dist 文件字节与清单不符：${a.urlPath}`)
    const sha = createHash('sha256').update(readFileSync(file)).digest('hex')
    if (sha !== a.sha256) mediaFail(`dist 文件 sha256 与清单不符（拷贝损坏）：${a.urlPath}`)
  }
  for (const r of refs) {
    const rest = r.ref.slice('assets/'.length)
    // 扩展名限小写位图白名单：与 sync 清单规则及 Linux 大小写敏感托管逐字一致，
    // 大写扩展引用视为非法（防止"清单命中但 dist 实体 404"的假绿）。
    if (!/^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.(?:png|jpe?g|gif|webp)$/.test(rest)) {
      mediaFail(`正文引用形状非法（一层目录+小写位图扩展）：posts[${r.post}] ${r.ref}`)
    }
    const expected = `/media/${r.category}/${rest}`
    if (!urlPaths.has(expected)) {
      mediaFail(`引用断链：posts[${r.post}] ${r.ref} → ${expected} 未命中清单实体`)
    }
  }
  console.log(`postbuild: media gate OK assets=${assets.length} bytes=${total} refs=${refs.length}`)
}

console.log('postbuild: 404.html + sitemap.xml generated')