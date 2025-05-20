import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'

export async function startServer(server: McpServer, port = 3000, useSession = false) {
  if (useSession) {
    console.log('Starting MCP server with session support')
    const {startServer: startWithSessionServer} = await import('./with-session-steamable-http.js')
    return startWithSessionServer(server, port)
  } else {
    console.log('Starting MCP server without session support')
    const {startServer: startWithoutSessionServer} = await import('./without-session-steamable-http.js')
    return startWithoutSessionServer(server, port)
  }
}
