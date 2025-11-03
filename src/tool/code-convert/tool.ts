import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {socketClient} from 'src/utils/socket-client.js'
import {z} from 'zod'
import {generatePromptText} from './prompt'
import downloader from '@/utils/downloader'

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
      localPath: z
        .string()
        .optional()
        .describe(
          'Absolute path for asset(e.g., images) and code storage. Directory will be created if non-existent. Path must follow OS-specific format without special character escaping. When this path is set, all code-related static resources are stored in this directory, while other assets (e.g., images) will be saved into the subdirectory named assets under this path.',
        ),
    },
    async ({componentName, framework, style, localPath}) => {
      const name = componentName || 'ConvertedComponent'
      const fw = framework || 'react'
      const sm = style || 'css'
      downloader.setup({localPath, imgFormat: 'png'})

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

        // 处理图片
        const files = response.files
        if (Array.isArray(files) && files.length > 0) {
          await downloader.downLoadImageFromBase64(files)
        } else {
          console.error('Files is not a valid array:', typeof files, files)
        }

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
