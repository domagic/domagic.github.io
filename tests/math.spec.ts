// @vitest-environment jsdom
// F3 数学渲染专项测试：批准条件（seq=152）逐条验证。
import { describe, it, expect } from 'vitest'
import DOMPurify from 'dompurify'
import { hasMath, renderMarkdownWithMath, MATH_SANITIZE } from '../src/utils/math'
import { renderMarkdown } from '../src/utils/markdown'

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html')

describe('hasMath 检测（决定是否懒加载 KaTeX）', () => {
  it('识别行内与块级数学', () => {
    expect(hasMath('设 $F = ma$ 成立')).toBe(true)
    expect(hasMath('$$\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$$')).toBe(true)
  })

  it('正文中部/多段后的数学也能识别（修复锚定漏判：真实文章数学几乎不在串首）', () => {
    expect(hasMath('# 标题\n\n这是一段普通正文。\n\n$$\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}$$\n\n后续说明。')).toBe(true)
    expect(hasMath('前面很多文字 '.repeat(20) + ' 然后 $x^2$ 出现')).toBe(true)
    expect(hasMath('行内嵌套 $\\text{其中 $F$ 为矩阵}$ 也要识别')).toBe(true)
  })

  it('无数学、空串返回 false（首页/列表零 KaTeX）', () => {
    expect(hasMath('普通正文，没有公式')).toBe(false)
    expect(hasMath('')).toBe(false)
  })

  it('代码围栏与行内代码中的 $ 不触发加载', () => {
    expect(hasMath('```js\nconst s = "$x$"\n```')).toBe(false)
    expect(hasMath('行内 `$x$` 代码')).toBe(false)
    expect(hasMath('~~~\n$$x$$\n~~~')).toBe(false)
  })

  it('转义 \\$ 与货币写法不误判', () => {
    expect(hasMath('价格 \\$100')).toBe(false)
    expect(hasMath('区间 $5 到 $10 之间')).toBe(false)
  })
})

describe('KaTeX 渲染保真', () => {
  it('行内公式渲染出 KaTeX 与 MathML（无障碍）', async () => {
    const html = await renderMarkdownWithMath('牛顿第二定律 $F = ma$。')
    expect(html).toContain('katex')
    expect(html).toContain('<math')
    expect(html).toContain('牛顿第二定律')
  })

  it('展示块 bmatrix / aligned / \\bm 正常渲染', async () => {
    const html = await renderMarkdownWithMath(
      '$$\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$$\n\n$$\\begin{aligned} x &= 1 \\\\ y &= 2 \\end{aligned}$$\n\n向量 $\\bm{F}$。',
    )
    expect(html).toContain('katex-display')
    expect(html).toContain('mtable')
    expect(html).not.toContain('katex-error')
  })

  it('数学块带内部横向滚动容器（窄屏不整页溢出）', async () => {
    const html = await renderMarkdownWithMath('$$\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$$')
    expect(html).toContain('class="math-block"')
  })

  it('非法 TeX 降级为错误文本而不抛异常', async () => {
    const html = await renderMarkdownWithMath('坏的 $\\frac{1}{$ 公式')
    expect(typeof html).toBe('string')
    expect(html.length).toBeGreaterThan(0)
  })

  it('多次渲染互不污染（重复交互稳定）', async () => {
    const a = await renderMarkdownWithMath('$x_1$')
    const b = await renderMarkdownWithMath('$y_2$')
    const again = await renderMarkdownWithMath('$x_1$')
    expect(a).toBe(again)
    expect(b).not.toBe(a)
    expect(a).not.toContain('data-math-ph')
    expect(b).not.toContain('data-math-ph')
  })
})

describe('嵌套数学：\\text{} 内用 $...$ 或 \\(...\\)（KaTeX 0.19.1 不支持 \\ensuremath）', () => {
  const visualOf = (html: string) => {
    const doc = parse(html)
    return Array.from(doc.querySelectorAll('.katex-html')).map((n) => n.textContent ?? '').join('')
  }

  it('行内 $\\text{其中 $F$ 为矩阵}$ 整体渲染（brace-aware 不提前闭合）', async () => {
    const html = await renderMarkdownWithMath('$\\text{其中 $F$ 为矩阵}$')
    const doc = parse(html)
    expect(doc.querySelectorAll('.katex-error')).toHaveLength(0)
    // 整段（含 "为矩阵"）进入同一数学 span，而非只渲染内层 F、其余漏到 prose
    expect(visualOf(html)).toContain('为矩阵')
    expect(doc.querySelectorAll('.katex')).toHaveLength(1)
  })

  it('展示块 $$\\text{其中 $a_{ij}$ 为元素}$$ 嵌套数学正确', async () => {
    const html = await renderMarkdownWithMath('$$\\text{其中 $a_{ij}$ 为元素}$$')
    const doc = parse(html)
    expect(doc.querySelectorAll('.katex-error')).toHaveLength(0)
    expect(visualOf(html)).toContain('为元素')
  })

  it('行内 \\text{其中 \\(F\\) 为矩阵} 用 \\(...\\) 嵌套也正确', async () => {
    const html = await renderMarkdownWithMath('$\\text{其中 \\(F\\) 为矩阵}$')
    expect(parse(html).querySelectorAll('.katex-error')).toHaveLength(0)
    expect(visualOf(html)).toContain('为矩阵')
  })

  it('KaTeX 不支持 \\ensuremath：渲染为字面量，故约定改用 $...$ / \\(...\\)', async () => {
    const html = await renderMarkdownWithMath('$\\ensuremath{F}$')
    // \ensuremath 未被 KaTeX 识别，作为字面文本出现（证明其不可用作作者约定）
    expect(visualOf(html)).toContain('\\ensuremath')
  })
})

describe('安全：trust:false + 数学专用最小放行', () => {
  const attacks = [
    '\\href{javascript:alert(1)}{x}',
    '\\url{javascript:alert(1)}',
    '\\includegraphics{http://evil/x.png}',
    '\\includegraphics{https://evil/x.png}',
    '\\htmlClass{evil}{x}',
    '\\htmlId{evil}{x}',
    '\\htmlStyle{color:red}{x}',
    '\\htmlData{evil}{x}',
  ]

  it.each(attacks)('注入样本被中和：%s', async (tex) => {
    const html = await renderMarkdownWithMath(`$${tex}$`)
    const doc = parse(html)
    // 无任何可执行/可加载元素
    expect(doc.querySelectorAll('a,img,script,iframe,object,embed,svg,link,meta,base')).toHaveLength(0)
    // 无任何事件处理器属性
    expect(doc.querySelectorAll('[onclick],[onerror],[onload]')).toHaveLength(0)
    // 无 URL 承载属性，且危险载荷不出现在任何属性值中。
    // KaTeX trust:false 拒绝命令后，原始 TeX 仅作为惰性错误文本（text node）显示，无法执行——
    // 故按属性而非裸 substring 判定，避免把无害的错误文本误报为漏洞。
    const badAttrs: string[] = []
    for (const el of Array.from(doc.querySelectorAll('*'))) {
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase()
        const val = attr.value
        if (['href', 'src', 'srcset', 'xlink:href', 'formaction'].includes(name)) badAttrs.push(`${name}=${val}`)
        if (val.toLowerCase().includes('javascript:')) badAttrs.push(`${name}=${val}`)
        if (val.includes('evil/x.png')) badAttrs.push(`${name}=${val}`)
      }
    }
    expect(badAttrs).toEqual([])
  })

  it('数学消毒保留 math 标记与必要样式，但禁 a/img/style 标签', () => {
    const raw = '<span class="katex" style="color:red"><math><mi>x</mi></math></span><a href="javascript:alert(1)">x</a><img src="https://evil/x.png"><style>body{}</style>'
    const safe = DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true, mathMl: true },
      ADD_ATTR: ['class', 'style', 'aria-hidden', 'encoding'],
      FORBID_TAGS: ['style', 'a', 'img', 'script', 'iframe'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'href', 'src', 'srcset', 'xlink:href', 'formaction'],
      ALLOW_DATA_ATTR: false,
    })
    expect(safe).toContain('<math')
    expect(safe).toContain('class="katex"')
    expect(safe).not.toContain('<a')
    expect(safe).not.toContain('<img')
    expect(safe).not.toContain('<style')
    expect(safe).not.toContain('javascript:')
  })

  it('prose 严格路径配置不变：script/style 属性仍被剥离', () => {
    const html = renderMarkdown('正文<script>alert(1)</script><span style="color:red">x</span>')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('style=')
  })

  it('数学内容中的 prose 注入仍被严格路径拦截', async () => {
    const html = await renderMarkdownWithMath('公式 $x$ 后<script>alert(1)</script>')
    expect(html).not.toContain('<script')
    expect(html).toContain('katex')
  })

  it('作者伪造占位符不会被回填为任何数学内容', async () => {
    const html = await renderMarkdownWithMath('<span data-math-ph="forged:0"></span> 与 $x$')
    expect(html).not.toContain('data-math-ph')
    const doc = parse(html)
    const forged = doc.querySelector('span:not([class])')
    expect(forged?.innerHTML ?? '').toBe('')
  })
})

describe('Markdown 结构保真（数学与 prose 混排）', () => {
  it('列表项内行内数学不破坏列表结构', async () => {
    const html = await renderMarkdownWithMath('- 第一项 $a^2$\n- 第二项 $b^2$\n')
    const doc = parse(html)
    expect(doc.querySelectorAll('ul li')).toHaveLength(2)
    expect(doc.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(2)
  })

  it('引用块与标题中的数学正常渲染', async () => {
    const html = await renderMarkdownWithMath('## 标题 $E=mc^2$\n\n> 引用中的 $x$ 公式\n')
    const doc = parse(html)
    expect(doc.querySelector('h2')).not.toBeNull()
    expect(doc.querySelector('blockquote')).not.toBeNull()
    expect(doc.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(2)
  })

  it('代码围栏内的 $ 不被当作数学', async () => {
    const html = await renderMarkdownWithMath('```tex\n$notmath$\n```\n\n真公式 $x$')
    const doc = parse(html)
    expect(doc.querySelector('pre code')?.textContent).toContain('$notmath$')
    expect(doc.querySelectorAll('.katex')).toHaveLength(1)
  })

  it('货币文本不被误渲染为数学', async () => {
    const html = await renderMarkdownWithMath('价格 $5 到 $10 之间')
    expect(html).not.toContain('katex')
    expect(html).toContain('$5')
    expect(html).toContain('$10')
  })

  it('展示块与行内混排顺序正确', async () => {
    const html = await renderMarkdownWithMath('前置 $a$\n\n$$b$$\n\n后置 $c$')
    const ia = html.indexOf('katex')
    const ib = html.indexOf('katex-display')
    const ic = html.lastIndexOf('katex')
    expect(ia).toBeGreaterThan(-1)
    expect(ib).toBeGreaterThan(ia)
    expect(ic).toBeGreaterThan(ib)
  })
})

describe('F2-D 高定界符保真：KaTeX 0.19 的 bmatrix 方括号是 svg>path 几何，消毒不得剥离', () => {
  const TALL = [
    '$$\\begin{bmatrix}',
    'a_{11} & a_{12} & \\cdots & a_{1n} \\\\',
    'a_{21} & a_{22} & \\cdots & a_{2n} \\\\',
    '\\vdots & \\vdots &  & \\vdots \\\\',
    'a_{m1} & a_{m2} & \\cdots & a_{mn} \\\\',
    '\\end{bmatrix}$$',
  ].join('\n')

  it('4 行 bmatrix 的左右方括号 svg 几何存活（mopen/mclose 各 1 个 path，viewBox 保留）', async () => {
    const html = await renderMarkdownWithMath(TALL)
    const doc = parse(html)
    expect(doc.querySelectorAll('.katex-error')).toHaveLength(0)
    const open = doc.querySelector('.katex-display .mopen svg path')
    const close = doc.querySelector('.katex-display .mclose svg path')
    expect(open).not.toBeNull()
    expect(close).not.toBeNull()
    expect(doc.querySelectorAll('.katex-display svg')).toHaveLength(2)
    for (const svg of Array.from(doc.querySelectorAll('.katex-display svg'))) {
      expect(svg.getAttribute('viewBox')).toBe('0 0 667 5400')
      expect(svg.children).toHaveLength(1)
      expect(svg.children[0].tagName.toLowerCase()).toBe('path')
    }
  })

  it('定界符容器不再为空壳（width/height span 内含 svg）', async () => {
    const html = await renderMarkdownWithMath(TALL)
    const doc = parse(html)
    const shells = Array.from(doc.querySelectorAll('.katex-display .mopen span[style], .katex-display .mclose span[style]'))
      .filter((n) => /width:/.test(n.getAttribute('style') ?? ''))
    expect(shells.length).toBeGreaterThanOrEqual(2)
    for (const s of shells) expect(s.querySelector('svg')).not.toBeNull()
  })

  it('svg 注入载荷在数学消毒配置下全灭（仅 svg/path 几何放行）', () => {
    const payloads = [
      '<svg><foreignObject><iframe src="javascript:alert(1)"></iframe></foreignObject></svg>',
      '<svg onload="alert(1)"><path d="M0 0"/></svg>',
      '<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>',
      '<svg><script>alert(1)</script></svg>',
      '<svg><use href="data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+"/></svg>',
      '<svg><animate attributeName="href" values="javascript:alert(1)"/></svg>',
      '<svg><image href="https://evil/x.png"/></svg>',
      '<svg><style>body{}</style></svg>',
      '<svg><path d="M0 0" onclick="alert(1)"/></svg>',
    ]
    for (const p of payloads) {
      const doc = parse(DOMPurify.sanitize(p, MATH_SANITIZE))
      expect(doc.querySelectorAll('script,iframe,foreignobject,use,image,animate,a,style,object,embed')).toHaveLength(0)
      expect(doc.querySelectorAll('[onclick],[onerror],[onload]')).toHaveLength(0)
      const badAttrs: string[] = []
      for (const el of Array.from(doc.querySelectorAll('*'))) {
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase()
          if (['href', 'src', 'srcset', 'xlink:href', 'formaction'].includes(name)) badAttrs.push(name)
          if (attr.value.toLowerCase().includes('javascript:')) badAttrs.push(name)
        }
      }
      expect(badAttrs).toEqual([])
    }
  })

  it('prose 严格路径仍然全禁 svg（数学放行不波及 prose）', () => {
    const html = renderMarkdown('正文<svg onload="alert(1)"><path d="M0 0"/></svg>')
    expect(html).not.toContain('<svg')
    expect(html).not.toContain('onload')
  })
})