import type { Locale } from '@/stores/locale'

/**
 * 当前界面语言的轻量镜像：api 单例在 pinia 安装前创建，不能在模块顶层调用 useLocaleStore。
 * 由 locale store 在 apply/setLocale 时同步，api 层按调用时读取，保证数据源与界面语言一致。
 */
let current: Locale = 'zh-CN'

export function getActiveLocale(): Locale {
  return current
}

export function setActiveLocale(next: Locale): void {
  current = next
}
