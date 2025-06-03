# F2C MCP Server 
![](https://badge.mcpx.dev?type=server 'MCP Server')
[![smithery badge](https://smithery.ai/badge/@f2c-ai/f2c-mcp)](https://smithery.ai/server/@f2c-ai/f2c-mcp)
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

使用[F2C](https://f2c.yy.com/) 根据 Figma设计稿生成代码的模型上下文协议服务器。

## 主要功能
<img alt="f2c" src="https://raw.githubusercontent.com/f2c-ai/f2c-mcp/main/docs/bannerv3.png" /> 

- 🎨 高保真 HTML/CSS 还原：F2C 实现像素级高保真 Figma 设计到 HTML/CSS 的精准转换。
- ⚛️ 多框架支持：F2C 生成 React、CSS Modules 和 Tailwind CSS 代码，加速前端开发。
- 🧠 Figma 设计上下文：F2C 提供设计上下文，与 AI 工具兼容，确保代码一致性。
- 🔗 Figma 文件 URL 解析：F2C 通过 URL 直接转换 Figma 设计节点，简化工作流程。
- 🖼️ 远程图片本地化：F2C 自动下载 Figma 远程图片到本地，优化开发体验。

<a href="https://glama.ai/mcp/servers/@f2c-ai/f2c-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@f2c-ai/f2c-mcp/badge" alt="f2c-mcp-server MCP server" />
</a>

## 快速上手
[Getting started](docs/zh/GettingStarted.md)

## 常见问题
[FAQ](docs/zh/FAQ.md)

## 致谢

感谢：

+ [Framelink Figma MCP Server](https://github.com/GLips/Figma-Context-MCP) 通过此模型上下文协议服务器，为Cursor和其他AI编程工具提供Figma文件访问能力。  
+ [Cursor Talk to Figma MCP](https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp) 允许 Cursor 与 Figma 进行通信，以便读取设计内容并通过编程方式修改它们。这种集成使开发者能够以编程方式访问和操作 Figma 中的设计元素。
+ [Figma MCP Server](https://github.com/MatthewDailey/figma-mcp) 该服务器提供直接通过ModelContextProtocol查看、评论和分析Figma设计的工具。

