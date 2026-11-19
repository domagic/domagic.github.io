#!/usr/bin/env node
/**
 * P5-C1 终稿（v1.3 A.2-4）媒体落位器：content/ 位图 → public/media/<栏目>/<图片目录>/<文件名>。
 * 用法：node scripts/stage-media.mjs [--content-dir content] [--manifest public/media/manifest.json]
 * cwd＝站点仓根（FE 源码即仓根）。必须在 sync-static-data.mjs 之后、vite build 之前执行。
 *
 * 输入＝sync 写出的 public/media/manifest.json（字段 relPath/sha256/bytes/mime/urlPath，
 * v1.2 §E 口径）。relPath 以 contentDir 为基准（实形不含 content/ 前缀；契约源树写法
 * 含之前缀作可选容忍，两写法同映射——FE 链 Batch2 已申报的双形状口径）。
 *
 * fail-closed：任一资产源缺失／字节不符／sha256 不符＝exit 1，workflow 中止，线上保持旧版。
 * postbuild 随后对 dist 产物面做 bytes+sha 双配复核（拷贝链双保险）。
 */
import { readFileSync, copyFileSync, mkdirSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { createHash } from 'node:crypto'

function arg(name, dflt) {
  const i = process.argv.indexOf(name)
  if (i < 0) return dflt
  const v = process.argv[i + 1]
  if (!v) { console.error(`STAGE_MEDIA_FAIL: ${name} 缺少路径参数`); process.exit(1) }
  return v
}
const CONTENT_DIR = resolve(arg('--content-dir', 'content'))
const MANIFEST = resolve(arg('--manifest', 'public/media/manifest.json'))
const PUBLIC_DIR = resolve('public')

function fail(msg) {
  console.error(`STAGE_MEDIA_FAIL: ${msg}`)
  process.exit(1)
}

let manifest
try {
  manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
} catch (e) {
  // 无清单＝纯文本 run（sync 无 --assets-manifest 或零图片时不落清单），零落位即成功。
  if (e.code === 'ENOENT') {
    console.log('STAGE_MEDIA_OK assets=0 bytes=0 (no manifest, text-only run)')
    process.exit(0)
  }
  fail(`清单不可解析：${e.message}`)
}
if (!Array.isArray(manifest.assets)) fail('manifest 缺 assets 数组')

let total = 0
for (const a of manifest.assets) {
  if (typeof a.relPath !== 'string' || typeof a.urlPath !== 'string' || !a.urlPath.startsWith('/media/')) {
    fail(`清单条目形状非法：${JSON.stringify(a)}`)
  }
  const rel = a.relPath.startsWith('content/') ? a.relPath.slice('content/'.length) : a.relPath
  const src = join(CONTENT_DIR, rel)
  const dst = join(PUBLIC_DIR, ...a.urlPath.slice(1).split('/'))
  let buf
  try {
    buf = readFileSync(src)
  } catch (e) {
    fail(`源图片缺失：${src} (${e.message})`)
  }
  if (buf.length !== a.bytes) fail(`源图片字节与清单不符：${a.relPath} bytes=${buf.length} manifest=${a.bytes}`)
  const sha = createHash('sha256').update(buf).digest('hex')
  if (sha !== a.sha256) fail(`源图片 sha256 与清单不符：${a.relPath}`)
  mkdirSync(dirname(dst), { recursive: true })
  copyFileSync(src, dst)
  if (statSync(dst).size !== a.bytes) fail(`落位后字节复核失败：${a.urlPath}`)
  const dstSha = createHash('sha256').update(readFileSync(dst)).digest('hex')
  if (dstSha !== a.sha256) fail(`落位后 sha256 复核失败：${a.urlPath}`)
  total += a.bytes
}
console.log(`STAGE_MEDIA_OK assets=${manifest.assets.length} bytes=${total}`)
