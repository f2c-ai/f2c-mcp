import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {registerLoggerNotificatons} from './logger'

export const registerNotificatons = (server: McpServer) => {
  registerLoggerNotificatons(server)
}
