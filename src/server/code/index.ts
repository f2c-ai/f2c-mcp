import config from 'src/config'
import {createLogger} from 'src/utils/logger'

export {registerCodeConfig} from './config'
export {registerCodeMCP} from './mcp'
export {registerCodeWS} from './ws'

const logger = createLogger('code')

export const codeLogPrint = () => {
  logger.info(`MCP Server: ${config.httpUrl}/mcp`)
  logger.info(`MCP Config: ${config.httpUrl}/mcp-config`)
  logger.info(`WebSocket: ${config.codeWsUrl}`)
  logger.info(`Demo Case: ${config.httpUrl}`)
}
