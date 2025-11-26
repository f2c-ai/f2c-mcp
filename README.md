# @f2c/mcp（alpha）

## 版本说明
- 当前版本：`1.0.0-alpha.1`
- 该版本为早期预览，接口与参数可能迭代更新；后续会根据使用反馈持续完善


## STDIO 模式运行
```bash
npx -y @f2c/mcp@1.0.0-alpha.1 --mcpServer=http://localhost:3000 --accessToken=唯一令牌
```
+ `mcpServer` 为 MCP 服务器地址，默认值为 `https://f2c-figma-mcp.yy.com`
+ `accessToken` 为 MCP 客户端令牌，默认值为空字符串

## IDE 配置示例（STDIO）
### macOS / Linux
```json
{
  "mcpServers": {
    "f2c-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@f2c/mcp@1.0.0-alpha.1",
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
        "@f2c/mcp@1.0.0-alpha.1",
        "--mcpServer=https://f2c-figma-mcp.yy.com",
        "--accessToken=xxx-xxx-xxx-xxx"
      ]
    }
  }
}
```

## 注意事项（alpha）
- 当前为 alpha 版本，后续将继续更新
