import {
  ApiError,
  type AcademicMeta,
  type ApiClient,
  type ArchiveYear,
  type Category,
  type Paged,
  type Post,
  type PostQuery,
  type PostSummary,
  type Profile,
  type Tag,
  type TagRef,
} from '../types'
import { PROFILE_DISPLAY } from '../../config/site'

/**
 * P2-B2 static 数据源（第三模式，与 mock/http 并列）：
 * 构建期消费 LuoCG P2-B1 导出 JSON（契约 v1.2 公开形状，仅 published && public），
 * 零运行时网络请求、零认证面。私密/草稿内容不存在于导出数据中，深链一律 404。
 * 导出 schema 以 shared/P2-B-静态导出/ 发布版为准；本适配层按契约线上形状实现，
 * 差异由 scripts/sync-static-data.mjs 归一化吸收。
 */

// ---------- 契约 v1.2 公开线上形状（与 http 适配层 Wire* 一致） ----------

export interface StaticWireTagRef {
  slug: string
  name: string
}

export interface StaticWirePost {
  slug: string
  type: Category
  title: string
  summary: string
  tags: StaticWireTagRef[]
  coverImageUrl?: string | null
  publishedAt: string
  readingTimeMinutes: number
  contentMd: string
  academicMeta?: AcademicMeta | null
  updatedAt: string
}

export interface StaticWireProfile {
  displayName: string
  headline: string
  bio: string
  avatarUrl?: string | null
  location?: string | null
  socialLinks: { label: string; url: string }[]
  updatedAt: string
}

export interface StaticWireTag {
  id: string
  slug: string
  name: string
  description?: string | null
  postCount: number
}

export interface StaticWireArchiveYear {
  year: number
  count: number
  posts: { slug: string; title: string; type: Category; publishedAt: string }[]
}

export interface StaticDataset {
  schema: string
  generatedAt: string
  profile: StaticWireProfile
  /** 仅 published && public；导出侧保证，适配层按 publishedAt 降序兜底排序 */
  posts: StaticWirePost[]
  tags: StaticWireTag[]
  archive: StaticWireArchiveYear[]
}

export const STATIC_DATASET_SCHEMA = 'domagic-static-export/v1'

function mapTagRefs(tags: StaticWireTagRef[] | undefined): TagRef[] {
  return (tags ?? []).map((t) => ({ slug: t.slug, name: t.name }))
}

function mapSummary(w: StaticWirePost): PostSummary {
  return {
    id: w.slug,
    slug: w.slug,
    category: w.type,
    title: w.title,
    excerpt: w.summary,
    tags: mapTagRefs(w.tags),
    visibility: 'public',
    status: 'published',
    publishedAt: w.publishedAt,
    readingMinutes: w.readingTimeMinutes,
  }
}

function mapDetail(w: StaticWirePost): Post {
  return {
    ...mapSummary(w),
    content: w.contentMd,
    updatedAt: w.updatedAt,
    academicMeta: w.academicMeta ?? null,
  }
}

function mapProfile(w: StaticWireProfile): Profile {
  return {
    name: w.displayName,
    handle: PROFILE_DISPLAY.handle,
    title: w.headline,
    affiliation: PROFILE_DISPLAY.affiliation,
    bio: w.bio,
    location: w.location ?? '',
    email: PROFILE_DISPLAY.email,
    sealChar: PROFILE_DISPLAY.sealChar,
    research: [...PROFILE_DISPLAY.research],
    links: w.socialLinks.map((l) => ({ label: l.label, url: l.url })),
    timeline: PROFILE_DISPLAY.timeline.map((t) => ({ ...t })),
    avatarUrl: w.avatarUrl ?? null,
  }
}

function readOnlyError(): ApiError {
  return new ApiError(403, 'FORBIDDEN', '静态站点模式为只读公开内容，不支持登录或内容管理')
}

export function createStaticClient(dataset: StaticDataset): ApiClient {
  // 防御性快照：避免调用方变更返回对象污染数据源
  const posts = [...dataset.posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const bySlug = new Map(posts.map((p) => [p.slug, p]))
  const profile = mapProfile(dataset.profile)
  const tags: Tag[] = dataset.tags.map((t) => ({ slug: t.slug, name: t.name, count: t.postCount }))
  const archive: ArchiveYear[] = dataset.archive.map((y) => ({
    year: y.year,
    count: y.count,
    posts: y.posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.type,
      publishedAt: p.publishedAt,
    })),
  }))

  return {
    async getProfile(): Promise<Profile> {
      return structuredClone(profile)
    },

    async listPosts(query: PostQuery = {}): Promise<Paged<PostSummary>> {
      let items = posts
      if (query.category) items = items.filter((p) => p.type === query.category)
      if (query.tag) items = items.filter((p) => p.tags.some((t) => t.slug === query.tag))
      if (query.q) {
        const q = query.q.toLowerCase()
        // 契约：q 仅 ILIKE title/summary，不检索正文
        items = items.filter((p) =>
          [p.title, p.summary].some((f) => f.toLowerCase().includes(q)),
        )
      }
      const page = Math.max(1, query.page ?? 1)
      const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 10))
      const start = (page - 1) * pageSize
      return {
        items: items.slice(start, start + pageSize).map((p) => structuredClone(mapSummary(p))),
        total: items.length,
        page,
        pageSize,
      }
    },

    async getPost(slug: string): Promise<Post> {
      const post = bySlug.get(slug)
      // 私密/草稿不在导出中，与不存在同样 404，不泄露存在性
      if (!post) throw new ApiError(404, 'NOT_FOUND', '文章不存在')
      return structuredClone(mapDetail(post))
    },

    async getAdminPost(): Promise<Post> {
      throw readOnlyError()
    },

    async createPost(): Promise<Post> {
      throw readOnlyError()
    },

    async updatePost(): Promise<Post> {
      throw readOnlyError()
    },

    async deletePost(): Promise<void> {
      throw readOnlyError()
    },

    async createTag(): Promise<Tag> {
      throw readOnlyError()
    },

    async listTags(): Promise<Tag[]> {
      return structuredClone(tags)
    },

    async getArchive(): Promise<ArchiveYear[]> {
      return structuredClone(archive)
    },

    async login(): Promise<never> {
      throw readOnlyError()
    },

    async changePassword(): Promise<never> {
      throw readOnlyError()
    },

    async logout(): Promise<void> {
      // 静态模式无会话，幂等空操作
    },

    async me(): Promise<never> {
      throw new ApiError(401, 'UNAUTHORIZED', '静态站点模式无登录会话')
    },

    async restoreSession(): Promise<null> {
      return null
    },

    subscribeAuth() {
      return () => undefined
    },
  }
}