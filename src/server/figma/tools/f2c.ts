import api from '@/server/figma/apis/f2c'
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import {z} from 'zod'

export const registerF2cServer = (server: McpServer) => {
  // Register Figma to HTML conversion tool
  server.tool(
    'figma_to_code',
    'Convert Figma design to code with node',
    {
      fileKey: z.string().describe('Unique identifier of the Figma file'),
      ids: z.string().describe('List of node IDs to retrieve, comma separated'),
      framework: z
        .enum(['html', 'react-cssmodules', 'react-tailwind'])
        .default('html')
        .describe('Format of the returned code'),
      personalToken: z.string().optional().describe('Your Figma personal access token'),
    },
    async (o): Promise<CallToolResult> => {
      try {
        // Infer format, fallback to 'html'
        const framework = o.framework ?? 'html'
        const json = await api.nodeToCode({...o, framework})

        return {
          content: [{type: 'text', text: JSON.stringify(json)}],
        }
      } catch (error: any) {
        console.error('Tool execution error:', error)
        return {
          content: [{type: 'text', text: `Error: ${error.message}`}],
        }
      }
    },
  )
}
