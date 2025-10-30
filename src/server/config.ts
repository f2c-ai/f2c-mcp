import {getArgValue} from 'src/utils'
import {createLogger, LogLevel} from 'src/utils/logger'

const logger = createLogger('FigmaConfig', LogLevel.INFO)

class FigmaConfig {
  public serverName = 'F2C MCP'
  public serverVersion = process.env.FIGMA_VERSION || '0.0.1'
  private _personalToken = getArgValue('figma-api-key') || process.env.FIGMA_API_KEY || process.env.personalToken || ''
  public get personalToken() {
    return this._personalToken
  }
  public set personalToken(token: string) {
    this._personalToken = token
    logger.debug('personalToken', token)
  }
}

export default new FigmaConfig()
