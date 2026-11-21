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
      'nav.home': '首页', 'nav.about': '团队简介', 'nav.members': '团队成员', 'nav.publications': '成果',
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
      'pubs.eyebrow': 'Publications', 'pubs.heading': '成果',
      'pubs.sub': '团队成果清单按发表日期排序；清单与归属口径待 owner 确认。',
      'pubs.empty': '成果清单待成员供给，暂无条目。',
      'pubs.authorsLabel': '作者', 'pubs.venueLabel': '发表',
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
      'pubs.authorsLabel': 'Authors', 'pubs.venueLabel': 'Published in',
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

  // 品牌标志（完整图案）：左侧「流光丝带 A + ∞」图形，右侧 Aethera 字样，整体作为一枚 logo。
  // 图形为一条丝带盘绕的抽象 A：圆拱顶 + 左下环 + 横向交叉带，∞ 嵌于中部（对照官方视觉稿重绘）。
  // 整段可在此替换；配色走 CSS 变量 --mark-*，明暗主题自适应，零外部图片依赖。
  // 文字用 SVG <text> 随图形同一坐标系缩放，字样由 team.name.en 注入，字体族可改 --serif-en。
  var BRAND_MARK_SVG =
    '<svg viewBox="0 0 340 100" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="qlMarkGrad" x1="0" y1="1" x2="1" y2="0">' +
        '<stop offset="0%" style="stop-color:var(--mark-c1,#f4ecda)"></stop>' +
        '<stop offset="52%" style="stop-color:var(--mark-c2,#d6c496)"></stop>' +
        '<stop offset="100%" style="stop-color:var(--mark-c3,#c9a45c)"></stop>' +
      '</linearGradient></defs>' +
      '<g transform="translate(0,5) scale(0.62)">' +
        '<g fill="none" stroke="url(#qlMarkGrad)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M 44,105 C 52,52 88,10 112,10 C 140,10 162,55 200,132"></path>' +
          '<path d="M 44,105 C 22,110 16,132 34,138 C 54,143 76,120 90,100"></path>' +
          '<path d="M 30,102 C 80,90 145,98 200,132"></path>' +
        '</g>' +
        '<g fill="none" stroke="rgba(255,248,225,0.55)" stroke-width="1.4" stroke-linecap="round">' +
          '<path d="M 44,105 C 52,52 88,10 112,10 C 140,10 162,55 200,132"></path>' +
          '<path d="M 30,102 C 80,90 145,98 200,132"></path>' +
        '</g>' +
        '<path d="M 96,66 C 96,60 104,60 108,66 C 112,72 120,72 120,66 C 120,60 112,60 108,66 C 104,72 96,72 96,66 Z" fill="none" stroke="url(#qlMarkGrad)" stroke-width="3.6" stroke-linecap="round"></path>' +
      '</g>' +
      '<text x="138" y="66" fill="url(#qlMarkGrad)" style="font-family:var(--serif-en);font-size:52px;letter-spacing:1px">__BRAND_WORD__</text>' +
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
    var cs = document.getElementById('couplet-status')
    if (cs) {
      var draft = lang === 'en' && team.coupletStatus && team.coupletStatus.en === 'draft'
      cs.hidden = !draft
      cs.textContent = draft ? t(lang, 'marker.draftTrans') : ''
    }
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
      // 三层立体结构：底层底座 / 中层圆盘 / 表层图标；hover 时逐层上浮，形成底层→表层 3D 效果。
      var topInner = m.photo
        ? '<img class="orb-photo" src="' + esc(m.photo) + '" alt="">'
        : '<span class="orb-glyph" aria-hidden="true">' + glyph + '</span>' +
          '<span class="orb-initial" aria-hidden="true">' + esc(sealChar(m, lang)) + '</span>'
      // 图标下不放文字；文字详情只在 member.html?id=... 页展示。aria-label 供屏幕阅读器与悬停提示使用。
      return '<a class="member-orb orb-accent-' + accent + '" href="member.html?id=' + encodeURIComponent(m.id) + '"' +
        ' aria-label="' + name + ' · ' + esc(titleLine) + '">' +
        '<span class="orb-stack">' +
          '<span class="orb-layer orb-layer-base" aria-hidden="true"></span>' +
          '<span class="orb-layer orb-layer-mid" aria-hidden="true"></span>' +
          '<span class="orb-layer orb-layer-top">' + topInner + '</span>' +
        '</span>' +
        '</a>'
    }).join('')
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
    el.innerHTML =
      '<p class="member-back"><a href="members.html">← ' + esc(t(lang, 'member.back')) + '</a></p>' +
      '<h1 class="member-detail-name">' + name + '</h1>' +
      '<p class="member-detail-alt">' + alt + '</p>' +
      '<p class="member-detail-role">' + esc(titleLine) + '</p>' +
      (member.status === 'placeholder' ? '<p class="member-detail-badge">' + badge(lang, '', 'badge.pending') + '</p>' : '') +
      '<div class="member-detail-bio prose">' + (bio.missing ? '<p>' + badge(lang, '', 'badge.missing') + '</p>' : '') + bio.html + '</div>'
  }

  function renderPubs(lang) {
    var el = document.getElementById('pub-list')
    if (!el) return
    if (!D.publications.length) {
      el.innerHTML = '<p class="pub-empty muted">' + esc(t(lang, 'pubs.empty')) + '</p>'
      return
    }
    el.innerHTML = D.publications.map(function (p) {
      var ti = bi(lang, p.title)
      var su = bi(lang, p.summary)
      var kind = t(lang, 'pubs.kind.' + p.kind)
      return '<article class="pub-item">' +
        '<div class="pub-year" aria-hidden="true">' + esc(p.year || '') + '</div>' +
        '<div class="pub-body">' +
        '<h2 class="pub-title">' + esc(ti.html) + (ti.missing ? ' ' + badge(lang, '', 'badge.missing') : '') + '</h2>' +
        '<p class="pub-authors"><span class="lbl">' + esc(t(lang, 'pubs.authorsLabel')) + '</span> ' + esc(p.authors.join(' · ')) + '</p>' +
        '<p class="pub-venue"><span class="lbl">' + esc(t(lang, 'pubs.venueLabel')) + '</span> <em>' + esc(p.venue) + '</em>' + (p.year ? ' (' + esc(p.year) + ')' : '') + '</p>' +
        '<div class="pub-summary prose">' + su.html + '</div>' +
        '<p class="pub-meta">' +
        '<span class="kind">' + esc(kind) + '</span>' +
        (p.doi ? ' <a class="doi" href="https://doi.org/' + esc(p.doi) + '" rel="noopener noreferrer">DOI: ' + esc(p.doi) + '</a>' : '') +
        '</p></div></article>'
    }).join('')
  }

  // ===== 背景粒子动态配置（可编辑：调这里即可改密度/速度/颜色/流星频率，无需动绘制逻辑）=====
  var AMBIENT_CFG = {
    link: {
      areaPerNode: 30000,   // 每多少平方像素放 1 个连线节点（越小越密）
      min: 24, max: 68,
      speed: 0.18,          // 节点漂移速度基准
      maxDist: 128,         // 连线触发距离
      radius: [0.7, 1.7],   // 节点半径范围
      lineAlpha: 0.20       // 连线最大透明度（再乘主题系数）
    },
    dust: {
      areaPerMote: 12000,   // 每多少平方像素放 1 颗漂浮微尘
      min: 26, max: 96,
      rise: [0.05, 0.22],   // 上浮速度范围
      radius: [0.4, 1.4],   // 微尘半径范围
      twinkle: 0.016,       // 呼吸闪烁相位速度
      alpha: [0.10, 0.55]   // 微尘透明度范围
    },
    meteor: {
      every: 4200,          // 流星平均间隔（毫秒）
      speed: 6.2,           // 流星速度（像素/帧）
      length: 140,          // 尾迹长度
      alpha: 0.55           // 流星透明度
    }
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
    var W = 0, H = 0, nodes = [], motes = [], meteor = null
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
    // 品牌区：印章 = 完整图案（A+∞ 图形 + 英文名 Aethera），由 team.name.en 驱动；
    // 旁边仅保留中文名作为辅助（避免与印章内英文名重复）。logo 固定，不随界面语言切换。
    var enName = (team.name || {}).en || 'Aethera'
    var zhName = (team.name || {}).zh || '秦罗万象'
    var bm = document.getElementById('brand-main'); if (bm) bm.textContent = zhName
    var bs = document.getElementById('brand-sub'); if (bs) bs.textContent = ''
    // 完整图案：注入含 A+∞ 图形与英文字样的 SVG；字样由 team.name.en 注入，配色走 CSS 变量。
    var sealEl = document.getElementById('brand-seal')
    if (sealEl) sealEl.innerHTML = BRAND_MARK_SVG.replace('__BRAND_WORD__', enName)
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
    if (page === 'members') renderMembers(lang)
    if (page === 'member') renderMemberDetail(lang)
    if (page === 'publications') renderPubs(lang)
    if (page !== 'home') { var fc = document.getElementById('foot-couplet'); if (fc) fc.textContent = coupletParts(lang).join(' · ') }
    // 地区变体最后落地（繁体/英式拼写），基于 base 文案转换，不累积。
    applyVariant(document.body, locale)
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme()
    render()
    if ((document.body.getAttribute('data-page') || 'home') === 'home') initAmbient()
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
