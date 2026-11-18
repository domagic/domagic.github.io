/** Markdown → 纯文本（用于 hero/SEO 摘要等无需富文本的场景）。
 *  纯正则实现，不依赖 marked/DOMPurify，避免把 markdown 库带入首页关键渲染路径（T7-③）。 */
export function mdToPlainText(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*(?:>\s?|[-*+]\s+|\d+\.\s+)/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}