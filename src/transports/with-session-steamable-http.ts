import {randomUUID} from 'node:crypto'
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {isInitializeRequest} from '@modelcontextprotocol/sdk/types.js'
import express from 'express'
const app = express()
app.use(express.json())
export const startServer = (server: any, port = 3000) => {
  // Map to store transports by session ID
  const transports: {[sessionId: string]: StreamableHTTPServerTransport} = {}

  // Handle POST requests for client-to-server communication
  app.post('/mcp', async (req, res) => {
    let acceptHeader = req.headers.accept as string
    if (acceptHeader === '*/*') {
      // If Accept header is */* add necessary content types
      acceptHeader = '*/*,application/json, text/event-stream'
      req.headers.accept = acceptHeader
    }
    // Check for existing session ID
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    let transport: StreamableHTTPServerTransport

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId]
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
        onsessioninitialized: sessionId => {
          // Store the transport by session ID
          transports[sessionId] = transport
        },
      })

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId]
        }
      }

      // Connect to the MCP server
      await server.connect(transport)
    } else {
      // Invalid request
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

    // Handle the request
    await transport.handleRequest(req, res, req.body)
  })

  // Reusable handler for GET and DELETE requests
  const handleSessionRequest = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    if (!sessionId || !transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID')
      return
    }

    const transport = transports[sessionId]
    await transport.handleRequest(req, res)
  }

  // Handle GET requests for server-to-client notifications via SSE
  app.get('/mcp', handleSessionRequest)

  // Handle DELETE requests for session termination
  app.delete('/mcp', handleSessionRequest)

  app.listen(port, () => {
    console.log(`MCP Session-based Streamable HTTP Server listening on port ${port}`)
  })
}
