<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError, apiMode } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useSeo } from '@/composables/useSeo'
import SealStamp from '@/components/SealStamp.vue'

useSeo({ title: '登录', description: '登录以管理站点内容。' })

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const error = ref('')
const cooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

function startCooldown(seconds: number) {
  cooldown.value = Math.max(1, seconds)
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})

async function submit() {
  error.value = ''
  if (cooldown.value > 0) return
  try {
    await auth.login(username.value.trim(), password.value)
    // v1.1 增补 §3.1：强制改密会话直接进入改密页，屏蔽管理界面
    if (auth.mustChangePassword) {
      await router.push('/change-password')
      return
    }
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin'
    await router.push(redirect)
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) {
      startCooldown(e.retryAfterSeconds ?? 60)
      error.value = '尝试过于频繁，请稍后再试'
      return
    }
    if (e instanceof ApiError && e.code === 'ACCOUNT_LOCKED') {
      startCooldown(e.retryAfterSeconds ?? 900)
      error.value = e.message
      return
    }
    error.value = e instanceof ApiError ? e.message : '登录失败，请稍后重试'
  }
}
</script>

<template>
  <div class="page login">
    <section class="login__card" aria-label="登录表单">
      <SealStamp />
      <h1 class="login__title">开门</h1>
      <p class="login__note">登录后可管理全部内容。</p>
      <p v-if="route.query.changed === '1'" class="login__notice" role="status">
        密码已更新，所有会话已撤销，请使用新密码重新登录。
      </p>

      <form class="login__form" @submit.prevent="submit">
        <label class="login__field">
          <span>用户名</span>
          <input v-model="username" type="text" autocomplete="username" required />
        </label>
        <label class="login__field">
          <span>密码</span>
          <input v-model="password" type="password" autocomplete="current-password" required />
        </label>
        <p v-if="error" class="login__error" role="alert">{{ error }}</p>
        <button type="submit" class="login__submit" :disabled="auth.pending || cooldown > 0">
          {{ cooldown > 0 ? `请稍候（${cooldown}s）` : auth.pending ? '登录中…' : '登录' }}
        </button>
      </form>

      <p v-if="apiMode === 'mock'" class="login__demo mono">
        演示模式账号：admin / magic-demo（仅 mock，非真实凭据）
      </p>
      <p v-else-if="apiMode === 'static'" class="login__demo mono">
        当前为静态站点模式，仅公开阅读，不支持登录；内容管理请在本地开发环境进行。
      </p>
    </section>
  </div>
</template>

<style scoped>
.login {
  padding-top: 4rem;
  display: flex;
  justify-content: center;
  min-height: 62vh;
}

.login__card {
  width: min(26rem, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  padding: 2.6rem 2rem;
  background: var(--paper-elev);
  border: 1px solid var(--line);
  border-radius: 8px;
  height: fit-content;
}

.login__title {
  font-size: 1.6rem;
  margin-top: 0.6rem;
}

.login__note {
  color: var(--ink-soft);
  font-size: 0.9rem;
  text-align: center;
}

.login__notice {
  color: var(--cinnabar-deep);
  font-size: 0.85rem;
  text-align: center;
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 0.5rem 0.8rem;
  background: var(--paper);
}

.login__form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.login__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.login__field input {
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  padding: 0.6rem 0.9rem;
}

.login__field input:focus {
  border-color: var(--cinnabar);
  outline: none;
}

.login__error {
  color: var(--cinnabar-deep);
  font-size: 0.88rem;
}

.login__submit {
  background: var(--cinnabar);
  color: #f6f1e7;
  border: none;
  border-radius: 999px;
  padding: 0.65rem;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.login__submit:hover:not(:disabled) {
  background: var(--cinnabar-deep);
}

.login__submit:disabled {
  opacity: 0.6;
}

.login__demo {
  margin-top: 0.8rem;
  color: var(--ink-faint);
  font-size: 0.7rem;
  text-align: center;
}
</style>