import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import {createLogger} from 'src/utils/logger'

const logger = createLogger('StdioTransport')

export async function startServer(server: McpServer) {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)
  } catch (e: any) {
    logger.info(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32000,
          message: `Server startup failed: ${e.message}`,
        },
      }),
    )
    process.exit(1)
  }
}
