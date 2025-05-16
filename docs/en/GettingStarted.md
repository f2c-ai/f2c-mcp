# Getting Started

1. Set up your Figma API key in `.env` file:
```bash
FIGMA_API_KEY=your_api_key_here
```

2. Install dependencies:
```bash
npm install
 ```

3. Start development server:
```bash
npm run dev
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