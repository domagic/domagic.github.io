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

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, saved) {
    // 全局 html 设了 scroll-behavior:smooth（供页内 TOC 锚点平滑跳转用）。
    // 但路由切换必须瞬时定位：否则从首页「精选/最新索引」（scrollY 较大）点进文章，
    // 新页面会先停在原滚动位置，再被 smooth 动画缓慢拉回顶部，出现"卡顿+回退"的怪异感。
    // behavior:'instant' 覆盖 CSS 的 smooth，只影响路由跳转，不影响页内锚点。
    const pos = saved ? { ...saved } : { top: 0, left: 0 }
    return { ...pos, behavior: 'instant' } as any
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