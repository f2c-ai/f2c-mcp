import {createLogger} from '@/utils/logger'
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
const logger = createLogger('StreamableHttp')
type ServerTypeIns = 'all' | 'session' | 'no_session'
export async function startServer(server: McpServer, port = 3000, serverType: ServerTypeIns = 'no_session') {
  switch (serverType) {
    // don't support hot reload
    case 'all': {
      const {startHttpServer} = await import('./http-server.js')
      return startHttpServer(port, server)
    }
    // don't support hot reload
    case 'session': {
      const {startServer: startWithSessionServer} = await import('./with-session-steamable-http.js')
      return startWithSessionServer(server, port)
    }
    // support hot reload and dev
    case 'no_session': {
      const {startServer: startWithoutSessionServer} = await import('./without-session-steamable-http.js')
      return startWithoutSessionServer(server, port)
    }
  }
}
