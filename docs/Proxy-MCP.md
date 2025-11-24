# Proxy-MCP
## 调试
```bash
bun ./src/index.ts --accessToken=你的TOKEN --mcpServer=http://localhost:3000/mcp
```
## MCP 配置
```json
{
  "mcpServers": {
    "f2c-local-mcp": {
      "command": "bun",
      "args": [
        "/Users/xuhongbin/Desktop/Develop/f2c-github-workspace/f2c-mcp/dist/index.js",
        "--accessToken=你的TOKEN",
        "--mcpServer=http://localhost:3000/mcp"
      ]
    }
  }
}
```
+ `accessToken` 唯一身份验证
+ `mcpServer` MCP 服务器地址、可以是远程地址
