// F3：从 node_modules/katex 生成自托管数学字体与样式（woff2-only，禁 CDN）。
// 可复跑：升级 KaTeX 后重跑本脚本即可同步字体与 CSS。产物纳入源码，构建不依赖本脚本。
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const katexDist = join(root, 'node_modules', 'katex', 'dist')
const css = readFileSync(join(katexDist, 'katex.min.css'), 'utf8')

const fontOut = join(root, 'src', 'assets', 'katex-fonts')
mkdirSync(fontOut, { recursive: true })

const used = new Set()
let blocks = 0
const out = css.replace(/@font-face\{[^}]*\}/g, (block) => {
  const m = block.match(/url\(fonts\/([^)]+\.woff2)\)\s*format\("woff2"\)/)
  if (!m) throw new Error(`@font-face 缺少 woff2 源：${block}`)
  used.add(m[1])
  blocks += 1
  // 仅保留 woff2（es2022 目标浏览器全支持），路径改为本地相对路径由 Vite 处理并哈希
  return block.replace(/src:[^}]+/, `src:url(../assets/katex-fonts/${m[1]}) format("woff2")`)
})

if (blocks !== 20) throw new Error(`@font-face 数量异常：${blocks}（预期 20）`)
if (/url\(fonts\//.test(out)) throw new Error('仍残留 katex 原始 fonts/ 相对路径')
if (/https?:\/\//.test(out)) throw new Error('KaTeX CSS 含外部 URL，违反禁 CDN')

for (const f of used) copyFileSync(join(katexDist, 'fonts', f), join(fontOut, f))
writeFileSync(join(root, 'src', 'styles', 'katex.css'), out)

console.log(`prepare-katex: ${used.size} 个 woff2 字体 + katex.css（woff2-only，自托管，0 外链）`)