import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import express from 'express'
import {server} from 'src/tool'

const app = express()
app.use(express.json())

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  res.on('close', () => {
    transport.close()
  })

  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

const port = Number.parseInt(process.env.PORT || '3000', 10)
app
  .listen(port, () => {
    console.log(`MCP Server running on http://localhost:${port}/mcp`)
  })
  .on('error', error => {
    console.error('Server error:', error)
    process.exit(1)
  })
