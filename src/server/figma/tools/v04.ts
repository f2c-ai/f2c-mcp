import {createLogger} from '@/utils/logger'
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import type {NodeToCodeFile} from 'src/server/figma/types/f2c'
import {z} from 'zod'
import downloader from '../helpers/downloader'
import {joinChannel, sendCommandToFigma, start} from '../helpers/ws'

const logger = createLogger('V4Tool')

export const registerV04Server = (server: McpServer) => {
  server.tool(
    'join_channel',
    'Join a specific channel to communicate with Figma',
    {
      channel: z.string().describe('The name of the channel to join').default(''),
    },
    async ({channel}) => {
      try {
        if (!channel) {
          // If no channel provided, ask the user for input
          return {
            content: [
              {
                type: 'text',
                text: 'Please provide a channel name to join:',
              },
            ],
            followUp: {
              tool: 'join_channel',
              description: 'Join the specified channel',
            },
          }
        }

        await joinChannel(channel)
        return {
          content: [
            {
              type: 'text',
              text: `Successfully joined channel: ${channel}`,
            },
          ],
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error joining channel: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )

  server.tool(
    'get_code',
    'Generate UI code from the currently selected node in Figma desktop app via WebSocket connection. This tool communicates directly with the Figma plugin to convert selected design elements into code without requiring node IDs or file keys.',
    {
      localPath: z
        .string()
        .optional()
        .describe(
          'Absolute path for asset(e.g., images) and code storage. Directory will be created if non-existent. Path must follow OS-specific format without special character escaping. When this path is set, all code-related static resources are stored in this directory, while other assets (e.g., images) will be saved into the subdirectory named assets under this path.',
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
        .default(1)
        .describe(
          'Image export scale factor (1-4). Higher values yield better quality at the cost of larger file sizes.',
        ),
    },
    async (options): Promise<CallToolResult> => {
      try {
        const result = (await sendCommandToFigma('generateCodeFromSelection', {
          localPath: options.localPath,
          imgFormat: options.imgFormat,
          scaleSize: options.scaleSize,
        })) as {files?: NodeToCodeFile[] | any}

        logger.debug('Received result from Figma:', result, JSON.stringify(result, null, 2))

        // 检查返回的数据结构
        if (!result) {
          return {
            content: [
              {
                type: 'text',
                text: 'Failed to generate code. No response from Figma.',
              },
            ],
          }
        }

        // 从正确的位置获取files数组: result.files.files
        let files: NodeToCodeFile[] = []
        if (result.files && result.files.files && Array.isArray(result.files.files)) {
          files = result.files.files
        } else if (Array.isArray(result.files)) {
          files = result.files
        } else if (Array.isArray(result)) {
          files = result
        } else {
          logger.error('Unexpected result structure:', result)
          return {
            content: [
              {
                type: 'text',
                text: `Failed to generate code. Unexpected response structure: ${JSON.stringify(result)}`,
              },
            ],
          }
        }

        if (files.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'Failed to generate code. Please ensure you have selected a node in Figma and are connected to the correct channel.',
              },
            ],
          }
        }

        // Download images if local path is specified
        if (options.localPath) {
          downloader.setup({
            ...options,
            fileKey: '',
            ids: '',
          })

          logger.debug('Files before download:', JSON.stringify(files, null, 2))
          logger.debug('Files is array:', Array.isArray(files))
          logger.debug('Files length:', files.length)

          if (Array.isArray(files) && files.length > 0) {
            await downloader.downLoadImageFromBase64(files)
          } else {
            logger.error('Files is not a valid array:', typeof files, files)
          }
        }

        // Create file summary
        const summary = files
          .filter(file => !file.path.endsWith('/index.scss'))
          .map((file, index) => `${index + 1}. ${file.path}`)
          .join('\n')

        // If local path is specified, return save location information
        if (options.localPath) {
          return {
            content: [
              {
                type: 'text',
                text: `# Files Saved Locally

## Save Location
${options.localPath}

## Generated Files
${summary}

Convert the Tailwind to vanilla CSS if not already used in the codebase. Do not install any dependencies.`,
              },
            ],
          }
        }

        // Return detailed file content (only when local path is not specified)
        const fileDetails = files
          .filter(file => file.path.endsWith('.tsx') || file.path.endsWith('.jsx') || file.path.endsWith('.html'))
          .map(file => file.content)
          .join('\n\n')

        return {
          content: [
            {
              type: 'text',
              text: `${fileDetails}\n\nConvert the Tailwind to vanilla CSS if not already used in the codebase. Do not install any dependencies.`,
            },
          ],
        }
      } catch (error) {
        logger.error('Tool execution error:', error)
        return {
          content: [
            {
              type: 'text',
              text: `Error generating code: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        }
      }
    },
  )
}

start().catch(error => {
  logger.error(`Error starting FigmaMCP server: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
