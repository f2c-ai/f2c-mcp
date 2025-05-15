import type {NodeToCodeWithF2C, NodeToCodeWithF2COptions} from '@/server/figma/types/f2c'
import {DEFAULT_PERSONAL_TOKEN} from 'src/server/figma/config'

class F2cApi {
  protected f2cHost = `https://f2c-figma-api.yy.com/api`
  private personalToken = DEFAULT_PERSONAL_TOKEN
  //
  async nodeToCode(o: NodeToCodeWithF2COptions) {
    const op: NodeToCodeWithF2C = {
      fileKey: o.fileKey,
      nodeIds: o.ids,
      personal_token: o.personalToken || this.personalToken,
      format: o.format,
    }

    const url = this.opToUrl(`${this.f2cHost}/nodes`, op)
    return this.fetch(url, 'text')
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
      console.error('HTTP error', error)
      throw error
    }
  }
  private opToUrl(api: string, o: any = {}) {
    if (Object.keys(o).length === 0) {
      return api
    }
    const url: any = new URL(api)
    for (const [key, value] of Object.entries(o)) {
      url.searchParams.append(key, value)
    }
    return url.toString()
  }
}
export default new F2cApi()
