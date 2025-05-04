import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import {serverName, serverVersion} from '../config'
import {sendRpcMessage} from '../helper/logger'
import {registerFigmaToHtmlTool} from '../tools/figma-to-html'

// Create MCP server
const server = new McpServer({
  name: serverName,
  version: serverVersion,
})

sendRpcMessage('notification', {
  message: 'MCP server instance created',
})

// 注册工具
registerFigmaToHtmlTool(server)

// Start server and connect to stdio transport
export async function startServer() {
  sendRpcMessage('notification', {message: 'Starting Figma-to-HTML service'})
  const transport = new StdioServerTransport()
  sendRpcMessage('notification', {message: 'Transport layer initialized'})
  await server.connect(transport)
  sendRpcMessage('notification', {message: 'MCP server connected to stdio'})
}
