import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import downloader from 'src/utils/downloader'
import {createLogger, LogLevel} from 'src/utils/logger'
import {z} from 'zod'
export const server = new McpServer(
  {
    name: 'f2c-filesystem-mcp',
    version: '0.0.1',
  },
  {
    capabilities: {
      logging: {},
      tools: {},
    },
  },
)

const logger = createLogger('filesystem-tool', LogLevel.INFO)

server.tool(
  'download_assets_from_base64',
  'Save image assets from base64 to local directory in parallel',
  {
    assets: z
      .array(
        z.object({
          filename: z.string(),
          data: z.string(),
          format: z.enum(['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp']).optional(),
        }),
      )
      .describe('Array of assets with filename and base64 data'),
    localPath: z.string().optional().describe('Absolute local directory to save assets'),
    imgFormat: z.enum(['png', 'jpg', 'svg']).default('png').optional().describe('Image format setting'),
  },
  async ({assets, localPath, imgFormat}) => {
    const imageFiles = (assets || []).map(a => ({
      path: a.filename,
      content: a.data,
    }))

    const lp = localPath || process.cwd()
    const fmt = imgFormat || 'png'
    downloader.setup({localPath: lp, imgFormat: fmt})
    await downloader.downLoadImageFromBase64(imageFiles)
    logger.info('Saved assets', {count: imageFiles.length, dir: lp})
    return {
      content: [
        {
          type: 'text',
          text: `Saved ${imageFiles.length} assets to ${lp}`,
        },
      ],
    }
  },
)
