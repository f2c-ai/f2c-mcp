
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
export async function startServer(server:any) {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}
