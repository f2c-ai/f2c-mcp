import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
export async function startServer(server: any) {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)
  } catch (e: any) {
    console.log(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32000,
          message: `Server startup failed: ${e.message}`,
        },
      }),
    )
    process.exit(1)
  }
}
