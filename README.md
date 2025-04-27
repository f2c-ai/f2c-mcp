# F2C MCP Server

English | [简体中文](./README-zh-CN.md) 

The F2C MCP Server is a Model Context Protocol server that enables AI coding assistants to access Figma design data and convert it to HTML/CSS code. Key features:

- Provides Figma design context to AI coding tools like Cursor
- Converts Figma nodes to HTML content with styling
- Supports Figma file URLs with fileKey and nodeId parameters
- Uses Figma API to fetch design metadata
- Implements JSON-RPC 2.0 protocol for communication

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
## Getting Started

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

## FAQ
 ```
Error: spawn npx ENOENT
```
Solutions: Add PATH to mcpServer
```
{
  "env": {
    "PATH": "/Users/xxx/.nvm/versions/node/v20.10.0/bin:/bin"
  }
}
```