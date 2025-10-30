import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import config from 'src/server/figma/config'
// import {registerNotificatons} from './figma/notifications'
// import {registerF2cServer} from 'src/server/figma/tools/f2c'
// import {registerFigmaServer} from 'src/server/figma/tools/figma'
// import {registerV03Server} from './figma/tools/v03'
import {registerCodeServer} from './code'

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
registerCodeServer(server)
// registerNotificatons(server)
// registerFigmaServer(server)
// registerF2cServer(server)
// registerV03Server(server)
