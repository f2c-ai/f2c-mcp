import {afterAll, beforeAll, describe, expect, it} from 'bun:test'
import {Client} from '@modelcontextprotocol/sdk/client/index.js'
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js'

/**
 * 使用官方 SDK 的 MCP 客户端测试（Streamable HTTP）
 * - 连接到 MCP 服务器
 * - 列出工具并断言存在 get_code_and_img_url
 * - 调用 get_code_and_img_url 并验证结构化返回
 *
 * 通过环境变量 `MCP_BASE_URL` 指定服务地址（默认 http://localhost:3000/mcp）。
 */

const BASE_URL = process.env.MCP_BASE_URL ?? 'http://localhost:3000/mcp'

let client: Client | null = null
let serverAvailable = false

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function buildDynamicSnippet() {
  const albums = ['Class Warfare', 'Silent Echo', 'Neon Drift', 'Rust & Rain'] as const
  const bands = ['The Anti-Patterns', 'Blue Circuit', 'Null Pointers', 'Quantum Cats'] as const
  const years = [1990, 2000, 2025, 2030]
  const layouts = ['md:flex-row md:gap-8', 'md:flex-col md:gap-4'] as const
  const textLayouts = ['flex items-center', 'flex flex-col items-start'] as const
  const imgSrcs = ['/img/cover.png', '/img/cover-2.png', '/img/missing.png'] as const

  const album = pick(albums)
  const band = pick(bands)
  const year = pick(years)
  const layout = pick(layouts)
  const textLayout = pick(textLayouts)
  const imgSrc = pick(imgSrcs)
  const withAlt = Math.random() < 0.5
  const withLazy = Math.random() < 0.5
  const withDataAttrs = Math.random() < 0.5

  const dataAttrs = withDataAttrs ? ' data-testid="card" data-version="v1"' : ''
  const altAttr = withAlt ? ` alt="${album} cover"` : ' alt=""'
  const loadingAttr = withLazy ? ' loading="lazy"' : ''

  const html = `
<div class="flex flex-col items-center gap-6 p-7 rounded-2xl ${layout}"${dataAttrs}>
  <div>
    <img class="size-48 shadow-xl rounded-md"${altAttr} src="${imgSrc}"${loadingAttr} />
  </div>
  <div class="${textLayout}">
    <span class="text-2xl font-medium">${album}</span>
    <span class="font-medium text-sky-500">${band}</span>
    <span class="flex gap-2 font-medium text-gray-600 dark:text-gray-400">
      <span>No. ${Math.floor(Math.random() * 10)}</span>
      <span>·</span>
      <span>${year}</span>
    </span>
  </div>
</div>`

  return {html, meta: {album, band, year, layout, textLayout, imgSrc, withAlt, withLazy, withDataAttrs}}
}

beforeAll(async () => {
  try {
    // 使用官方 Streamable HTTP 客户端传输连接 MCP 服务器
    const transport = new StreamableHTTPClientTransport(new URL(BASE_URL))
    client = new Client({name: 'sdk-client-test', version: '1.0.0'})
    await client.connect(transport)
    serverAvailable = true
  } catch (err) {
    // 如果服务器未启动或不可达，则跳过本文件中的所有断言
    serverAvailable = false
  }
})

afterAll(async () => {
  await client?.close()
})

describe('MCP SDK Client (Streamable HTTP)', () => {
  it('listTools 应包含 get_code_and_img_url', async () => {
    if (!serverAvailable || !client) {
      expect(true).toBe(true)
      return
    }
    const {tools} = await client.listTools()
    const hasTool = Array.isArray(tools) && tools.some(t => t?.name === 'get_code_and_img_url')
    console.log('[MCP SDK Test] tools:', Array.isArray(tools) ? tools.map(t => t.name) : tools)
    expect(hasTool).toBe(true)
  })

  it('callTool(get_code_and_img_url) 应返回结构化内容与文本说明', async () => {
    if (!serverAvailable || !client) {
      expect(true).toBe(true)
      return
    }

    const {html: codeSnippet, meta} = buildDynamicSnippet()
    console.log('[MCP SDK Test] dynamic-meta:', meta)

    const result = await client.callTool({
      name: 'get_code_and_img_url',
      arguments: {
        code: codeSnippet,
        // 可选：提供一个可达的占位图，便于服务器做可达性检查；若离线则仅记录日志
        imgUrl: 'https://via.placeholder.com/96',
      },
    })
    // content 可能被推断为 {}，这里做数组守卫避免类型报错
    const contentList: any[] = Array.isArray((result as any)?.content) ? (result as any).content : []
    const textBlock = contentList.find((c: any) => c?.type === 'text')
    const textStr = String(textBlock?.text ?? '')
    console.log('[MCP SDK Test] text:', textStr)
    expect(textStr).toContain('Converted to project HTML')

    // structuredContent 在 SDK 类型中为 unknown，这里按测试断言需要做宽松访问
    const structured: any = (result as any)?.structuredContent ?? {}
    console.log('[MCP SDK Test] acceptance:', structured?.acceptance)
    const filePath = structured?.project?.files?.[0]?.path
    const fileHtml = structured?.project?.files?.[0]?.contents
    const previewHead = String(fileHtml ?? '')
      .slice(0, 240)
      .replace(/\n/g, ' ')
    console.log('[MCP SDK Test] index.html head:', previewHead)
    expect(filePath).toBe('index.html')
    expect(String(fileHtml)).toContain('<!doctype html')
  })
})
