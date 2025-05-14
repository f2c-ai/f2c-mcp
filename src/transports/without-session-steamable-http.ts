import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import express from 'express'
const app = express()
app.use(express.json())
export const startServer = (server: any, port = 3000) => {
  app.post('/mcp', async (req, res) => {
    // In stateless mode, create a new instance of transport and server for each request
    // to ensure complete isolation. A single instance would cause request ID collisions
    // when multiple clients connect concurrently.
    console.log('Request body:', JSON.stringify(req.body))
    let acceptHeader = req.headers.accept as string
    if (acceptHeader === '*/*') {
      // If Accept header is */* add necessary content types
      acceptHeader = '*/*,application/json, text/event-stream'
      req.headers.accept = acceptHeader
    }
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

  app.get('/mcp', async (req, res) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      }),
    )
  })

  app.delete('/mcp', async (req, res) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      }),
    )
  })

  app.listen(port, () => {
    console.log(`MCP Stateless Streamable HTTP server started, listening on port ${port}`)
    console.log(`Server address: http://localhost:${port}/mcp`)
  })
}
