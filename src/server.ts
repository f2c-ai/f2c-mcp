import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import {z} from 'zod'
import {DEFAULT_PERSONAL_TOKEN} from './config'
import {parseFigmaUrl, sendRpcMessage} from './helper'

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
  'Convert Figma nodes to HTML content',
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
export async function startServer() {
  sendRpcMessage('notification', {message: 'Starting Figma-to-HTML service'})
  const transport = new StdioServerTransport()
  sendRpcMessage('notification', {message: 'Transport layer initialized'})
  await server.connect(transport)
  sendRpcMessage('notification', {message: 'MCP server connected to stdio'})
}
