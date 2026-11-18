import type { ProfileLink, TimelineEntry } from '@/api/types'

/**
 * 前端静态展示配置（T5a 第 6 项）：
 * 契约 v1 的 Profile 仅含 displayName/headline/bio/avatarUrl/location/socialLinks，
 * 以下展示字段无后端来源，按 Manager 裁决改为前端静态配置；
 * 如需入库，走契约增补评审，不得私改接口。内容为演示占位，待站点主人确认。
 */
export const PROFILE_DISPLAY: {
  handle: string
  affiliation: string
  email: string
  sealChar: string
  research: string[]
  timeline: TimelineEntry[]
} = {
  handle: 'domagic',
  affiliation: '浙江大学管理学院',
  email: 'hello@domagic.example.com',
  sealChar: '魔',
  research: ['数字化创新', '平台治理', '信息系统行为', '因果推断方法'],
  timeline: [
    { period: '2023 — 至今', role: '博士研究生', org: '浙江大学管理学院', note: '数字化创新与平台治理方向' },
    { period: '2021 — 2023', role: '研究助理', org: '浙江大学管理学院', note: '参与国家自然科学基金项目' },
    { period: '2017 — 2021', role: '本科', org: '某大学 信息管理与信息系统', note: '演示数据，待替换' },
  ],
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