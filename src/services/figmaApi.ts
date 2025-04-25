export class FigmaApiService {
  private baseUrl = 'https://f2c-figma-api.yy.com/api'

  constructor(private personalToken: string) {}

  async getNodeHtml(fileKey: string, nodeIds: string): Promise<string> {
    const url = new URL(`${this.baseUrl}/nodes`)
    url.searchParams.append('fileKey', fileKey)
    url.searchParams.append('nodeIds', nodeIds)
    url.searchParams.append('personal_token', this.personalToken)
    url.searchParams.append('format', 'html')

    try {
      const response = await fetch(url.toString())
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return await response.text()
    } catch (error) {
      console.error('获取节点HTML失败:', error)
      throw error
    }
  }
}
