#!/usr/bin/env node
import {Client} from '@modelcontextprotocol/sdk/client/index.js'
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {startServer} from 'src/server/common/stdio'
import {createLogger, LogLevel} from 'src/utils/logger'
// import z from 'zod'
import config from './config'
import {genCodeTool} from './tool/code-convert/gen-code-tool'
import {getCliParam} from './utils'
import downloader from './utils/downloader'

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

const logger = createLogger('local-gen-code-client', LogLevel.INFO)
let client = new Client({name: 'web-demo', version: '1.0.0'}, {capabilities: {}})
//
genCodeTool(server, async (toolName, {componentName, framework, style, localPath}: any) => {
  logger.debug('genCodeTool', componentName, framework, style, localPath)
  const rs: any = await client.callTool({
    name: toolName,
    arguments: {
      componentName,
      framework,
      style,
      localPath,
    },
  })
  //
  if (Array.isArray(rs?.structuredContent?.assets)) {
    try {
      localPath = localPath || process.cwd()
      downloader.setup({localPath, imgFormat: 'png'})
      //
      const imageFiles = rs?.structuredContent?.assets.map((f: {filename: string; base64: string}) => ({
        path: f.filename,
        content: f.base64,
      }))
      logger.debug(
        'download image files',
        localPath,
        imageFiles.map((f: {path: any}) => f.path),
      )
      await downloader.downLoadImageFromBase64(imageFiles)
    } catch (e) {
      logger.error('download image failed', e)
      //   return {error: e}
    }
  }
  //
  return rs
})

const cliToken = getCliParam(['accessToken'])
const cliMcp = getCliParam(['mcpServer'])
//
console.error('connect to server', cliMcp, cliToken)
//
const REMOTE_SERVER_URL = cliMcp || process.env.MCP_SERVER_URL || config.mcpHttpUrl
const accessToken = cliToken || process.env.MCP_CLIENT_TOKEN || ''
const transport = new StreamableHTTPClientTransport(new URL(REMOTE_SERVER_URL), {
  requestInit: {
    headers: {
      accesstoken: accessToken,
    },
  },
})

await client.connect(transport)

startServer(server)
