import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import Elysia from 'elysia'
import {toFetchResponse, toReqRes} from 'fetch-to-node'
import {server} from '@/tool'
import {createLogger, LogLevel} from '@/utils/logger'

const logger = createLogger('code-mcp', LogLevel.DEBUG)
export const registerCodeMCP = async (app: Elysia) => {
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
    const accessToken = request.headers.get('accessToken') || undefined
    // console.log('accessToken', accessToken)
    // 检查 accessToken 是否存在
    // if (!accessToken) {
    //   return new Response('Missing accessToken', {
    //     status: 400,
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Access-Control-Allow-Origin': '*',
    //     },
    //   })
    // }
    //
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
}
