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
        // Infer format, fallback to 'html'
        const cb = await api.nodeToCode(o)
        
        // 处理返回内容为空的情况
        if (!cb) {
          return {
            content: [{
              type: 'text',
              text: '未能生成任何代码。请检查提供的Figma节点ID是否正确，或者该节点是否可以转换为代码。'
            }]
          }
        }
        
        const files = Array.isArray(cb) ? cb : [cb]
        
        // 处理返回的文件数组为空的情况
        if (files.length === 0) {
          return {
            content: [{
              type: 'text',
              text: '转换成功，但没有生成任何文件。请检查选择的Figma节点是否包含可转换的内容。'
            }]
          }
        }

        // 创建文件摘要
        const summary = files.map((file, index) => `${index + 1}. ${file.path}`).join('\n')

        // 创建详细文件内容
        const fileDetails = files
          .map((file, index) => {
            const fileExtension = file.path.split('.').pop() || ''
            return `## File ${index + 1}: ${file.path}\n\`\`\`${fileExtension}\n${file.content}\n\`\`\``
          })
          .join('\n\n')

        return {
          content: [
            {
              type: 'text',
              text: `# Generated Files Summary\n${summary}\n\n# File Details\n${fileDetails}`,
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
