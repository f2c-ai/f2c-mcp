import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import {z} from 'zod'

export const registerCodeServer = (server: McpServer) => {
  // Get Figma file information
  server.tool(
    'get_code_and_img_url',
    'Get the design draft and HTML and Tailwind CSS code',
    {
      code: z.string().describe('HTML + Tailwind CSS code reproducing the design draft'),
      imgUrl: z.string().describe('Public URL of the design draft preview image'),
    },
    async (o): Promise<CallToolResult> => {
      try {
        const data = {}
        return {
          content: [{type: 'text', text: JSON.stringify(data)}],
        }
      } catch (error: any) {
        return {
          content: [{type: 'text', text: `Error: ${error.message}`}],
        }
      }
    },
  )
}
