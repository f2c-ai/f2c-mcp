import {afterAll, beforeAll, describe, expect, it} from 'bun:test'
import {Client} from '@modelcontextprotocol/sdk/client/index.js'
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const MCP_URL = process.env.MCP_URL || 'http://localhost:3000/mcp'

let client: Client
let transport: StreamableHTTPClientTransport

describe('MCP Streamable HTTP – html_to_component tool', () => {
  beforeAll(async () => {
    transport = new StreamableHTTPClientTransport(new URL(MCP_URL))
    client = new Client({name: 'f2c-mcp-http-test', version: '1.0.0'})
    await client.connect(transport)
  })

  afterAll(async () => {
    // Gracefully close transport and client
    try {
      await client.close()
    } catch {}
    try {
      await transport.close()
    } catch {}
  })

  it('lists tools and contains html_to_component', async () => {
    const tools = await client.listTools()
    const names = (tools.tools || []).map(t => t.name)
    expect(names).toContain('html_to_component')
  })

  it('calls html_to_component and returns prompt text', async () => {
    const source = `<div class="text-center p-4 bg-blue-500 text-white">Hello</div>`
    const res: any = await client.callTool({
      name: 'html_to_component',
      arguments: {
        source,
        framework: 'vue',
        style: 'css',
        componentName: 'HelloBox',
      },
    })

    expect(res.content?.length || 0).toBeGreaterThan(0)
    const first = res.content?.[0]
    expect(first?.type).toBe('text')
    const text = (first as any)?.text as string
    expect(text).toContain('Convert the provided HTML + TailwindCSS snippet')
    expect(text).toContain('Component name hint: HelloBox')
  })

  it('react + tailwind returns React prompt keeping Tailwind', async () => {
    const source = `<button class="px-3 py-2 bg-green-500 text-white">Click</button>`
    const res: any = await client.callTool({
      name: 'html_to_component',
      arguments: {
        source,
        framework: 'react',
        style: 'tailwind',
        componentName: 'ReactBox',
      },
    })

    const text = (res.content?.[0] as any)?.text as string
    expect(text).toContain('Convert the provided HTML + TailwindCSS snippet into a React functional component (TSX)')
    expect(text).toContain("Preserve Tailwind utility classes under 'className'")
    expect(text).toContain('Component name: ReactBox')
    expect(text).toContain('Source:')
    expect(text).toContain(source)
  })

  it('react + css returns React prompt with semantic CSS', async () => {
    const source = `<div class="p-2 text-gray-700">Text</div>`
    const res: any = await client.callTool({
      name: 'html_to_component',
      arguments: {
        source,
        framework: 'react',
        style: 'css',
        componentName: 'ReactCssBox',
      },
    })

    const text = (res.content?.[0] as any)?.text as string
    expect(text).toContain('Convert the provided HTML + TailwindCSS snippet into a React functional component (TSX) using semantic CSS (no Tailwind)')
    expect(text).toContain("import styles from './ReactCssBox.module.css'")
    expect(text).toContain('Component name: ReactCssBox')
    expect(text).toContain('Source:')
    expect(text).toContain(source)
  })

  it('vue + css returns Vue SFC prompt with semantic CSS', async () => {
    const source = `<div class="text-center p-4 bg-blue-500 text-white">Hello</div>`
    const res: any = await client.callTool({
      name: 'html_to_component',
      arguments: {
        source,
        framework: 'vue',
        style: 'css',
        componentName: 'VueBox',
      },
    })

    const text = (res.content?.[0] as any)?.text as string
    expect(text).toContain('Convert the provided HTML + TailwindCSS snippet into a Vue 3 single-file component (SFC) with semantic CSS')
    expect(text).toContain('<style scoped>')
    expect(text).toContain('Do not use Tailwind utility classes')
    expect(text).toContain('Component name hint: VueBox')
    expect(text).toContain('Source:')
    expect(text).toContain(source)
  })

  it('vue + tailwind returns Vue SFC prompt keeping Tailwind', async () => {
    const source = `<div class="flex items-center gap-2"><span class="text-sm">A</span></div>`
    const res: any = await client.callTool({
      name: 'html_to_component',
      arguments: {
        source,
        framework: 'vue',
        style: 'tailwind',
        componentName: 'VueTwBox',
      },
    })

    const text = (res.content?.[0] as any)?.text as string
    expect(text).toContain('Convert the provided HTML + TailwindCSS snippet into a Vue 3 single-file component (SFC) that keeps Tailwind utilities')
    expect(text).toContain("Keep Tailwind classes under 'class' (do not rename to className)")
    expect(text).toContain('Component name hint: VueTwBox')
    expect(text).toContain('Source:')
    expect(text).toContain(source)
  })

  it('defaults: react + css + ConvertedComponent when args omitted', async () => {
    const source = `<p class="text-red-600">Default</p>`
    const res: any = await client.callTool({
      name: 'html_to_component',
      arguments: {
        source,
      },
    })

    const text = (res.content?.[0] as any)?.text as string
    expect(text).toContain('Convert the provided HTML + TailwindCSS snippet into a React functional component (TSX) using semantic CSS (no Tailwind)')
    expect(text).toContain('Component name: ConvertedComponent')
    expect(text).toContain('Source:')
    expect(text).toContain(source)
  })

  it('defaults: vue + css componentName omitted shows hint ConvertedComponent', async () => {
    const source = `<h1 class="font-bold text-xl">Title</h1>`
    const res: any = await client.callTool({
      name: 'html_to_component',
      arguments: {
        source,
        framework: 'vue',
        // style omitted -> defaults to 'css'
      },
    })

    const text = (res.content?.[0] as any)?.text as string
    expect(text).toContain('Convert the provided HTML + TailwindCSS snippet into a Vue 3 single-file component (SFC) with semantic CSS')
    expect(text).toContain('Component name hint: ConvertedComponent')
    expect(text).toContain('Source:')
    expect(text).toContain(source)
  })
})
