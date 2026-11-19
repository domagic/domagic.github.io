// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../src/utils/markdown'
import { renderMarkdownWithMath } from '../src/utils/math'

const IMG = '![框架图](assets/Live_streaming_channel_recommendation/fig4_framework.png)'

describe('v1.2 随文图片：prose 路径', () => {
  it('提供 section 时把合规相对引用映射到 /media/<栏目>/ 并加惰性加载属性', () => {
    const html = renderMarkdown(IMG, { section: 'academic' })
    expect(html).toContain('src="/media/academic/Live_streaming_channel_recommendation/fig4_framework.png"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('decoding="async"')
    expect(html).toContain('alt="框架图"')
  })

  it('未提供 section 时不改写（旧行为），但守卫属性仍补齐', () => {
    const html = renderMarkdown('<img src="assets/x/y.png">')
    expect(html).toContain('src="assets/x/y.png"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('alt=""')
  })

  it('非白名单形状（嵌套目录/越权路径/SVG/大写扩展）不改写', () => {
    for (const bad of [
      '<img src="assets/a/b/c.png">',
      '<img src="../secret/x.png">',
      '<img src="assets/a/x.svg">',
      '<img src="assets/a/x.PNG">',
    ]) {
      const html = renderMarkdown(bad, { section: 'blog' })
      expect(html).toContain(bad.slice(9, -1))
      expect(html).not.toContain('/media/')
    }
  })

  it('非法 section 值不触发映射（防注入）', () => {
    const html = renderMarkdown(IMG, { section: '../../etc' })
    expect(html).not.toContain('/media/')
    expect(html).toContain('src="assets/Live_streaming_channel_recommendation/fig4_framework.png"')
  })

  it('纯文本产物逐字不变（增补式零行为变化承诺）', () => {
    const src = '## 标题\n\n正文**重点**与 `code`。'
    expect(renderMarkdown(src, { section: 'blog' })).toBe(renderMarkdown(src))
  })

  it('XSS 面不放宽：onerror/data: URI 依旧被剥离', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">', { section: 'blog' })
    expect(html).not.toContain('onerror')
    const html2 = renderMarkdown('![x](data:image/png;base64,AAAA)', { section: 'blog' })
    expect(html2).not.toContain('data:image')
  })
})

describe('v1.2 随文图片：数学路径', () => {
  it('含数学文章同样执行图片映射，数学渲染不受影响', async () => {
    const html = await renderMarkdownWithMath(`${IMG}\n\n行内 $E=mc^2$ 数学。`, { section: 'academic' })
    expect(html).toContain('/media/academic/Live_streaming_channel_recommendation/fig4_framework.png')
    expect(html).toContain('katex')
  })
})
