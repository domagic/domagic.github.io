import { describe, expect, it } from 'vitest'
import { formatDate, formatDateZh, indexNumber } from '../src/utils/format'

describe('format 工具', () => {
  it('ISO 日期格式化为 YYYY-MM-DD', () => {
    expect(formatDate('2026-10-28T09:00:00+08:00')).toMatch(/^2026-10-2[78]$/)
  })

  it('中文日期格式', () => {
    expect(formatDateZh('2026-11-01T22:00:00+08:00')).toBe('2026 年 11 月 1 日')
  })

  it('非法日期返回空串', () => {
    expect(formatDate('not-a-date')).toBe('')
    expect(formatDateZh('')).toBe('')
  })

  it('null/undefined（草稿无发布时间）返回空串', () => {
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
    expect(formatDateZh(null)).toBe('')
    expect(formatDateZh(undefined)).toBe('')
  })

  it('索引编号补零', () => {
    expect(indexNumber(1)).toBe('01')
    expect(indexNumber(10)).toBe('10')
  })
})