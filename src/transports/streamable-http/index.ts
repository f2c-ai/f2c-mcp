import {createLogger} from '@/utils/logger'
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {startHttpServer} from './http-server'

const logger = createLogger('StreamableHttp')

/* export async function startServer(server: McpServer, port = 3000, useSession = false) {
  if (useSession) {
    logger.info('Starting MCP server with session support')
    const {startServer: startWithSessionServer} = await import('./with-session-steamable-http.js')
    return startWithSessionServer(server, port)
  } else {
    logger.info('Starting MCP server without session support')
    const {startServer: startWithoutSessionServer} = await import('./without-session-steamable-http.js')
    return startWithoutSessionServer(server, port)
  }
} */

export async function startServer(server: McpServer, port = 3000) {
  startHttpServer(port, server)
}
