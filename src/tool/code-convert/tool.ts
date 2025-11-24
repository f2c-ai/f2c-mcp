import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {createLogger, LogLevel} from 'src/utils/logger'
import {genCodeTool} from './gen-code-tool'

// const logger = createLogger('code-convert-tool', LogLevel.DEBUG)

export const registerCodeConvertTool = (mcpServer: McpServer) => {
  genCodeTool(mcpServer)
}
