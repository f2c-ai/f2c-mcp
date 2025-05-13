import { parseFigmaUrl } from '@/helper'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { DEFAULT_PERSONAL_TOKEN, serverName, serverVersion } from 'src/config'
import { z } from 'zod'

export const server = new McpServer({
  name: serverName,
  version: serverVersion,
}, {
  capabilities: {
    logging: {},
  }
})

// 注册 Figma 转 HTML 工具
server.tool(
  'figma_to_html',
  '根据提供的figma url通过F2C的DWL转换成html代码',
  {
    figmaUrl: z.string().describe('Figma design URL containing fileKey and nodeId'),
    // personalToken 参数已注释掉，使用默认值
    // personalToken: z.string().default(DEFAULT_PERSONAL_TOKEN).describe('Your Figma personal access token'),
  },
  async ({ figmaUrl }): Promise<CallToolResult> => {
    const personalToken = DEFAULT_PERSONAL_TOKEN
    
    try {
      console.log('开始解析Figma URL:', figmaUrl)
      const { fileKey, nodeId } = parseFigmaUrl(figmaUrl)
      console.log(`解析结果: fileKey=${fileKey}, nodeId=${nodeId}`)

      if (!fileKey) {
        console.error('错误: fileKey 不能为空')
        throw new Error('fileKey 不能为空')
      }

      const url = new URL('https://f2c-figma-api.yy.com/api/nodes')
      url.searchParams.append('fileKey', fileKey)
      url.searchParams.append('nodeIds', nodeId)
      url.searchParams.append('personal_token', personalToken)
      url.searchParams.append('format', 'html')
      console.log('准备请求API:', url.toString())

      console.log('开始发送请求到Figma API')
      const response = await fetch(url.toString())
      console.log('收到API响应, 状态码:', response.status)

      if (!response.ok) {
        console.error(`API请求失败! 状态码: ${response.status}`)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.text()
      console.log(`成功获取数据, 数据长度: ${data.length}字节`)

      return {
        content: [{ type: 'text', text: data }],
      }
    } catch (error: any) {
      console.error('工具调用出错:', error)
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      }
    }
  }
)
