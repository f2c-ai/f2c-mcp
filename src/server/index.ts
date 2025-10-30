import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import config from 'src/server/config'

export const server = new McpServer(
  {
    name: config.serverName,
    version: config.serverVersion,
  },
  {
    capabilities: {
      logging: {},
    },
  },
)
