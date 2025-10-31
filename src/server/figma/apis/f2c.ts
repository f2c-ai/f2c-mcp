import config from 'src/server/figma/config'
import type {NodeToCodeAllFiles, NodeToCodeFile, NodeToCodeWithF2COptions} from 'src/server/figma/types/f2c'
import compatFetch from 'src/utils/fetch'
import {createLogger, LogLevel} from 'src/utils/logger'

const logger = createLogger('F2cApi', LogLevel.INFO)
class F2cApi {
  protected f2cHost = `https://f2c-figma-api.yy.com/api`
  //
  async nodeToCode(o: NodeToCodeWithF2COptions): Promise<NodeToCodeFile[]> {
    const op = {
      fileKey: o.fileKey,
      nodeIds: o.ids,
      personal_token: o.personalToken || config.personalToken,
      option: {
        cssFramework: 'inlinecss',
        imgFormat: o.imgFormat || 'png',
        scaleSize: o.scaleSize || 2,
      },
      format: 'files',
      // format: 'allFiles',
    }
    if (o.format === 'react-cssmodules') {
      op.option.cssFramework = 'cssmodules'
    } else if (o.format === 'react-tailwind') {
      op.option.cssFramework = 'tailwindcss'
    }
    const url = this.opToUrl(`${this.f2cHost}/nodes`, op)
    return this.fetch(url, 'json', o.ideInfo || 'other')
  }
  async fetch(url: string, resType: 'json' | 'text' = 'json', ideInfo: string): Promise<any> {
    logger.debug('fetch', url, config.personalToken)
    try {
      const fetchOptions = {
        method: 'GET',
        headers: {
          'F2c-Api-Platform': `mcp-${ideInfo}`,
        },
      }
      logger.debug('fetch', url)
      const response = await compatFetch(url, fetchOptions)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = resType === 'text' ? await response.text() : await response.json()
      return data
    } catch (error) {
      logger.error('HTTP error', error)
      throw error
    }
  }
  private opToUrl(api: string, o: any = {}) {
    if (Object.keys(o).length === 0) {
      return api
    }
    const url: any = new URL(api)
    for (const [key, value] of Object.entries(o)) {
      if (typeof value === 'object' && value !== null) {
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          url.searchParams.append(`${key}[${nestedKey}]`, nestedValue as string)
        }
      } else {
        url.searchParams.append(key, value as string)
      }
    }
    return url.toString()
  }
}
export default new F2cApi()
