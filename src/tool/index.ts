import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {registerCodeConvert} from 'src/tool/code-convert'

export const server = new McpServer({
  name: 'f2c-mcp',
  version: '2.0.0',
})

registerCodeConvert(server)


