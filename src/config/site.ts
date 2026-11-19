import type { ProfileLink, TimelineEntry } from '@/api/types'

/**
 * 前端静态展示配置。
 * 契约 v1 的 Profile 仅含 displayName/headline/bio/avatarUrl/location/socialLinks，
 * 以下展示字段无后端来源，按 Manager 裁决改为前端静态配置。
 *
 * 后期维护提示：研究方向、经历、印章等在「关于」页对应的 section 由 AboutView 的
 * ABOUT_VISIBILITY 开关控制显隐；需要恢复时把开关打开、在此填回内容即可。
 */
/**
 * 全站印章（“魔”字红印）总开关：默认 false 隐藏。
 * 后期若想恢复印章展示，把这里改为 true 即可（首页 / 页头 / 关于页统一受控）。
 */
export const SEAL_VISIBLE = false

export const PROFILE_DISPLAY: {
  handle: string
  affiliation: string
  email: string
  sealChar: string
  research: string[]
  timeline: TimelineEntry[]
} = {
  handle: 'domagic',
  // 需求(5)：删除「浙江大学管理学院」展示
  affiliation: '',
  email: 'hello@domagic.example.com',
  sealChar: '魔',
  // 需求(3)(7)：删除旧的四个方向，改为「信息系统」「人工智能」
  research: ['信息系统', '人工智能'],
  // 需求(7)：「经历」先隐藏；数据留空，后期需要可在此恢复
  timeline: [],
}

/**
 * 首页封面配置（需求 6/8）：封面所有文案、显示开关与视觉主题集中于此。
 * 后期调整封面内容只需改这里，不必改组件代码；空字符串的项不会渲染。
 */
export const HOME_CONFIG = {
  /** 视觉主题：'tech-light' 全浅色 AI 科技风（流动网格/光晕/粒子，带动画，融入全页连续渐变）；
   *  后期若想换成传统纸感可改为 'classic'（HomeView 两套样式并存）。 */
  theme: 'tech-light' as 'tech-light' | 'classic',
  /** 顶部小标题，空则不显示 */
  eyebrow: '',
  /** 主标题：lead 为普通字，accent 为高亮字 */
  titleLead: '在数据之中，',
  titleAccent: '做一点魔法。',
  /** 主标题下的副标题，空则不显示（需求(5)：删除原长简介） */
  bio: '',
  /** 单位/附属信息，空则不显示（需求(5)：删除「浙江大学管理学院」） */
  affiliation: '',
  /** 主按钮 */
  primaryAction: { label: '开始阅读', to: '/blog' },
  /** 次按钮 */
  secondaryAction: { label: '了解我', to: '/about' },
  /** 侧边竖排字，空则不显示 */
  vertical: '格物致知',
  /** 印章字符，空则不显示印章 */
  sealChar: '魔',
  /**
   * 全站已改为「一条连续渐变贯穿全页」：渐变色由 styles/tokens.css 的 --page-top/mid/bottom
   * 统一管理（近白→浅蓝灰→稍深蓝灰），所有页面共用同一条、无分段跳变。
   * accent: 首页强调色（精选/更多/索引箭头等），配合浅色封面用科技蓝紫。
   */
  palette: {
    accent: '#4f46e5',
  },
}

/**
 * 「关于」页各 section 显隐开关（需求(7)）：后期要恢复「简介」「经历」把对应开关改为 true。
 */
/**
 * 页脚金句（后期改文案只改这里，空字符串则不渲染）。
 */
export const FOOTER_QUOTE = {
  text: '好的研究应当既能解释世界，也能改善日常。',
}

export const ABOUT_VISIBILITY = {
  showBio: false,
  showTimeline: false,
  showResearch: true,
  showContact: true,
}

/** 首页「精选」位：契约无 pinned 字段，改由前端静态配置 slug 列表驱动 */
export const FEATURED_SLUGS: string[] = [
  'causal-inference-notes',
  'ai-reviewer-opinion',
  'paper-digital-innovation',
]

export const DEMO_SOCIAL_LINKS: ProfileLink[] = [
  { label: 'GitHub', url: 'https://github.com/domagic' },
  { label: 'Google Scholar', url: 'https://scholar.google.com/' },
  { label: 'ORCID', url: 'https://orcid.org/' },
]
