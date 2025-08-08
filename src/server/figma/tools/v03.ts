import api from '@/server/figma/apis/f2c'
import figmaApi from '@/server/figma/apis/figma'
import {createLogger} from '@/utils/logger'
import {reportMcpLoader} from '@f2c/data-reporter'
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import type {CallToolResult} from '@modelcontextprotocol/sdk/types.js'
import type {NodeToCodeFile} from 'src/server/figma/types/f2c'
import {z} from 'zod'
import downloader from '../helpers/downloader'
const logger = createLogger('V3Tool')

export const registerV03Server = (server: McpServer) => {
  reportMcpLoader()
  // Register Figma to HTML conversion tool
  server.tool(
    'get_code',
    '在 Figma 桌面应用中，为指定节点或当前选中的节点生成 UI 代码。你可以通过 nodeId 参数指定一个节点 ID。如果没有提供节点 ID，则使用当前选中的节点。如果提供的是一个 URL，请从该 URL 中提取节点 ID。例如，如果给定的 URL 为 https://figma.com/design/:fileKey/:fileName?node-id=1-2，则提取出的节点 ID 为 1:2。重要提示：在调用此工具后，你应该调用 get_image 来获取该节点的图像，以获得视觉上下文。',
    {
      fileKey: z
        .string()
        .describe(
          'Figma 文件 URL 中的文件标识符（例如：https://www.figma.com/file/XXXXXXXXXXXX/）。请提取其中的 XXXXXXXXXXXX 作为 fileKey。',
        ),
      ids: z
        .string()
        .describe(
          '用于转换的 Figma 节点 ID，使用英文逗号分隔。获取节点 ID 的方式：在 Figma 中选中元素，右键选择“Copy/Paste as”→“Copy ID”。',
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
          '用于 API 认证的 Figma 个人访问令牌。调用该工具时此参数不是必填项。',
        ),
      localPath: z
        .string()
        .optional()
        .describe(
          '用于存放资源（如图片）和代码的本地绝对路径；若目录不存在将自动创建。路径需符合操作系统的格式要求，无需特殊转义。设置该路径后，所有与代码相关的静态资源会存放在此目录下，其他资源（如图片）将保存在该路径下名为 assets 的子目录中。',
        ),
      imgFormat: z
        .enum(['png', 'jpg', 'svg'])
        .default('png')
        .describe(
          '导出图片资源的格式：“png”为无损质量，“jpg”为压缩文件，“svg”为矢量图形。',
        ),
      scaleSize: z
        .number()
        .min(1)
        .max(4)
        .default(2)
        .describe(
          '导出图片的缩放倍数（1–4）。数值越大，质量越高，但文件体积也越大。',
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
    '在 Figma 桌面应用中，为指定节点或当前选中的节点生成图像。你可以通过 nodeId 参数指定一个节点 ID。如果没有提供节点 ID，则使用当前选中的节点。如果提供的是一个 URL，请从该 URL 中提取节点 ID。例如，如果给定的 URL 为 https://figma.com/design/:fileKey/:fileName?node-id=1-2，则提取出的节点 ID 为 1:2。同时，导出 Figma 设计图以进行视觉验证和设计保真度校验。这对于将生成的代码输出与原始设计进行对比至关重要，可确保像素级精准实现，并在设计到代码的转换过程中及时发现视觉差异。',
    {
      fileKey: z.string().describe('来自 URL 的 Figma 文件标识符，用于访问设计源文件'),
      ids: z
        .string()
        .describe(
          '要导出的节点 ID，使用英文逗号分隔。可通过 Figma 右键菜单的“Copy ID”获取精确的元素引用以便对比。',
        ),
      format: z
        .enum(['jpg', 'png', 'svg', 'pdf'])
        .optional()
        .describe(
          '用于校验的导出格式：“png”适合带透明通道的像素级对比，“jpg”适合快速预览，“svg”便于可缩放参考，“pdf”用于打印级别验证。',
        ),
      scale: z
        .number()
        .optional()
        .describe(
          '导出倍率（1–4 倍），用于高分辨率对比。Retina 等高分屏上建议使用 2 倍及以上以便进行细节保真检查。',
        ),
      svg_include_id: z
        .boolean()
        .optional()
        .describe('在 SVG 中包含元素 ID，便于代码校验时进行精确的元素映射'),
      svg_simplify_stroke: z
        .boolean()
        .optional()
        .describe('简化描边路径，使对比用的参考图更清晰'),
      use_absolute_bounds: z
        .boolean()
        .optional()
        .describe('使用绝对边界定位，便于与实现代码进行更准确的布局校验'),
      version: z.string().optional().describe('指定设计版本，以确保对比基线一致'),
      personalToken: z
        .string()
        .optional()
        .describe('Figma 个人访问令牌，用于经过认证地访问设计文件'),
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
