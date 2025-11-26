# F2C MCP Server Plugin Version
![MCP Server](https://badge.mcpx.dev?type=server 'MCP Server')

English | [简体中文](./README-zh-CN.md)

Plugin version of [@f2c/mcp](https://www.npmjs.com/package/@f2c/mcp). Due to Figma's [REST API rate limits](https://developers.figma.com/docs/rest-api/rate-limits/), if you're affected, please switch to this version for normal operation.

> This version requires the Chrome extension: [Download here](https://chromewebstore.google.com/detail/f2c/gmcgpjgoiidajfjhdooaajaeonnmikfc)

## Running in STDIO Mode
```bash
npx -y @f2c/mcp-plugin --mcpServer=http://localhost:3000 --accessToken=your-unique-token
```
+ `mcpServer` is the MCP server address, defaults to `https://f2c-figma-mcp.yy.com`
+ `accessToken` is the MCP client token, defaults to an empty string, generated from the Chrome extension

## IDE Configuration Examples (STDIO)
### macOS / Linux
```json
{
  "mcpServers": {
    "f2c-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@f2c/mcp-plugin",
        "--mcpServer=https://f2c-figma-mcp.yy.com",
        "--accessToken=xxx-xxx-xxx-xxx"
      ]
    }
  }
}
```

### Windows
```json
{
  "mcpServers": {
    "f2c-mcp": {
      "type": "stdio",
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@f2c/mcp-plugin",
        "--mcpServer=https://f2c-figma-mcp.yy.com",
        "--accessToken=xxx-xxx-xxx-xxx"
      ]
    }
  }
}
```

## Quick Start
After installing the Chrome extension and MCP, select the layer you want to generate code for in your design file, then ask the Agent in the chat to convert the selected node to code and place it in your desired directory.
