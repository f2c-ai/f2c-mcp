import {afterAll, beforeAll, expect, test} from 'bun:test'
import WebSocket from 'ws'

// 端口与URL设置，确保与服务器一致
const PORT = Number.parseInt(process.env.PORT || '3001', 10)
process.env.PORT = String(PORT)
const WS_URL = process.env.WS_URL || `ws://localhost:${PORT}/ws`

let webClient: WebSocket | null = null
let mcpClient: WebSocket | null = null

function createWebClientResponder() {
  const ws = new WebSocket(`${WS_URL}?device=web`)
  ws.on('error', (err: unknown) => {
    console.error('web ws error:', err)
  })
  ws.on('open', () => {
    // 主动告知服务端：web 客户端在线
    ws.send(
      JSON.stringify({
        type: 'device_online',
        data: {device: 'web', online: true, timestamp: Date.now()},
      }),
    )
  })
  ws.on('message', (raw: unknown) => {
    try {
      const msg = JSON.parse(String(raw))
      console.log('[web] recv:', msg)
      if (msg.requestId) {
        const isHtmlReq = msg.type === 'get_html_content'
        const response = isHtmlReq
          ? {
              type: 'get_html_content',
              requestId: msg.requestId,
              data: {content: '<div class="flex flex-col items-center p-7 rounded-2xl">demo</div>'},
              timestamp: Date.now(),
            }
          : {
              type: msg.type,
              requestId: msg.requestId,
              data: msg.data ?? msg,
              timestamp: Date.now(),
            }
        console.log('[web] send:', response)
        ws.send(JSON.stringify(response))
      }
    } catch {}
  })
  return ws
}

beforeAll(async () => {
  // 等待服务器可响应，保证后续 WS 连接成功
  const MCP_URL = `http://localhost:${PORT}/mcp`
  for (let i = 0; i < 10; i++) {
    try {
      await fetch(MCP_URL, {method: 'POST', body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'ping'})})
      break
    } catch {
      await new Promise(r => setTimeout(r, 300))
    }
  }
})

afterAll(() => {
  webClient?.close()
  mcpClient?.close()
})

test('web在线时，mcp请求 get_html_content 并收到固定HTML响应', async () => {
  // 1) 先连接 web 客户端（告知在线），准备响应逻辑
  webClient = createWebClientResponder()
  await new Promise(r => setTimeout(r, 200))

  // 2) 连接 mcp 客户端，发送请求
  mcpClient = new WebSocket(`${WS_URL}?device=mcp`)
  mcpClient.on('error', (err: unknown) => {
    console.error('mcp ws error:', err)
  })

  const responsePromise = new Promise<string>((resolve, reject) => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const timer = setTimeout(() => reject(new Error('Response timeout')), 5000)

    mcpClient!.on('open', () => {
      // 发送请求
      mcpClient!.send(
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

    mcpClient!.on('message', (raw: unknown) => {
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
  expect(typeof content).toBe('string')
  expect(content).toContain('rounded-2xl')
  expect(content).toContain('demo')
})
