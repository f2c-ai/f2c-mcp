/**
 * 兼容性fetch工具
 * 对于支持原生fetch的Node环境使用fetch，对于不支持的环境使用node-fetch
 */

let nodeFetchModule: any = null

/**
 * 获取兼容的fetch函数
 * @returns Promise<typeof fetch>
 */
async function getCompatibleFetch(): Promise<typeof fetch> {
  // 优先检查global.fetch（用于测试环境）
  if (typeof global !== 'undefined' && global.fetch) {
    return global.fetch
  }

  // 检查是否支持原生fetch
  if (typeof globalThis.fetch !== 'undefined') {
    return globalThis.fetch
  }

  // 如果不支持原生fetch，动态导入node-fetch
  if (!nodeFetchModule) {
    try {
      nodeFetchModule = await import('node-fetch')
    } catch (error) {
      throw new Error(
        'Neither native fetch nor node-fetch is available. Please install node-fetch or upgrade to Node.js 18+',
      )
    }
  }

  return nodeFetchModule.default as unknown as typeof fetch
}

/**
 * 兼容性fetch函数
 * @param input - 请求URL或Request对象
 * @param init - 请求配置选项
 * @returns Promise<Response>
 */
export async function compatFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // 每次调用都重新获取fetch函数，以确保在测试环境中能正确使用mock
  const fetchFn = await getCompatibleFetch()
  return fetchFn(input, init)
}

export default compatFetch
