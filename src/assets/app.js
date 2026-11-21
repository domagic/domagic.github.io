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

  // 主题切换图标：内联 SVG，零外部依赖，可在此统一替换（后期换图标只改这里）。
  // 当前暗色→显示太阳（点按切亮）；当前亮色→显示月亮（点按切暗）。
  var THEME_ICONS = {
    sun: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.1"></circle><path d="M12 2.6v2.7M12 18.7v2.7M2.6 12h2.7M18.7 12h2.7M5.35 5.35l1.9 1.9M16.75 16.75l1.9 1.9M18.65 5.35l-1.9 1.9M7.25 16.75l-1.9 1.9"></path></svg>',
    moon: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.2 14.8A8.6 8.6 0 0 1 9.2 3.8a8.6 8.6 0 1 0 11 11z"></path></svg>'
  }

  // 品牌标志（完整图案）：左侧流光 A + ∞ 图形，右侧 Aethera 字样，整体作为一枚 logo。
  // 整段可在此替换；配色走 CSS 变量 --mark-*，明暗主题自适应，零外部图片依赖。
  // 文字用 SVG <text> 随图形同一坐标系缩放，保证任意尺寸下比例一致；字体族可改 --serif-en。
  var BRAND_MARK_SVG =
    '<svg viewBox="0 0 300 100" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="qlMarkGrad" x1="0" y1="1" x2="1" y2="0">' +
        '<stop offset="0%" style="stop-color:var(--mark-c1,#f4ecda)"></stop>' +
        '<stop offset="52%" style="stop-color:var(--mark-c2,#d6c496)"></stop>' +
        '<stop offset="100%" style="stop-color:var(--mark-c3,#c9a45c)"></stop>' +
      '</linearGradient></defs>' +
      '<g transform="translate(0,-6) scale(0.92)" fill="none" stroke="url(#qlMarkGrad)" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M20 84 C28 52 40 18 50 10 C60 18 72 52 80 84" stroke-width="9" opacity="0.3"></path>' +
        '<path d="M20 84 C28 52 40 18 50 10 C60 18 72 52 80 84" stroke-width="4.6"></path>' +
        '<path d="M50 56 C43 47 31 48 31 56 C31 64 43 65 50 56 C57 47 69 48 69 56 C69 64 57 65 50 56 Z" stroke-width="4.8"></path>' +
      '</g>' +
      '<text x="104" y="66" fill="url(#qlMarkGrad)" style="font-family:var(--serif-en);font-size:52px;letter-spacing:1px">__BRAND_WORD__</text>' +
    '</svg>'

  function getLang() {
    try { var v = localStorage.getItem(KEY); if (v === 'zh' || v === 'en') return v } catch (e) {}
    return 'zh'
  }
  function setLang(l) { try { localStorage.setItem(KEY, l) } catch (e) {} }
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
    var altName = lang === 'zh' ? (team.name || {}).en : (team.name || {}).zh
    var prov = team.nameStatus && team.nameStatus.en === 'provisional'
    set('hero-enname', altName + (prov ? ' · ' + t(lang, 'marker.provisional') : ''))
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

  function sealChar(m, lang) {
    if (lang === 'zh') return (m.name.zh || '?').charAt(0)
    return (m.name.en || '?').split(/\s+/).map(function (w) { return w.charAt(0) }).join('').slice(0, 2).toUpperCase()
  }
  function renderMembers(lang) {
    var el = document.getElementById('members-grid')
    if (!el) return
    el.innerHTML = D.members.map(function (m) {
      var bio = bi(lang, m.bio)
      var titleLine = m.titleLine[lang] || m.titleLine[lang === 'zh' ? 'en' : 'zh'] || t(lang, 'members.titleFallback')
      var portrait = m.photo
        ? '<img class="portrait-img" src="' + esc(m.photo) + '" alt="' + esc(m.name[lang]) + '">'
        : '<div class="portrait" aria-hidden="true"><span>' + esc(sealChar(m, lang)) + '</span></div>'
      return '<article class="member-card">' + portrait +
        '<div class="member-body">' +
        '<h2 class="member-name">' + esc(m.name[lang] || m.name.zh) +
        ' <span class="member-alt">' + esc(m.name[lang === 'zh' ? 'en' : 'zh']) + '</span></h2>' +
        '<p class="member-title">' + esc(titleLine) + '</p>' +
        (m.status === 'placeholder' ? '<p class="member-badge">' + badge(lang, '', 'badge.pending') + '</p>' : '') +
        '<div class="member-bio prose">' + (bio.missing ? '<p>' + badge(lang, '', 'badge.missing') + '</p>' : '') + bio.html + '</div>' +
        '</div></article>'
    }).join('')
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

  function render() {
    var lang = getLang()
    var page = document.body.getAttribute('data-page') || 'home'
    var team = D.team || {}
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
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
    if (btn) { btn.textContent = t(lang, 'langBtn'); btn.setAttribute('aria-label', t(lang, 'langBtnAria')) }
    var tb = document.getElementById('theme-toggle')
    if (tb) {
      var toLight = getTheme() !== 'light'
      tb.innerHTML = toLight ? THEME_ICONS.sun : THEME_ICONS.moon
      tb.setAttribute('aria-label', t(lang, toLight ? 'theme.toLightAria' : 'theme.toDarkAria'))
      tb.setAttribute('title', t(lang, toLight ? 'theme.toLight' : 'theme.toDark'))
    }
    var links = document.querySelectorAll('[data-nav]')
    for (var j = 0; j < links.length; j++) {
      var on = links[j].getAttribute('data-nav') === page
      links[j].classList.toggle('active', on)
      if (on) links[j].setAttribute('aria-current', 'page'); else links[j].removeAttribute('aria-current')
    }
    // R26：fixture 横幅机件退役；页脚仅余数据面队名＋联句（team.json 驱动）。
    var fn = document.getElementById('foot-name')
    if (fn) fn.textContent = (team.name || {})[lang] || ''
    if (page === 'home') renderHome(lang)
    if (page === 'about') renderAbout(lang)
    if (page === 'members') renderMembers(lang)
    if (page === 'publications') renderPubs(lang)
    if (page !== 'home') { var fc = document.getElementById('foot-couplet'); if (fc) fc.textContent = coupletParts(lang).join(' · ') }
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme()
    render()
    if ((document.body.getAttribute('data-page') || 'home') === 'home') initAmbient()
    var btn = document.getElementById('lang-toggle')
    if (btn) btn.addEventListener('click', function () { setLang(getLang() === 'zh' ? 'en' : 'zh'); render() })
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
