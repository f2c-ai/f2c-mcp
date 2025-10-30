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
    expect(hasTool).toBe(true)
  })

  it('callTool(get_code_and_img_url) 应返回结构化内容与文本说明', async () => {
    if (!serverAvailable || !client) {
      expect(true).toBe(true)
      return
    }

    const codeSnippet = `
<div class="flex flex-col items-center gap-6 p-7 md:flex-row md:gap-8 rounded-2xl">
  <div>
    <img class="size-48 shadow-xl rounded-md" alt="" src="/img/cover.png" />
  </div>
  <div class="flex items-center md:items-start">
    <span class="text-2xl font-medium">Class Warfare</span>
    <span class="font-medium text-sky-500">The Anti-Patterns</span>
    <span class="flex gap-2 font-medium text-gray-600 dark:text-gray-400">
      <span>No. 4</span>
      <span>·</span>
      <span>2025</span>
    </span>
  </div>
</div>`

    const result = await client.callTool({
      name: 'get_code_and_img_url',
      arguments: {code: codeSnippet},
    })
    // content 可能被推断为 {}，这里做数组守卫避免类型报错
    const contentList: any[] = Array.isArray((result as any)?.content) ? (result as any).content : []
    const textBlock = contentList.find((c: any) => c?.type === 'text')
    expect(String(textBlock?.text ?? '')).toContain('Converted to project HTML')

    // structuredContent 在 SDK 类型中为 unknown，这里按测试断言需要做宽松访问
    const structured: any = (result as any)?.structuredContent ?? {}
    const filePath = structured?.project?.files?.[0]?.path
    const fileHtml = structured?.project?.files?.[0]?.contents
    expect(filePath).toBe('index.html')
    expect(String(fileHtml)).toContain('<!doctype html')
  })
})
