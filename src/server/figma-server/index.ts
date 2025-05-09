import {parseFigmaUrl} from '@/helper'
import type {Server} from '@modelcontextprotocol/sdk/server/index.js'
import {CallToolRequestSchema, ListToolsRequestSchema} from '@modelcontextprotocol/sdk/types.js'
import {DEFAULT_PERSONAL_TOKEN} from 'src/config'
import {z} from 'zod'
const personalToken = DEFAULT_PERSONAL_TOKEN
const FigmaToHtmlSchema = z.object({
  // personalToken: z.string().default(DEFAULT_PERSONAL_TOKEN).describe('Your Figma personal access token'),
  figmaUrl: z.string().describe('Figma design URL containing fileKey and nodeId'),
})
class FigmaServer {
  server!: Server
  tools = [
    {
      name: 'figma_to_html',
      description: '根据提供的figma url通过F2C的DWL转换成html代码',
      inputSchema: {
        type: 'object',
        properties: {
          figmaUrl: {
            type: 'string',
            description: 'figma url 连接',
          },
          // personalToken: {
          //   type: 'string',
          //   description: 'figma personalToken',
          // },
        },
        required: ['figmaUrl'],
      },
    },
  ]
  setup(server: Server) {
    this.server = server
    this.toolsSchama()
    this.requestHandler()
  }
  toolsSchama() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools,
      }
    })
  }
  requestHandler() {
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      console.log('收到工具调用请求:', JSON.stringify(request))
      const {name, arguments: args} = request.params
      console.log(`处理工具: ${name}, 参数:`, JSON.stringify(args))

      if (name === 'figma_to_html') {
        console.log('开始处理 figma_to_html 工具请求')
        const {
          figmaUrl,
          // , personalToken
        } = FigmaToHtmlSchema.parse(args)
        console.log(`解析后的参数: figmaUrl=${figmaUrl}, personalToken=${personalToken ? '已提供' : '使用默认值'}`)
        //
        try {
          console.log('开始解析Figma URL:', figmaUrl)
          const {fileKey, nodeId} = parseFigmaUrl(figmaUrl)
          console.log(`解析结果: fileKey=${fileKey}, nodeId=${nodeId}`)

          if (!fileKey) {
            console.error('错误: fileKey 不能为空')
            throw new Error('fileKey 不能为空')
          }

          const url = new URL('https://f2c-figma-api.yy.com/api/nodes')
          url.searchParams.append('fileKey', fileKey)
          url.searchParams.append('nodeIds', nodeId)
          url.searchParams.append('personal_token', personalToken)
          url.searchParams.append('format', 'html')
          console.log('准备请求API:', url.toString())

          console.log('开始发送请求到Figma API')
          const response = await fetch(url.toString())
          console.log('收到API响应, 状态码:', response.status)

          if (!response.ok) {
            console.error(`API请求失败! 状态码: ${response.status}`)
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.text()
          console.log(`成功获取数据, 数据长度: ${data.length}字节`)

          console.log('工具调用成功完成')
          return {
            content: [{type: 'text' as const, text: data}],
          }
        } catch (error: any) {
          console.error('工具调用出错:', error)
          return {
            content: [{type: 'text' as const, text: `Error: ${error.message}`}],
          }
        }
        //
      }
      console.error(`未知工具: ${name}`)
      throw new Error(`Unknown tool: ${name}`)
    })
  }
}
export default new FigmaServer()
