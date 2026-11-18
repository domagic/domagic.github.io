import { defineStore } from 'pinia'
import { createStorage } from '@/api/storage'

const THEME_KEY = 'domagic.theme.v1'
const storage = createStorage()

export type Theme = 'paper' | 'ink'

function initialTheme(): Theme {
  const stored = storage.getItem(THEME_KEY)
  if (stored === 'paper' || stored === 'ink') return stored
  if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'ink'
  }
  return 'paper'
}

export const useThemeStore = defineStore('theme', {
  state: () => ({ theme: initialTheme() as Theme }),
  actions: {
    apply() {
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.theme = this.theme
      }
    },
    toggle() {
      this.theme = this.theme === 'paper' ? 'ink' : 'paper'
      storage.setItem(THEME_KEY, this.theme)
      this.apply()
    },
  },
})