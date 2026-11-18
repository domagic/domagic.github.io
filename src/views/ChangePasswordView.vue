<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError, api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useSeo } from '@/composables/useSeo'
import SealStamp from '@/components/SealStamp.vue'

useSeo({ title: '修改密码', description: '修改登录密码；成功后所有会话将被撤销。' })

const auth = useAuthStore()
const router = useRouter()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const fieldErrors = ref<Record<string, string>>({})
const pending = ref(false)
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

function validate(): boolean {
  fieldErrors.value = {}
  if (!currentPassword.value) {
    fieldErrors.value.currentPassword = '请输入当前密码'
  }
  if (newPassword.value.length < 12 || newPassword.value.length > 128) {
    fieldErrors.value.newPassword = '新密码长度须为 12–128 位'
  }
  if (confirmPassword.value !== newPassword.value) {
    fieldErrors.value.confirmPassword = '两次输入的新密码不一致'
  }
  return Object.keys(fieldErrors.value).length === 0
}

async function submit() {
  error.value = ''
  if (cooldown.value > 0 || pending.value) return
  if (!validate()) return
  pending.value = true
  try {
    await api.changePassword(currentPassword.value, newPassword.value)
    // 服务端已撤销全部 refresh token，本地双令牌已被适配层清空；回登录页重新认证
    auth.clear()
    await router.push({ path: '/login', query: { changed: '1' } })
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) {
      startCooldown(e.retryAfterSeconds ?? 30)
      error.value = '请求过于频繁，请稍后再试'
      return
    }
    if (e instanceof ApiError && e.details?.length) {
      for (const detail of e.details) fieldErrors.value[detail.field] = detail.message
    }
    if (e instanceof ApiError && e.status === 422) {
      fieldErrors.value.newPassword = e.message
    }
    if (e instanceof ApiError && e.status === 401) {
      if (!auth.isAuthenticated) {
        // 会话已失效（刷新失败/令牌吊销）：回登录页
        void router.push('/login')
        return
      }
      fieldErrors.value.currentPassword = '当前密码不正确'
    }
    error.value = e instanceof ApiError ? e.message : '修改失败，请稍后重试'
  } finally {
    pending.value = false
  }
}

async function logout() {
  await auth.logout()
  void router.push('/login')
}
</script>

<template>
  <div class="page change-password">
    <section class="cp__card" aria-label="修改密码表单">
      <SealStamp />
      <h1 class="cp__title">换钥</h1>
      <p v-if="auth.mustChangePassword" class="cp__note cp__note--forced" role="status">
        首次登录须修改初始密码，完成后才能进入管理界面。
      </p>
      <p class="cp__note">
        新密码至少 12 位。修改成功后所有设备的会话将被撤销，需重新登录。
      </p>

      <form class="cp__form" @submit.prevent="submit">
        <label class="cp__field">
          <span>当前密码</span>
          <input
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            required
            :aria-invalid="Boolean(fieldErrors.currentPassword)"
            aria-describedby="cp-err-current"
          />
          <em v-if="fieldErrors.currentPassword" id="cp-err-current" class="cp__field-error">
            {{ fieldErrors.currentPassword }}
          </em>
        </label>
        <label class="cp__field">
          <span>新密码</span>
          <input
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            minlength="12"
            maxlength="128"
            required
            :aria-invalid="Boolean(fieldErrors.newPassword)"
            aria-describedby="cp-err-new"
          />
          <em v-if="fieldErrors.newPassword" id="cp-err-new" class="cp__field-error">
            {{ fieldErrors.newPassword }}
          </em>
        </label>
        <label class="cp__field">
          <span>确认新密码</span>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            minlength="12"
            maxlength="128"
            required
            :aria-invalid="Boolean(fieldErrors.confirmPassword)"
            aria-describedby="cp-err-confirm"
          />
          <em v-if="fieldErrors.confirmPassword" id="cp-err-confirm" class="cp__field-error">
            {{ fieldErrors.confirmPassword }}
          </em>
        </label>
        <p v-if="error" class="cp__error" role="alert">{{ error }}</p>
        <button type="submit" class="cp__submit" :disabled="pending || cooldown > 0">
          {{ cooldown > 0 ? `请稍候（${cooldown}s）` : pending ? '提交中…' : '修改密码' }}
        </button>
      </form>

      <button type="button" class="cp__logout" @click="logout">退出登录</button>
    </section>
  </div>
</template>

<style scoped>
.change-password {
  padding-top: 4rem;
  display: flex;
  justify-content: center;
  min-height: 62vh;
}

.cp__card {
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

.cp__title {
  font-size: 1.6rem;
  margin-top: 0.6rem;
}

.cp__note {
  color: var(--ink-soft);
  font-size: 0.9rem;
  text-align: center;
}

.cp__note--forced {
  color: var(--cinnabar-deep);
  font-weight: 600;
}

.cp__form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.cp__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.cp__field input {
  background: var(--paper);
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  padding: 0.6rem 0.9rem;
}

.cp__field input:focus {
  border-color: var(--cinnabar);
  outline: none;
}

.cp__field input[aria-invalid='true'] {
  border-color: var(--cinnabar-deep);
}

.cp__field-error {
  color: var(--cinnabar-deep);
  font-size: 0.8rem;
  font-style: normal;
}

.cp__error {
  color: var(--cinnabar-deep);
  font-size: 0.88rem;
}

.cp__submit {
  background: var(--cinnabar);
  color: #f6f1e7;
  border: none;
  border-radius: 999px;
  padding: 0.65rem;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.cp__submit:hover:not(:disabled) {
  background: var(--cinnabar-deep);
}

.cp__submit:disabled {
  opacity: 0.6;
}

.cp__logout {
  margin-top: 0.4rem;
  background: none;
  border: none;
  color: var(--ink-faint);
  font-size: 0.82rem;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.cp__logout:hover {
  color: var(--ink-soft);
}
</style>