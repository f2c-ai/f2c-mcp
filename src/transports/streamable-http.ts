import {serverName, serverVersion} from '@/config'
// import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {Server} from '@modelcontextprotocol/sdk/server/index.js'
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type {CallToolResult, GetPromptResult, ReadResourceResult} from '@modelcontextprotocol/sdk/types.js'
import cors from 'cors'
import express, {type Request, type Response} from 'express'
// import {registerServer} from '@/server'
import figmaServer from 'src/server/figma-server'
// import {z} from 'zod'

const getServer = () => {
  // Create an MCP server with implementation details
  const server = new Server(
    {
      name: serverName,
      version: serverVersion,
    },
    {capabilities: {logging: {}, tools: {}}}, // 添加 logging
  )
  // const server = new McpServer(
  //   {
  //     name: 'stateless-streamable-http-server',
  //     version: '1.0.0',
  //   },
  //   {capabilities: {logging: {}}},
  // )

  // Register a simple prompt
  // server.prompt(
  //   'greeting-template',
  //   'A simple greeting prompt template',
  //   {
  //     name: z.string().describe('Name to include in greeting'),
  //   },
  //   async ({name}): Promise<GetPromptResult> => {
  //     return {
  //       messages: [
  //         {
  //           role: 'user',
  //           content: {
  //             type: 'text',
  //             text: `Please greet ${name} in a friendly manner.`,
  //           },
  //         },
  //       ],
  //     }
  //   },
  // )

  // // Register a tool specifically for testing resumability
  // server.tool(
  //   'start-notification-stream',
  //   'Starts sending periodic notifications for testing resumability',
  //   {
  //     interval: z.number().describe('Interval in milliseconds between notifications').default(100),
  //     count: z.number().describe('Number of notifications to send (0 for 100)').default(10),
  //   },
  //   async ({interval, count}, {sendNotification}): Promise<CallToolResult> => {
  //     const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  //     let counter = 0

  //     while (count === 0 || counter < count) {
  //       counter++
  //       try {
  //         await sendNotification({
  //           method: 'notifications/message',
  //           params: {
  //             level: 'info',
  //             data: `Periodic notification #${counter} at ${new Date().toISOString()}`,
  //           },
  //         })
  //       } catch (error) {
  //         console.error('Error sending notification:', error)
  //       }
  //       // Wait for the specified interval
  //       await sleep(interval)
  //     }

  //     return {
  //       content: [
  //         {
  //           type: 'text',
  //           text: `Started sending periodic notifications every ${interval}ms`,
  //         },
  //       ],
  //     }
  //   },
  // )

  // // Create a simple resource at a fixed URI
  // server.resource(
  //   'greeting-resource',
  //   'https://example.com/greetings/default',
  //   {mimeType: 'text/plain'},
  //   async (): Promise<ReadResourceResult> => {
  //     return {
  //       contents: [
  //         {
  //           uri: 'https://example.com/greetings/default',
  //           text: 'Hello, world!',
  //         },
  //       ],
  //     }
  //   },
  // )
  // registerServer(server)
  figmaServer.setup(server)
  return server
}

const app = express()
app.use(cors())
app.use(express.json())

app.post('/mcp', async (req: Request, res: Response) => {
  const server = getServer()
  try {
    console.log('收到 MCP 请求，请求头:', JSON.stringify(req.headers))
    console.log('收到 MCP 请求，请求体:', JSON.stringify(req.body))

    // 如果是 tools/list 请求，可以添加额外的日志
    if (req.body && req.body.method === 'tools/list') {
      const cb = {
        result: {
          tools: figmaServer.tools,
        },
        id: req.body.id || null,
      }
      console.log('收到工具列表请求', JSON.stringify(cb))
      res.json(cb)
      return
    }

    //
    // 设置响应头，支持两种内容类型
    res.setHeader('Content-Type', 'application/json')
    // res.setHeader('Accept', 'application/json, text/event-stream')

    // 确保请求头包含正确的 Accept 类型
    if (
      !req.headers.accept ||
      !(req.headers.accept.includes('application/json') && req.headers.accept.includes('text/event-stream'))
    ) {
      req.headers.accept = 'application/json, text/event-stream'
    }
    //
    const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })
    await server.connect(transport)
    console.log('开始处理请求...')
    await transport.handleRequest(req, res, req.body)
    console.log('请求处理完成')
    res.on('close', () => {
      console.log('Request closed!')
      transport.close()
      server.close()
    })
  } catch (error) {
    console.error('处理 MCP 请求时出错:', error)
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      })
    }
  }
})

app.get('/mcp', async (req: Request, res: Response) => {
  console.log('Received GET MCP request')
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
app.get('/health', (_, res) => {
  res.status(200).send('OK')
})

app.delete('/mcp', async (req: Request, res: Response) => {
  console.log('Received DELETE MCP request')
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

// Start the server
const PORT = 3000
export const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`)
  })
}

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...')
  process.exit(0)
})
