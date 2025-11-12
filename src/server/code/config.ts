/**
{
  "mcpServers": {
      "f2c_mcp": {
        "transport": "streamableHttp",
        "url": "http://localhost:3000/mcp",
        "headers": {
          "accessToken": ""
        }
      }
    }
}
 */
import {randomUUID} from 'node:crypto'
import Elysia from 'elysia'

export const registerCodeConfig = async (app: Elysia) => {
  app.get('/mcp-config', async () => {
    return new Response(
      JSON.stringify({
        mcpServers: {
          f2c_mcp: {
            transport: 'streamableHttp',
            url: 'http://localhost:3000/mcp',
            headers: {
              accessToken: `${randomUUID()}`,
            },
          },
        },
      }),
      {
        headers: {'Content-Type': 'application/json'},
      },
    )
  })
}
