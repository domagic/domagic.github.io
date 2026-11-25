import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { applyImagePolicy, applyLinkPolicy, type MarkdownRenderOptions } from './media'

marked.setOptions({ gfm: true, breaks: false })

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
  const html = marked.parse(source, { async: false }) as string
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