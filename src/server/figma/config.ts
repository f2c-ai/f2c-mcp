import {getArgValue} from '@/utils/index'
// import {LogLevel, createLogger} from '@/utils/logger'

// const logger = createLogger('FigmaConfig', LogLevel.DEBUG)

// 优先从命令行参数获取，其次从环境变量获取
export const DEFAULT_PERSONAL_TOKEN = getArgValue('figma-api-key') || process.env.FIGMA_API_KEY || ''
export const serverName = 'F2C MCP'
export const serverVersion = process.env.FIGMA_VERSION || '0.0.1'
// logger.debug('DEFAULT_PERSONAL_TOKEN', DEFAULT_PERSONAL_TOKEN)
