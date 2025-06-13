import {randomUUID} from 'node:crypto'
import {createLogger} from '@/utils/logger'
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {isInitializeRequest} from '@modelcontextprotocol/sdk/types.js'
import express from 'express'

const logger = createLogger('SessionStreamableHttp')

const app = express()
app.use(express.json())
export const startServer = (server: McpServer, port = 3000) => {
  const transports: {[sessionId: string]: StreamableHTTPServerTransport} = {}
  app.post('/mcp', async (req, res) => {
    // let acceptHeader = req.headers.accept as string
    // if (acceptHeader === '*/*') {
    //   acceptHeader = '*/*,application/json, text/event-stream'
    //   req.headers.accept = acceptHeader
    // }
    res.setHeader('Content-Type', 'application/json')
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    let transport: StreamableHTTPServerTransport
    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId]
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: sessionId => {
          transports[sessionId] = transport
        },
      })
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId]
        }
      }
      await server.connect(transport)
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      })
      return
    }
    await transport.handleRequest(req, res, req.body)
  })
  const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID')
      return
    }
    const transport = transports[sessionId]
    await transport.handleRequest(req, res)
  }
  app.get('/mcp', handleSessionRequest)
  app.delete('/mcp', handleSessionRequest)
  app.listen(port, () => {
    logger.info(`MCP Session-based Streamable HTTP Server listening on port ${port}`)
    logger.info(`Server address: http://localhost:${port}/mcp`)
  })
}
