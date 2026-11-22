import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
// T7-③：首页是入口与 LCP 关键页，静态导入并入主包，去掉懒加载 chunk 这一级关键请求链；
// 配合 utils/text 拆分（首页不再引入 marked/DOMPurify），缩短慢网下 LCP 的渲染依赖链。
import HomeView from '@/views/HomeView.vue'

export async function authGuard(to: RouteLocationNormalized) {
  const auth = useAuthStore()
  await auth.ensureReady()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  // v1.1 增补 §3.1：强制改密期间屏蔽一切需登录页面（改密页自身除外）
  if (
    auth.isAuthenticated &&
    auth.mustChangePassword &&
    to.meta.requiresAuth &&
    to.path !== '/change-password'
  ) {
    return { path: '/change-password' }
  }
  if (to.path === '/login' && auth.isAuthenticated) {
    return { path: auth.mustChangePassword ? '/change-password' : '/admin' }
  }
  return true
}

// 前进导航的目标滚动位置：由 scrollBehavior 暂存，交给 App.vue 的 Transition
// 在新视图 enter 之前执行。这样可避免 out-in 过渡期间旧视图被滚动拉回首屏。
export const routeScroll = {
  pending: null as { top: number; left: number } | null,
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, saved) {
    // 每次导航先清空上次可能未消费的目标，避免残留影响后续跳转。
    routeScroll.pending = null

    // 回退/前进历史恢复：保持既有行为，导航确认后瞬时恢复位置（回退位置已验证正确）。
    if (saved) {
      return { ...saved, behavior: 'instant' } as any
    }

    // 普通前进（如从首页「精选/最新」点进文章）：
    // App.vue 用 <Transition mode="out-in">，旧视图要先播放 0.28s 淡出动画才卸载。
    // 若在这里立即把 window 滚回顶部，仍在文档流中的旧首页会被拉回首屏，
    // 露出 hero「在数据之中，做一点魔法」，形成闪现。
    // 因此这里暂时不滚动，把目标交给新视图 enter 前（DOM 已插入、尚未绘制）执行 instant 定位。
    routeScroll.pending = { top: 0, left: 0 }
    return false
  },
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: '首页' } },
    { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue'), meta: { title: '关于' } },
    {
      path: '/blog',
      name: 'blog',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: '博客', category: 'blog' },
    },
    {
      path: '/opinions',
      name: 'opinions',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: '观点', category: 'opinion' },
    },
    {
      path: '/academic',
      name: 'academic',
      component: () => import('@/views/AcademicView.vue'),
      meta: { title: '学术' },
    },
    {
      path: '/group',
      name: 'group',
      component: () => import('@/views/CategoryView.vue'),
      meta: { title: '组会', category: 'group' },
    },
    {
      path: '/group/:slug',
      name: 'post-group',
      component: () => import('@/views/PostView.vue'),
      meta: { title: '组会' },
    },
    {
      path: '/blog/:slug',
      name: 'post-blog',
      component: () => import('@/views/PostView.vue'),
      meta: { title: '文章' },
    },
    {
      path: '/opinions/:slug',
      name: 'post-opinion',
      component: () => import('@/views/PostView.vue'),
      meta: { title: '文章' },
    },
    {
      // 日记「板块」已下线：无公开分类列表页/导航/首页入口。
      // 仅保留所有者登录后的单篇私密文章访问，避免后台既有私密日记链接失效或私有内容丢失。
      path: '/diary/:slug',
      name: 'post-diary',
      component: () => import('@/views/PostView.vue'),
      meta: { title: '私密文章', requiresAuth: true },
    },
    {
      path: '/academic/:slug',
      name: 'post-academic',
      component: () => import('@/views/PostView.vue'),
      meta: { title: '学术' },
    },
    { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { title: '登录' } },
    {
      path: '/change-password',
      name: 'change-password',
      component: () => import('@/views/ChangePasswordView.vue'),
      meta: { title: '修改密码', requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { title: '内容管理', requiresAuth: true },
    },
    { path: '/privacy', name: 'privacy', component: () => import('@/views/PrivacyView.vue'), meta: { title: '隐私声明' } },
    { path: '/archive', name: 'archive', component: () => import('@/views/ArchiveView.vue'), meta: { title: '归档' } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue'), meta: { title: '页面不存在' } },
  ],
})

router.beforeEach(authGuard)