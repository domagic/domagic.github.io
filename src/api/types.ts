export type Category = 'blog' | 'opinion' | 'diary' | 'academic' | 'group'
export type Visibility = 'public' | 'private'
export type PostStatus = 'published' | 'draft'

export interface ProfileLink {
  label: string
  url: string
}

export interface TimelineEntry {
  period: string
  role: string
  org: string
  note?: string
}

/**
 * 视图层 Profile：name/title/bio/location/links 来自契约 GET /api/v1/profile
 * （displayName/headline/bio/location/socialLinks）；handle/affiliation/email/
 * sealChar/research/timeline 为前端静态展示配置（契约 v1 无对应字段，见 config/site.ts）。
 */
export interface Profile {
  name: string
  handle: string
  title: string
  affiliation: string
  /** Markdown 源（契约 bio），渲染必须 sanitize */
  bio: string
  location: string
  email: string
  sealChar: string
  research: string[]
  links: ProfileLink[]
  timeline: TimelineEntry[]
  avatarUrl?: string | null
}

/** 契约 TagRef：文章携带的标签引用 */
export interface TagRef {
  slug: string
  name: string
}

/** 视图层标签：count 映射契约 postCount（公开已发布计数） */
export interface Tag {
  slug: string
  name: string
  count: number
}

/** 契约 AcademicMeta：仅 type=academic 可携带 */
export interface AcademicMeta {
  authors: string[]
  venue?: string | null
  year?: number | null
  doi?: string | null
  pdfUrl?: string | null
}

/**
 * 视图层文章摘要（内部模型，http 适配层负责与冻结契约 v1 双向映射）：
 * category←type、excerpt←summary、readingMinutes←readingTimeMinutes。
 * 公开列表无 id/visibility/status，适配层以 slug 作稳定键并补 public/published 语义。
 */
export interface PostSummary {
  id: string
  slug: string
  category: Category
  title: string
  excerpt: string
  tags: TagRef[]
  visibility: Visibility
  status: PostStatus
  publishedAt: string | null
  updatedAt?: string
  readingMinutes?: number
  /** 学术元数据（作者/期刊/年份），列表项用于快速检索；非学术文章为 null */
  academicMeta?: AcademicMeta | null
}

export interface Post extends PostSummary {
  /** Markdown 源（契约 contentMd），渲染必须 sanitize */
  content: string
}

/** 写入模型：tags 为标签 slug 数组（契约 CreatePostRequest.tags）；契约无 pinned，禁止发送 */
export interface PostInput {
  title: string
  slug?: string
  category: Category
  excerpt: string
  content: string
  tags: string[]
  visibility: Visibility
  status: PostStatus
  coverImageUrl?: string | null
  academicMeta?: AcademicMeta | null
  /** 契约 CreatePostRequest.publishedAt：仅 status=published 可携带（draft 携带 → 422） */
  publishedAt?: string | null
}

/** 契约 CreateTagRequest（POST /api/v1/admin/tags）：中文标签两步创建的第一步 */
export interface CreateTagInput {
  name: string
  slug?: string
  description?: string | null
}

export interface PostQuery {
  category?: Category
  /** 标签 slug（契约 TagQuery 格式 ^[a-z0-9]+(?:-[a-z0-9]+)*$） */
  tag?: string
  q?: string
  status?: PostStatus
  visibility?: Visibility
  /** admin：登录态全量管理列表（/admin/posts）；缺省按公开规则路由 */
  scope?: 'public' | 'admin'
  page?: number
  pageSize?: number
}

export interface Paged<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** 契约 ArchivePostRef：归档仅公开已发布文章 */
export interface ArchivePostRef {
  slug: string
  title: string
  category: Category
  publishedAt: string
}

/** 契约 ArchiveYear：年份降序，年内按 publishedAt 降序 */
export interface ArchiveYear {
  year: number
  count: number
  posts: ArchivePostRef[]
}

export interface SessionUser {
  id: string
  name: string
  role: 'owner'
}

/** 双令牌会话：accessToken 仅存内存；refreshToken 由 ApiClient 存 localStorage（ADR-004） */
export interface Session {
  accessToken: string
  expiresAt: number
  refreshToken: string
  refreshExpiresAt: number
  user: SessionUser
  /** v1.1 增补 A：首登强制改密标记；恢复会话时 /auth/me 不携带该字段，默认 false，由管理端 403 门禁兜底 */
  mustChangePassword: boolean
}

export interface ValidationDetail {
  field: string
  message: string
}

export interface ApiClient {
  getProfile(): Promise<Profile>
  listPosts(query?: PostQuery): Promise<Paged<PostSummary>>
  /** 公开详情；登录态访问私密/草稿时由适配层回退管理端点 */
  getPost(slug: string): Promise<Post>
  getAdminPost(id: string): Promise<Post>
  createPost(input: PostInput): Promise<Post>
  updatePost(id: string, input: Partial<PostInput>): Promise<Post>
  deletePost(id: string): Promise<void>
  listTags(): Promise<Tag[]>
  /** 管理端创建标签（契约 v1.2 POST /admin/tags）；slug 冲突 → 409 */
  createTag(input: CreateTagInput): Promise<Tag>
  /** 公开归档：按年分组（年份降序，年内 publishedAt 降序） */
  getArchive(): Promise<ArchiveYear[]>
  login(username: string, password: string): Promise<Session>
  /** v1.1 增补 A：改密成功后服务端撤销该用户全部 refresh token，适配层同步清空本地双令牌 */
  changePassword(currentPassword: string, newPassword: string): Promise<{ mustChangePassword: false }>
  logout(): Promise<void>
  me(): Promise<SessionUser>
  /** 页面刷新后凭 localStorage 中的 refreshToken 恢复会话（轮换+me）；无凭据返回 null */
  restoreSession(): Promise<Session | null>
  /** 订阅认证状态变化（刷新失败/登出时通知视图层清理） */
  subscribeAuth(listener: (authenticated: boolean) => void): () => void
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: ValidationDetail[]
  readonly requestId?: string
  readonly retryAfterSeconds?: number

  constructor(
    status: number,
    code: string,
    message: string,
    extra?: {
      details?: ValidationDetail[]
      requestId?: string
      retryAfterSeconds?: number
    },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = extra?.details
    this.requestId = extra?.requestId
    this.retryAfterSeconds = extra?.retryAfterSeconds
  }
}

/** v1.1 增补 §2.3：管理端强制改密门禁的固定文案（403 时精确匹配后跳转改密页） */
export const MUST_CHANGE_PASSWORD_MESSAGE =
  'Password change required before accessing admin resources'

export const CATEGORY_LABELS: Record<Category, string> = {
  blog: '博客',
  opinion: '观点',
  diary: '日记',
  academic: '学术',
  group: '组会',
}

export const CATEGORY_PATHS: Record<Category, string> = {
  blog: '/blog',
  opinion: '/opinions',
  diary: '/diary',
  academic: '/academic',
  group: '/group',
}