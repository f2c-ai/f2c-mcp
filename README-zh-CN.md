# F2C MCP Server Plugin Version
![MCP Server](https://badge.mcpx.dev?type=server 'MCP Server')

[English](./README.md) | 简体中文  

[@f2c/mcp](https://www.npmjs.com/package/@f2c/mcp)的Plugin版本。由于Figma对于[REST API的调用限制](https://developers.figma.com/docs/rest-api/rate-limits/)，如果您受到影响，请切换至该版本以便能够正常运行。

>该版本需要配合Chrome插件使用：[下载地址](https://chromewebstore.google.com/detail/f2c/gmcgpjgoiidajfjhdooaajaeonnmikfc)

## STDIO 模式运行
```bash
npx -y @f2c/mcp-plugin --mcpServer=http://localhost:3000 --accessToken=唯一令牌
```
+ `mcpServer` 为 MCP 服务器地址，默认值为 `https://f2c-figma-mcp.yy.com`
+ `accessToken` 为 MCP 客户端令牌，默认值为空字符串，从Chrome插件生成

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

## 快速使用
安装好Chrome插件和MCP后，在设计稿选中你想要生成代码的图层，在Agent聊天框中让其将选中节点转成代码并放置在你想要的目录即可。
