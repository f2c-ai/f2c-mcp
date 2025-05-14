import type {
  GetFileParams,
  GetImagesParams,
  GetKeyParams,
  NodeToCodeWithF2C,
  NodeToCodeWithF2COptions,
} from './apiTypes'
import {DEFAULT_PERSONAL_TOKEN} from './config'

class Api {
  protected figmaHost = `https://api.figma.com/v1`
  protected f2cHost = `https://f2c-figma-api.yy.com/api`
  private personalToken = DEFAULT_PERSONAL_TOKEN
  //
  async f2cNodeToCode(o: NodeToCodeWithF2COptions) {
    const op: NodeToCodeWithF2C = {
      fileKey: o.fileKey,
      nodeIds: o.ids,
      personal_token: o.personalToken || this.personalToken,
      format: o.format,
    }

    const url = this.opToUrl(`${this.f2cHost}/nodes`, op, [])
    return this.fetch(url, 'text')
  }
  async files(o: GetFileParams) {
    let url: string
    if (o.ids) {
      url = this.opToUrl(`${this.figmaHost}/files/${o.fileKey}/nodes`, o)
    } else {
      url = this.opToUrl(`${this.figmaHost}/files/${o.fileKey}`, o)
    }

    return this.fetch(url)
  }
  async images(o: GetImagesParams) {
    const url = this.opToUrl(`${this.figmaHost}/images/${o.fileKey}`, o)
    return this.fetch(url)
  }
  // Returns download links for all images present in image fills
  async imageFills(o: GetKeyParams) {
    const url = this.opToUrl(`${this.figmaHost}/files/${o.fileKey}/images`, o)
    return this.fetch(url)
  }
  // Returns the metadata for the file referred to by :key
  async meta(o: GetKeyParams) {
    const url = this.opToUrl(`${this.figmaHost}/files/${o.fileKey}/meta`, o)
    return this.fetch(url)
  }
  async fetch(url: string, resType: 'json' | 'text' = 'json'): Promise<any> {
    try {
      const fetchOptions = {
        method: 'GET',
        headers: {
          'X-FIGMA-TOKEN': this.personalToken,
        },
      }
      const response = await fetch(url, fetchOptions)
      // console.log('response', url, JSON.stringify(fetchOptions))
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
  private opToUrl(api: string, o: any = {}, filters = ['fileKey', 'personalToken']) {
    if (Object.keys(o).length === 0) {
      return api
    }
    if (o.personalToken) {
      this.personalToken = o.personalToken
    }
    const url: any = new URL(api)
    for (const [key, value] of Object.entries(o)) {
      if (!filters.includes(key)) url.searchParams.append(key, value)
    }
    return url.toString()
  }
}
export default new Api()
