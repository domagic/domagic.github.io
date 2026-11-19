import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { applyImagePolicy, type MarkdownRenderOptions } from './media'

marked.setOptions({ gfm: true, breaks: false })

export function renderMarkdown(source: string, options: MarkdownRenderOptions = {}): string {
  const html = marked.parse(source, { async: false }) as string
  const safe = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'iframe'],
    FORBID_ATTR: ['style', 'onerror', 'onclick'],
  })
  return applyImagePolicy(safe, options.section)
}

/** Markdown → 纯文本：纯正则实现已拆分至 utils/text（不依赖 marked/DOMPurify），
 *  此处再导出以兼容既有引用；首页应直接从 utils/text 导入，避免引入 markdown 库（T7-③）。 */
export { mdToPlainText } from './text'