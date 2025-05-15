import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {serverName, serverVersion} from 'src/server/figma/config'
import {registerF2cServer} from 'src/server/figma/tools/f2c'
import {registerFigmaServer} from 'src/server/figma/tools/figma'

export const server = new McpServer(
  {
    name: serverName,
    version: serverVersion,
  },
  {
    capabilities: {
      logging: {},
    },
  },
)
registerFigmaServer(server)
registerF2cServer(server)
