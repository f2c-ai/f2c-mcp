import { parseFigmaUrl } from 'src/server/figma/helper'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { DEFAULT_PERSONAL_TOKEN, serverName, serverVersion } from 'src/server/figma/config'
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
  '根据提供的figma url通过F2C转换成html代码',
  {
    figmaUrl: z.string().describe('Figma design URL containing fileKey and nodeId'),
    personalToken: z.string().optional().describe('Your Figma personal access token'),
  },
  async ({ figmaUrl, personalToken }): Promise<CallToolResult> => {
    console.log('开始执行 figma_to_html 工具', { figmaUrl, personalToken })
    personalToken = personalToken || DEFAULT_PERSONAL_TOKEN
    
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

// 获取 Figma 文件信息
server.tool(
  'figma_get_file',
  '获取 Figma 文件的详细信息',
  {
    fileKey: z.string().describe('Figma 文件的唯一标识符'),
    personalToken: z.string().optional().describe('Your Figma personal access token'),
  },
  async ({ fileKey, personalToken }): Promise<CallToolResult> => {
    personalToken = personalToken || DEFAULT_PERSONAL_TOKEN
    
    try {
      if (!fileKey) {
        throw new Error('fileKey 不能为空')
      }

      const url = new URL('https://f2c-figma-api.yy.com/api/file')
      url.searchParams.append('fileKey', fileKey)
      url.searchParams.append('personal_token', personalToken)
      
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      }
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      }
    }
  }
)

// 获取 Figma 节点图片
server.tool(
  'figma_get_images',
  '获取 Figma 节点的图片',
  {
    fileKey: z.string().describe('Figma 文件的唯一标识符'),
    nodeIds: z.string().describe('要获取图片的节点 ID，以逗号分隔'),
    format: z.string().optional().describe('图片格式，例如 png, jpg, svg'),
    personalToken: z.string().optional().describe('Your Figma personal access token'),
  },
  async ({ fileKey, nodeIds, format, personalToken }): Promise<CallToolResult> => {
    personalToken = personalToken || DEFAULT_PERSONAL_TOKEN
    
    try {
      if (!fileKey || !nodeIds) {
        throw new Error('fileKey 和 nodeIds 不能为空')
      }

      const url = new URL('https://f2c-figma-api.yy.com/api/images')
      url.searchParams.append('fileKey', fileKey)
      url.searchParams.append('nodeIds', nodeIds)
      if (format) {
        url.searchParams.append('format', format)
      }
      url.searchParams.append('personal_token', personalToken)
      
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      }
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      }
    }
  }
)

// 获取 Figma 项目文件列表
server.tool(
  'figma_get_project_files',
  '获取 Figma 项目中的所有文件、主要是图片资源',
  {
    projectId: z.string().describe('Figma 项目的唯一标识符'),
    personalToken: z.string().optional().describe('Your Figma personal access token'),
  },
  async ({ projectId, personalToken }): Promise<CallToolResult> => {
    personalToken = personalToken || DEFAULT_PERSONAL_TOKEN
    
    try {
      if (!projectId) {
        throw new Error('projectId 不能为空')
      }

      const url = new URL('https://f2c-figma-api.yy.com/api/project-files')
      url.searchParams.append('projectId', projectId)
      url.searchParams.append('personal_token', personalToken)
      
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        content: [{ type: 'text', text: JSON.stringify(data) }],
      }
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      }
    }
  }
)

