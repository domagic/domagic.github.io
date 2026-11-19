/** v1.2 随文图片前端侧策略：正文 `assets/<图片目录>/<文件名>` 相对引用 → 站点媒体 URL 映射，
 *  并为全部图片补惰性加载与 alt 守卫。sanitize 链（markdown/math 两路）语义零放宽：
 *  本模块只在**已消毒**的产物上做受控属性改写，写入值全部经白名单正则约束，零注入面。 */

export interface MarkdownRenderOptions {
  /** 文章所属栏目（文章页传入）。提供时才执行随文图片 URL 重写；缺省=旧行为（纯透传）。 */
  section?: string
}

/** 与 api Category 值域一致的栏目白名单；非法值一律不映射（防路径注入）。 */
const MEDIA_SECTIONS = new Set(['blog', 'opinion', 'diary', 'academic'])

/** 契约 v1.2 §1-A：一层图片目录 [A-Za-z0-9_-]+，位图扩展白名单限小写（SVG 首期禁）。
 *  大小写口径与 sync/postbuild 门逐字一致：大写扩展引用不改写也不上站（构建期已被断链门拒绝）。 */
const ASSET_REF = /^assets\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+\.(?:png|jpe?g|gif|webp))$/

/** 对已 sanitize 的 HTML 片段执行图片策略；无 <img> 时原串返回（纯文本站零行为变化）。 */
export function applyImagePolicy(html: string, section?: string): string {
  if (!html.includes('<img')) return html
  const validSection = section !== undefined && MEDIA_SECTIONS.has(section) ? section : null
  const doc = new DOMParser().parseFromString(html, 'text/html')
  let dirty = false
  for (const img of Array.from(doc.body.querySelectorAll('img'))) {
    // 契约 v1.2 §1-A.2：data: URI 图片禁止。实测 DOMPurify 默认放行 img 的 data: 源，
    // 故此处 fail-closed 移除整节点（既有净化链不放宽，本门只收紧）。
    if (/^data:/i.test((img.getAttribute('src') ?? '').trim())) {
      img.remove()
      dirty = true
      continue
    }
    if (validSection) {
      const ref = ASSET_REF.exec(img.getAttribute('src') ?? '')
      if (ref) {
        img.setAttribute(
          'src',
          `${import.meta.env.BASE_URL}media/${validSection}/${ref[1]}/${ref[2]}`,
        )
        dirty = true
      }
    }
    for (const [attr, value] of [
      ['loading', 'lazy'],
      ['decoding', 'async'],
      ['alt', ''],
    ] as const) {
      if (!img.hasAttribute(attr)) {
        img.setAttribute(attr, value)
        dirty = true
      }
    }
  }
  return dirty ? doc.body.innerHTML : html
}

/** 正文链接策略：作品/外链一律在新标签页打开，并补 noopener/noreferrer 安全属性。
 *  与图片策略一致——只在已 sanitize 的产物上做受控属性改写，零注入面。
 *  仅处理正文（markdown/math 两路产物），站内导航链接不受影响。 */
export function applyLinkPolicy(html: string): string {
  if (!html.includes('<a')) return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  let dirty = false
  for (const a of Array.from(doc.body.querySelectorAll('a'))) {
    if (a.getAttribute('target') !== '_blank') {
      a.setAttribute('target', '_blank')
      dirty = true
    }
    if (!a.getAttribute('rel')?.includes('noopener')) {
      a.setAttribute('rel', 'noopener noreferrer')
      dirty = true
    }
  }
  return dirty ? doc.body.innerHTML : html
}
