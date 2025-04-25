# F2C MCP Server

[English](./README.md) | 简体中文

F2C MCP 服务器是一个模型上下文协议服务器，主要功能：

- 为AI编程助手提供Figma设计数据访问能力
- 将Figma设计节点转换为HTML/CSS代码
- 支持通过Figma文件URL获取设计元数据
- 使用JSON-RPC 2.0协议进行通信

## 添加 MCP 服务
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
## 快速开始
1. 在 .env 文件中配置Figma API密钥:
```bash
FIGMA_API_KEY=你的API密钥
 ```

2. 安装依赖:
```bash
npm install
 ```

3. 启动开发服务器:
```bash
npm run dev
 ```

## 工作原理
1. 在IDE聊天窗口粘贴Figma设计链接
2. AI助手通过MCP协议获取设计数据
3. 服务器将Figma节点转换为HTML代码
4. AI助手使用转换后的代码进行开发
项目基于Model Context Protocol实现，专为AI编程工具优化设计数据访问。
