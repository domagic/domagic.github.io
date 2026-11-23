import { computed, type ComputedRef } from 'vue'
import { useLocaleStore, type Locale } from '@/stores/locale'

type Dict = Record<string, string>

/** 界面文案字典：只覆盖界面文字，文章正文仍以原文展示。 */
const dict: Record<Locale, Dict> = {
  'zh-CN': {
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
    'lang.en': 'English',
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
    'privacy.title': '隐私声明',
    'privacy.note': '最近更新：2026-11-13（与 v1.1 安全实现对齐）',
    'post.toc': '目录',
    'post.tocAria': '文章目录',
    'footer.tagline': '在数据之中，做一点魔法。',
    'footer.quote': '好的研究应当既能解释世界，也能改善日常。',
    'footer.privacy': '隐私声明',
  },
  'en-US': {
    'nav.home': 'Home',
    'nav.blog': 'Blog',
    'nav.opinions': 'Opinions',
    'nav.academic': 'Academic',
    'nav.group': 'Group Meetings',
    'nav.archive': 'Archive',
    'nav.about': 'About',
    'nav.team': 'Team Site',
    'nav.login': 'Log in',
    'nav.admin': 'Admin',
    'nav.diary': 'Diary',
    'lang.label': 'Language',
    'lang.zh': '简体中文',
    'lang.en': 'English',
    'theme.toDark': 'Switch to dark mode',
    'theme.toLight': 'Switch to light mode',
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
    'home.titleLead': 'In data,',
    'home.titleAccent': 'a little magic.',
    'home.primary': 'Start reading',
    'home.secondary': 'About me',
    'home.vertical': 'Explore',
    'home.featured': 'Featured',
    'home.recent': 'Recent',
    'home.categories': 'Categories',
    'category.blog.desc': 'Methods, tools, and long-form thinking.',
    'category.opinions.desc': 'Clear positions on academic and industry trends.',
    'category.academic.desc': 'Papers, talks, and project progress.',
    'category.group.desc': 'Weekly group meeting reports and discussion notes.',
    'category.search': 'Search',
    'category.filterTag': 'Filter by tag',
    'archive.note': 'Public posts organized by year; private content never appears here.',
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
    'privacy.title': 'Privacy',
    'privacy.note': 'Last updated: 2026-11-13 (aligned with v1.1 security implementation)',
    'post.toc': 'Contents',
    'post.tocAria': 'Table of contents',
    'footer.tagline': 'In data, a little magic.',
    'footer.quote': 'Good research should explain the world and improve daily life.',
    'footer.privacy': 'Privacy',
  },
}

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
  const isEn = computed(() => store.locale === 'en-US')
  const t = (key: string, vars?: Record<string, string | number>): string => {
    let s = dict[store.locale][key] ?? dict['zh-CN'][key] ?? key
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
      { code: 'en-US', label: 'English' },
    ],
  }
}
