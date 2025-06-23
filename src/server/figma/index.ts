import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {serverName, serverVersion} from 'src/server/figma/config'
import {registerNotificatons} from './notifications'
// import {registerF2cServer} from 'src/server/figma/tools/f2c'
// import {registerFigmaServer} from 'src/server/figma/tools/figma'
import {registerV03Server} from './tools/v03'

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

registerNotificatons(server)
// registerFigmaServer(server)
// registerF2cServer(server)
registerV03Server(server)
