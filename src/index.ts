#!/usr/bin/env node
import {Client} from '@modelcontextprotocol/sdk/client/index.js'
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {startServer} from 'src/server/common/stdio'
import {createLogger, LogLevel} from 'src/utils/logger'
import z from 'zod'
import config from './config'
export const server = new McpServer(
  {
    name: 'f2c-local-mcp',
    version: '0.0.1',
  },
  {
    capabilities: {
      logging: {},
      tools: {},
    },
  },
)

const logger = createLogger('local-gen-code-client', LogLevel.DEBUG)
let client = new Client({name: 'web-demo', version: '1.0.0'}, {capabilities: {}})
//
server.registerTool(
    "get_code_to_component",
  {
    title:'get code',
  description:'Fetch HTML code via WebSocket and generate React/Vue/HTML output',
  inputSchema:{
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
  outputSchema:{
    
  }
  },
  async ({componentName, framework, style, localPath}: any) => {
    const rs = await client.callTool({
      name: 'get_code_to_component',
      arguments: {
        componentName,
        framework,
        style,
        localPath,
      },
    })
    return {
      content: (rs as any)?.content ?? [],
      structuredContent: (rs as any)?.structuredContent,
    }
  },
)
const REMOTE_SERVER_URL = config.mcpHttpUrl
const accessToken = process.env.MCP_CLIENT_TOKEN || ''
const transport = new StreamableHTTPClientTransport(new URL(REMOTE_SERVER_URL), {
  requestInit: {
    headers: {
      accesstoken: accessToken,
    },
  },
})

await client.connect(transport)

startServer(server)
