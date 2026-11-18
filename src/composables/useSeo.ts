interface SeoOptions {
  title: string
  description?: string
}

const SITE_NAME = 'Do Magic · Magic'
const DEFAULT_DESCRIPTION =
  'Magic 的个人网站：研究、博客、观点与学术内容。在管理与数据之间，做一点魔法。'

function setMeta(selector: string, attr: string, value: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    const [, key, name] = selector.match(/\[(\w+)="([^"]+)"\]/) ?? []
    if (key && name) el.setAttribute(key, name)
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

export function useSeo(options: SeoOptions): void {
  const title = options.title ? `${options.title} · ${SITE_NAME}` : SITE_NAME
  const description = options.description ?? DEFAULT_DESCRIPTION
  document.title = title
  setMeta('meta[name="description"]', 'content', description)
  setMeta('meta[property="og:title"]', 'content', title)
  setMeta('meta[property="og:description"]', 'content', description)
}