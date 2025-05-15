# F2C MCP Server

[English](./README.md) | 简体中文

F2C MCP 服务器是一个模型上下文协议服务器，主要功能：

- 将Figma设计节点转换为**极高还原度**的HTML/CSS代码，行业内领先
- 为AI编程助手提供Figma设计数据访问能力
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
### Streamable HTTP
#### 1.构建产物
```sh
pnpm dev 
```
or
```sh
pnpm build 
```
#### 2.复制配置
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

## FAQ
```
Error: spawn npx ENOENT
```
解决方法：添加PATH到mcpServer中
```
{
  "env": {
    "PATH": "/Users/xxx/.nvm/versions/node/v20.10.0/bin:/bin"
  }
}
```