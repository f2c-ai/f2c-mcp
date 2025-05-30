import {afterEach, describe, expect, it} from 'bun:test'
import f2cApi from '@/server/figma/apis/f2c'
import figmaApi from '@/server/figma/apis/figma'
import {DEFAULT_PERSONAL_TOKEN} from 'src/server/figma/config'

// 测试常量
const originalFetch = global.fetch
const fileKey = 'DkzGbKo09kf2w1ytMPALxd'
const ids = '293-1752'
const personalToken = DEFAULT_PERSONAL_TOKEN

// 模拟响应生成器
const createMockResponse = (options: {
  ok?: boolean
  status?: number
  textData?: string
  jsonData?: any
  throwError?: boolean
}) => {
  if (options.throwError) {
    return () => {
      throw new Error('网络连接失败')
    }
  }

  return () => {
    return {
      ok: options.ok ?? true,
      status: options.status ?? 200,
      text: async () => options.textData ?? '',
      json: async () => options.jsonData ?? {},
    }
  }
}

describe('Figma API', () => {
  // 每个测试后恢复原始 fetch
  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('f2cApi.nodeToCode', () => {
    const htmlCode = '<div>测试 HTML 代码</div>'

    it('应该正确转换 Figma 节点为代码', async () => {
      // 模拟成功的响应
      global.fetch = createMockResponse({textData: htmlCode}) as any

      // 使用手动方法替换来跟踪函数调用
      const fetchCalls: any[] = []
      const originalFetchMethod = f2cApi.fetch
      f2cApi.fetch = function (...args: any) {
        fetchCalls.push(args)
        return originalFetchMethod.apply(this, args)
      }

      const result = await f2cApi.nodeToCode({
        fileKey,
        ids,
        format: 'html',
        personalToken,
      })

      expect(result).toBe(htmlCode)
      expect(fetchCalls.length).toBeGreaterThan(0)
      expect(fetchCalls[0][0]).toContain('https://f2c-figma-api.yy.com/api/nodes')
      expect(fetchCalls[0][0]).toContain(`fileKey=${fileKey}`)
      expect(fetchCalls[0][0]).toContain(`nodeIds=${encodeURIComponent(ids)}`)
      expect(fetchCalls[0][0]).toContain(`personal_token=${personalToken}`)

      // 恢复原始方法
      f2cApi.fetch = originalFetchMethod
    })

    it('应该处理 API 错误', async () => {
      // 模拟失败的响应
      global.fetch = createMockResponse({ok: false, status: 404}) as any

      try {
        await f2cApi.nodeToCode({
          fileKey,
          ids,
          format: 'html',
        })
        // 如果没有抛出错误，测试应该失败
        expect(true).toBe(false)
      } catch (error: any) {
        expect(error.message).toContain('HTTP error')
      }
    })

    it('应该使用默认令牌当未提供个人令牌时', async () => {
      global.fetch = createMockResponse({textData: htmlCode}) as any

      // 使用手动方法替换来跟踪函数调用
      const fetchCalls: any[] = []
      const originalFetchMethod = f2cApi.fetch
      f2cApi.fetch = function (...args: any) {
        fetchCalls.push(args)
        return originalFetchMethod.apply(this, args)
      }

      await f2cApi.nodeToCode({
        fileKey,
        ids,
        format: 'html',
      })

      // 验证使用了默认令牌
      expect(fetchCalls.length).toBeGreaterThan(0)
      expect(fetchCalls[0][0]).toContain(`personal_token=${DEFAULT_PERSONAL_TOKEN}`)

      // 恢复原始方法
      f2cApi.fetch = originalFetchMethod
    })
  })

  describe('figmaApi.files', () => {
    it('应该获取文件节点数据', async () => {
      const mockData = {nodes: {[ids]: {id: ids}}}
      global.fetch = createMockResponse({jsonData: mockData}) as any

      // 使用手动方法替换来跟踪函数调用
      const fetchCalls: any[] = []
      const originalFetchMethod = figmaApi.fetch
      figmaApi.fetch = function (...args: any) {
        fetchCalls.push(args)
        return originalFetchMethod.apply(this, args)
      }

      await figmaApi.files({
        fileKey,
        ids,
      })

      expect(fetchCalls.length).toBeGreaterThan(0)
      expect(fetchCalls[0][0]).toContain(`https://api.figma.com/v1/files/${fileKey}/nodes`)

      // 恢复原始方法
      figmaApi.fetch = originalFetchMethod
    })

    it('应该获取整个文件数据当未提供节点 ID 时', async () => {
      const mockData = {document: {}}
      global.fetch = createMockResponse({jsonData: mockData}) as any

      // 使用手动方法替换来跟踪函数调用
      const fetchCalls: any[] = []
      const originalFetchMethod = figmaApi.fetch
      figmaApi.fetch = function (...args: any) {
        fetchCalls.push(args)
        return originalFetchMethod.apply(this, args)
      }

      await figmaApi.files({
        fileKey,
      })

      expect(fetchCalls.length).toBeGreaterThan(0)
      expect(fetchCalls[0][0]).toContain(`https://api.figma.com/v1/files/${fileKey}`)
      expect(fetchCalls[0][0]).not.toContain('/nodes')

      // 恢复原始方法
      figmaApi.fetch = originalFetchMethod
    })
  })

  describe('figmaApi.images', () => {
    it('应该获取图像数据', async () => {
      const mockData = {images: {[ids]: 'image-url'}}
      global.fetch = createMockResponse({jsonData: mockData}) as any

      // 使用手动方法替换来跟踪函数调用
      const fetchCalls: any[] = []
      const originalFetchMethod = figmaApi.fetch
      figmaApi.fetch = function (...args: any) {
        fetchCalls.push(args)
        return originalFetchMethod.apply(this, args)
      }

      await figmaApi.images({
        fileKey,
        ids,
        format: 'png',
      })

      expect(fetchCalls.length).toBeGreaterThan(0)
      expect(fetchCalls[0][0]).toContain(`https://api.figma.com/v1/images/${fileKey}`)
      expect(fetchCalls[0][0]).toContain(`ids=${ids}`)
      expect(fetchCalls[0][0]).toContain('format=png')

      // 恢复原始方法
      figmaApi.fetch = originalFetchMethod
    })
  })

  describe('figmaApi.imageFills', () => {
    it('应该获取图像填充数据', async () => {
      const mockData = {meta: {images: {}}}
      global.fetch = createMockResponse({jsonData: mockData}) as any

      // 使用手动方法替换来跟踪函数调用
      const fetchCalls: any[] = []
      const originalFetchMethod = figmaApi.fetch
      figmaApi.fetch = function (...args: any) {
        fetchCalls.push(args)
        return originalFetchMethod.apply(this, args)
      }

      await figmaApi.imageFills({
        fileKey,
      })

      expect(fetchCalls.length).toBeGreaterThan(0)
      expect(fetchCalls[0][0]).toContain(`https://api.figma.com/v1/files/${fileKey}/images`)

      // 恢复原始方法
      figmaApi.fetch = originalFetchMethod
    })
  })

  describe('figmaApi.meta', () => {
    it('应该获取元数据', async () => {
      const mockData = {name: 'Test File'}
      global.fetch = createMockResponse({jsonData: mockData}) as any

      // 使用手动方法替换来跟踪函数调用
      const fetchCalls: any[] = []
      const originalFetchMethod = figmaApi.fetch
      figmaApi.fetch = function (...args: any) {
        fetchCalls.push(args)
        return originalFetchMethod.apply(this, args)
      }

      await figmaApi.meta({
        fileKey,
      })

      expect(fetchCalls.length).toBeGreaterThan(0)
      expect(fetchCalls[0][0]).toContain(`https://api.figma.com/v1/files/${fileKey}/meta`)

      // 恢复原始方法
      figmaApi.fetch = originalFetchMethod
    })
  })

  describe('API fetch 方法', () => {
    describe('figmaApi.fetch', () => {
      it('应该处理成功的文本响应', async () => {
        global.fetch = createMockResponse({textData: '测试数据'}) as any
        const textResult = await figmaApi.fetch('https://test-url.com', 'text')
        expect(textResult).toBe('测试数据')
      })

      it('应该处理成功的 JSON 响应', async () => {
        const mockData = {data: '测试数据'}
        global.fetch = createMockResponse({jsonData: mockData}) as any
        const jsonResult = await figmaApi.fetch('https://test-url.com', 'json')
        expect(jsonResult).toEqual(mockData)
      })

      it('应该处理失败的响应', async () => {
        global.fetch = createMockResponse({ok: false, status: 500}) as any

        try {
          await figmaApi.fetch('https://test-url.com')
          // 如果没有抛出错误，测试应该失败
          expect(true).toBe(false)
        } catch (error: any) {
          expect(error.message).toContain('HTTP error')
          expect(error.message).toContain('500')
        }
      })

      it('应该处理网络错误', async () => {
        global.fetch = createMockResponse({throwError: true}) as any

        try {
          await figmaApi.fetch('https://test-url.com')
          // 如果没有抛出错误，测试应该失败
          expect(true).toBe(false)
        } catch (error: any) {
          expect(error.message).toBe('网络连接失败')
        }
      })
    })

    describe('f2cApi.fetch', () => {
      it('应该处理成功的文本响应', async () => {
        global.fetch = createMockResponse({textData: '测试数据'}) as any
        const textResult = await f2cApi.fetch('https://test-url.com', 'text')
        expect(textResult).toBe('测试数据')
      })

      it('应该处理成功的 JSON 响应', async () => {
        const mockData = {data: '测试数据'}
        global.fetch = createMockResponse({jsonData: mockData}) as any
        const jsonResult = await f2cApi.fetch('https://test-url.com', 'json')
        expect(jsonResult).toEqual(mockData)
      })

      it('应该处理失败的响应', async () => {
        global.fetch = createMockResponse({ok: false, status: 500}) as any

        try {
          await f2cApi.fetch('https://test-url.com')
          // 如果没有抛出错误，测试应该失败
          expect(true).toBe(false)
        } catch (error: any) {
          expect(error.message).toContain('HTTP error')
          expect(error.message).toContain('500')
        }
      })
    })
  })

  describe('URL 构建方法', () => {
    describe('figmaApi.opToUrl', () => {
      it('应该正确构建 Figma API URL', async () => {
        global.fetch = createMockResponse({jsonData: {}}) as any

        // 使用手动方法替换来跟踪函数调用
        const fetchCalls: any[] = []
        const originalGlobalFetch = global.fetch
        const fetchSpy = function (url: string, options?: any) {
          fetchCalls.push([url, options])
          return originalGlobalFetch(url, options)
        }
        global.fetch = fetchSpy as any

        await figmaApi.files({
          fileKey,
          ids,
          version: '123',
        })

        // 验证构建的 URL 包含所有参数
        expect(fetchCalls.length).toBeGreaterThan(0)
        const url = fetchCalls[0][0]
        expect(url).toContain(`https://api.figma.com/v1/files/${fileKey}/nodes`)
        expect(url).toContain(`ids=${ids}`)
        expect(url).toContain('version=123')
        expect(url).not.toContain('fileKey=')
      })

      it('应该设置个人令牌', async () => {
        global.fetch = createMockResponse({jsonData: {}}) as any

        // 使用手动方法替换来跟踪函数调用
        const fetchCalls: any[] = []
        const originalGlobalFetch = global.fetch
        const fetchSpy = function (url: string, options?: any) {
          fetchCalls.push([url, options])
          return originalGlobalFetch(url, options)
        }
        global.fetch = fetchSpy as any

        await figmaApi.files({
          fileKey,
          personalToken: 'custom-token',
        })

        // 验证请求头中包含个人令牌
        expect(fetchCalls.length).toBeGreaterThan(0)
        const options = fetchCalls[0][1]
        expect(options.headers['X-FIGMA-TOKEN']).toBe('custom-token')
      })
    })

    describe('f2cApi.opToUrl', () => {
      it('应该正确构建 F2C API URL', async () => {
        global.fetch = createMockResponse({textData: 'test'}) as any

        // 使用手动方法替换来跟踪函数调用
        const fetchCalls: any[] = []
        const originalGlobalFetch = global.fetch
        const fetchSpy = function (url: string, options?: any) {
          fetchCalls.push([url, options])
          return originalGlobalFetch(url, options)
        }
        global.fetch = fetchSpy as any

        await f2cApi.nodeToCode({
          fileKey,
          ids,
          format: 'html',
          personalToken,
        })

        // 验证构建的 URL 包含所有参数
        expect(fetchCalls.length).toBeGreaterThan(0)
        const url = fetchCalls[0][0]
        expect(url).toContain('https://f2c-figma-api.yy.com/api/nodes')
        expect(url).toContain(`fileKey=${fileKey}`)
        expect(url).toContain(`nodeIds=${ids}`)
        expect(url).toContain('format=html')
        expect(url).toContain(`personal_token=${personalToken}`)
      })
    })
  })
})
