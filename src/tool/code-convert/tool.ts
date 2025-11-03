import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {socketClient} from 'src/utils/socket-client.js'
import {z} from 'zod'
import {generatePromptText} from './prompt'

export const registerCodeConvertTool = (mcpServer: McpServer) => {
  mcpServer.tool(
    'get_code_to_component',
    'Fetch HTML code via WebSocket and generate React/Vue component',
    {
      componentName: z.string().optional().describe('Optional component name hint (e.g., HelloDiv)'),
      framework: z
        .enum(['react', 'vue'])
        .default('react')
        .describe('Target framework to generate: react or vue (default: react)'),
      style: z
        .enum(['css', 'tailwind'])
        .default('css')
        .describe(
          "Styling mode: 'css' converts Tailwind to CSS rules; 'tailwind' keeps Tailwind utilities (default: css)",
        ),
    },
    async ({componentName, framework, style}) => {
      const name = componentName || 'ConvertedComponent'
      const fw = framework || 'react'
      const sm = style || 'css'

      try {
        // 打印请求前连接状态
        console.log('Socket 连接状态:', socketClient.isConnected)

        // 通过消息中继请求 HTML 内容生成
        // 消息会被转发给业务处理客户端
        const response = await socketClient.request('get_html_content', {
          componentName: name,
          framework: fw,
          style: sm,
        })

        const htmlContent = response.content

        // 提取 body 内容或使用完整 HTML
        const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
        const source = bodyMatch ? bodyMatch[1].trim() : htmlContent.trim()

        if (!source) {
          throw new Error('No HTML content received from socket')
        }

        const promptName = `html-to-${fw}-${sm}`

        // 生成组件代码提示
        const promptText = generatePromptText(promptName, name, source)

        return {
          content: [
            {
              type: 'text',
              text: promptText,
            },
          ],
        }
      } catch (error) {
        // 打印错误时的连接状态
        console.log('错误时 Socket 连接状态:', socketClient.isConnected)
        console.error('Socket 请求错误:', error)

        return {
          content: [
            {
              type: 'text',
              text: `Error fetching or processing HTML via socket: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        }
      }
    },
  )
}
