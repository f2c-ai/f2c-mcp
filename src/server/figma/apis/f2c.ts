import type {NodeToCodeAllFiles, NodeToCodeFile, NodeToCodeWithF2COptions} from '@/server/figma/types/f2c'
import {DEFAULT_PERSONAL_TOKEN} from 'src/server/figma/config'
import {createLogger} from '@/utils/logger'

const logger = createLogger('F2cApi')

class F2cApi {
  protected f2cHost = `https://f2c-figma-api.yy.com/api`
  private personalToken = DEFAULT_PERSONAL_TOKEN
  //
  async nodeToCode(o: NodeToCodeWithF2COptions): Promise<NodeToCodeFile[]> {
    const op = {
      fileKey: o.fileKey,
      nodeIds: o.ids,
      personal_token: o.personalToken || this.personalToken,
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
    return this.fetch(url, 'json')
  }
  async fetch(url: string, resType: 'json' | 'text' = 'json'): Promise<any> {
    try {
      const fetchOptions = {
        method: 'GET',
      }
      const response = await fetch(url, fetchOptions)
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
