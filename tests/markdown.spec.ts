// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mdToPlainText, renderMarkdown } from '../src/utils/markdown'

describe('Markdown 渲染与 XSS 防护', () => {
  it('渲染标题、引用与代码块', () => {
    const html = renderMarkdown('## 标题\n\n> 引用\n\n```js\nconsole.log(1)\n```')
    expect(html).toContain('<h2>')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<pre>')
  })

  it('剥离 script 标签', () => {
    const html = renderMarkdown('正文<script>alert(1)</script>')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert(1)')
  })

  it('剥离事件处理器与 javascript: 链接', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">[点我](javascript:alert(1))')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('javascript:')
  })

  it('保留正常链接与强调', () => {
    const html = renderMarkdown('[GitHub](https://github.com) 与 **重点**')
    expect(html).toContain('href="https://github.com"')
    expect(html).toContain('<strong>重点</strong>')
  })
})

describe('mdToPlainText（hero/摘要用）', () => {
  it('剥离标题/强调/链接/列表/代码块标记', () => {
    const text = mdToPlainText('## 标题\n\n**重点** 与 [链接](https://example.com)\n\n- 条目\n\n```js\ncode()\n```')
    expect(text).toBe('标题 重点 与 链接 条目')
  })

  it('纯文本原样保留（折叠空白）', () => {
    expect(mdToPlainText('在管理与数据之间做一点魔法。')).toBe('在管理与数据之间做一点魔法。')
  })
})