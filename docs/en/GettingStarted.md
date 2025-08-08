# Getting Started
Usually, code editors and other AI clients use a configuration file to manage MCP servers.

You can add the following content to the configuration file to set up the `f2c-mcp` server.

> NOTE: You will need to create a Figma access token to use this server. Instructions on how to create a Figma API access token can be found [here](https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens).

## No-Installation MCP Configuration (stdio)

### MacOS / Linux
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=f2c-mcp&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMm5weCUyMC15JTIwJTQwZjJjJTJGbWNwJTIyJTJDJTIyZW52JTIyJTNBJTdCJTIycGVyc29uYWxUb2tlbiUyMiUzQSUyMiUyMiU3RCU3RA%3D%3D)
```json
{
  "mcpServers": {
    "f2c-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@f2c/mcp"
      ],
      "env": {
        "personalToken": ""
      }
    }
  }
}
```
or
```json
{
  "mcpServers": {
    "f2c-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@f2c/mcp",
        "--figma-api-key=YOUR-KEY"
      ],
    }
  }
}
```

### Windows (stdio)
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=f2c-mcp&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMmNtZCUyMCUyRmMlMjBucHglMjAteSUyMCU0MGYyYyUyRm1jcCUyMiUyQyUyMmVudiUyMiUzQSU3QiUyMnBlcnNvbmFsVG9rZW4lMjIlM0ElMjIlMjIlN0QlN0Q%3D)
```json
{
  "mcpServers": {
    "f2c-mcp": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@f2c/mcp"],
      "env": {
        "personalToken": ""
      }
    }
  }
}
```
or 
```json
{
  "mcpServers": {
    "f2c-mcp": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@f2c/mcp", "--figma-api-key=YOUR-KEY"],
    }
  }
}
```

## Global Installation MCP Configuration (stdio)
For cases where MCP client instability causes installation errors, we can use global installation and then configure it.

```bash
npm install -g @f2c/mcp
```
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=f2c-mcp&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMmYyYy1tY3AlMjAlMjIlMkMlMjJlbnYlMjIlM0ElN0IlMjJwZXJzb25hbFRva2VuJTIyJTNBJTIyJTIyJTdEJTdE)
```json
{
  "mcpServers": {
    "f2c-mcp": {
      "command": "f2c-mcp",
      "args": [],
      "env": {
        "personalToken": ""
      }
    }
  }
}
```

## Other Configuration Types

### Add Streamable HTTP
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=f2c_mcp&config=JTdCJTIydHJhbnNwb3J0JTIyJTNBJTIyc3RyZWFtYWJsZV9odHRwJTIyJTJDJTIydXJsJTIyJTNBJTIyaHR0cCUzQSUyRiUyRmxvY2FsaG9zdCUzQTMwMDAlMkZtY3AlMjIlMkMlMjJoZWFkZXJzJTIyJTNBJTdCJTdEJTJDJTIydGltZW91dCUyMiUzQTUwJTdE)
```json
{
  "mcpServers": {
      "f2c_mcp": {
        "transport": "streamable_http",
        "url": "http://localhost:3000/mcp",
        "headers": {},
        "timeout": 50
      }
    }
}
```

### Add SSE
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=f2c_mcp&config=JTdCJTIydHJhbnNwb3J0JTIyJTNBJTIyc3NlJTIyJTJDJTIydXJsJTIyJTNBJTIyaHR0cCUzQSUyRiUyRmxvY2FsaG9zdCUzQTMwMDAlMkZzc2UlMjIlMkMlMjJoZWFkZXJzJTIyJTNBJTdCJTdEJTJDJTIydGltZW91dCUyMiUzQTUwJTdE)
```json
{
  "mcpServers": {
      "f2c_mcp": {
        "transport": "sse",
        "url": "http://localhost:3000/sse",
        "headers": {},
        "timeout": 50
      }
    }
}
```

## Development

### 1. Set up your Figma API key in `.env` file:
```bash
FIGMA_API_KEY=your_api_key_here
```

### 2. Install dependencies:
```bash
bun install
 ```

### 3. Start development server:
### stdio dev server
```bash
bun run dev
 ```
### streamable_http and SSE dev server
```bash
bun run http:dev
 ```

## Install Smithery

To install F2C MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@f2c-ai/f2c-mcp):

```bash
npx -y @smithery/cli install @f2c-ai/f2c-mcp --client claude
```