import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {toFetchResponse, toReqRes} from 'fetch-to-node'
import {Hono} from 'hono'
import {upgradeWebSocket, websocket} from 'hono/bun'
import {server} from 'src/tool'
import {socketClient} from './utils/socket-client'

const app = new Hono()

// WebSocket 连接管理
const connections = new Map<string, any>()
const clientRegistry = new Map<
  string,
  {
    clientType: string
    capabilities?: string[]
    processorType?: string
  }
>()

app.get(
  '/ws',
  upgradeWebSocket(() => {
    let clientId: string
    return {
      onOpen: (event, ws) => {
        // 为每个连接生成唯一ID
        clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        connections.set(clientId, ws)

        console.log(`🔌 客户端连接: ${clientId} (总连接数: ${connections.size})`)

        // 通知客户端连接成功
        ws.send(
          JSON.stringify({
            type: 'connection_established',
            clientId: clientId,
            timestamp: Date.now(),
          }),
        )
      },

      onMessage: (event, ws) => {
        try {
          const message = JSON.parse(event.data as string)
          console.log(`📨 收到消息 [${clientId}]:`, message.type)

          // 处理客户端注册
          if (message.type === 'register_client') {
            clientRegistry.set(clientId, {
              clientType: message.clientType,
              capabilities: message.capabilities,
              processorType: message.processorType,
            })
            console.log(`客户端注错册: ${clientId} (${message.clientType})`)

            // 显示当前注册的客户端
            const mcpClients = Array.from(clientRegistry.entries()).filter(
              ([_, info]) => info.clientType === 'mcp_client',
            )
            const processors = Array.from(clientRegistry.entries()).filter(
              ([_, info]) => info.clientType === 'business_processor',
            )

            console.log(`📊 当前状态: MCP客户端 ${mcpClients.length} 个, 业务处理器 ${processors.length} 个`)
            return
          }

          // 消息转发逻辑
          if (message.target) {
            // 点对点消息转发
            forwardToTarget(message, clientId)
          } else {
            // 广播消息 (排除发送者)
            broadcastMessage(message, clientId)
          }
        } catch (error) {
          console.error(`💥 消息解析错误 [${clientId}]:`, error)
        }
      },

      onClose: () => {
        if (clientId) {
          connections.delete(clientId)
          clientRegistry.delete(clientId)
          console.log(`🔌 客户端断开: ${clientId} (剩余连接数: ${connections.size})`)
        }
      },

      onError: error => {
        console.error(`💥 WebSocket错误 [${clientId}]:`, error)
      },
    }
  }),
)

// 消息转发到指定目标
function forwardToTarget(message: any, senderId: string) {
  const targetWs = connections.get(message.target)

  if (targetWs) {
    // 添加发送者信息
    const forwardedMessage = {
      ...message,
      sender: senderId,
      forwarded: true,
      forwardedAt: Date.now(),
    }

    targetWs.send(JSON.stringify(forwardedMessage))
    console.log(`📤 消息转发: ${senderId} -> ${message.target}`)
  } else {
    // 目标不存在，发送错误响应
    const errorResponse = {
      type: 'forward_error',
      requestId: message.requestId,
      error: `Target client ${message.target} not found`,
      timestamp: Date.now(),
    }

    const senderWs = connections.get(senderId)
    if (senderWs) {
      senderWs.send(JSON.stringify(errorResponse))
    }
    console.log(`❌ 转发失败: 目标 ${message.target} 不存在`)
  }
}

// 广播消息到所有其他客户端
function broadcastMessage(message: any, senderId: string) {
  let broadcastCount = 0

  connections.forEach((ws, clientId) => {
    if (clientId !== senderId) {
      const broadcastMessage = {
        ...message,
        sender: senderId,
        broadcast: true,
        broadcastAt: Date.now(),
      }

      ws.send(JSON.stringify(broadcastMessage))
      broadcastCount++
    }
  })

  console.log(`📡 消息广播: ${senderId} -> ${broadcastCount} 个客户端`)
}

app.post('/mcp', async c => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  try {
    const {req, res} = toReqRes(c.req.raw)

    res.on('close', () => {
      transport.close()
    })

    await server.connect(transport)
    const body = await c.req.json()
    await transport.handleRequest(req, res, body)

    return toFetchResponse(res)
  } catch (error) {
    console.error('Error handling MCP request:', error)
    // Return JSON-RPC error when something goes wrong
    return c.json(
      {
        jsonrpc: '2.0',
        error: {code: -32603, message: 'Internal server error'},
        id: null,
      },
      500,
    )
  }
})

const port = Number.parseInt(process.env.PORT || '3000', 10)

Bun.serve({
  port,
  fetch: app.fetch,
  websocket,
})

console.log(`🚀 MCP Server listening on http://localhost:${port}/mcp`)
console.log(`🔌 WebSocket Message Relay Server listening on ws://localhost:${port}/ws`)
