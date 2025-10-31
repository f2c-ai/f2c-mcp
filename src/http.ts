import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {toFetchResponse, toReqRes} from 'fetch-to-node'
import {Hono} from 'hono'
import {server} from 'src/tool'

const app = new Hono()

app.post('/mcp', async c => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  try {
    const {req, res} = toReqRes(c.req.raw)

    res.on('close', () => {
      transport.close()
    })

    await server.connect(transport)
    const body = await c.req.json()
    await transport.handleRequest(req, res, body)

    return toFetchResponse(res)
  } catch (error) {
    console.error('Error handling MCP request:', error)
    // Return JSON-RPC error when something goes wrong
    return c.json(
      {
        jsonrpc: '2.0',
        error: {code: -32603, message: 'Internal server error'},
        id: null,
      },
      500,
    )
  }
})

const port = Number.parseInt(process.env.PORT || '3000', 10)
console.log(`MCP Server (Hono+Bun) listening on http://localhost:${port}/mcp`)

export default {
  port,
  fetch: app.fetch,
}
