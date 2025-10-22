import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import config from 'src/server/figma/config'
import {registerNotificatons} from './notifications'
// import {registerF2cServer} from 'src/server/figma/tools/f2c'
// import {registerFigmaServer} from 'src/server/figma/tools/figma'
// import {registerV03Server} from './tools/v03'
import {registerV04Server} from './tools/v04'

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

registerNotificatons(server)
// registerFigmaServer(server)
// registerF2cServer(server)
registerV04Server(server)
