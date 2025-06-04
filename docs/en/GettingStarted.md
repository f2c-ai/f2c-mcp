# Getting Started

## No-Installation MCP Configuration (stdio)

### MacOS / Linux
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

### Windows (stdio)
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

## Global Installation MCP Configuration (stdio)
For cases where MCP client instability causes installation errors, we can use global installation and then configure it.

```bash
npm install -g @f2c/mcp
```

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