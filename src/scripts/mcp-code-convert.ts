import {Client} from '@modelcontextprotocol/sdk/client/index.js'
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import {readFile} from 'fs/promises'

/**
 * 简易 CLI：调用 MCP html_to_react 工具
 * 用法：
 *   MCP_BASE_URL=http://localhost:3001/mcp bun run src/scripts/mcp-code-convert.ts '<div class="p-4 text-white bg-blue-500">Hello</div>'
 *   MCP_BASE_URL=http://localhost:3001/mcp bun run src/scripts/mcp-code-convert.ts --file ./example.html
 * 环境变量：
 *   - MCP_BASE_URL（默认 http://localhost:3000/mcp）
 *   - SUMMARIZE_TIMEOUT_MS（默认 12000）
 *   - COMPONENT_NAME（可选，默认 ConvertedComponent）
 */

const BASE_URL = process.env.MCP_BASE_URL ?? 'http://localhost:3000/mcp'
const TIMEOUT_MS = Number.parseInt(process.env.SUMMARIZE_TIMEOUT_MS || '12000')
const COMPONENT_NAME = process.env.COMPONENT_NAME || 'ConvertedComponent'

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function resolveSourceFromArgs(): Promise<string> {
  const args = process.argv.slice(2)
  if (args[0] === '--file' || args[0] === '-f') {
    const filePath = args[1]
    if (!filePath) throw new Error('请提供 --file 路径')
    const buf = await readFile(filePath)
    return buf.toString('utf8')
  }
  const inline = args.join(' ') || process.env.CONVERT_SOURCE || ''
  if (inline.trim()) return inline
  // 默认示例
  return '<div class="p-4 text-white bg-blue-500">Hello Tailwind</div>'
}

async function main() {
  const source = await resolveSourceFromArgs()

  console.log(`[Code Convert CLI] base: ${BASE_URL}`)
  console.log(`[Code Convert CLI] component: ${COMPONENT_NAME}`)
  console.log(`[Code Convert CLI] timeout: ${TIMEOUT_MS}ms`)

  const transport = new StreamableHTTPClientTransport(new URL(BASE_URL))
  const client = new Client({name: 'code-convert-cli', version: '1.0.0'})
  await client.connect(transport)

  const {tools} = await client.listTools()
  const names = Array.isArray(tools) ? tools.map(t => t.name) : []
  console.log('[Code Convert CLI] tools:', names)
  if (!names.includes('html_to_react')) {
    console.error('[Code Convert CLI] 未发现 html_to_react 工具。')
    await client.close()
    process.exit(2)
  }

  let result: any
  try {
    result = await Promise.race([
      client.callTool({name: 'html_to_react', arguments: {source, componentName: COMPONENT_NAME}}),
      wait(TIMEOUT_MS).then(() => ({__timeout__: true})),
    ])
  } catch (err: any) {
    console.error('[Code Convert CLI] callTool error:', err?.message || err)
    await client.close()
    process.exit(1)
  }

  if (result?.__timeout__) {
    console.warn(`[Code Convert CLI] 超时 ${TIMEOUT_MS}ms，可能未配置采样能力。`)
    await client.close()
    process.exit(0)
  }

  const contentList: any[] = Array.isArray(result?.content) ? result.content : []
  const textBlock = contentList.find(c => c?.type === 'text')
  const textStr = String(textBlock?.text ?? '')
  const structured: any = result?.structuredContent ?? {}
  const code = String(structured?.code ?? '')

  console.log('[Code Convert CLI] AI raw content:')
  console.log(textStr)
  console.log('\n[Code Convert CLI] structured.code:')
  console.log(code)

  await client.close()
}

main().catch(err => {
  console.error('[Code Convert CLI] fatal:', err)
  process.exit(1)
})