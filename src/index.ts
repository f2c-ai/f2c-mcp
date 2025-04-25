import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import {z} from 'zod'

// 从环境变量获取 personalToken
const DEFAULT_PERSONAL_TOKEN = process.env.personalToken || process.env.FIGMA_API_KEY || ''

// 增强的 Figma URL 解析器，支持更多格式
function parseFigmaUrl(url: string) {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname

    // 支持 file/xxx 和 design/xxx 两种格式
    const [, fileKey] = path.match(/(?:file|design)\/([^/]+)/) || []

    // 支持 node-id 参数和 hash 路由格式
    const nodeIdMatch =
      urlObj.searchParams.get('node-id') || url.match(/node-id=([^&]+)/) || url.match(/#([^:]+:[^:]+)/)

    const nodeId = nodeIdMatch ? (Array.isArray(nodeIdMatch) ? nodeIdMatch[1] : nodeIdMatch) : ''

    if (!fileKey) {
      throw new Error('无效的 Figma 链接：未找到 fileKey')
    }

    return {
      fileKey,
      nodeId: nodeId || '',
    }
  } catch (error) {
    throw new Error('无效的 Figma 链接')
  }
}

// Replace console.log with proper JSON-RPC notification format
// 统一的JSON-RPC消息发送方法
function sendRpcMessage(
  type: 'notification' | 'error',
  options: {
    method?: string
    id?: string | number | null
    code?: number
    message: string
    params?: any
  },
) {
  const base = {
    jsonrpc: '2.0',
    ...(type === 'notification'
      ? {
          method: options.method || 'log',
          params: options.params || {message: options.message},
        }
      : {
          id: options.id || null,
          error: {
            code: options.code || -32000,
            message: options.message,
          },
        }),
  }
  console.log(JSON.stringify(base))
}

// Replace console.error with proper JSON-RPC error format
function sendError(id: string | number | null, code: number, message: string) {
  console.log(
    JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
      },
    }),
  )
}

// Create MCP server
const server = new McpServer({
  name: 'F2C MCP',
  version: '0.0.1',
})

sendRpcMessage('notification', {
  message: 'MCP server instance created',
})

server.tool(
  'figma_to_html',
  '将 Figma 文件中的节点转换为 HTML 内容',
  {
    personalToken: z.string().default(DEFAULT_PERSONAL_TOKEN).describe('Your Figma personal access token'),
    figmaUrl: z.string().describe('Figma design URL containing fileKey and nodeId'),
  },
  async ({personalToken = DEFAULT_PERSONAL_TOKEN, figmaUrl}) => {
    sendRpcMessage('notification', {
      message: 'Tool call received',
      params: {figmaUrl},
    })

    try {
      const {fileKey, nodeId} = parseFigmaUrl(figmaUrl)

      if (!fileKey) {
        throw new Error('fileKey 不能为空')
      }

      const url = new URL('https://f2c-figma-api.yy.com/api/nodes')
      url.searchParams.append('fileKey', fileKey)
      url.searchParams.append('nodeIds', nodeId)
      url.searchParams.append('personal_token', personalToken)
      url.searchParams.append('format', 'html')

      const response = await fetch(url.toString())
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.text()

      return {
        content: [{type: 'text', text: data}],
      }
    } catch (error: any) {
      sendRpcMessage('error', {
        message: `Error: ${error.message}`,
        code: -32000,
      })
      return {
        content: [{type: 'text', text: `Error: ${error.message}`}],
      }
    }
  },
)

// Start server and connect to stdio transport
async function startServer() {
  sendRpcMessage('notification', {message: 'Starting Figma-to-HTML service'})
  const transport = new StdioServerTransport()
  sendRpcMessage('notification', {message: 'Transport layer initialized'})
  await server.connect(transport)
  sendRpcMessage('notification', {message: 'MCP server connected to stdio'})
}

startServer().catch(error => {
  sendRpcMessage('error', {
    message: `Server startup failed: ${error.message}`,
    code: -32000,
  })
  process.exit(1)
})
