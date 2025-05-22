import api from '@/server/figma/apis/f2c'
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import {z} from 'zod'

export const registerF2cServer = (server: McpServer) => {
  // Register Figma to HTML conversion tool
  server.tool(
    'figma_to_code',
    'Convert Figma designs into code. This tool extracts specified Figma nodes and transforms them into HTML, React with CSS Modules, or React with Tailwind CSS, facilitating automated design-to-code conversion.',
    {
      fileKey: z
        .string()
        .describe(
          'The unique identifier for a Figma file. Can be found in the Figma file URL, such as: https://www.figma.com/file/XXXXXXXXXXXX/, where XXXXXXXXXXXX is the fileKey.',
        ),
      ids: z
        .string()
        .describe(
          `List of Figma node IDs to convert, separated by commas. These can be obtained in Figma by selecting elements, right-clicking and choosing 'Copy/Paste as' → 'Copy ID'.`,
        ),
      format: z
        .enum(['html', 'react-cssmodules', 'react-tailwind'])
        .default('html')
        .describe(
          `The output code format: 'html' for pure HTML and CSS code, 'react-cssmodules' for React components with CSS modules, 'react-tailwind' for React components using Tailwind CSS.`,
        ),
      personalToken: z.string().optional().describe('Your Figma personal access token'),
    },
    async (o): Promise<CallToolResult> => {
      try {
        const cb = (await api.nodeToCode(o)) || {}

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(cb),
            },
          ],
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
