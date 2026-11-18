import { ApiError } from '@/api/types'

/**
 * P1-3 批量导入节流与退避（契约 v1.2：create/update/delete 60 次/60s + 全局 120 次/min）。
 * 滚动窗口计数；写入同时占用两个窗口，读取只占全局窗口。
 * 时钟与 sleep 可注入，便于单测确定性验证。
 */

export interface RateLimiterOptions {
  writeLimit?: number
  globalLimit?: number
  windowMs?: number
  now?: () => number
  sleep?: (ms: number) => Promise<void>
}

export interface RateLimiter {
  acquire(kind: 'write' | 'read'): Promise<void>
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export function createRateLimiter(options: RateLimiterOptions = {}): RateLimiter {
  const writeLimit = options.writeLimit ?? 60
  const globalLimit = options.globalLimit ?? 120
  const windowMs = options.windowMs ?? 60_000
  const now = options.now ?? Date.now
  const sleep = options.sleep ?? defaultSleep
  const writeStamps: number[] = []
  const globalStamps: number[] = []

  function prune(stamps: number[], t: number): void {
    while (stamps.length > 0 && stamps[0] <= t - windowMs) stamps.shift()
  }

  async function acquire(kind: 'write' | 'read'): Promise<void> {
    for (;;) {
      const t = now()
      prune(globalStamps, t)
      if (kind === 'write') prune(writeStamps, t)
      const globalFull = globalStamps.length >= globalLimit
      const writeFull = kind === 'write' && writeStamps.length >= writeLimit
      if (!globalFull && !writeFull) {
        globalStamps.push(t)
        if (kind === 'write') writeStamps.push(t)
        return
      }
      const waitGlobal = globalFull ? globalStamps[0] + windowMs - t + 1 : 0
      const waitWrite = writeFull ? writeStamps[0] + windowMs - t + 1 : 0
      await sleep(Math.max(1, waitGlobal, waitWrite))
    }
  }

  return { acquire }
}

export interface BackoffOptions {
  maxRetries?: number
  baseDelayMs?: number
  sleep?: (ms: number) => Promise<void>
  onWait?: (ms: number, attempt: number) => void
}

/**
 * 仅对 429 退避重试（请求被限流拒绝、未产生副作用，重放安全）；
 * 优先 Retry-After，否则指数退避。409/4xx/5xx 一律原样抛出：
 * 409 由调用方走 skip-or-PATCH，绝不重试 POST。
 */
export async function withBackoff<T>(fn: () => Promise<T>, options: BackoffOptions = {}): Promise<T> {
  const maxRetries = options.maxRetries ?? 3
  const baseDelayMs = options.baseDelayMs ?? 1000
  const sleep = options.sleep ?? defaultSleep
  let attempt = 0
  for (;;) {
    try {
      return await fn()
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 429 || attempt >= maxRetries) throw e
      const retryAfterMs = (e.retryAfterSeconds ?? 0) * 1000
      const delay = Math.max(retryAfterMs, baseDelayMs * 2 ** attempt)
      options.onWait?.(delay, attempt)
      attempt += 1
      await sleep(delay)
    }
  }
}