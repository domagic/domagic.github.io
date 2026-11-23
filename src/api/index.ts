import type { ApiClient } from './types'
import type { StaticDataset } from './static/staticClient'
import { createHttpClient } from './http/httpClient'

const mode = import.meta.env.VITE_API_MODE ?? 'mock'
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiMode: 'mock' | 'http' | 'static' =
  mode === 'http' ? 'http' : mode === 'static' ? 'static' : 'mock'

// T5a 第 8 项 / P2-B2：mock fixtures 与 http client 均不入对方产物；
// static 模式仅动态加载 staticClient + 导出 JSON（构建期消费，零运行时请求）
export const api: ApiClient =
  apiMode === 'http'
    ? createHttpClient(baseUrl)
    : apiMode === 'static'
      ? await (async () => {
          const [{ createStaticClient }, dataset, datasetEn] = await Promise.all([
            import('./static/staticClient'),
            import('./static/data/dataset.json'),
            import('./static/data/dataset.en.json').catch(() => null),
          ])
          return createStaticClient(
            dataset as unknown as StaticDataset,
            datasetEn ? (datasetEn as unknown as StaticDataset) : undefined,
          )
        })()
      : await (async () => {
          const { createMockClient } = await import('./mock/mockClient')
          return createMockClient()
        })()

export * from './types'