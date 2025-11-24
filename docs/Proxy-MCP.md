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
        "你的项目绝对路径/dist/index.js",
        "--accessToken=你的TOKEN",
        "--mcpServer=http://localhost:3000/mcp"
      ]
    }
  }
}
```
+ `accessToken` 唯一身份验证
+ `mcpServer` MCP 服务器地址、可以是远程地址
