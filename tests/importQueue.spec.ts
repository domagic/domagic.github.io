import { describe, expect, it } from 'vitest'
import { ApiError } from '../src/api/types'
import { createRateLimiter, withBackoff } from '../src/utils/importQueue'

/** 确定性时钟：sleep 直接推进虚拟时间，避免真实等待 */
function fakeClock() {
  let t = 1_000_000
  const sleeps: number[] = []
  return {
    now: () => t,
    sleep: async (ms: number) => {
      sleeps.push(ms)
      t += ms
    },
    sleeps,
    advance: (ms: number) => {
      t += ms
    },
  }
}

describe('createRateLimiter：60 写/60s + 全局 120/min 滚动窗口', () => {
  it('60 次写入不等待；第 61 次等待到窗口滑出', async () => {
    const clock = fakeClock()
    const limiter = createRateLimiter({ now: clock.now, sleep: clock.sleep })
    for (let i = 0; i < 60; i++) await limiter.acquire('write')
    expect(clock.sleeps.length).toBe(0)
    await limiter.acquire('write')
    expect(clock.sleeps.length).toBe(1)
    expect(clock.sleeps[0]).toBe(60_001)
  })

  it('读取只占全局窗口：60 写 + 60 读后，第 121 次请求等待', async () => {
    const clock = fakeClock()
    const limiter = createRateLimiter({ now: clock.now, sleep: clock.sleep })
    for (let i = 0; i < 60; i++) await limiter.acquire('write')
    for (let i = 0; i < 60; i++) await limiter.acquire('read')
    expect(clock.sleeps.length).toBe(0)
    await limiter.acquire('read')
    expect(clock.sleeps.length).toBe(1)
  })

  it('窗口滑出后恢复配额（旧计数被清理）', async () => {
    const clock = fakeClock()
    const limiter = createRateLimiter({ now: clock.now, sleep: clock.sleep })
    for (let i = 0; i < 60; i++) await limiter.acquire('write')
    clock.advance(60_001)
    await limiter.acquire('write')
    expect(clock.sleeps.length).toBe(0)
  })

  it('小窗口参数：写入与全局限制独立生效', async () => {
    const clock = fakeClock()
    const writeLimited = createRateLimiter({
      writeLimit: 2,
      globalLimit: 5,
      windowMs: 1000,
      now: clock.now,
      sleep: clock.sleep,
    })
    await writeLimited.acquire('write')
    await writeLimited.acquire('write')
    await writeLimited.acquire('write') // 写窗口满 → 等待
    expect(clock.sleeps).toEqual([1001])

    const clock2 = fakeClock()
    const globalLimited = createRateLimiter({
      writeLimit: 5,
      globalLimit: 3,
      windowMs: 1000,
      now: clock2.now,
      sleep: clock2.sleep,
    })
    await globalLimited.acquire('write')
    await globalLimited.acquire('read')
    await globalLimited.acquire('read') // 全局 3 满
    expect(clock2.sleeps.length).toBe(0)
    await globalLimited.acquire('read') // 写窗口未满但全局满 → 仍等待
    expect(clock2.sleeps).toEqual([1001])
  })
})

describe('withBackoff：仅 429 退避重试，409 绝不重试', () => {
  it('429 按 Retry-After 与指数退避取大者重试，最终成功', async () => {
    const clock = fakeClock()
    let calls = 0
    const waits: number[] = []
    const result = await withBackoff(
      async () => {
        calls += 1
        if (calls === 1) throw new ApiError(429, 'RATE_LIMITED', 'limited', { retryAfterSeconds: 5 })
        if (calls === 2) throw new ApiError(429, 'RATE_LIMITED', 'limited')
        return 'ok'
      },
      { baseDelayMs: 1000, sleep: clock.sleep, onWait: (ms) => waits.push(ms) },
    )
    expect(result).toBe('ok')
    expect(calls).toBe(3)
    expect(waits).toEqual([5000, 2000])
  })

  it('超过 maxRetries 后抛出最后一次 429', async () => {
    const clock = fakeClock()
    let calls = 0
    await expect(
      withBackoff(
        async () => {
          calls += 1
          throw new ApiError(429, 'RATE_LIMITED', 'limited')
        },
        { maxRetries: 2, baseDelayMs: 10, sleep: clock.sleep },
      ),
    ).rejects.toMatchObject({ status: 429 })
    expect(calls).toBe(3)
  })

  it('409 CONFLICT 原样抛出且只调用一次（不重试 POST）', async () => {
    let calls = 0
    await expect(
      withBackoff(async () => {
        calls += 1
        throw new ApiError(409, 'CONFLICT', 'slug 已存在')
      }),
    ).rejects.toMatchObject({ status: 409, code: 'CONFLICT' })
    expect(calls).toBe(1)
  })

  it('422/500/网络错误不重试', async () => {
    for (const status of [422, 500, 0]) {
      let calls = 0
      await expect(
        withBackoff(async () => {
          calls += 1
          throw new ApiError(status, 'X', 'err')
        }),
      ).rejects.toBeInstanceOf(ApiError)
      expect(calls).toBe(1)
    }
  })
})