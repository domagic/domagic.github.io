import { defineStore } from 'pinia'
import { api } from '@/api'
import type { SessionUser } from '@/api'

// T5a / ADR-004：accessToken 仅存内存（由 ApiClient 持有），store 不落盘任何令牌；
// 页面刷新后通过 api.restoreSession()（localStorage 中的 refreshToken 轮换）恢复。
let restoreInflight: Promise<void> | null = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as SessionUser | null,
    /** v1.1 增补 A：首登强制改密；登录响应携带，恢复会话由管理端 403 门禁置位 */
    mustChangePassword: false,
    pending: false,
    restoring: false,
    ready: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
  },
  actions: {
    async ensureReady() {
      if (this.ready) return
      if (!restoreInflight) {
        this.restoring = true
        restoreInflight = api
          .restoreSession()
          .then((session) => {
            if (session) {
              this.user = session.user
              this.mustChangePassword = session.mustChangePassword
            }
          })
          .catch(() => {
            this.user = null
            this.mustChangePassword = false
          })
          .finally(() => {
            this.ready = true
            this.restoring = false
            restoreInflight = null
          })
      }
      await restoreInflight
    },
    async login(username: string, password: string) {
      this.pending = true
      try {
        const session = await api.login(username, password)
        this.user = session.user
        this.mustChangePassword = session.mustChangePassword
        this.ready = true
      } finally {
        this.pending = false
      }
    },
    async logout() {
      try {
        await api.logout()
      } finally {
        this.clear()
      }
    },
    clear() {
      this.user = null
      this.mustChangePassword = false
    },
    /** 管理端 403 门禁（v1.1 增补 §2.3）命中时置位，路由守卫强制跳转改密页 */
    markMustChangePassword() {
      if (this.user) this.mustChangePassword = true
    },
    /** 订阅适配层认证事件：刷新失败/令牌吊销时同步清理视图态 */
    bindClient() {
      api.subscribeAuth((authenticated) => {
        if (!authenticated) {
          this.user = null
          this.mustChangePassword = false
        }
      })
    },
  },
})