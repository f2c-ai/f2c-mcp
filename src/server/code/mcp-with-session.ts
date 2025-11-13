import {randomUUID} from 'node:crypto'
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {isInitializeRequest} from '@modelcontextprotocol/sdk/types.js'
import Elysia from 'elysia'
import {toFetchResponse, toReqRes} from 'fetch-to-node'
import {server} from '@/tool'
import {createLogger, LogLevel} from '@/utils/logger'

const logger = createLogger('code-mcp', LogLevel.DEBUG)
const transports = new Map<string, StreamableHTTPServerTransport>()
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
    try {
      const body = await request.json()
      const {req, res} = toReqRes(request)

      const sid = request.headers.get('mcp-session-id') || undefined
      let transport: StreamableHTTPServerTransport | undefined = sid ? transports.get(sid) : undefined

      if (!transport && isInitializeRequest(body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true,
          onsessioninitialized: sessionId => {
            transports.set(sessionId, transport!)
          },
        })
        transport.onclose = () => {
          if (transport?.sessionId) transports.delete(transport.sessionId)
        }
        await server.connect(transport)
      }

      if (!transport) {
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.end(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {code: -32000, message: 'Bad Request: No valid session ID provided'},
            id: null,
          }),
        )
        return toFetchResponse(res)
      }

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
