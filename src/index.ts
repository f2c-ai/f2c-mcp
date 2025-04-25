import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import axios from 'axios'
import {z} from 'zod'

// 从环境变量获取 personalToken
const DEFAULT_PERSONAL_TOKEN: any = process.env.personalToken || process.env.FIGMA_API_KEY

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
function sendNotification(method: string, params: any) {
  console.log(
    JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
    }),
  )
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

sendNotification('log', {message: 'MCP server instance created'})

server.tool(
  'figma_to_html',
  '将 Figma 文件中的节点转换为 HTML 内容',
  {
    personalToken: z
      .string()
      .optional()
      .default(DEFAULT_PERSONAL_TOKEN || '')
      .describe('Your Figma personal access token'),
    figmaUrl: z.string().describe('Figma design URL containing fileKey and nodeId'),
  },
  async ({personalToken = DEFAULT_PERSONAL_TOKEN, figmaUrl}) => {
    sendNotification('log', {message: 'Tool call received', figmaUrl})

    try {
      const {fileKey, nodeId} = parseFigmaUrl(figmaUrl)

      if (!fileKey) {
        throw new Error('fileKey 不能为空')
      }

      const response = await axios.get('https://f2c-figma-api.yy.com/api/nodes', {
        params: {
          fileKey,
          nodeIds: nodeId,
          personal_token: personalToken,
          format: 'html',
        },
      })

      return {
        content: [{type: 'text', text: response.data}],
      }
    } catch (error: any) {
      sendError(null, -32000, `Error: ${error.message}`)
      return {
        content: [{type: 'text', text: `Error: ${error.message}`}],
      }
    }
  },
)

// Start server and connect to stdio transport
async function startServer() {
  sendNotification('log', {message: 'Starting Figma-to-HTML service'})
  const transport = new StdioServerTransport()
  sendNotification('log', {message: 'Transport layer initialized'})
  await server.connect(transport)
  sendNotification('log', {message: 'MCP server connected to stdio'})
}

startServer().catch(error => {
  sendError(null, -32000, `Server startup failed: ${error.message}`)
  process.exit(1)
})
