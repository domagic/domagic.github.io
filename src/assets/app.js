// P6-B4 秦罗万象 · 双语渲染＋语言/明暗开关（零依赖，离线可运行）
// 首页文案全数据驱动（QL_DATA.team/home，R8）；I18N 仅余导航/按钮/徽标 chrome（R26 退役 demo 键）。
// 主题默认 C（R25）：localStorage['ql-theme'] 存储优先；无存储跟系统 prefers-color-scheme 且 live 跟随；手动切换写存储覆盖。
(function () {
  'use strict'
  var D = window.QL_DATA || { about: {}, members: [], publications: [], team: null, home: null }
  var KEY = 'ql-lang'
  var KEY_THEME = 'ql-theme'

  var I18N = {
    zh: {
      'nav.home': '首页', 'nav.about': '团队简介', 'nav.members': '团队成员', 'nav.publications': '团队成果',
      'nav.menu': '打开菜单',
      'hero.ctaAbout': '了解团队', 'hero.ctaPubs': '查看成果',
      'teaser.morePubs': '全部成果 →', 'teaser.moreMembers': '认识成员 →',
      'badge.pending': '待确认',
      'badge.provisional': '暂定', 'badge.translation': '暂译', 'badge.missing': '译文待补',
      'marker.provisional': '英文名暂定', 'marker.draftTrans': '暂译',
      'about.eyebrow': 'About', 'about.heading': '团队简介',
      'members.eyebrow': 'Members', 'members.heading': '团队成员',
      'members.sub': '两位学者 · 一个团队（履历信息待确认，不预置未经核实内容）',
      'members.titleFallback': '头衔待确认',
      'member.heading': '成员简介', 'member.back': '返回成员列表', 'member.notFound': '未找到该成员简介。',
      'pubs.eyebrow': 'Publications', 'pubs.heading': '团队成果',
      'pubs.sub': '团队成果清单按发表日期排序；清单与归属口径待 owner 确认。',
      'pubs.empty': '成果清单待成员供给，暂无条目。',
      'pubs.authorsLabel': '作者', 'pubs.venueLabel': '发表', 'pubs.citeLabel': '引用', 'pubs.doiLabel': 'DOI', 'pubs.previewNote': '官方发表记录 · 据出版商版本',
      'pubs.kind.paper-note': '论文笔记', 'pubs.kind.paper': '论文', 'pubs.kind.project': '项目', 'pubs.kind.talk': '报告',
      'langBtn': '语言', 'langBtnAria': '切换到英文',
      'theme.toLight': '亮色', 'theme.toLightAria': '切换到亮色模式',
      'theme.toDark': '暗色', 'theme.toDarkAria': '切换到暗色模式'
    },
    en: {
      'nav.home': 'Home', 'nav.about': 'About', 'nav.members': 'Members', 'nav.publications': 'Publications',
      'nav.menu': 'Open menu',
      'hero.ctaAbout': 'About the Group', 'hero.ctaPubs': 'Publications',
      'teaser.morePubs': 'All publications →', 'teaser.moreMembers': 'Meet the members →',
      'badge.pending': 'Pending confirmation',
      'badge.provisional': 'Provisional', 'badge.translation': 'Provisional translation', 'badge.missing': 'Translation pending',
      'marker.provisional': 'English name provisional', 'marker.draftTrans': 'Draft translation',
      'about.eyebrow': 'About', 'about.heading': 'About the Group',
      'members.eyebrow': 'Members', 'members.heading': 'Members',
      'members.sub': 'Two scholars, one team. Biographies pending confirmation; no unverified information is pre-filled.',
      'members.titleFallback': 'Title pending confirmation',
      'member.heading': 'Member Profile', 'member.back': 'Back to members', 'member.notFound': 'Profile not found.',
      'pubs.eyebrow': 'Publications', 'pubs.heading': 'Publications',
      'pubs.sub': 'Team publication list ordered by publication date; list scope and attribution pending owner confirmation.',
      'pubs.empty': 'The publication list awaits member supply; no entries yet.',
      'pubs.authorsLabel': 'Authors', 'pubs.venueLabel': 'Published in', 'pubs.citeLabel': 'Reference', 'pubs.doiLabel': 'DOI', 'pubs.previewNote': 'Official publication record · publisher version',
      'pubs.kind.paper-note': 'Paper note', 'pubs.kind.paper': 'Paper', 'pubs.kind.project': 'Project', 'pubs.kind.talk': 'Talk',
      'langBtn': 'Languages', 'langBtnAria': 'Switch to Chinese',
      'theme.toLight': 'Light', 'theme.toLightAria': 'Switch to light mode',
      'theme.toDark': 'Dark', 'theme.toDarkAria': 'Switch to dark mode'
    }
  }

  // ===== 多语种配置（可编辑：增删语言只改这里，前端按 base 取文案再按地区做轻量转换）=====
  // 站点内容权威源仍是 content/*.{zh,en}.md 与 team.json 的 zh/en 双语；
  // zh-TW 由 zh 文案做简→繁转换，en-GB 由 en 文案做美式→英式拼写转换，en-US 保持原样。
  // 若要为某地区写独立文案，可给 LOCALES 项加 "overlay" 字段并在 localeText() 中接入。
  var DEFAULT_LOCALE = 'zh-CN'
  var LOCALES = [
    { code: 'zh-CN', label: '简体中文', base: 'zh' },
    { code: 'zh-TW', label: '繁體中文', base: 'zh' },
    { code: 'en-GB', label: 'United Kingdom', base: 'en' },
    { code: 'en-US', label: 'United States', base: 'en' }
  ]
  var LOCALE_CODES = LOCALES.map(function (l) { return l.code })
  function localeInfo(code) {
    for (var i = 0; i < LOCALES.length; i++) if (LOCALES[i].code === code) return LOCALES[i]
    return LOCALES[0]
  }
  function baseLang(code) { return localeInfo(code).base }

  // 简→繁常用字表（逐字映射；只列本站会用到的安全字，避免一对多误转）。
  var ZH_HANT_MAP = {
    '们':'們','这':'這','个':'個','为':'為','与':'與','说':'說','学':'學','术':'術','团':'團','队':'隊','员':'員',
    '简':'簡','历':'歷','时':'時','间':'間','数':'數','据':'據','传':'傳','记':'記','录':'錄','开':'開','关':'關',
    '语':'語','页':'頁','观':'觀','击':'擊','选':'選','项':'項','显':'顯','隐':'隱','题':'題','内':'內','联':'聯',
    '获':'獲','奖':'獎','参':'參','进':'進','发':'發','现':'現','场':'場','长':'長','门':'門','问':'問','闻':'聞',
    '见':'見','觉':'覺','应':'應','该':'該','对':'對','处':'處','边':'邊','过':'過','还':'還','将':'將','从':'從',
    '会':'會','来':'來','东':'東','车':'車','马':'馬','鸟':'鳥','风':'風','书':'書','画':'畫','读':'讀','写':'寫',
    '课':'課','论':'論','结':'結','构':'構','类':'類','别':'別','种':'種','领':'領','实':'實','验':'驗','证':'證',
    '严':'嚴','谨':'謹','复':'複','变':'變','称':'稱','断':'斷','测':'測','预':'預','设':'設','计':'計','划':'劃',
    '释':'釋','义':'義','总':'總','号':'號','码':'碼','随':'隨','机':'機','产':'產','业':'業','览':'覽','馆':'館',
    '访':'訪','谈':'談','图':'圖','标':'標','签':'簽','顶':'頂','栏':'欄','钮':'鈕','颜':'顏','词':'詞','译':'譯',
    '审':'審','暂':'暫','积':'積','极':'極','众':'眾','优':'優','级':'級','继':'繼','续':'續','贡':'貢','献':'獻',
    '状':'狀','态':'態','环':'環','镜':'鏡','层':'層','叠':'疊','骤':'驟','离':'離','闭':'閉','启':'啟','动':'動',
    '静':'靜','缘':'緣','细':'細','节':'節','约':'約','归':'歸','纳':'納','释':'釋','汇':'匯','聚':'聚','领':'領'
  }
  // 美式→英式拼写（仅整词匹配，保留首字母大小写）。
  var EN_GB_MAP = {
    'color':'colour','colors':'colours','organize':'organise','organizes':'organises','organized':'organised',
    'organization':'organisation','organizations':'organisations','recognize':'recognise','recognized':'recognised',
    'analyze':'analyse','analyzed':'analysed','analysis':'analysis','center':'centre','centers':'centres',
    'behavior':'behaviour','favorite':'favourite','modeling':'modelling','labeled':'labelled','traveling':'travelling',
    'catalog':'catalogue','defense':'defence','license':'licence','program':'programme','canceled':'cancelled',
    'realize':'realise','optimize':'optimise','optimized':'optimised','summarize':'summarise','emphasize':'emphasise',
    'generalize':'generalise','localize':'localise','visualize':'visualise','prioritize':'prioritise'
  }

  // 主题切换图标：内联 SVG，零外部依赖，可在此统一替换（后期换图标只改这里）。
  // 当前暗色→显示太阳（点按切亮）；当前亮色→显示月亮（点按切暗）。
  var THEME_ICONS = {
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.1"></circle><path d="M12 2.6v2.7M12 18.7v2.7M2.6 12h2.7M18.7 12h2.7M5.35 5.35l1.9 1.9M16.75 16.75l1.9 1.9M18.65 5.35l-1.9 1.9M7.25 16.75l-1.9 1.9"></path></svg>',
    moon: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.2 14.8A8.6 8.6 0 0 1 9.2 3.8a8.6 8.6 0 1 0 11 11z"></path></svg>'
  }

  // 品牌图形标志（Aethera 圆形封印）：双层圆环构成印章外廓，环内缎带 A 以金属渐变＋内侧高光绘成，
  // A 的开口中嵌无穷符号 ∞（承接最初参考图的意象），顶端四角星收束。
  // 正方形 viewBox、几何对称，放大缩小都清晰；不含文字（字标由 HTML/CSS 排版，文案由 team.name 驱动）。
  // 配色全部走 --mark-* 变量：--mark-c1/2/3 渐变、--mark-glow 光晕、--mark-size 尺寸，明暗主题自适应，零外部图片依赖。
  var BRAND_MARK_SVG =
    '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<defs>' +
        '<linearGradient id="qlMarkGold" x1="18" y1="88" x2="82" y2="12" gradientUnits="userSpaceOnUse">' +
          '<stop offset="0%" style="stop-color:var(--mark-c1,#f4ecda)"></stop>' +
          '<stop offset="48%" style="stop-color:var(--mark-c2,#d6c496)"></stop>' +
          '<stop offset="100%" style="stop-color:var(--mark-c3,#c9a45c)"></stop>' +
        '</linearGradient>' +
        '<linearGradient id="qlMarkSheen" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" style="stop-color:rgba(255,255,255,0.55)"></stop>' +
          '<stop offset="100%" style="stop-color:rgba(255,255,255,0)"></stop>' +
        '</linearGradient>' +
      '</defs>' +
      // 印章外廓：双环＋四处方位刻点
      '<g fill="none" stroke="url(#qlMarkGold)">' +
        '<circle cx="50" cy="50" r="46.5" stroke-width="1.5"></circle>' +
        '<circle cx="50" cy="50" r="42" stroke-width="0.6" opacity="0.65"></circle>' +
      '</g>' +
      '<g fill="url(#qlMarkGold)" opacity="0.85">' +
        '<path d="M50 4.1 L51.5 5.9 L50 7.7 L48.5 5.9 Z"></path>' +
        '<path d="M50 92.3 L51.5 94.1 L50 95.9 L48.5 94.1 Z"></path>' +
        '<path d="M4.1 50 L5.9 48.5 L7.7 50 L5.9 51.5 Z"></path>' +
        '<path d="M92.3 50 L94.1 48.5 L95.9 50 L94.1 51.5 Z"></path>' +
      '</g>' +
      // 缎带 A：每条笔画＝宽底渐变＋居中细高光（缎带磅凸），无偏移杂线
      '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M23 82 C 30 58 38 34 50 16" stroke="url(#qlMarkGold)" stroke-width="6.4"></path>' +
        '<path d="M77 82 C 70 58 62 34 50 16" stroke="url(#qlMarkGold)" stroke-width="6.4"></path>' +
        '<path d="M30 63 C 42 57 58 57 70 63" stroke="url(#qlMarkGold)" stroke-width="3.8"></path>' +
        '<path d="M24 80 C 31 57 39 34 50 18" stroke="url(#qlMarkSheen)" stroke-width="1.4"></path>' +
        '<path d="M76 80 C 69 57 61 34 50 18" stroke="url(#qlMarkSheen)" stroke-width="1.4"></path>' +
        '<path d="M32 62 C 43 56.5 57 56.5 68 62" stroke="url(#qlMarkSheen)" stroke-width="1.1"></path>' +
      '</g>' +
      // 无穷符号 ∞：位于 A 的开口内，是最初参考图的核心意象
      '<path d="M50 38 C 45.5 32.5 40 32.5 40 38 C 40 43.5 45.5 43.5 50 38 C 54.5 32.5 60 32.5 60 38 C 60 43.5 54.5 43.5 50 38 Z" fill="none" stroke="url(#qlMarkGold)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path>' +
      // 顶端四角星
      '<path d="M50 8 L51 10.5 L53.5 11.5 L51 12.5 L50 15 L49 12.5 L46.5 11.5 L49 10.5 Z" fill="url(#qlMarkGold)"></path>' +
    '</svg>'

  function getLang() {
    var v = null
    try { v = localStorage.getItem(KEY) } catch (e) {}
    if (LOCALE_CODES.indexOf(v) >= 0) return v   // 新格式：zh-CN / zh-TW / en-GB / en-US
    if (v === 'zh') return 'zh-CN'               // 兼容旧版两语言存储值
    if (v === 'en') return 'en-US'
    return DEFAULT_LOCALE
  }
  function setLang(l) {
    if (LOCALE_CODES.indexOf(l) < 0) l = DEFAULT_LOCALE
    try { localStorage.setItem(KEY, l) } catch (e) {}
  }
  // R25 主题 C：存储覆盖优先；无存储＝系统偏好（live 跟随见 DOMContentLoaded）。
  function storedTheme() {
    try { var v = localStorage.getItem(KEY_THEME); if (v === 'light' || v === 'dark') return v } catch (e) {}
    return null
  }
  function systemLight() {
    try { return window.matchMedia('(prefers-color-scheme: light)').matches } catch (e) { return false }
  }
  function getTheme() { return storedTheme() || (systemLight() ? 'light' : 'dark') }
  function setTheme(th) { try { localStorage.setItem(KEY_THEME, th) } catch (e) {} }
  function applyTheme() {
    if (getTheme() === 'light') document.documentElement.setAttribute('data-theme', 'light')
    else document.documentElement.removeAttribute('data-theme')
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }

  // 地区变体落地：只改文本节点，不动标签与属性；脚本/样式/文本域/SVG 字标跳过。
  // 每次 render 都会先按 base 文案重设文本，再跑本函数，因此不会重复叠加转换。
  function applyVariant(root, locale) {
    if (locale !== 'zh-TW' && locale !== 'en-GB') return
    if (!document.createTreeWalker || !window.NodeFilter) return
    var isZh = locale === 'zh-TW'
    var map = isZh ? ZH_HANT_MAP : EN_GB_MAP
    var keys = Object.keys(map)
    if (!keys.length) return
    var pattern = isZh ? '[' + keys.join('') + ']' : '\\b(' + keys.join('|') + ')\\b'
    var reTest = new RegExp(pattern, isZh ? '' : 'i')   // 检测用非全局，避免 lastIndex 推进漏节点
    var reReplace = new RegExp(pattern, isZh ? 'g' : 'gi') // 替换用全局，确保整段文本全部转换
    var targets = []
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false)
    while (walker.nextNode()) {
      var n = walker.currentNode
      var p = n.parentNode
      if (!p || !n.nodeValue) continue
      var tag = p.nodeName.toLowerCase()
      if (tag === 'script' || tag === 'style' || tag === 'textarea' || tag === 'text') continue
      if (reTest.test(n.nodeValue)) targets.push(n)
    }
    for (var i = 0; i < targets.length; i++) {
      var s = targets[i].nodeValue
      if (isZh) {
        targets[i].nodeValue = s.replace(reReplace, function (ch) { return map[ch] || ch })
      } else {
        targets[i].nodeValue = s.replace(reReplace, function (w) {
          var rep = map[w.toLowerCase()]
          if (!rep) return w
          return w.charAt(0) === w.charAt(0).toUpperCase() ? rep.charAt(0).toUpperCase() + rep.slice(1) : rep
        })
      }
    }
  }

  function t(lang, key) { return (I18N[lang] && I18N[lang][key]) || I18N.zh[key] || key }
  function badge(lang, cls, key) { return '<span class="badge ' + cls + '">' + esc(t(lang, key)) + '</span>' }
  function bi(lang, obj) {
    if (!obj) return { html: '', missing: false }
    if (obj[lang]) return { html: obj[lang], missing: false }
    var other = lang === 'zh' ? 'en' : 'zh'
    return { html: obj[other] || '', missing: true }
  }
  function coupletParts(lang) {
    var c = (D.team && D.team.couplet) || { zh: '', en: '' }
    if (lang === 'zh') return (c.zh || '').split('，').map(function (s) { return s.trim() }).filter(Boolean)
    return (c.en || '').split(';').map(function (s) { return s.trim() }).filter(Boolean)
  }

  function renderHome(lang) {
    var team = D.team || {}
    var home = D.home || { hero: {}, teasers: [] }
    var hero = home.hero || {}
    function set(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt == null ? '' : txt }
    set('hero-eyebrow', (hero.eyebrow || {})[lang])
    set('hero-name', (team.name || {})[lang])
    set('hero-mission', (hero.mission || {})[lang])
    var parts = coupletParts(lang)
    set('couplet-1', parts[0] || '')
    set('couplet-2', parts[1] || '')
    var box = document.getElementById('teasers')
    if (box) {
      box.innerHTML = (home.teasers || []).filter(function (x) { return x && x.enabled }).map(function (x) {
        var head = '<h2 class="teaser-title">' + esc((x.title || {})[lang] || '') + '</h2>'
        var body = '<p class="teaser-text">' + esc((x.text || {})[lang] || '') + '</p>'
        if (x.id === 'research') return '<article class="teaser">' + head + body + '<p class="teaser-badge">' + badge(lang, '', 'badge.pending') + '</p></article>'
        if (x.id === 'latest') return '<article class="teaser">' + head + body + '<div id="latest-pub" class="mini"></div><p class="teaser-more"><a href="publications.html">' + esc(t(lang, 'teaser.morePubs')) + '</a></p></article>'
        if (x.id === 'members') return '<article class="teaser">' + head + body + '<div id="members-mini" class="mini"></div><p class="teaser-more"><a href="members.html">' + esc(t(lang, 'teaser.moreMembers')) + '</a></p></article>'
        return '<article class="teaser">' + head + body + '</article>'
      }).join('')
    }
    var latest = document.getElementById('latest-pub')
    if (latest) {
      var p = D.publications[0]
      if (!p) latest.innerHTML = '<p class="muted">' + esc(t(lang, 'pubs.empty')) + '</p>'
      else {
        var ti = bi(lang, p.title)
        latest.innerHTML =
          '<p class="mini-title">' + esc(ti.html) + (ti.missing ? ' ' + badge(lang, '', 'badge.missing') : '') + '</p>' +
          '<p class="mini-meta"><em>' + esc(p.venue) + '</em> · ' + esc(p.year) + '</p>'
      }
    }
    var mini = document.getElementById('members-mini')
    if (mini) {
      mini.innerHTML = D.members.map(function (m) {
        return '<p class="mini-member">' + esc(m.name[lang] || m.name.zh) +
          ' <span class="mini-alt">' + esc(m.name[lang === 'zh' ? 'en' : 'zh']) + '</span> ' +
          (m.status === 'placeholder' ? badge(lang, '', 'badge.pending') : '') + '</p>'
      }).join('')
    }
    set('foot-couplet', coupletParts(lang).join(' · '))
  }

  function renderAbout(lang) {
    var el = document.getElementById('about-content')
    if (!el) return
    var a = D.about || {}
    var pick = a[lang] || a[lang === 'zh' ? 'en' : 'zh']
    var missing = !a[lang]
    el.innerHTML = (missing ? '<p>' + badge(lang, '', 'badge.missing') + '</p>' : '') + (pick ? pick.html : '')
  }

  // ===== 成员头像图形库（可编辑：新增一个 key 即可给成员换「脸」）=====
  // 每个成员在 team.json 的 memberVisuals 里指定 glyph 与 accent，形成不同角色视觉；
  // 未配置时回退 default。颜色走 CSS 变量 --orb-*，明暗主题自适应。
  var ORB_GLYPHS = {
    orbit:
      '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
        '<circle cx="60" cy="60" r="43" fill="none" stroke="currentColor" stroke-width="1.1" opacity=".45"></circle>' +
        '<ellipse cx="60" cy="60" rx="43" ry="16" fill="none" stroke="currentColor" stroke-width="1.7" transform="rotate(-28 60 60)"></ellipse>' +
        '<ellipse cx="60" cy="60" rx="43" ry="16" fill="none" stroke="currentColor" stroke-width="1" opacity=".55" transform="rotate(36 60 60)"></ellipse>' +
        '<circle cx="60" cy="60" r="10" fill="currentColor" opacity=".9"></circle>' +
        '<circle cx="23" cy="80" r="3.4" fill="currentColor"></circle>' +
        '<circle cx="97" cy="41" r="2.6" fill="currentColor"></circle>' +
      '</svg>',
    lattice:
      '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
        '<path d="M60 16 L104 60 L60 104 L16 60 Z" fill="none" stroke="currentColor" stroke-width="1.5"></path>' +
        '<path d="M60 34 L86 60 L60 86 L34 60 Z" fill="none" stroke="currentColor" stroke-width="1" opacity=".6"></path>' +
        '<path d="M16 60 H104 M60 16 V104" stroke="currentColor" stroke-width=".9" opacity=".4"></path>' +
        '<circle cx="60" cy="60" r="8" fill="currentColor"></circle>' +
        '<circle cx="60" cy="16" r="3" fill="currentColor"></circle>' +
        '<circle cx="104" cy="60" r="3" fill="currentColor"></circle>' +
        '<circle cx="16" cy="60" r="3" fill="currentColor"></circle>' +
        '<circle cx="60" cy="104" r="3" fill="currentColor"></circle>' +
      '</svg>',
    default:
      '<svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
        '<circle cx="60" cy="44" r="17" fill="none" stroke="currentColor" stroke-width="1.7"></circle>' +
        '<path d="M30 96 C30 72 46 64 60 64 C74 64 90 72 90 96" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"></path>' +
      '</svg>'
  }

  function sealChar(m, lang) {
    if (lang === 'zh') return (m.name.zh || '?').charAt(0)
    return (m.name.en || '?').split(/\s+/).map(function (w) { return w.charAt(0) }).join('').slice(0, 2).toUpperCase()
  }
  // 成员照片：由 team.json.memberVisuals[id].photo 配置（内容层无图片契约 G3′ 不破），
  // 兼容早期 m.photo 字段。路径为仓库静态资源相对地址，换照片只改 team.json。
  function memberPhoto(m, vis) {
    var p = (vis && vis.photo) || m.photo
    return (typeof p === 'string' && /^(assets\/|\.\/assets\/)/.test(p)) ? p : ''
  }
  function renderMembers(lang) {
    var el = document.getElementById('members-grid')
    if (!el) return
    var visuals = (D.team && D.team.memberVisuals) || {}
    el.className = 'members-orbit'
    el.innerHTML = D.members.map(function (m) {
      var vis = visuals[m.id] || {}
      var glyph = ORB_GLYPHS[vis.glyph] || ORB_GLYPHS.default
      var accent = /^[a-z0-9_-]+$/.test(vis.accent || '') ? vis.accent : 'bronze'
      var name = esc(m.name[lang] || m.name.zh)
      var titleLine = m.titleLine[lang] || m.titleLine[lang === 'zh' ? 'en' : 'zh'] || t(lang, 'members.titleFallback')
      var photo = memberPhoto(m, vis)
      // 三层立体结构：底层底座 / 中层圆盘 / 表层图标；hover 时逐层上浮，形成底层→表层 3D 效果。
      var topInner = photo
        ? '<img class="orb-photo" src="' + esc(photo) + '" alt="">'
        : '<span class="orb-glyph" aria-hidden="true">' + glyph + '</span>' +
          '<span class="orb-initial" aria-hidden="true">' + esc(sealChar(m, lang)) + '</span>'
      // 图标下方标注成员姓名（当前界面语言）；点击整张卡片进入 member.html?id=... 看详情。
      // 名称用绝对定位放在圆盘下方、不参与 3D 飞行，避免影响悬停「由远及近」效果；
      // aria-hidden 防止与 aria-label 重复朗读。姓名由 name[lang] 驱动，换语言自动切换。
      return '<a class="member-orb orb-accent-' + accent + '" href="member.html?id=' + encodeURIComponent(m.id) + '"' +
        ' aria-label="' + name + ' · ' + esc(titleLine) + '">' +
        '<span class="orb-stack">' +
          '<span class="orb-layer orb-layer-base" aria-hidden="true"></span>' +
          '<span class="orb-layer orb-layer-mid" aria-hidden="true"></span>' +
          '<span class="orb-layer orb-layer-top' + (photo ? ' has-photo' : '') + '">' + topInner + '</span>' +
        '</span>' +
        '<span class="orb-caption" aria-hidden="true">' + name + '</span>' +
        '</a>'
    }).join('')
  }

  // 气泡浮现入场：成员区滚入视口时，头像像气泡从水底浮上水面（短促、肉眼可见）。
  // 只播放一次；语言/主题切换导致重渲染后直接呈现终态，不重复播放。
  var membersRevealed = false
  function revealMembersOrbs() {
    var grid = document.getElementById('members-grid')
    if (!grid) return
    var orbs = grid.querySelectorAll('.member-orb')
    if (!orbs.length) return
    function play() {
      for (var i = 0; i < orbs.length; i++) {
        (function (orb) {
          orb.classList.add('bubble-in')
          orb.addEventListener('animationend', function (e) {
            if (e.animationName !== 'bubble-surface') return
            orb.classList.remove('bubble-in')
            orb.classList.add('surfaced')
          })
        })(orbs[i])
      }
    }
    if (membersRevealed) {
      for (var j = 0; j < orbs.length; j++) orbs[j].classList.add('surfaced')
      return
    }
    // 无 IntersectionObserver 时直接播放；否则等滚入视口再播，确保能看到
    if (!('IntersectionObserver' in window)) { membersRevealed = true; play(); return }
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return
      membersRevealed = true
      io.disconnect()
      play()
    }, { threshold: 0.15 })
    io.observe(grid)
  }

  // 成员简介详情页：由 URL 的 id 从 D.members 取人，文字来自 content/members/*.md（不写死）。
  function renderMemberDetail(lang) {
    var el = document.getElementById('member-detail')
    if (!el) return
    var id = ''
    var qm = location.search.match(/[?&]id=([^&]+)/)
    if (qm) { try { id = decodeURIComponent(qm[1]) } catch (e) { id = qm[1] } }
    var member = null
    for (var i = 0; i < D.members.length; i++) if (D.members[i].id === id) { member = D.members[i]; break }
    if (!member) {
      el.innerHTML = '<p class="muted">' + esc(t(lang, 'member.notFound')) + '</p>' +
        '<p><a href="members.html">' + esc(t(lang, 'member.back')) + '</a></p>'
      return
    }
    var bio = bi(lang, member.bio)
    var titleLine = member.titleLine[lang] || member.titleLine[lang === 'zh' ? 'en' : 'zh'] || t(lang, 'members.titleFallback')
    var name = esc(member.name[lang] || member.name.zh)
    var alt = esc(member.name[lang === 'zh' ? 'en' : 'zh'])
    var visuals = (D.team && D.team.memberVisuals) || {}
    var photo = memberPhoto(member, visuals[id] || {})
    var photoHtml = photo ? '<img class="member-detail-photo" src="' + esc(photo) + '" alt="' + name + '">' : ''
    el.innerHTML =
      '<p class="member-back"><a href="members.html">← ' + esc(t(lang, 'member.back')) + '</a></p>' +
      '<div class="member-detail-head">' + photoHtml + '<div class="member-detail-id">' +
      '<h1 class="member-detail-name">' + name + '<span class="member-detail-alt">（' + alt + '）</span></h1>' +
      '<p class="member-detail-role">' + esc(titleLine) + '</p>' +
      (member.status === 'placeholder' ? '<p class="member-detail-badge">' + badge(lang, '', 'badge.pending') + '</p>' : '') +
      '</div></div>' +
      '<div class="member-detail-bio prose">' + (bio.missing ? '<p>' + badge(lang, '', 'badge.missing') + '</p>' : '') + bio.html + '</div>'
  }

  var doiPreviewLang = 'zh'
  function renderPubs(lang) {
    doiPreviewLang = lang
    var el = document.getElementById('pub-list')
    if (!el) return
    if (!D.publications.length) {
      el.innerHTML = '<p class="pub-empty muted">' + esc(t(lang, 'pubs.empty')) + '</p>'
      return
    }
    el.innerHTML = D.publications.map(function (p, pIdx) {
      var ti = bi(lang, p.title)
      var su = bi(lang, p.summary)
      // 把摘要里的著录引导行（"著录（…）：" / "Bibliographic record (…):"）
      // 改成与"作者/发表"同款的金色小标签"引用"，APA-7 引用紧随其后。
      var citeLbl = esc(t(lang, 'pubs.citeLabel'))
      var suHtml = su.html.replace(/<p>(著录|Bibliographic record)(\s*[（(])/, function (m, word, paren) {
        return '<p><span class="lbl">' + citeLbl + '</span>' + paren
      })
      var kind = t(lang, 'pubs.kind.' + p.kind)
      // 有 DOI 时：用与"作者/发表/引用"同款的金色标签"DOI"，链接只显示 DOI 号；
      // 无 DOI 时：保留灰色类型标签（论文/项目/报告）。
      var metaHtml = '<p class="pub-meta">'
      if (p.doi) {
        metaHtml += '<span class="lbl">' + esc(t(lang, 'pubs.doiLabel')) + '</span>' +
          '<a class="doi" data-pub-idx="' + pIdx + '" href="https://doi.org/' + esc(p.doi) + '" rel="noopener noreferrer">' + esc(p.doi) + '</a>'
      } else {
        metaHtml += '<span class="kind">' + esc(kind) + '</span>'
      }
      metaHtml += '</p>'
      return '<article class="pub-item">' +
        '<div class="pub-year" aria-hidden="true">' + esc(p.year || '') + '</div>' +
        '<div class="pub-body">' +
        '<h2 class="pub-title">' + esc(ti.html) + (ti.missing ? ' ' + badge(lang, '', 'badge.missing') : '') + '</h2>' +
        '<p class="pub-authors"><span class="lbl">' + esc(t(lang, 'pubs.authorsLabel')) + '</span> ' + esc(p.authors.join(' · ')) + '</p>' +
        '<p class="pub-venue"><span class="lbl">' + esc(t(lang, 'pubs.venueLabel')) + '</span> <em>' + esc(p.venue) + '</em>' + (p.year ? ' (' + esc(p.year) + ')' : '') + '</p>' +
        '<div class="pub-summary prose">' + suHtml + '</div>' +
        metaHtml +
        '</div></article>'
    }).join('')
    initDoiPreview()
  }

  // ===== DOI 悬停预览卡：显示该文官方著录信息，跟随鼠标出现在右侧 =====
  var doiPreviewInited = false
  function initDoiPreview() {
    if (doiPreviewInited) return
    doiPreviewInited = true
    var card = document.createElement('div')
    card.className = 'doi-preview'
    card.setAttribute('role', 'tooltip')
    card.setAttribute('aria-hidden', 'true')
    document.body.appendChild(card)
    var list = document.getElementById('pub-list')
    if (!list) return
    var offset = 18
    function place(x, y) {
      var w = card.offsetWidth || 340, h = card.offsetHeight || 220
      var left = x + offset, top = y + offset
      if (left + w > window.innerWidth - 12) left = x - w - offset
      if (left < 12) left = 12
      if (top + h > window.innerHeight - 12) top = window.innerHeight - h - 12
      if (top < 12) top = 12
      card.style.left = left + 'px'
      card.style.top = top + 'px'
    }
    function fill(p) {
      var lang = doiPreviewLang
      var ti = bi(lang, p.title)
      var su = bi(lang, p.summary)
      // 从著录引导行提取来源说明，如"据出版商正式版 PDF，The Internet and Higher Education 72 (2027) 101115"
      var recMatch = su.html.match(/[（(](据出版商正式版 PDF[^）)]*|from the publisher's final PDF[^)]*)[）)]/)
      var rec = recMatch ? recMatch[1] : ''
      card.innerHTML =
        '<div class="dp-venue">' + esc(p.venue) + (p.year ? ' · ' + esc(p.year) : '') + '</div>' +
        '<div class="dp-title">' + ti.html + '</div>' +
        '<div class="dp-authors">' + esc(p.authors.join(', ')) + '</div>' +
        (rec ? '<div class="dp-rec">' + esc(rec) + '</div>' : '') +
        '<div class="dp-doi">DOI: ' + esc(p.doi) + '</div>' +
        '<div class="dp-note">' + esc(t(lang, 'pubs.previewNote')) + '</div>'
    }
    list.addEventListener('mouseover', function (e) {
      var a = e.target.closest ? e.target.closest('a.doi[data-pub-idx]') : null
      if (!a) return
      var p = D.publications[+a.getAttribute('data-pub-idx')]
      if (!p || !p.doi) return
      fill(p)
      place(e.clientX, e.clientY)
      card.classList.add('visible')
      card.setAttribute('aria-hidden', 'false')
    })
    list.addEventListener('mousemove', function (e) {
      if (!card.classList.contains('visible')) return
      if (e.target.closest && e.target.closest('a.doi[data-pub-idx]')) place(e.clientX, e.clientY)
    })
    list.addEventListener('mouseout', function (e) {
      var a = e.target.closest ? e.target.closest('a.doi[data-pub-idx]') : null
      if (!a) return
      card.classList.remove('visible')
      card.setAttribute('aria-hidden', 'true')
    })
  }

  // ===== 背景粒子动态配置（可编辑：调这里即可改密度/速度/颜色/流星频率，无需动绘制逻辑）=====
  var AMBIENT_CFG = {
    link: {
      areaPerNode: 52000,   // 每多少平方像素放 1 个连线节点（稀疏化）
      min: 16, max: 44,
      speed: 0.18,          // 节点漂移速度基准
      maxDist: 128,         // 连线触发距离
      radius: [0.7, 1.7],   // 节点半径范围
      lineAlpha: 0.13       // 连线最大透明度（再乘主题系数）
    },
    dust: {
      areaPerMote: 42000,   // 每多少平方像素放 1 颗漂浮微尘（稀疏，避免小黑点抢戏）
      min: 16, max: 48,
      rise: [0.05, 0.22],   // 上浮速度范围
      radius: [0.4, 1.4],   // 微尘半径范围
      twinkle: 0.016,       // 呼吸闪烁相位速度
      alpha: [0.08, 0.4]    // 微尘透明度范围
    },
    meteor: {
      every: 4200,          // 流星平均间隔（毫秒）
      speed: 6.2,           // 流星速度（像素/帧）
      length: 140,          // 尾迹长度
      alpha: 0.55           // 流星透明度
    },
    galaxy: {
      // 对联区细碎星点：作为立体星球的点缀，数量大幅减少，不再铺满小圆点。
      // cx/cy/rx/ry 为相对画布的比例，决定椭圆星野中心与范围。
      cx: 0.80, cy: 0.44, rx: 0.30, ry: 0.40,
      stars: 55,            // 星野内星点数量（原 150，让位给立体星球）
      radius: [0.4, 1.6],   // 星点半径范围
      alpha: [0.14, 0.70],  // 星点透明度范围
      twinkle: 0.014        // 闪烁相位速度
    }
  }
  // ===== 真实感星系配置（可编辑：调这里改旋臂数/密度/倾角/转速，无需动绘制逻辑）=====
  var GALAXY_CFG = {
    // —— 右侧螺旋星系 ——
    arms: 2,              // 主旋臂数量
    perArm: 900,          // 每条旋臂星点密度
    halo: 240,            // 盘面弥散星点数量
    coreSize: 0.11,       // 星核半径占画布半径比例
    spin: 5.6,            // 螺旋缠绕圈数（θ 上限，越大臂绕得越多）
    tilt: -0.34,          // 盘面倾角（弧度，负值为右下倾）
    flatten: 0.58,        // 盘面压扁系数（正视=1，越小越侧视）
    rotation: 0.000075,   // 整体自转角速度（弧度/毫秒）；约 84 秒一圈
    drift: 0.00011,       // 盘面弥散星独立公转速度（营造流动感）
    armWidth: 0.075,      // 旋臂径向宽度（占半径比例，越小臂越紧致）
    galaxyCx: 0.80,       // 螺旋星系中心 x（占画布宽）
    galaxyCy: 0.44,       // 螺旋星系中心 y（占画布高）
    galaxyR: 0.46,        // 螺旋星系半径（占画布高）
    // —— 全幅立体星球：左疏右密 ——
    planets: 46,          // 星球总数
    planetR: [5, 15],     // 星球半径范围（px，右大左小由 density 缩放）
    planetDrift: 0.0045,  // 星球缓慢漂移速度（营造流动感）
    planetAlpha: [0.14, 0.85], // 星球透明度范围（左淡右亮）
    maxPlanetR: 26,       // 右侧最大星球半径（含放大）
    twinkleSpeed: 0.0016  // 星点闪烁相位速度
  }
  // 读取主题下的星系配色（RGB 三元组字符串），与 ambPalette 共用主题判断。
  function galaxyPalette() {
    var cs = getComputedStyle(document.documentElement)
    function rgb(name, fallback) {
      var v = (cs.getPropertyValue(name) || '').trim()
      return v || fallback
    }
    var light = document.documentElement.getAttribute('data-theme') === 'light'
    return {
      core: rgb('--galaxy-core', light ? '120, 138, 168' : '255, 236, 190'),
      armA: rgb('--galaxy-arm-a', light ? '96, 126, 170' : '122, 158, 214'),
      armB: rgb('--galaxy-arm-b', light ? '146, 126, 178' : '176, 150, 220'),
      dust: rgb('--galaxy-dust', light ? '138, 109, 31' : '214, 196, 150'),
      light: light
    }
  }
  function initGalaxy() {
    var cv = document.querySelector('.galaxy-canvas')
    if (!cv) return
    var reduce = false, host = document.querySelector('.galaxy')
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch (e) {}
    var ctx = cv.getContext('2d')
    if (!ctx) return
    var CFG = GALAXY_CFG
    var dpr = Math.min(window.devicePixelRatio || 1, 2)
    var W = 0, H = 0, R = 0, gx = 0, gy = 0
    var stars = [], planets = [], t0 = 0, raf = 0

    function resize() {
      var r = (host || cv).getBoundingClientRect()
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height))
      gx = CFG.galaxyCx * W; gy = CFG.galaxyCy * H; R = CFG.galaxyR * H
      cv.width = W * dpr; cv.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    // 颜色分量提亮/压暗，用于球面高光与暗面
    function tint(rgb, amt) {
      var p = rgb.split(',')
      return [0, 1, 2].map(function (i) {
        return Math.max(0, Math.min(255, parseInt(p[i], 10) + amt))
      }).join(',')
    }
    // 生成螺旋星系星点：对数螺旋 r = a·e^(b·θ)，沿臂加窄抖动，盘面另撒弥散星
    function seed() {
      stars = []
      var b = CFG.spin / (2 * Math.PI)
      var a = 0.085
      function push(theta, rr, band, bright) {
        stars.push({
          t: theta, r: Math.max(0.05, Math.min(1, rr)), band: band,
          size: bright ? 1.0 + Math.random() * 1.6 : 0.45 + Math.random() * (band === 2 ? 0.9 : 1.2),
          phase: Math.random() * 6.2832,
          ps: CFG.twinkleSpeed * (0.5 + Math.random()),
          alpha: band === 2 ? 0.22 + Math.random() * 0.34
               : bright ? 0.85 + Math.random() * 0.15
               : 0.5 + Math.random() * 0.5
        })
      }
      var i, k
      for (k = 0; k < CFG.arms; k++) {
        var phase = k * (2 * Math.PI / CFG.arms)
        for (i = 0; i < CFG.perArm; i++) {
          var u = i / CFG.perArm
          var theta = u * CFG.spin + phase
          var rNorm = 0.085 + 0.915 * (Math.exp(b * theta) / Math.exp(b * CFG.spin))
          rNorm += (Math.random() - 0.5) * 2 * CFG.armWidth * (0.4 + rNorm)
          var bright = Math.random() < 0.09 && rNorm > 0.22
          push(theta, rNorm, k % 2, bright)
        }
      }
      for (i = 0; i < CFG.halo; i++) {
        push(Math.random() * 6.2832, Math.sqrt(Math.random()), 2, false)
      }
      // 生成全幅立体星球：x 幂律分布偏右（左疏右密），越靠右越大越亮。
      planets = []
      for (i = 0; i < CFG.planets; i++) {
        var nx = Math.pow(Math.random(), 0.68)   // 密度 ∝ x^0.47，右侧更密
        planets.push({
          nx: nx, ny: 0.06 + Math.random() * 0.88,
          baseR: CFG.planetR[0] + Math.random() * (CFG.planetR[1] - CFG.planetR[0]),
          hue: i % 4,                            // 0暖核 1金尘 2臂A蓝 3臂B紫
          ring: Math.random() < 0.3,
          ringTilt: (Math.random() - 0.5) * 1.1,
          vx: (Math.random() - 0.5) * CFG.planetDrift,
          vy: (Math.random() - 0.5) * CFG.planetDrift,
          phase: Math.random() * 6.2832,
          ps: CFG.twinkleSpeed * (0.5 + Math.random())
        })
      }
    }
    // 立体星球：外光晕 + 球面明暗（左上高光、右下暗面）+ 部分土星环
    function drawPlanet(x, y, r, col, alpha, ring, ringTilt) {
      var hi = tint(col, 66), lo = tint(col, -58)
      var halo = ctx.createRadialGradient(x, y, r * 0.55, x, y, r * 2.8)
      halo.addColorStop(0, 'rgba(' + col + ',' + (alpha * 0.30).toFixed(3) + ')')
      halo.addColorStop(1, 'rgba(' + col + ',0)')
      ctx.fillStyle = halo
      ctx.beginPath(); ctx.arc(x, y, r * 2.8, 0, 6.2832); ctx.fill()
      if (ring) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(ringTilt)
        ctx.strokeStyle = 'rgba(' + col + ',' + (alpha * 0.55).toFixed(3) + ')'
        ctx.lineWidth = Math.max(1, r * 0.16)
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.9, r * 0.62, 0, 0, 6.2832); ctx.stroke()
        ctx.restore()
      }
      var sph = ctx.createRadialGradient(x - r * 0.34, y - r * 0.38, r * 0.05, x, y, r * 1.08)
      sph.addColorStop(0, 'rgba(' + hi + ',' + alpha.toFixed(3) + ')')
      sph.addColorStop(0.5, 'rgba(' + col + ',' + alpha.toFixed(3) + ')')
      sph.addColorStop(1, 'rgba(' + lo + ',' + alpha.toFixed(3) + ')')
      ctx.fillStyle = sph
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill()
      if (ring) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(ringTilt)
        ctx.strokeStyle = 'rgba(' + hi + ',' + (alpha * 0.8).toFixed(3) + ')'
        ctx.lineWidth = Math.max(1, r * 0.16)
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.9, r * 0.62, 0, 0, Math.PI); ctx.stroke()
        ctx.restore()
      }
    }
    function draw(ts) {
      if (!t0) t0 = ts
      var pal = galaxyPalette()
      ctx.clearRect(0, 0, W, H)
      var fl = CFG.flatten, tilt = CFG.tilt
      var elapsed = reduce ? 3000 : (ts - t0)

      // 1) 右侧螺旋星系（局部坐标系，圆心固定在右侧对联区）
      ctx.save()
      ctx.translate(gx, gy)
      ctx.rotate(tilt)
      ctx.scale(1, fl)
      var glow = ctx.createRadialGradient(0, 0, 0, 0, 0, R)
      var a1 = pal.light ? 0.16 : 0.20
      glow.addColorStop(0, 'rgba(' + pal.core + ',' + (a1 * 1.4).toFixed(3) + ')')
      glow.addColorStop(0.35, 'rgba(' + pal.armA + ',' + a1.toFixed(3) + ')')
      glow.addColorStop(0.72, 'rgba(' + pal.armB + ',' + (a1 * 0.5).toFixed(3) + ')')
      glow.addColorStop(1, 'rgba(' + pal.armB + ',0)')
      ctx.fillStyle = glow
      ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.2832); ctx.fill()
      var baseRot = elapsed * CFG.rotation
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i]
        var extra = s.band === 2 ? elapsed * CFG.drift * (1.2 - s.r) : 0
        var th = s.t + baseRot + extra
        var rad = s.r * R
        var tw = 0.6 + 0.4 * Math.sin(s.phase + (reduce ? 0 : ts * s.ps))
        var al = Math.min(1, s.alpha * tw)
        var col = s.band === 0 ? pal.armA : s.band === 1 ? pal.armB : s.band === 3 ? pal.core : pal.dust
        ctx.fillStyle = 'rgba(' + col + ',' + al.toFixed(3) + ')'
        ctx.beginPath(); ctx.arc(Math.cos(th) * rad, Math.sin(th) * rad, s.size, 0, 6.2832); ctx.fill()
      }
      var breathe = reduce ? 1 : (0.92 + 0.08 * Math.sin(ts * 0.0009))
      var cr = R * CFG.coreSize * breathe
      var core = ctx.createRadialGradient(0, 0, 0, 0, 0, cr * 3.2)
      core.addColorStop(0, 'rgba(' + pal.core + ',0.98)')
      core.addColorStop(0.28, 'rgba(' + pal.core + ',0.62)')
      core.addColorStop(0.6, 'rgba(' + pal.dust + ',0.22)')
      core.addColorStop(1, 'rgba(' + pal.dust + ',0)')
      ctx.fillStyle = core
      ctx.beginPath(); ctx.arc(0, 0, cr * 3.2, 0, 6.2832); ctx.fill()
      ctx.fillStyle = 'rgba(' + pal.core + ',0.95)'
      ctx.beginPath(); ctx.arc(0, 0, cr * 0.55, 0, 6.2832); ctx.fill()
      ctx.restore()

      // 2) 全幅立体星球：右大左小、右亮左淡、缓慢漂移＋闪烁
      var pCols = [pal.core, pal.dust, pal.armA, pal.armB]
      var av = pal.light ? 0.6 : 1   // 浅色主题整体压低，避免压住文字
      for (i = 0; i < planets.length; i++) {
        var p = planets[i]
        if (!reduce) {
          p.nx += p.vx / W; p.ny += p.vy / H
          if (p.nx < 0.02 || p.nx > 0.995) p.vx *= -1
          if (p.ny < 0.03 || p.ny > 0.97) p.vy *= -1
        }
        var r = Math.min(CFG.maxPlanetR, p.baseR * (0.4 + 1.15 * p.nx))
        var al = (CFG.planetAlpha[0] + (CFG.planetAlpha[1] - CFG.planetAlpha[0]) * p.nx)
              * (0.65 + 0.35 * Math.sin(p.phase + (reduce ? 0 : ts * p.ps))) * av
        drawPlanet(p.nx * W, p.ny * H, r, pCols[p.hue], Math.max(0.05, al), p.ring, p.ringTilt)
      }
    }
    function loop(ts) { draw(ts); raf = window.requestAnimationFrame(loop) }

    resize(); seed()
    if (reduce) { draw(0) }
    else { raf = window.requestAnimationFrame(loop) }
    var rt
    window.addEventListener('resize', function () {
      clearTimeout(rt)
      rt = setTimeout(function () { resize(); seed() }, 180)
    })
  }

  // 主题配色（暗＝青铜金／亮＝墨青）；lineK 为亮色下连线的补偿系数。
  function ambPalette() {
    if (document.documentElement.getAttribute('data-theme') === 'light') {
      return { rgb: '28,39,51', lineK: 0.85 }
    }
    return { rgb: '214,196,150', lineK: 1 }
  }
  function initAmbient() {
    var cv = document.getElementById('ambient')
    if (!cv) return
    var reduce = false
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch (e) {}
    window.__qlAmbient = { active: false }
    if (reduce) { cv.style.display = 'none'; return }
    var ctx = cv.getContext('2d')
    if (!ctx) return
    var CFG = AMBIENT_CFG
    var dpr = Math.min(window.devicePixelRatio || 1, 2)
    var W = 0, H = 0, nodes = [], motes = [], gstars = [], meteor = null
    var raf = 0, last = 0, nextMeteor = 0
    function rand(a, b) { return a + Math.random() * (b - a) }
    function resize() {
      var r = cv.parentElement.getBoundingClientRect()
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height))
      cv.width = W * dpr; cv.height = H * dpr
      cv.style.width = W + 'px'; cv.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    function seed() {
      var area = W * H
      var ln = Math.min(CFG.link.max, Math.max(CFG.link.min, Math.round(area / CFG.link.areaPerNode)))
      nodes = []
      for (var i = 0; i < ln; i++) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * CFG.link.speed,
          vy: (Math.random() - 0.5) * CFG.link.speed,
          r: rand(CFG.link.radius[0], CFG.link.radius[1])
        })
      }
      var mn = Math.min(CFG.dust.max, Math.max(CFG.dust.min, Math.round(area / CFG.dust.areaPerMote)))
      motes = []
      for (var k = 0; k < mn; k++) {
        motes.push({
          x: Math.random() * W, y: Math.random() * H,
          vy: -rand(CFG.dust.rise[0], CFG.dust.rise[1]), // 缓慢上浮
          r: rand(CFG.dust.radius[0], CFG.dust.radius[1]),
          phase: Math.random() * 6.2832,
          ps: rand(CFG.dust.twinkle * 0.6, CFG.dust.twinkle * 1.4)
        })
      }
      // 对联区星野：在以 (cx,cy) 为中心、半径 (rx,ry) 的椭圆内按高斯聚集撒点，
      // 越靠中心越密，形成星系核附近的密集星场；左侧文字区自然稀疏。
      var G = CFG.galaxy
      gstars = []
      var gcx = G.cx * W, gcy = G.cy * H
      for (var g = 0; g < G.stars; g++) {
        // 两个均匀数求平均→近似三角分布，中心更密
        var u = (Math.random() + Math.random()) / 2 - 0.5   // [-0.5,0.5] 偏中
        var v = (Math.random() + Math.random()) / 2 - 0.5
        gstars.push({
          x: gcx + u * 2 * G.rx * W,
          y: gcy + v * 2 * G.ry * H,
          r: rand(G.radius[0], G.radius[1]),
          phase: Math.random() * 6.2832,
          ps: rand(G.twinkle * 0.5, G.twinkle * 1.5)
        })
      }
      meteor = null
      nextMeteor = tsSafe() + CFG.meteor.every
    }
    function tsSafe() { try { return performance.now() } catch (e) { return Date.now() } }
    function spawnMeteor() {
      var dir = Math.random() < 0.5 ? 1 : -1
      meteor = {
        x: rand(W * 0.45, W * 1.15),
        y: rand(-40, H * 0.45),
        vx: -CFG.meteor.speed * dir,
        vy: CFG.meteor.speed * rand(0.45, 0.75)
      }
    }
    function step(ts) {
      raf = window.requestAnimationFrame(step)
      if (ts - last < 30) return
      last = ts
      ctx.clearRect(0, 0, W, H)
      var pal = ambPalette()
      var i, j, a, b, dx, dy, d

      // 0) 对联区星野：密集星点 + 闪烁，构成 CSS 星系之上的实体星场
      var G = CFG.galaxy
      for (i = 0; i < gstars.length; i++) {
        a = gstars[i]
        a.phase += a.ps
        var sa = G.alpha[0] + (G.alpha[1] - G.alpha[0]) * (0.5 + 0.5 * Math.sin(a.phase))
        ctx.fillStyle = 'rgba(' + pal.rgb + ',' + sa.toFixed(3) + ')'
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill()
      }

      // 1) 漂浮微尘（底层）：缓慢上浮 + 呼吸闪烁，越界从底部回绕
      for (i = 0; i < motes.length; i++) {
        a = motes[i]
        a.y += a.vy; a.phase += a.ps
        if (a.y < -6) { a.y = H + 6; a.x = Math.random() * W }
        var tw = 0.5 + 0.5 * Math.sin(a.phase)
        var ma = CFG.dust.alpha[0] + (CFG.dust.alpha[1] - CFG.dust.alpha[0]) * tw
        ctx.fillStyle = 'rgba(' + pal.rgb + ',' + ma.toFixed(3) + ')'
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill()
      }

      // 2) 连线网络：节点缓漂 + 邻近连线随距离淡出
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i]
        a.x += a.vx; a.y += a.vy
        if (a.x < -6) a.x = W + 6; if (a.x > W + 6) a.x = -6
        if (a.y < -6) a.y = H + 6; if (a.y > H + 6) a.y = -6
      }
      ctx.lineWidth = 0.6
      for (i = 0; i < nodes.length; i++) for (j = i + 1; j < nodes.length; j++) {
        a = nodes[i]; b = nodes[j]
        dx = a.x - b.x; dy = a.y - b.y; d = Math.sqrt(dx * dx + dy * dy)
        if (d < CFG.link.maxDist) {
          ctx.strokeStyle = 'rgba(' + pal.rgb + ',' + ((1 - d / CFG.link.maxDist) * CFG.link.lineAlpha * pal.lineK).toFixed(3) + ')'
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i]
        ctx.fillStyle = 'rgba(' + pal.rgb + ',0.55)'
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.2832); ctx.fill()
      }

      // 3) 流星：定时生成，带渐隐尾迹，划出即回收
      if (!meteor && ts > nextMeteor) { spawnMeteor(); nextMeteor = ts + CFG.meteor.every * rand(0.7, 1.3) }
      if (meteor) {
        var m = meteor
        var tx = m.x - m.vx * CFG.meteor.length / CFG.meteor.speed
        var ty = m.y - m.vy * CFG.meteor.length / CFG.meteor.speed
        var grad = ctx.createLinearGradient(m.x, m.y, tx, ty)
        grad.addColorStop(0, 'rgba(' + pal.rgb + ',' + CFG.meteor.alpha + ')')
        grad.addColorStop(1, 'rgba(' + pal.rgb + ',0)')
        ctx.strokeStyle = grad; ctx.lineWidth = 1.4
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke()
        m.x += m.vx; m.y += m.vy
        if (m.x < -CFG.meteor.length || m.x > W + CFG.meteor.length || m.y > H + CFG.meteor.length) meteor = null
      }
    }
    resize(); seed()
    window.__qlAmbient.active = true
    raf = window.requestAnimationFrame(step)
    window.addEventListener('resize', function () { resize(); seed() })
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { window.cancelAnimationFrame(raf); window.__qlAmbient.active = false }
      else if (!window.__qlAmbient.active) { window.__qlAmbient.active = true; last = 0; nextMeteor = tsSafe() + CFG.meteor.every; raf = window.requestAnimationFrame(step) }
    })
  }

  function renderLangMenu(locale) {
    var menu = document.getElementById('lang-menu')
    if (!menu) return
    menu.innerHTML = LOCALES.map(function (l) {
      var on = l.code === locale
      return '<button type="button" class="lang-option' + (on ? ' selected' : '') +
        '" role="menuitem" data-locale="' + l.code + '" lang="' + l.code + '"' +
        (on ? ' aria-current="true"' : '') + '>' + esc(l.label) + '</button>'
    }).join('')
  }

  function render() {
    var locale = getLang()
    var lang = baseLang(locale)
    var page = document.body.getAttribute('data-page') || 'home'
    var team = D.team || {}
    document.documentElement.lang = locale
    var name = (team.name || {})[lang] || '秦罗万象'
    var alt = (team.name || {})[lang === 'zh' ? 'en' : 'zh'] || ''
    document.title = page === 'home' ? name + ' · ' + alt : t(lang, page + '.heading') + ' · ' + name
    var nodes = document.querySelectorAll('[data-i18n]')
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = t(lang, nodes[i].getAttribute('data-i18n'))
    // 品牌锁组合（brand lockup）：几何 A 图形 + 英文主字标 + 中文副标，三者均不随界面语言切换。
    // 文字由 team.name 驱动，图形由 BRAND_MARK_SVG 注入；排版见 .brand-main / .brand-sub。
    var enName = (team.name || {}).en || 'Aethera'
    var zhName = (team.name || {}).zh || '秦罗万象'
    var bm = document.getElementById('brand-main'); if (bm) bm.textContent = enName
    var bs = document.getElementById('brand-sub'); if (bs) bs.textContent = zhName
    var sealEl = document.getElementById('brand-seal')
    if (sealEl) sealEl.innerHTML = BRAND_MARK_SVG
    var btn = document.getElementById('lang-toggle')
    if (btn) {
      btn.textContent = t(lang, 'langBtn')
      btn.setAttribute('aria-label', t(lang, 'langBtnAria'))
      btn.setAttribute('aria-haspopup', 'menu')
      btn.setAttribute('aria-expanded', btn.getAttribute('aria-expanded') || 'false')
    }
    renderLangMenu(locale)
    var tb = document.getElementById('theme-toggle')
    if (tb) {
      var toLight = getTheme() !== 'light'
      tb.innerHTML = toLight ? THEME_ICONS.sun : THEME_ICONS.moon
      tb.setAttribute('aria-label', t(lang, toLight ? 'theme.toLightAria' : 'theme.toDarkAria'))
      tb.setAttribute('title', t(lang, toLight ? 'theme.toLight' : 'theme.toDark'))
    }
    var links = document.querySelectorAll('[data-nav]')
    var navKey = page === 'member' ? 'members' : page  // 成员详情页高亮「团队成员」
    for (var j = 0; j < links.length; j++) {
      var on = links[j].getAttribute('data-nav') === navKey
      links[j].classList.toggle('active', on)
      if (on) links[j].setAttribute('aria-current', 'page'); else links[j].removeAttribute('aria-current')
    }
    // R26：fixture 横幅机件退役；页脚仅余数据面队名＋联句（team.json 驱动）。
    var fn = document.getElementById('foot-name')
    if (fn) fn.textContent = (team.name || {})[lang] || ''
    if (page === 'home') renderHome(lang)
    if (page === 'about') renderAbout(lang)
    if (page === 'members') { renderMembers(lang); revealMembersOrbs() }
    if (page === 'member') renderMemberDetail(lang)
    if (page === 'publications') renderPubs(lang)
    if (page !== 'home') { var fc = document.getElementById('foot-couplet'); if (fc) fc.textContent = coupletParts(lang).join(' · ') }
    // 地区变体最后落地（繁体/英式拼写），基于 base 文案转换，不累积。
    applyVariant(document.body, locale)
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme()
    render()
    if ((document.body.getAttribute('data-page') || 'home') === 'home') {
      initGalaxy()
      initAmbient()
    }
    var btn = document.getElementById('lang-toggle')
    var menu = document.getElementById('lang-menu')
    function closeLangMenu() {
      if (!menu) return
      menu.hidden = true
      if (btn) btn.setAttribute('aria-expanded', 'false')
    }
    if (btn && menu) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation()
        var open = menu.hidden
        menu.hidden = !open
        btn.setAttribute('aria-expanded', open ? 'true' : 'false')
        if (open) renderLangMenu(getLang())
      })
      menu.addEventListener('click', function (e) {
        var opt = e.target && e.target.closest ? e.target.closest('[data-locale]') : null
        if (!opt || !menu.contains(opt)) return
        setLang(opt.getAttribute('data-locale'))
        closeLangMenu()
        render()
      })
      document.addEventListener('click', function (e) {
        if (menu.hidden) return
        if (btn.contains(e.target) || menu.contains(e.target)) return
        closeLangMenu()
      })
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !menu.hidden) { closeLangMenu(); btn.focus() }
      })
    }
    var tb = document.getElementById('theme-toggle')
    if (tb) tb.addEventListener('click', function () { setTheme(getTheme() === 'light' ? 'dark' : 'light'); applyTheme(); render() })
    // R25：无存储期间系统主题 live 变化即时跟随；有存储覆盖时不跟随。
    try {
      var mq = window.matchMedia('(prefers-color-scheme: light)')
      var onSys = function () { if (!storedTheme()) { applyTheme(); render() } }
      if (mq.addEventListener) mq.addEventListener('change', onSys)
      else if (mq.addListener) mq.addListener(onSys)
    } catch (e) {}
    var nt = document.getElementById('nav-toggle')
    var nav = document.getElementById('site-nav')
    if (nt && nav) nt.addEventListener('click', function () {
      var open = nav.classList.toggle('open')
      nt.setAttribute('aria-expanded', open ? 'true' : 'false')
    })
  })
})()
