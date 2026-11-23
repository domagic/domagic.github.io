import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Locale = 'zh-CN' | 'en-US'

const STORAGE_KEY = 'magic-locale'

function readLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'zh-CN' || saved === 'en-US') return saved
  } catch {
    // localStorage 不可用时退回默认语言
  }
  return 'zh-CN'
}

/** 界面语言：与主题开关一样持久化到 localStorage，并同步 <html lang>。 */
export const useLocaleStore = defineStore('locale', () => {
  const locale = ref<Locale>(readLocale())

  function apply() {
    document.documentElement.lang = locale.value
  }

  function setLocale(next: Locale) {
    if (locale.value === next) return
    locale.value = next
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
    apply()
  }

  watch(locale, apply, { immediate: true })

  return { locale, setLocale, apply }
})
