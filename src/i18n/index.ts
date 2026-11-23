import { computed, type ComputedRef } from 'vue'
import { useLocaleStore, type Locale } from '@/stores/locale'

type Dict = Record<string, string>

/** 界面文案字典。英文正文由 dataset.en.json 提供，此处仅覆盖界面文字。 */
const zh: Dict = {
  'nav.home': '首页',
  'nav.blog': '博客',
  'nav.opinions': '观点',
  'nav.academic': '学术',
  'nav.group': '组会',
  'nav.archive': '归档',
  'nav.about': '关于',
  'nav.team': '团队首页',
  'nav.login': '登录',
  'nav.admin': '管理',
  'nav.diary': '日记',
  'lang.label': '语言',
  'lang.zh': '简体中文',
  'lang.enGB': 'English (UK)',
  'lang.enUS': 'English (US)',
  'theme.toDark': '切换到墨色夜间模式',
  'theme.toLight': '切换到纸色日间模式',
  'common.loading': '加载中…',
  'common.private': '私密',
  'common.draft': '草稿',
  'common.prev': '← 上一页',
  'common.next': '下一页 →',
  'common.pageInfo': '共 {n} 篇',
  'common.empty': '这里还什么都没有',
  'common.readMore': '阅读全文 →',
  'common.allPosts': '全部文章 →',
  'common.back': '返回',
  'common.retry': '加载失败，请稍后重试',
  'home.titleLead': '在数据之中，',
  'home.titleAccent': '做一点魔法。',
  'home.primary': '开始阅读',
  'home.secondary': '了解我',
  'home.vertical': '格物致知',
  'home.featured': '精选',
  'home.recent': '最新',
  'home.categories': '归类',
  'category.blog.desc': '方法、工具与长篇思考。',
  'category.opinions.desc': '对学术生态与行业趋势的明确立场。',
  'category.academic.desc': '论文、报告与项目进展。',
  'category.group.desc': '每周组会报告与讨论记录。',
  'category.diary.desc': '个人日记与随手记录。',
  'category.search': '搜索',
  'category.filterTag': '按标签筛选',
  'archive.note': '公开文章按年份整理；私密内容不在归档中出现。',
  'archive.yearAria': ' 年文章',
  'archive.emptyTitle': '还没有公开文章',
  'archive.emptyNote': '发布后的文章会按年份出现在这里',
  'about.title': '关于',
  'about.intro': '简介',
  'about.research': '研究方向',
  'about.timeline': '经历',
  'about.contact': '联系',
  'about.research.信息系统': '信息系统',
  'about.research.人工智能': '人工智能',
  'about.contactEmpty': '暂无公开联系方式。',
  'privacy.title': '隐私声明',
  'privacy.note': '最近更新：2026-11-13（与 v1.1 安全实现对齐）',
  'post.toc': '目录',
  'post.tocAria': '文章目录',
  'post.notFound': '文章不存在',
  'clock.aria': '日期 {date}，{tz} {time}',
  'nav.aria': '主导航',
  'mobile.aria': '移动端导航',
  'footer.tagline': '在数据之中，做一点魔法。',
  'footer.quote': '好的研究应当既能解释世界，也能改善日常。',
  'footer.privacy': '隐私声明',
}

/** 英式英语：colour / organisation / behaviour / analyse / centre / programme 等拼写与用词。 */
const enGB: Dict = {
  'nav.home': 'Home',
  'nav.blog': 'Blog',
  'nav.opinions': 'Opinions',
  'nav.academic': 'Academic',
  'nav.group': 'Group meetings',
  'nav.archive': 'Archive',
  'nav.about': 'About',
  'nav.team': 'Team site',
  'nav.login': 'Log in',
  'nav.admin': 'Admin',
  'nav.diary': 'Diary',
  'lang.label': 'Language',
  'lang.zh': '简体中文',
  'lang.enGB': 'English (UK)',
  'lang.enUS': 'English (US)',
  'theme.toDark': 'Switch to night mode',
  'theme.toLight': 'Switch to day mode',
  'common.loading': 'Loading…',
  'common.private': 'Private',
  'common.draft': 'Draft',
  'common.prev': '← Previous',
  'common.next': 'Next →',
  'common.pageInfo': '{n} posts',
  'common.empty': 'Nothing here yet',
  'common.readMore': 'Read more →',
  'common.allPosts': 'All posts →',
  'common.back': 'Back to',
  'common.retry': 'Failed to load. Please try again later.',
  'home.titleLead': 'In data, ',
  'home.titleAccent': 'a little magic.',
  'home.primary': 'Start reading',
  'home.secondary': 'About me',
  'home.vertical': 'The investigation of things and the extension of knowledge',
  'home.featured': 'Featured',
  'home.recent': 'Recent',
  'home.categories': 'Categories',
  'category.blog.desc': 'Methods, tools, and long-form thinking.',
  'category.opinions.desc': 'Clear positions on academic and industry trends.',
  'category.academic.desc': 'Papers, reports, and project progress.',
  'category.group.desc': 'Weekly group meeting reports and discussion notes.',
  'category.diary.desc': 'Personal diary and short notes.',
  'category.search': 'Search',
  'category.filterTag': 'Filter by tag',
  'archive.note': 'Public posts organised by year; private content never appears here.',
  'archive.yearAria': ' posts in',
  'archive.emptyTitle': 'No public posts yet',
  'archive.emptyNote': 'Published posts will appear here by year',
  'about.title': 'About',
  'about.intro': 'Profile',
  'about.research': 'Research',
  'about.timeline': 'Experience',
  'about.contact': 'Contact',
  'about.research.信息系统': 'Information Systems',
  'about.research.人工智能': 'Artificial Intelligence',
  'about.contactEmpty': 'No public contact details at present.',
  'privacy.title': 'Privacy',
  'privacy.note': 'Last updated: 2026-11-13 (aligned with the v1.1 security implementation)',
  'post.toc': 'Contents',
  'post.tocAria': 'Table of contents',
  'post.notFound': 'Post not found',
  'clock.aria': 'Date {date}, {tz} {time}',
  'nav.aria': 'Main navigation',
  'mobile.aria': 'Mobile navigation',
  'footer.tagline': 'In data, a little magic.',
  'footer.quote': 'Good research should both explain the world and improve everyday life.',
  'footer.privacy': 'Privacy',
}

/** 美式英语：color / organization / behavior / analyze / center / program 等拼写与用词。 */
const enUS: Dict = {
  ...enGB,
  'nav.group': 'Group Meetings',
  'nav.team': 'Team Site',
  'nav.login': 'Log In',
  'theme.toDark': 'Switch to dark mode',
  'theme.toLight': 'Switch to light mode',
  'common.loading': 'Loading...',
  'common.retry': 'Failed to load. Please try again later.',
  'category.opinions.desc': 'Clear positions on academic and industry trends.',
  'archive.note': 'Public posts organized by year; private content never appears here.',
  'archive.emptyTitle': 'No public posts yet',
  'archive.emptyNote': 'Published posts will appear here by year',
  'about.intro': 'Profile',
  'privacy.note': 'Last updated: 2026-11-13 (aligned with the v1.1 security implementation)',
  'post.toc': 'Contents',
  'footer.tagline': 'In data, a little magic.',
  'footer.quote': 'Good research should both explain the world and improve day-to-day life.',
}

const dict: Record<Locale, Dict> = { 'zh-CN': zh, 'en-GB': enGB, 'en-US': enUS }

export interface I18n {
  locale: ComputedRef<Locale>
  isEn: ComputedRef<boolean>
  t: (key: string, vars?: Record<string, string | number>) => string
  setLocale: (next: Locale) => void
  locales: { code: Locale; label: string }[]
}

export function useI18n(): I18n {
  const store = useLocaleStore()
  const locale = computed(() => store.locale)
  const isEn = computed(() => store.locale !== 'zh-CN')
  const t = (key: string, vars?: Record<string, string | number>): string => {
    let s = dict[store.locale][key] ?? zh[key] ?? key
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
    return s
  }
  return {
    locale,
    isEn,
    t,
    setLocale: store.setLocale,
    locales: [
      { code: 'zh-CN', label: '简体中文' },
      { code: 'en-GB', label: 'English (UK)' },
      { code: 'en-US', label: 'English (US)' },
    ],
  }
}

/** 英文正文统一采用英式拼写；美式界面下把少量英式词形换算为美式，保证两种英文选项有可见差异。 */
const GB_TO_US: [RegExp, string | ((m: string, ...groups: string[]) => string)][] = [
  [/\bbehaviour\b/g, 'behavior'],
  [/\bbehaviours\b/g, 'behaviors'],
  [/\bcolour\b/g, 'color'],
  [/\bcolours\b/g, 'colors'],
  [/\b[Oo]rganis(e|ed|es|ing|ation|ations)\b/g, (m: string, s: string) => `${m[0] === 'O' ? 'Organ' : 'organ'}${s}`],
  [/\b[Rr]ecognis(e|ed|es|ing|ation)\b/g, (m: string, s: string) => `${m[0] === 'R' ? 'Recogn' : 'recogn'}${s}`],
  [/\b[Aa]nalys(e|ed|es|ing|is)\b/g, (m: string, s: string) => `${m[0] === 'A' ? 'Analy' : 'analy'}${s}`],
  [/\bcentre\b/g, 'center'],
  [/\bcentred\b/g, 'centered'],
  [/\bmodelling\b/g, 'modeling'],
  [/\boptimisation\b/g, 'optimization'],
  [/\bprogramme\b/g, 'program'],
  [/\bfavourite\b/g, 'favorite'],
  [/\bdefence\b/g, 'defense'],
  [/\blicence\b/g, 'license'],
  [/\btravelling\b/g, 'traveling'],
  [/\bcancelled\b/g, 'canceled'],
]

export function toLocaleText(text: string, l: Locale): string {
  if (l !== 'en-US') return text
  return GB_TO_US.reduce((s, [re, rep]) => s.replace(re, rep as string), text)
}
