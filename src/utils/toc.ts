/** 文章目录（TOC）：在已消毒的 HTML 上给 h2/h3 注入稳定 id，并抽取目录项。
 *  纯前端处理，不改 markdown 源、不影响消毒流程；DOMParser 与 DOMPurify 同源浏览器 API。 */

export interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

export interface DecoratedHtml {
  html: string
  items: TocItem[]
}

/**
 * 给 html 中的 h2/h3 顺序注入 `sec-N` id（已有 id 则保留），返回目录项。
 * id 用序号而非标题 slug，避免中文/重复标题的 slug 冲突；目录跳转用 `#sec-N`。
 */
export function decorateHeadings(html: string): DecoratedHtml {
  if (!html) return { html, items: [] }
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const items: TocItem[] = []
  let n = 0
  doc.querySelectorAll('h2, h3').forEach((node) => {
    n += 1
    let id = node.getAttribute('id')
    if (!id) {
      id = `sec-${n}`
      node.setAttribute('id', id)
    }
    const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim()
    items.push({ id, text, level: node.tagName === 'H2' ? 2 : 3 })
  })
  return { html: doc.body.innerHTML, items }
}
