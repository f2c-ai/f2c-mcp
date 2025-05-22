import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {serverName, serverVersion} from 'src/server/figma/config'
import {registerF2cServer as registerF2cToolServer} from 'src/server/figma/tools/f2c'
import {registerFigmaServer} from 'src/server/figma/tools/figma'
import {registerResourceManagerServer} from 'src/server/figma/tools/resource-manager'

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
registerF2cToolServer(server)
registerResourceManagerServer(server)
