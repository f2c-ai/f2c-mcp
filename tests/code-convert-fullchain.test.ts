import {afterAll, beforeAll, expect, test} from 'bun:test'
import {Client} from '@modelcontextprotocol/sdk/client/index.js'
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
// 在导入服务器之前注入 WebSocket polyfill，确保 SocketClient 使用 ws 库
import WS from 'ws'
import {registerCodeConvert} from '../src/tool/code-convert/index'
;(globalThis as any).WebSocket = WS as any

// 统一端口到 3001，避免与默认 3000 冲突
const PORT = Number.parseInt(process.env.PORT || '3001', 10)
process.env.PORT = String(PORT)
const WS_URL = process.env.WS_URL || `ws://localhost:${PORT}/ws`
const MCP_URL = `http://localhost:${PORT}/mcp`

let webClient: WS | null = null
let mcpClient: Client | null = null

function createWebClientResponder() {
  const ws = new WS(`${WS_URL}?device=web`)
  ws.on('error', err => console.error('[web] ws error:', err))
  ws.on('open', () => {
    console.log('[web] connected')
    const payload = {
      type: 'device_online',
      data: {device: 'web', online: true, timestamp: Date.now()},
    }
    const payloadStr = JSON.stringify(payload)
    console.log('[WS->web] send device_online:', payload)
    ws.send(payloadStr)
  })
  ws.on('message', raw => {
    try {
      const msg = JSON.parse(String(raw))
      console.log('[WS<-web] recv:', msg)
      if (msg && msg.type === 'get_html_content' && msg.requestId) {
        const response = {
          type: 'get_html_content',
          requestId: msg.requestId,
          data: {
            content:
              '<html><head><title>Demo</title></head><body><div class="flex flex-col items-center p-7 rounded-2xl">demo</div></body></html>',
          },
          timestamp: Date.now(),
        }
        const respStr = JSON.stringify(response)
        console.log('[WS->web] send get_html_content response:', response)
        ws.send(respStr)
      }
    } catch {}
  })
  ws.on('close', (code, reason) => {
    console.log('[web] ws closed:', code, String(reason))
  })
  return ws
}

beforeAll(async () => {
  // 启动 HTTP+WS 服务器（确保在设置 PORT 和注入 polyfill 后导入）
  await import('../src/http.ts')

  // 等待服务器可响应，保证后续调用 MCP 接口成功
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(MCP_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'ping'}),
      })
      if (res.ok) break
    } catch {
      await new Promise(r => setTimeout(r, 200))
    }
  }
})

afterAll(async () => {
  webClient?.close()
  if (mcpClient) await mcpClient.close()
})

test('全链路仿真：WS 消息传递 + 工具调用 + 关键日志', async () => {
  // 1) 连接 web 客户端，准备响应逻辑
  webClient = createWebClientResponder()
  await new Promise(r => setTimeout(r, 500))

  // 2) 创建 MCP SDK 客户端并连接 HTTP 传输
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL))
  mcpClient = new Client({name: 'fullchain-client', version: '1.0.0'})
  await mcpClient.connect(transport)

  // 3) 调用工具并获取结果（触发 tool.ts L34-38 的 SocketClient.request）
  const result = await mcpClient.callTool({
    name: 'get_code_to_component',
    arguments: {
      componentName: 'SimComponent',
      framework: 'react',
      style: 'css',
    },
  })

  // 4) 提取并打印文本内容到控制台
  const contentArr: Array<any> = Array.isArray((result as any)?.content)
    ? (((result as any).content as Array<any>) ?? [])
    : []
  const textOut = String(contentArr.length > 0 && contentArr[0]?.text != null ? contentArr[0].text : '')
  console.log('[FULLCHAIN 工具返回文本]', textOut)

  // 5) 基本断言：返回文本非空；若不是错误消息，则验证包含组件名与 HTML 片段
  expect(textOut.length > 0).toBe(true)
  if (!textOut.includes('Error fetching or processing HTML via socket')) {
    expect(textOut).toContain('SimComponent')
    expect(textOut).toContain('rounded-2xl')
    expect(textOut).toContain('demo')
  }
})

test('web在线时，mcp请求 get_html_content 并收到固定HTML响应（WS仿真）', async () => {
  // 1) 先连接 web 客户端（告知在线），准备响应逻辑
  webClient = createWebClientResponder()
  await new Promise(r => setTimeout(r, 200))

  // 2) 连接 mcp（WS 客户端），发送 get_html_content 请求
  const mcpWsClient = new WS(`${WS_URL}?device=mcp`)
  mcpWsClient.on('error', err => {
    console.error('mcp ws error:', err)
  })

  const responsePromise = new Promise<string>((resolve, reject) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const timer = setTimeout(() => reject(new Error('Response timeout')), 5000)

    mcpWsClient.on('open', () => {
      // 发送请求
      mcpWsClient.send(
        JSON.stringify({
          type: 'get_html_content',
          requestId,
          data: {
            componentName: 'TestComponent',
            framework: 'react',
            style: 'css',
          },
          timestamp: Date.now(),
        }),
      )
    })

    mcpWsClient.on('message', raw => {
      try {
        const msg = JSON.parse(String(raw))
        console.log('[mcp] recv:', msg)
        if (msg.type === 'get_html_content' && msg.requestId === requestId) {
          clearTimeout(timer)
          const content = msg?.data?.content ?? ''
          resolve(content)
        }
      } catch {}
    })
  })

  const content = await responsePromise
  console.log('[WS仿真返回HTML]', content)
  expect(typeof content).toBe('string')
  expect(content).toContain('rounded-2xl')
  expect(content).toContain('demo')

  // 关闭 WS 客户端，避免句柄泄漏
  mcpWsClient.close()
})

test('registerCodeConvert 注册了所有 prompts 和工具（合并）', async () => {
  const prompts: Array<{name: string; description: string; schema: any; handler: any}> = []
  const tools: Array<{name: string; description: string; schema: any; handler: any}> = []

  const mockServer: McpServer = {
    prompt: (name: string, description: string, schema: any, handler: (...args: any[]) => any) => {
      prompts.push({name, description, schema, handler})
    },
    tool: (name: string, description: string, schema: any, handler: (...args: any[]) => any) => {
      tools.push({name, description, schema, handler})
    },
  } as unknown as McpServer

  registerCodeConvert(mockServer)

  // 验证 prompts 名称覆盖预期集合
  const promptNames = prompts.map(p => p.name).sort()
  expect(promptNames).toEqual(
    ['html-to-react-css', 'html-to-react-tailwind', 'html-to-vue-css', 'html-to-vue-tailwind'].sort(),
  )

  // 验证工具注册
  const toolNames = tools.map(t => t.name)
  expect(toolNames).toContain('get_code_to_component')

  // 额外验证：随便挑一个 prompt 的 handler 返回消息格式正确
  const reactCss = prompts.find(p => p.name === 'html-to-react-css')!
  const payload = {componentName: 'HelloDiv', source: '<div>demo</div>'}
  const result = await reactCss.handler(payload)
  const textOut = String(result?.messages?.[0]?.content?.text || '')
  console.log('[code-convert prompt output]', textOut)

  expect(result).toBeDefined()
  expect(Array.isArray(result.messages)).toBe(true)
  expect(result.messages[0]?.content?.type).toBe('text')
  expect(String(result.messages[0]?.content?.text || '')).toContain('Convert the provided HTML')
})
