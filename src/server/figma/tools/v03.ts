import api from '@/server/figma/apis/f2c'
import figmaApi from '@/server/figma/apis/figma'
import {createLogger} from '@/utils/logger'
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import type {NodeToCodeFile} from 'src/server/figma/types/f2c'
import {z} from 'zod'
import downloader from '../helpers/downloader'

const logger = createLogger('V3Tool')

export const registerV03Server = (server: McpServer) => {
  // Register Figma to HTML conversion tool
  server.tool(
    'get_code',
    'Generate UI code for a given node or the currently selected node in the Figma desktop app. Use the nodeId parameter to specify a node id. If no node id is provided, the currently selected node will be used. If a URL is provided, extract the node id from the URL, for example, if given the URL https://figma.com/design/:fileKey/:fileName?node-id=1-2, the extracted nodeId would be 1:2. IMPORTANT: After you call this tool, you should call get_image to get an image of the node for context.',
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
      // format: z
      //   .enum(['html', 'react-cssmodules', 'react-tailwind'])
      //   .default('html')
      //   .describe(
      //     'Specify the output format: "html" generates semantic HTML/CSS, "react-cssmodules" creates React components with scoped CSS modules, "react-tailwind" produces React components with utility-first Tailwind classes.',
      //   ),
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
        .default(2)
        .describe(
          'Image export scale factor (1-4). Higher values yield better quality at the cost of larger file sizes.',
        ),
    },
    async (o): Promise<CallToolResult> => {
      downloader.setup(o)
      try {
        const cb: NodeToCodeFile[] = (await api.nodeToCode({...o, format: 'react-tailwind'})) || []
        await downloader.checkLocalAndDownload(cb)
        if (!cb) {
          return {
            content: [
              {
                type: 'text',
                text: 'Failed to generate any code. Please check if the provided Figma node IDs are correct or if the nodes can be converted to code.',
              },
            ],
          }
        }

        const files = Array.isArray(cb) ? cb : [cb]

        // Handle case when returned file array is empty
        if (files.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'Conversion succeeded but no files were generated. Please check if the selected Figma nodes contain convertible content.',
              },
            ],
          }
        }

        // Create file summary
        const summary = files
          .filter(file => !file.path.endsWith('/index.scss'))
          .map((file, index) => `${index + 1}. ${file.path}`)
          .join('\n')
        // If local path is specified, return save location information instead of detailed content
        if (o.localPath) {
          return {
            content: [
              {
                type: 'text',
                text: `# Files Saved Locally

## Save Location
${o.localPath}

## Generated Files
${summary}. Convert the Tailwind to vanilla CSS if not already used in the codebase. Do not install any dependencies.`,
              },
            ],
          }
        }

        // Create detailed file content (only when local path is not specified)
        /* const fileDetails = files
          .map((file, index) => {
            const fileExtension = file.path.split('.').pop() || ''
            return `## File ${index + 1}: ${file.path}\n\`\`\`${fileExtension}\n${file.content}\n\`\`\``
          })
          .join('\n\n') */
        const fileDetails = files
          .filter(file => file.path.endsWith('.tsx'))
          .map(file => file.content)
          .join('\n\n')

        return {
          content: [
            {
              type: 'text',
              text: `${fileDetails} Convert the Tailwind to vanilla CSS if not already used in the codebase. Do not install any dependencies.`,
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
  server.tool(
    'get_image',
    'Generate an image for a given node or the currently selected node in the Figma desktop app. Use the nodeId parameter to specify a node id. If no node id is provided, the currently selected node will be used. If a URL is provided, extract the node id from the URL, for example, if given the URL https://figma.com/design/:fileKey/:fileName?node-id=1-2, the extracted nodeId would be 1:2. Also export Figma design images for visual verification and design fidelity validation. Essential for comparing generated code output against original designs, ensuring pixel-perfect implementation and catching visual discrepancies during the design-to-code process.',
    {
      fileKey: z.string().describe('Figma file identifier from the URL for accessing the design source'),
      ids: z
        .string()
        .describe(
          'Comma-separated node IDs to export. Use "Copy ID" from Figma context menu to get precise element references for comparison',
        ),
      format: z
        .enum(['jpg', 'png', 'svg', 'pdf'])
        .optional()
        .describe(
          'Export format for verification: "png" for pixel-perfect comparison with transparency, "jpg" for quick previews, "svg" for scalable reference, "pdf" for print validation',
        ),
      scale: z
        .number()
        .optional()
        .describe(
          'Scale factor (1-4x) for high-resolution comparison. Use 2x+ for detailed fidelity checks on retina displays',
        ),
      svg_include_id: z
        .boolean()
        .optional()
        .describe('Include element IDs in SVG for precise element mapping during code validation'),
      svg_simplify_stroke: z
        .boolean()
        .optional()
        .describe('Simplify stroke paths for cleaner reference images during visual comparison'),
      use_absolute_bounds: z
        .boolean()
        .optional()
        .describe('Use absolute positioning for accurate layout verification against implemented code'),
      version: z.string().optional().describe('Specific design version for consistent comparison baseline'),
      personalToken: z
        .string()
        .optional()
        .describe('Figma personal access token for authenticated access to design files'),
    },
    async (o): Promise<CallToolResult> => {
      try {
        const data = await figmaApi.images(o)

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
