// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import { authGuard } from '../src/router'
import { useAuthStore } from '../src/stores/auth'

function route(path: string, requiresAuth = false): RouteLocationNormalized {
  return {
    path,
    fullPath: path,
    meta: { requiresAuth },
  } as unknown as RouteLocationNormalized
}

describe('路由守卫', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('未登录访问受保护路由 → 重定向登录并携带 redirect', async () => {
    const result = await authGuard(route('/admin', true))
    expect(result).toEqual({ path: '/login', query: { redirect: '/admin' } })
  })

  it('未登录访问公开路由 → 放行', async () => {
    expect(await authGuard(route('/blog'))).toBe(true)
  })

  it('已登录访问受保护路由 → 放行', async () => {
    const auth = useAuthStore()
    auth.user = { id: 'u1', name: 'owner', role: 'owner' }
    auth.ready = true
    expect(await authGuard(route('/admin', true))).toBe(true)
  })

  it('已登录访问登录页 → 重定向管理页', async () => {
    const auth = useAuthStore()
    auth.user = { id: 'u1', name: 'owner', role: 'owner' }
    auth.ready = true
    expect(await authGuard(route('/login'))).toEqual({ path: '/admin' })
  })
})

describe('路由守卫 v1.1 首登强制改密（增补 §3）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function forcedAuth() {
    const auth = useAuthStore()
    auth.user = { id: 'u1', name: 'owner', role: 'owner' }
    auth.mustChangePassword = true
    auth.ready = true
    return auth
  }

  it('强制改密会话访问 /admin → 重定向改密页', async () => {
    forcedAuth()
    expect(await authGuard(route('/admin', true))).toEqual({ path: '/change-password' })
  })

  it('强制改密会话访问改密页自身 → 放行', async () => {
    forcedAuth()
    expect(await authGuard(route('/change-password', true))).toBe(true)
  })

  it('强制改密会话访问公开页 → 不受影响', async () => {
    forcedAuth()
    expect(await authGuard(route('/blog'))).toBe(true)
  })

  it('强制改密会话访问登录页 → 重定向改密页而非管理页', async () => {
    forcedAuth()
    expect(await authGuard(route('/login'))).toEqual({ path: '/change-password' })
  })

  it('markMustChangePassword 仅在已登录时置位；clear 复位', async () => {
    const auth = useAuthStore()
    auth.markMustChangePassword()
    expect(auth.mustChangePassword).toBe(false)
    auth.user = { id: 'u1', name: 'owner', role: 'owner' }
    auth.markMustChangePassword()
    expect(auth.mustChangePassword).toBe(true)
    auth.clear()
    expect(auth.mustChangePassword).toBe(false)
    expect(auth.user).toBeNull()
  })
})