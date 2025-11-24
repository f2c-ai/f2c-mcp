import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import path from 'path'
import downloader from 'src/utils/downloader'
import {createLogger, LogLevel} from 'src/utils/logger'
import {z} from 'zod'
import {mcpClients} from '@/client/mcp-client.js'
import {wrapTailwindCode} from '@/utils/code'
import {genCodeTool} from './gen-code-tool'
import {generatePromptText} from './prompt'

const logger = createLogger('code-convert-tool', LogLevel.DEBUG)

export const registerCodeConvertTool = (mcpServer: McpServer) => {
  genCodeTool(mcpServer)
}
