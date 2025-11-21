import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import path from 'path'
import downloader from 'src/utils/downloader'
import {createLogger, LogLevel} from 'src/utils/logger'
import {z} from 'zod'
import {mcpClients} from '@/client/mcp-client.js'
import {wrapTailwindCode} from '@/utils/code'
import {generatePromptText} from './prompt'

const logger = createLogger('code-convert-tool', LogLevel.DEBUG)

export const registerCodeConvertTool = (mcpServer: McpServer) => {
  mcpServer.tool(
    'get_code_to_component',
    'Fetch HTML code via WebSocket and generate React/Vue/HTML output',
    {
      componentName: z.string().optional().describe('Optional component name hint (e.g., HelloDiv)'),
      framework: z
        .enum(['react', 'vue', 'html'])
        .default('react')
        .describe('Target framework to generate: react, vue, or html (default: react)'),
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
    async ({componentName, framework, style, localPath}, o) => {
      // logger.debug('get_code_to_component', o.requestInfo?.headers.accesstoken)
      let name = componentName || 'ConvertedComponent'
      const fw = framework || 'react'
      let sm = style || 'css'
      // downloader.setup({localPath: localPath || process.cwd(), imgFormat: 'png'})

      if (fw === 'html') {
        sm = 'tailwind'
      }

      try {
        const client = mcpClients.get(o)
        logger.info('Socket 连接状态:', client.isConnected)

        const rs = await client.request('mcp-request-code', {
          componentName: name,
          framework: fw,
          style: sm,
        })
        logger.debug('Socket 响应:', rs)
        if (rs.data?.error) {
          throw new Error(rs.data.error)
        }
        name = rs.data?.nodeName || name

        const htmlContent = rs.data.content

        // 提取 body 内容或使用完整 HTML
        const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
        let source = bodyMatch ? bodyMatch[1].trim() : htmlContent.trim()

        if (!source) {
          throw new Error('No HTML content received from socket')
        }

        const promptName = `html-to-${fw}-${sm}`

        if (sm === 'tailwind' && fw === 'html') {
          // 包装 Tailwind 代码
          source = wrapTailwindCode(source)
        }

        // 从 socket 返回的 files 中提取资源列表（图片类）
        const files = rs.data.files
        const imageFiles = Array.isArray(files)
          ? files.filter((f: {path: string}) => f.path.match(/\.(png|jpg|jpeg|svg|gif|webp)$/i))
          : []
        const codeFiles = Array.isArray(files)
          ? files.filter((f: {path: string}) => !f.path.match(/\.(png|jpg|jpeg|svg|gif|webp)$/i))
          : []

        // 生成组件代码提示（附带资产列表）
        const assetList = imageFiles.map((f: {path: string}) => f.path)
        const promptText = generatePromptText(promptName, name, source, assetList)
        const imgFormat = 'png'
        // const localMCP = !Bun.env.MCP_CONFIG_URL
        // if (localMCP && Array.isArray(files)) {
        //   downloader.setup({localPath: localPath || process.cwd(), imgFormat})
        //   await downloader.downLoadImageFromBase64(imageFiles)
        // }
        const structuredContent = {
          files: codeFiles.map((f: {path: string; content: string}) => ({
            path: f.path,
            content: f.content,
          })),
          assets: imageFiles.map((f: {path: string; content: string}) => ({
            filename: f.path,
            base64: f.content,
            format: imgFormat,
          })),
        }
        logger.debug('structuredContent', structuredContent)
        return {
          content: [{type: 'text', text: promptText}],
          structuredContent,
        }
      } catch (error) {
        logger.info('错误时 Socket 连接状态:', false)
        logger.error('Socket 请求错误:', error)

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
