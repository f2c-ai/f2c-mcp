import {registerServer} from '@/server'
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import {serverName, serverVersion} from 'src/config'
import {sendRpcMessage} from 'src/helper/logger'

// Create MCP server
const server = new McpServer({
  name: serverName,
  version: serverVersion,
})

sendRpcMessage('notification', {
  message: 'MCP server instance created',
})

// 注册工具
registerServer(server)

// Start server and connect to stdio transport
export async function startServer() {
  sendRpcMessage('notification', {message: 'Starting Figma-to-HTML service'})
  const transport = new StdioServerTransport()
  sendRpcMessage('notification', {message: 'Transport layer initialized'})
  await server.connect(transport)
  sendRpcMessage('notification', {message: 'MCP server connected to stdio'})
}
