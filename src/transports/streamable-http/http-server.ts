import {randomUUID} from 'node:crypto'
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {SSEServerTransport} from '@modelcontextprotocol/sdk/server/sse.js'
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {isInitializeRequest} from '@modelcontextprotocol/sdk/types.js'
import express, {type Request, type Response} from 'express'
import type {Server} from 'http'
// import figmaConfig from '@/server/figma/config'
import {createLogger, Logger, LogLevel} from '@/utils/logger'

const logger = createLogger('HttpServer', LogLevel.INFO)
let httpServer: Server | null = null
const transports = {
  streamable: {} as Record<string, StreamableHTTPServerTransport>,
  sse: {} as Record<string, SSEServerTransport>,
}
export async function startHttpServer(port: number, mcpServer: McpServer): Promise<void> {
  const app = express()

  // 拦截所有请求，检查并更新personalToken
  app.use((req, res, next) => {
    // const personalToken = req.header('personalToken') as string
    // //
    // // console.log('[personalToken]', personalToken, figmaConfig.personalToken)
    // //
    // if (personalToken && personalToken.trim() !== '' && personalToken !== figmaConfig.personalToken) {
    //   logger.debug('Updating Figma personal token from request headers', personalToken, figmaConfig.personalToken)
    //   figmaConfig.personalToken = personalToken
    // }
    next()
  })

  app.use('/mcp', express.json())

  app.post('/mcp', async (req, res) => {
    logger.debug('Received StreamableHTTP request', JSON.stringify(req.headers), JSON.stringify(req.body))
    res.setHeader('Content-Type', 'application/json')
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    let transport: StreamableHTTPServerTransport

    if (sessionId && transports.streamable[sessionId]) {
      logger.debug('Reusing existing StreamableHTTP transport for sessionId', sessionId)
      transport = transports.streamable[sessionId]
    } else if (!sessionId && isInitializeRequest(req.body)) {
      logger.debug('New initialization request for StreamableHTTP sessionId', sessionId)
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: sessionId => {
          transports.streamable[sessionId] = transport
        },
      })
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports.streamable[transport.sessionId]
        }
      }
      await mcpServer.connect(transport)
    } else {
      logger.error('Invalid request:', req.body)
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

    let progressInterval: NodeJS.Timeout | null = null
    const progressToken = req.body.params?._meta?.progressToken
    let progress = 0
    if (progressToken) {
      logger.info(`Setting up progress notifications for token ${progressToken} on session ${sessionId}`)
      progressInterval = setInterval(async () => {
        logger.info('Sending progress notification', progress)
        await mcpServer.server.notification({
          method: 'notifications/progress',
          params: {
            progress,
            progressToken,
          },
        })
        progress++
      }, 1000)
    }

    logger.debug('Handling StreamableHTTP request')
    await transport.handleRequest(req, res, req.body)

    if (progressInterval) {
      clearInterval(progressInterval)
    }
    logger.debug('StreamableHTTP request handled')
  })

  const handleSessionRequest = async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined
    if (!sessionId || !transports.streamable[sessionId]) {
      res.status(400).send('Invalid or missing session ID')
      return
    }

    logger.info(`Received session termination request for session ${sessionId}`)

    try {
      const transport = transports.streamable[sessionId]
      await transport.handleRequest(req, res)
    } catch (error) {
      logger.error('Error handling session termination:', error)
      if (!res.headersSent) {
        res.status(500).send('Error processing session termination')
      }
    }
  }

  app.get('/mcp', handleSessionRequest)

  app.delete('/mcp', handleSessionRequest)

  app.get('/sse', async (req, res) => {
    logger.debug('Received SSE request', JSON.stringify(req.headers), JSON.stringify(req.body))
    const transport = new SSEServerTransport('/messages', res)
    transports.sse[transport.sessionId] = transport
    res.on('close', () => {
      delete transports.sse[transport.sessionId]
    })
    await mcpServer.connect(transport)
  })

  app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string
    const transport = transports.sse[sessionId]
    if (transport) {
      await transport.handlePostMessage(req, res)
    } else {
      res.status(400).send(`No transport found for sessionId ${sessionId}`)
      return
    }
  })

  httpServer = app.listen(port, () => {
    logger.info(`SSE endpoint available at http://localhost:${port}/sse`)
    logger.info(`Message endpoint available at http://localhost:${port}/messages`)
    logger.info(`StreamableHTTP endpoint available at http://localhost:${port}/mcp`)
  })

  process.on('SIGINT', async () => {
    logger.debug('Shutting down server...')
    await closeTransports(transports.sse)
    await closeTransports(transports.streamable)

    logger.debug('Server shutdown complete')
    process.exit(0)
  })
}

async function closeTransports(transports: Record<string, SSEServerTransport | StreamableHTTPServerTransport>) {
  for (const sessionId in transports) {
    try {
      await transports[sessionId]?.close()
      delete transports[sessionId]
    } catch (error) {
      logger.error(`Error closing transport for session ${sessionId}:`, error)
    }
  }
}

export async function stopHttpServer(): Promise<void> {
  if (!httpServer) {
    throw new Error('HTTP server is not running')
  }

  return new Promise((resolve, reject) => {
    httpServer!.close((err: Error | undefined) => {
      if (err) {
        reject(err)
        return
      }
      httpServer = null
      const closing = Object.values(transports.sse).map(transport => {
        return transport.close()
      })
      Promise.all(closing).then(() => {
        resolve()
      })
    })
  })
}
