import type {GetFileNodesParams, GetFileParams, GetImagesParams, NodeToCodeWithF2C} from './apiTypes'

class Api {
  protected figmaHost = `https://api.figma.com/v1`
  protected f2cHost = `https://f2c-figma-api.yy.com/api`
  //
  async nodes2Code(o: NodeToCodeWithF2C) {
    const url = this.opToUrl(`${this.f2cHost}/nodes`, o)
    return this.fetch(url, o.personal_token, 'text')
  }
  async files(fileKey: string, personalToken: string, op: GetFileParams) {
    const url = this.opToUrl(`${this.figmaHost}/files/${fileKey}`, op)
    return this.fetch(url, personalToken)
  }
  async nodes(fileKey: string, personalToken: string, op: GetFileNodesParams) {
    const url = this.opToUrl(`${this.figmaHost}/files/${fileKey}/nodes`, op)
    return this.fetch(url, personalToken)
  }
  async images(fileKey: string, personalToken: string, op: GetImagesParams) {
    const url = this.opToUrl(`${this.figmaHost}/images/${fileKey}`, op)
    return this.fetch(url, personalToken)
  }
  // Returns download links for all images present in image fills
  async imageFills(fileKey: string, personalToken: string) {
    const url = this.opToUrl(`${this.figmaHost}/files/${fileKey}/images`, {})
    return this.fetch(url, personalToken)
  }
  // Returns the metadata for the file referred to by :key
  async meta(fileKey: string, personalToken: string) {
    const url = this.opToUrl(`${this.figmaHost}/files/${fileKey}/meta`, {})
    return this.fetch(url, personalToken)
  }
  async fetch(url: string, personalToken: string, resType: 'json' | 'text' = 'json') {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-FIGMA-TOKEN': personalToken,
        },
      })
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
  private opToUrl(api: string, o: object = {}) {
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
export default new Api()
