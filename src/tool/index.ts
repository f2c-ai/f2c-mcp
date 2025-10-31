import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {registerCodeConvertTool} from 'src/tool/code-convert'
import {createLogger, LogLevel} from 'src/utils/logger'
export const server = new McpServer({
  name: 'f2c-mcp',
  version: '2.0.0',
})

registerCodeConvertTool(server)
