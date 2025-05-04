import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {z} from 'zod'
import {DEFAULT_PERSONAL_TOKEN} from '../config'
import {parseFigmaUrl} from '../helper'
import {sendRpcMessage} from '../helper/logger'

export const figmaToHtmlSchema = {
  personalToken: z.string().default(DEFAULT_PERSONAL_TOKEN).describe('Your Figma personal access token'),
  figmaUrl: z.string().describe('Figma design URL containing fileKey and nodeId'),
}

export async function figmaToHtml({
  personalToken = DEFAULT_PERSONAL_TOKEN,
  figmaUrl,
}: {
  personalToken?: string
  figmaUrl: string
}) {
  sendRpcMessage('notification', {
    message: 'Tool call received',
    params: {figmaUrl},
  })

  try {
    const {fileKey, nodeId} = parseFigmaUrl(figmaUrl)

    if (!fileKey) {
      throw new Error('fileKey 不能为空')
    }

    const url = new URL('https://f2c-figma-api.yy.com/api/nodes')
    url.searchParams.append('fileKey', fileKey)
    url.searchParams.append('nodeIds', nodeId)
    url.searchParams.append('personal_token', personalToken)
    url.searchParams.append('format', 'html')

    const response = await fetch(url.toString())
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.text()

    return {
      content: [{type: 'text' as const, text: data}],
    }
  } catch (error: any) {
    sendRpcMessage('error', {
      message: `Error: ${error.message}`,
      code: -32000,
    })
    return {
      content: [{type: 'text' as const, text: `Error: ${error.message}`}],
    }
  }
}

export function registerFigmaToHtmlTool(server: McpServer) {
  server.tool('figma_to_html', 'Convert Figma nodes to HTML content', figmaToHtmlSchema, figmaToHtml)
}
