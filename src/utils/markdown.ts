import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { applyImagePolicy, applyLinkPolicy, type MarkdownRenderOptions } from './media'

marked.setOptions({ gfm: true, breaks: false })

/** 中文稿正文里的成对英文直双引号 " 转成中文弯引号 “ ”（英文稿不含中文字符，原样跳过）。
 *  必须在源文本层成对处理：行内公式 $x$ 会把一对引号拆成两个 DOM 文本节点，
 *  渲染后逐节点处理会导致开闭错位。跳过代码块/行内代码/数学段/原始 HTML 标签，
 *  避免破坏代码与属性，也不让属性引号干扰正文的奇偶配对。 */
export function normalizeCjkQuotes(source: string): string {
  if (!source || !source.includes('"')) return source
  if (!/[\u3400-\u9fff]/.test(source)) return source

  let result = ''
  let openQuote = true
  let i = 0
  const len = source.length

  while (i < len) {
    const ch = source[i]

    // 反斜杠转义：连同下一个字符原样保留
    if (ch === '\\' && i + 1 < len) {
      result += source.slice(i, i + 2)
      i += 2
      continue
    }

    // 围栏代码块 ``` 或 ~~~（行首识别）
    if ((ch === '`' || ch === '~') && (i === 0 || source[i - 1] === '\n')) {
      const fence = source.startsWith('```', i)
        ? '```'
        : source.startsWith('~~~', i)
          ? '~~~'
          : null
      if (fence) {
        const end = source.indexOf(fence, i + 3)
        const stop = end < 0 ? len : end + 3
        result += source.slice(i, stop)
        i = stop
        continue
      }
    }

    // 行内代码 `...`（不跨行）
    if (ch === '`') {
      const end = source.indexOf('`', i + 1)
      const nl = source.indexOf('\n', i + 1)
      if (end > i && (nl < 0 || end < nl)) {
        result += source.slice(i, end + 1)
        i = end + 1
        continue
      }
    }

    // 数学段 $$...$$ 与 $...$
    if (ch === '$') {
      let stop = -1
      if (source.startsWith('$$', i)) {
        const end = source.indexOf('$$', i + 2)
        if (end >= i + 2) stop = end + 2
      } else {
        let j = i + 1
        while (j < len && source[j] !== '\n') {
          if (source[j] === '\\') {
            j += 2
            continue
          }
          if (source[j] === '$') {
            stop = j + 1
            break
          }
          j++
        }
      }
      if (stop > i) {
        result += source.slice(i, stop)
        i = stop
        continue
      }
    }

    // 原始 HTML 标签（含 <https://...> 自动链接）：整段原样保留，
    // 属性引号不参与转换，既不破坏属性也不干扰正文引号的奇偶配对。
    if (ch === '<' && i + 1 < len && /[A-Za-z!/]/.test(source[i + 1])) {
      const end = source.indexOf('>', i + 1)
      if (end > i) {
        result += source.slice(i, end + 1)
        i = end + 1
        continue
      }
    }

    // 正文直双引号：按出现次序交替为开 “ / 闭 ”
    if (ch === '"') {
      result += openQuote ? '\u201c' : '\u201d'
      openQuote = !openQuote
      i++
      continue
    }

    result += ch
    i++
  }
  return result
}

/** marked/CommonMark 的右_flanking 规则：当 ** 前为标点、后为文字时（中文常见，
 *  如「互动。**主动式互动（Proactive Interaction）**指助手」），闭合 ** 不会被识别，
 *  星号原样出现在正文里。消毒后在文本节点上补齐这类漏判的 <strong>，不改动原文。 */
export function fixLiteralBold(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
  const targets: Text[] = []
  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    if (!node.nodeValue?.includes('**')) continue
    if (node.parentElement?.closest('code, pre, script, style')) continue
    targets.push(node)
  }
  for (const node of targets) {
    const text = node.nodeValue ?? ''
    const frag = doc.createDocumentFragment()
    const re = /\*\*([^*\n]+?)\*\*/g
    let idx = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      if (m.index > idx) frag.appendChild(doc.createTextNode(text.slice(idx, m.index)))
      const strong = doc.createElement('strong')
      strong.textContent = m[1]
      frag.appendChild(strong)
      idx = re.lastIndex
    }
    if (idx < text.length) frag.appendChild(doc.createTextNode(text.slice(idx)))
    node.replaceWith(frag)
  }
  return doc.body.innerHTML
}

export function renderMarkdown(source: string, options: MarkdownRenderOptions = {}): string {
  const html = marked.parse(normalizeCjkQuotes(source), { async: false }) as string
  const safe = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe'],
    FORBID_ATTR: ['style', 'onerror', 'onclick'],
  })
  return applyLinkPolicy(applyImagePolicy(fixLiteralBold(safe), options.section))
}

/** Markdown → 纯文本：纯正则实现已拆分至 utils/text（不依赖 marked/DOMPurify），
 *  此处再导出以兼容既有引用；首页应直接从 utils/text 导入，避免引入 markdown 库（T7-③）。 */
export { mdToPlainText } from './text'