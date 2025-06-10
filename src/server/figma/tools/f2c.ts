import api from '@/server/figma/apis/f2c'
import {createLogger} from '@/utils/logger'
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import type {NodeToCodeFile} from 'src/server/figma/types/f2c'
import {z} from 'zod'
import downloader from '../helpers/downloader'

const logger = createLogger('F2cTool')

export const registerF2cServer = (server: McpServer) => {
  // Register Figma to HTML conversion tool
  server.tool(
    'figma_to_code',
    'Transform Figma designs into production-ready code. This tool converts selected Figma nodes into HTML, React with CSS Modules, or React with Tailwind CSS, enabling seamless design-to-code workflow.',
    {
      fileKey: z
        .string()
        .describe(
          'The Figma file identifier found in the file URL (e.g., https://www.figma.com/file/XXXXXXXXXXXX/). Extract the XXXXXXXXXXXX portion as the fileKey.',
        ),
      ids: z
        .string()
        .describe(
          'Comma-separated list of Figma node IDs for conversion. To obtain node IDs, select elements in Figma, right-click and select "Copy/Paste as" → "Copy ID".',
        ),
      format: z
        .enum(['html', 'react-cssmodules', 'react-tailwind'])
        .default('html')
        .describe(
          'Specify the output format: "html" generates semantic HTML/CSS, "react-cssmodules" creates React components with scoped CSS modules, "react-tailwind" produces React components with utility-first Tailwind classes.',
        ),
      personalToken: z
        .string()
        .optional()
        .describe(
          'Figma personal access token for API authentication.The parameters are not required when the tool is called.',
        ),
      localPath: z
        .string()
        .optional()
        .describe(
          'Absolute path for image asset storage. Directory will be created if non-existent. Path must follow OS-specific format without special character escaping.',
        ),
      imgFormat: z
        .enum(['png', 'jpg', 'svg'])
        .default('png')
        .describe(
          'Export format for image assets: "png" for lossless quality, "jpg" for compressed files, or "svg" for vector graphics.',
        ),
      scaleSize: z
        .number()
        .min(1)
        .max(4)
        .default(2)
        .describe(
          'Image export scale factor (1-4). Higher values yield better quality at the cost of larger file sizes.',
        ),
    },
    async (o, context): Promise<CallToolResult> => {
      logger.info(context)
      try {
        const cb: NodeToCodeFile[] = (await api.nodeToCode(o)) || []
        if (o.localPath) {
          downloader.setImgFormat(o.imgFormat)
          await Promise.all(
            cb.map(async f => {
              f.content = await downloader.processContent(f.content, o.localPath as string)
            }),
          )
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(cb),
            },
          ],
        }
      } catch (error: any) {
        logger.error('Tool execution error:', error)
        return {
          content: [{type: 'text', text: `Error: ${error.message}`}],
        }
      }
    },
  )
}
