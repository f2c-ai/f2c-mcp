import staticPlugin from '@elysiajs/static'
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {Elysia, t} from 'elysia'
import {toFetchResponse, toReqRes} from 'fetch-to-node'
import {server} from 'src/tool'
import {socketClient} from 'src/utils/socket-client'
import config from './config'

const app = new Elysia().use(
  staticPlugin({
    assets: 'public',
    prefix: '/',
  }),
)

// 首页路由
app.get('/', async () => {
  const file = Bun.file('public/index.html')
  return new Response(await file.text(), {
    headers: {'Content-Type': 'text/html'},
  })
})

// 泛化的 WebSocket 处理
app.ws('/ws', {
  query: t.Object({
    device: t.String(),
  }),
  open(ws) {
    ws.subscribe('f2c-mcp-channel')
    const device = ws.data.query.device
    console.log(`[${device}]客户端连接`)
    // if (device === 'web' && socketClient.isConnected) {
    //   setInterval(async () => {
    //     const response = await socketClient.request('get_html_content', {
    //       componentName: 'TestComponent',
    //       framework: 'react',
    //       style: 'css',
    //     })
    //     console.log('Web response:', response)
    //   }, 1000)
    // }
  },

  message(ws, message) {
    const msg = typeof message === 'string' ? JSON.parse(message) : message
    const device = ws.data.query.device
    const sendMsg = {...msg, device}
    console.log(`[${device}]发送消息 [${msg.type}] [${msg.requestId}]: ${JSON.stringify(sendMsg)}`)

    // ws.send(JSON.stringify({...msg, forwarded: true}))
    ws.publish('f2c-mcp-channel', sendMsg)
  },

  close(ws) {
    const device = ws.data.query.device
    console.log(`[${device}]客户端断开`)
    ws.unsubscribe('f2c-mcp-channel')
  },
})

// MCP 端点
// 允许 CORS 预检（即便当前为同源，这可避免未来跨源访问的预检失败）
app.options('/mcp', async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
    },
  })
})
app.get('/mcp', async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
    },
  })
})

app.post('/mcp', async ({request}) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  try {
    const {req, res} = toReqRes(request)
    res.on('close', () => transport.close())

    await server.connect(transport)
    const body = await request.json()
    await transport.handleRequest(req, res, body)

    return toFetchResponse(res)
  } catch (error) {
    console.error('MCP 请求错误:', error)
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {code: -32603, message: 'Internal server error'},
        id: null,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
})

// 启动服务器
app.listen(config.port, async () => {
  console.log(`MCP Server: http://${config.ip}:${config.port}/mcp`)
  console.log(`WebSocket: ${config.wsUrl}`)
  try {
    await socketClient.connect()
  } catch (error: any) {
    console.warn('[web callback msp] 示例请求失败:', error?.message || error)
  }
})
