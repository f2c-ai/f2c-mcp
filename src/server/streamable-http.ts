import {randomUUID} from 'node:crypto'
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {isInitializeRequest} from '@modelcontextprotocol/sdk/types.js'
import express from 'express'
import {serverName, serverVersion} from '../config'
import {sendRpcMessage} from '../helper/logger'
import {registerFigmaToHtmlTool} from '../tools/figma-to-html'

const app = express()
app.use(express.json())

// Map to store transports by session ID
const transports: {[sessionId: string]: StreamableHTTPServerTransport} = {}

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
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
    const server = new McpServer({
      name: serverName,
      version: serverVersion,
    })

    sendRpcMessage('notification', {
      message: 'HTTP MCP server instance created',
    })

    // 注册工具
    registerFigmaToHtmlTool(server)

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

export function startHttpServer(port = 3000) {
  app.listen(port, () => {
    console.log(`HTTP MCP server listening on port ${port}`)
  })
}
