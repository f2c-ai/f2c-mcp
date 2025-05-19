import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import express from 'express'
const app = express()
app.use(
  express.json({
    type: ['application/json', 'application/*+json', '*/*'], // 扩展支持的 Content-Type
  }),
)
const noAllowAcess = (req: any, res: any, next: any) => {
  return res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.',
      },
      id: null,
    }),
  )
}
const polyfillRequest = (req: any, res: any) => {
  // 设置响应头
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Keep-Alive', 'timeout=5')

  // let acceptHeader = req.headers.accept as string
  // if (acceptHeader === '*/*') {
  //   acceptHeader = '*/*,application/json, text/event-stream'
  //   req.headers.accept = acceptHeader
  // }

  // 确保请求的 Content-Type 存在
  if (!req.headers['content-type']) {
    req.headers['content-type'] = 'application/json'
  }
}
export const startServer = (server: any, port = 3000) => {
  app.post('/mcp', async (req, res) => {
    console.log('Request body:', JSON.stringify(req.body))
    polyfillRequest(req, res)
    try {
      const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      })

      res.on('close', () => {
        transport.close()
        server.close()
      })

      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (error: any) {
      console.error('Error handling MCP request:', error)
      console.error('Error stack:', error.stack)
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
            data: {
              errorMessage: error.message,
              errorName: error.name,
            },
          },
          id: req.body?.id || null,
        })
      }
    }
  })

  app.get('/mcp', noAllowAcess)
  app.delete('/mcp', noAllowAcess)

  app.listen(port, () => {
    console.log(`MCP Stateless Streamable HTTP server started, listening on port ${port}`)
    console.log(`Server address: http://localhost:${port}/mcp`)
  })
}
