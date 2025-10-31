import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {Elysia} from 'elysia'
import {toFetchResponse, toReqRes} from 'fetch-to-node'
import {server} from 'src/tool/index.js'
import {socketClient} from './utils/socket-client.js'

const app = new Elysia()

// 客户端统计
const clientStats = {mcp: 0, processor: 0}

app.ws('/ws', {
  open(ws: any) {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    ws.data = {clientId}

    // 订阅广播频道
    ws.subscribe('broadcast')

    console.log(`🔌 客户端连接: ${clientId}`)

    // 通知客户端连接成功
    ws.send(
      JSON.stringify({
        type: 'connection_established',
        clientId,
        timestamp: Date.now(),
      }),
    )
  },

  message(ws: any, message: any) {
    const clientId = ws.data?.clientId
    const msg = typeof message === 'string' ? JSON.parse(message) : message

    console.log(`📨 [服务器] 收到消息 [${clientId}]: ${msg.type}`)

    // 处理客户端注册
    if (msg.type === 'register_client') {
      if (msg.clientType === 'mcp_client') clientStats.mcp++
      if (msg.clientType === 'business_processor') clientStats.processor++

      const clientTypeName = msg.clientType === 'mcp_client' ? 'MCP客户端' : '业务处理器'
      console.log(`📋 [服务器] ${clientTypeName}注册: ${clientId}`)
      console.log(`📊 [服务器] 当前: MCP客户端 ${clientStats.mcp} 个, 业务处理器 ${clientStats.processor} 个`)
      return
    }

    // 使用 Elysia 内置广播功能
    const broadcastMsg = {
      ...msg,
      sender: clientId,
      broadcast: true,
      broadcastAt: Date.now(),
    }

    ws.publish('broadcast', JSON.stringify(broadcastMsg))

    const msgType =
      msg.type === 'business_request' ? 'MCP业务请求' : msg.type === 'business_response' ? '业务处理响应' : msg.type
    console.log(`📡 [服务器] 广播消息: ${msgType} [${clientId}]`)

    // 安全地显示消息内容预览
    const contentPreview = JSON.stringify(msg.data || msg)
      .replace(/\n/g, '\\n') // 转义换行符
      .replace(/\r/g, '\\r') // 转义回车符
      .substring(0, 100)
    console.log(`📄 消息内容: ${contentPreview}...`)
  },

  close(ws: any) {
    const clientId = ws.data?.clientId
    if (clientId) {
      console.log(`🔌 客户端断开: ${clientId}`)
    }
  },
})

app.post('/mcp', async ({request}) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  try {
    const {req, res} = toReqRes(request)

    res.on('close', () => {
      transport.close()
    })

    await server.connect(transport)
    const body = await request.json()
    await transport.handleRequest(req, res, body)

    return toFetchResponse(res)
  } catch (error) {
    console.error('Error handling MCP request:', error)
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {code: -32603, message: 'Internal server error'},
        id: null,
      }),
      {
        status: 500,
        headers: {'Content-Type': 'application/json'},
      },
    )
  }
})

const port = Number.parseInt(process.env.PORT || '3000', 10)

app.listen(port, async () => {
  console.log(`🚀 MCP Server listening on http://localhost:${port}/mcp`)
  console.log(`🔌 WebSocket Message Relay Server listening on ws://localhost:${port}/ws`)
  console.log(`📡 服务模式: 消息中继和广播`)

  // 服务器启动后自动连接 MCP 客户端
  try {
    // 更新 socketClient 的 URL 为当前服务器端口
    const mcpClientUrl = `ws://localhost:${port}/ws`
    console.log(`🔗 MCP客户端自动连接到: ${mcpClientUrl}`)

    // 这里我们需要创建一个新的客户端实例，因为原来的可能使用了不同的端口
    await socketClient.connect()
    console.log(`✅ MCP客户端已自动连接到服务器`)
  } catch (error) {
    console.log(`⚠️ MCP客户端自动连接失败: ${error}`)
  }
})
