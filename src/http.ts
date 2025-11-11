import staticPlugin from '@elysiajs/static'
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {Elysia, t} from 'elysia'
import {toFetchResponse, toReqRes} from 'fetch-to-node'
import {server} from 'src/tool'
import {createLogger} from 'src/utils/logger'
import {socketClient} from '@/client/mcp-client'
import config from './config'
import {CodeWS} from './server/code-ws'

const logger = createLogger('http')

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

// 通过类注册 /code WebSocket 路由
new CodeWS().register(app)

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
    logger.error('MCP 请求错误:', error)
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
  logger.info(`MCP Server: ${config.httpUrl}/mcp`)
  logger.info(`WebSocket: ${config.codeWsUrl}`)
  logger.info(`Demo Case: ${config.httpUrl}`)
  try {
    await socketClient.connect()
  } catch (error: any) {
    logger.warn('[web callback msp] 示例请求失败:', error?.message || error)
  }
})
