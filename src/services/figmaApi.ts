import axios from 'axios'

export class FigmaApiService {
  private baseUrl = 'https://f2c-figma-api.yy.com/api'
  private personalToken: string

  constructor(personalToken: string) {
    this.personalToken = personalToken
  }

  async getNodeHtml(fileKey: string, nodeIds: string): Promise<string> {
    try {
      const response = await axios.get(`${this.baseUrl}/nodes`, {
        params: {
          fileKey,
          nodeIds,
          personal_token: this.personalToken,
          format: 'html',
        },
      })
      return response.data
    } catch (error) {
      console.error('获取节点HTML失败:', error)
      throw error
    }
  }
}
