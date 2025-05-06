import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {registerFigmaServer} from 'src/server/figma'

export const registerServer = (server: McpServer) => {
  registerFigmaServer(server)
}
