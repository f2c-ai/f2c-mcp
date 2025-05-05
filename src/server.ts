import {execSync} from 'child_process'
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import {z} from 'zod'
import {DEFAULT_PERSONAL_TOKEN} from './config'
import {isValidProjectName, parseFigmaUrl} from './helper'
import {sendRpcMessage} from './logger'
// Create MCP server
const server = new McpServer({
  name: 'F2C MCP',
  version: '0.0.1',
})

sendRpcMessage('notification', {
  message: 'MCP server instance created',
})

server.tool(
  'figma_to_html',
  'Convert Figma nodes to HTML content',
  {
    personalToken: z.string().default(DEFAULT_PERSONAL_TOKEN).describe('Your Figma personal access token'),
    figmaUrl: z.string().describe('Figma design URL containing fileKey and nodeId'),
  },
  async ({personalToken = DEFAULT_PERSONAL_TOKEN, figmaUrl}) => {
    sendRpcMessage('notification', {
      message: 'Tool call received',
      params: {figmaUrl},
    })

    try {
      const {fileKey, nodeId} = parseFigmaUrl(figmaUrl)

      if (!fileKey) {
        throw new Error('fileKey 不能为空')
      }

      const url = new URL('https://f2c-figma-api.yy.com/api/nodes')
      url.searchParams.append('fileKey', fileKey)
      url.searchParams.append('nodeIds', nodeId)
      url.searchParams.append('personal_token', personalToken)
      url.searchParams.append('format', 'html')

      const response = await fetch(url.toString())
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.text()

      return {
        content: [{type: 'text', text: data}],
      }
    } catch (error: any) {
      sendRpcMessage('error', {
        message: `Error: ${error.message}`,
        code: -32000,
      })
      return {
        content: [{type: 'text', text: `Error: ${error.message}`}],
      }
    }
  },
)

server.tool(
  '创建或新增Astro组件',
  '创建或新增Astro组件通过组件名字',
  {
    componentName: z.string().regex(/^[A-Z][a-zA-Z0-9_]*$/, {
      message: '组件名称必须以大写字母开头，且只能包含英文、数字、下划线',
    }).describe('组件的名字'),
  },
  async ({componentName}) => {
    sendRpcMessage('notification', {
      message: 'Creating Astro component',
      params: {componentName},
    })

    try {
      // Validate component name
      if (!componentName.match(/^[A-Z][a-zA-Z0-9_]*$/)) {
        throw new Error('组件名称必须以大写字母开头，且只能包含英文、数字、下划线')
      }

      // Determine output directory
      
      // Create component using Astro CLI
      try {
        execSync(`npx --registry=https://npm-registry.yy.com @astro/create-astro new component ${componentName}`, {
          stdio: 'pipe',
          cwd: process.cwd(),
          env: process.env
        })
        
        return {
          content: [{
            type: 'text', 
            text: `成功创建 Astro 组件: ${componentName} , 在当前目录下: ${process.cwd()}`
          }],
        }
      } catch (execError: any) {
        throw new Error(`创建组件失败: ${execError.message}\n请确保您在YY内网环境下执行此操作`)
      }
    } catch (error: any) {
      sendRpcMessage('error', {
        message: `Error: ${error.message}`,
        code: -32000,
      })
      return {
        content: [{type: 'text', text: `Error: ${error.message}`}],
      }
    }
  },
)

server.tool(
  '创建Astro项目',
  '通过项目名称创建新的Astro项目',
  {
    projectName: z.string().describe('项目的名称'),
  },
  async ({projectName}) => {
    sendRpcMessage('notification', {
      message: 'Creating Astro project',
      params: {projectName},
    })

    try {
      // 验证项目名称
      const validation = isValidProjectName(projectName)
      if (!validation.isValid) {
        throw new Error(validation.message)
      }

      // 创建项目使用Astro CLI
      try {
        execSync(`npx --registry=https://npm-registry.yy.com @astro/create-astro new project --name ${projectName}`, {
          stdio: 'pipe',
          cwd: process.cwd(),
          env: process.env
        })
        
        return {
          content: [{
            type: 'text', 
            text: `成功创建 Astro 项目: ${projectName}, 在当前目录下: ${process.cwd()}`
          }],
        }
      } catch (execError: any) {
        throw new Error(`创建项目失败: ${execError.message}\n请确保您在YY内网环境下执行此操作`)
      }
    } catch (error: any) {
      sendRpcMessage('error', {
        message: `Error: ${error.message}`,
        code: -32000,
      })
      return {
        content: [{type: 'text', text: `Error: ${error.message}`}],
      }
    }
  },
)

// Start server and connect to stdio transport
export async function startServer() {
  sendRpcMessage('notification', {message: 'Starting Figma-to-HTML service'})
  const transport = new StdioServerTransport()
  sendRpcMessage('notification', {message: 'Transport layer initialized'})
  await server.connect(transport)
  sendRpcMessage('notification', {message: 'MCP server connected to stdio'})
}
