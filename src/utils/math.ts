import { Marked, type Tokens } from 'marked'
import DOMPurify from 'dompurify'

/** prose 严格消毒配置：与 utils/markdown.ts 逐字一致，数学特性不得放宽此路径。 */
const PROSE_SANITIZE = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe'],
  FORBID_ATTR: ['style', 'onerror', 'onclick'],
}

/** 数学专用最小放行：仅 KaTeX htmlAndMathml 输出所需标签/属性；危险项一律 FORBID。
 *  trust:false 已使 KaTeX 不生成 a/img，此处再显式禁用以形成双保险。
 *  F2-D：KaTeX 0.19 的高定界符（bmatrix 方括号等）输出为 svg>path 纯几何，
 *  故仅 ADD_TAGS svg/path + 几何属性；use/image/animate/foreignObject/a/style/script
 *  均不在放行面内（FORBID 或默认拒绝），括号字形得以保留且注入面不扩大。 */
export const MATH_SANITIZE = {
  USE_PROFILES: { html: true, mathMl: true },
  ADD_TAGS: ['svg', 'path'],
  ADD_ATTR: [
    'class', 'style', 'aria-hidden', 'encoding',
    'xmlns', 'viewbox', 'viewBox', 'd', 'width', 'height', 'fill', 'stroke', 'preserveaspectratio',
  ],
  FORBID_TAGS: [
    'style', 'form', 'input', 'button', 'iframe', 'script', 'object', 'embed',
    'a', 'img', 'foreignobject', 'link', 'meta', 'base', 'textarea', 'select',
  ],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'href', 'src', 'srcset', 'xlink:href', 'formaction'],
  ALLOW_DATA_ATTR: false,
}

/** KaTeX 渲染选项：trust:false 强制（trust:true 实测会存活外部图片注入）。 */
const KATEX_OPTS = {
  trust: false,
  throwOnError: false,
  output: 'htmlAndMathml',
  strict: 'warn',
} as const

// 块级 $$...$$（可跨行，非贪婪到首个闭合 $$）。
const BLOCK_MATH = /^\$\$([\s\S]+?)\$\$/
// 行内展示 $$...$$（不跨行）。
const INLINE_DISPLAY_MATH = /^\$\$([^$\n]+?)\$\$/
// 全文任意位置的块级数学探测（hasMath 用，非锚定）。
const BLOCK_MATH_ANY = /\$\$[\s\S]+?\$\$/

/** 行内数学扫描（brace-aware），从 src[0] 的 $ 起：
 *  - $$...$$ 为行内展示，$...$ 为行内；
 *  - 跟踪花括号深度：\text{...} 等组内的 $ 视为内容（KaTeX 支持 \text{$F$} 嵌套数学），
 *    仅深度 0 的 $ 作为闭合定界符，故行内 $...$ 内可安全嵌套 \text{$...$} 而不提前闭合；
 *  - 开 $ 后不接空白；闭 $ 前不接空白、后不接数字（货币守卫，避免 $5/$10 误判）；
 *  - 遇反引号交给 marked codespan；不跨行；反斜杠转义整体跳过。 */
function scanInlineMath(src: string): { raw: string; text: string; display: boolean } | null {
  if (src[0] !== '$') return null
  if (src[1] === '$') {
    const m = INLINE_DISPLAY_MATH.exec(src)
    return m && !m[1].includes('`') ? { raw: m[0], text: m[1].trim(), display: true } : null
  }
  if (src.length < 2 || /\s/.test(src[1])) return null
  let depth = 0
  for (let i = 1; i < src.length; i++) {
    const ch = src[i]
    if (ch === '\n') return null
    if (ch === '\\') { i++; continue }
    if (ch === '`') return null
    if (ch === '{') { depth++; continue }
    if (ch === '}') { if (depth > 0) depth--; continue }
    if (ch === '$' && depth === 0) {
      const prev = src[i - 1]
      const next = src[i + 1]
      if (!/\s/.test(prev) && !(next !== undefined && /\d/.test(next))) {
        return { raw: src.slice(0, i + 1), text: src.slice(1, i), display: false }
      }
      return null
    }
  }
  return null
}

/** 廉价检测：是否需要加载 KaTeX。跳过代码围栏/行内代码/转义 \$；在全文任意位置检测，
 *  避免锚定正则只识别串首数学的漏判（真实文章数学几乎总在正文中部）。 */
export function hasMath(source: string): boolean {
  if (!source || !source.includes('$')) return false
  const stripped = source
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
    .replace(/`[^`\n]*`/g, '')
    .replace(/\\\$/g, '')
  if (BLOCK_MATH_ANY.test(stripped)) return true
  for (let i = stripped.indexOf('$'); i >= 0; i = stripped.indexOf('$', i + 1)) {
    if (scanInlineMath(stripped.slice(i))) return true
  }
  return false
}

/** 数学段渲染：KaTeX → 数学专用消毒 → 占位符；prose 走原严格消毒后再回填。
 *  两条路径各自消毒，数学标记不经过（也不放宽）prose 严格配置。 */
export async function renderMarkdownWithMath(source: string): Promise<string> {
  const mod = await import('katex')
  const katex = mod.default
  const nonce = Math.random().toString(36).slice(2, 10)
  const store: string[] = []

  const emit = (tex: string, display: boolean): string => {
    const raw = katex.renderToString(tex, { ...KATEX_OPTS, displayMode: display })
    const safe = DOMPurify.sanitize(raw, MATH_SANITIZE)
    const idx = store.push(safe) - 1
    const ph = `${nonce}:${idx}`
    return display
      ? `<div class="math-block" data-math-ph="${ph}"></div>`
      : `<span class="math-inline" data-math-ph="${ph}"></span>`
  }

  const toToken = (type: string, raw: string, text: string): Tokens.Generic =>
    ({ type, raw, text }) as Tokens.Generic

  const md = new Marked({ gfm: true, breaks: false })
  md.use({
    extensions: [
      {
        name: 'blockMath',
        level: 'block',
        start(src: string) {
          const i = src.indexOf('$$')
          return i < 0 ? undefined : i
        },
        tokenizer(src: string) {
          const m = BLOCK_MATH.exec(src)
          return m ? toToken('blockMath', m[0], m[1].trim()) : undefined
        },
        renderer(token: Tokens.Generic) {
          return emit(String(token.text ?? ''), true)
        },
      },
      {
        name: 'inlineMath',
        level: 'inline',
        start(src: string) {
          const i = src.indexOf('$')
          return i < 0 ? undefined : i
        },
        tokenizer(src: string) {
          const m = scanInlineMath(src)
          return m ? toToken('inlineMath', m.raw, m.text) : undefined
        },
        renderer(token: Tokens.Generic) {
          return emit(String(token.text ?? ''), token.raw.startsWith('$$'))
        },
      },
    ],
  })

  const rawHtml = md.parse(source, { async: false }) as string
  const proseSafe = DOMPurify.sanitize(rawHtml, PROSE_SANITIZE)

  // 回填：仅认本次渲染的随机 nonce，作者伪造的占位符不会被替换为任何内容。
  const doc = new DOMParser().parseFromString(proseSafe, 'text/html')
  for (const node of Array.from(doc.querySelectorAll('[data-math-ph]'))) {
    const key = node.getAttribute('data-math-ph') ?? ''
    node.removeAttribute('data-math-ph')
    if (!key.startsWith(`${nonce}:`)) continue
    const safe = store[Number(key.slice(nonce.length + 1))]
    if (typeof safe === 'string') node.innerHTML = safe
  }
  return doc.body.innerHTML
}