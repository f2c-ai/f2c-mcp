# Getting Started

## 1. Set up your Figma API key in `.env` file:
```bash
FIGMA_API_KEY=your_api_key_here
```

## 2. Install dependencies:
```bash
bun install
 ```

## 3. Start development server:
### stdio dev server
```bash
bun run dev
 ```
 ### streamable_http and SSE dev server
```bash
bun run http:dev
 ```

 ## Add MCP Service
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

## Add MCP Service(Windows)
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

## Global Installation
For cases where mcp client installation is unstable and causing errors, we can use global installation and then configure it.

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

## Installing via Smithery

To install F2C MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@f2c-ai/f2c-mcp):

```bash
npx -y @smithery/cli install @f2c-ai/f2c-mcp --client claude
```