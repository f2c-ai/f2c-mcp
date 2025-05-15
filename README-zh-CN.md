# F2C MCP Server
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![github][github-src]][github-href]
[![node][node-src]][node-href]

[npm-version-src]: https://img.shields.io/npm/v/@f2c/mcp?style=flat&colorA=18181B&colorB=F0DB4F
[npm-version-href]: https://npmjs.com/package/@f2c/mcp
[npm-downloads-src]: https://img.shields.io/npm/dm/@f2c/mcp?style=flat&colorA=18181B&colorB=F0DB4F
[npm-downloads-href]: https://npmjs.com/package/@f2c/mcp
[github-src]: https://img.shields.io/badge/github-@f2c/mcp-blue?style=flat&colorA=18181B&colorB=F0DB4F
[github-href]: https://github.com/f2c-ai/f2c-mcp
[node-src]: https://img.shields.io/node/v/@f2c/mcp?style=flat&colorA=18181B&colorB=F0DB4F
[node-href]: https://nodejs.org/en/about/previous-releases

[English](./README.md) | 简体中文

F2C MCP 服务器是一个模型上下文协议服务器，主要功能：

- 🎨 将Figma设计节点转换为**极高还原度**的HTML/CSS代码，行业内领先
- 📚 为AI编程助手提供Figma设计数据访问能力
- 🚀 支持通过Figma文件URL获取设计元数据
- 🎯 使用JSON-RPC 2.0协议进行通信

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

## 致谢

感谢：

+ [Framelink Figma MCP Server](https://github.com/GLips/Figma-Context-MCP) 通过此模型上下文协议服务器，为Cursor和其他AI编程工具提供Figma文件访问能力。  
+ [Figma MCP Server](https://github.com/MatthewDailey/figma-mcp) 该服务器提供直接通过ModelContextProtocol查看、评论和分析Figma设计的工具。

