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

> 由于Figma对于[REST API的调用限制](https://developers.figma.com/docs/rest-api/rate-limits/)，如果您受到影响，请切换至[@f2c/mcp-plugin](https://www.npmjs.com/package/@f2c/mcp-plugin)以便能够正常运行。

[English](./README.md) | 简体中文   

使用[F2C](https://f2c.yy.com/) 根据 Figma设计稿生成代码的模型上下文协议服务器。

<a href="https://glama.ai/mcp/servers/@f2c-ai/f2c-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@f2c-ai/f2c-mcp/badge" alt="f2c-mcp-server MCP server" />
</a>


## 主要功能
<img alt="f2c" src="https://raw.githubusercontent.com/f2c-ai/f2c-mcp/main/docs/bannerv3.png" /> 

- 🎨 高保真 HTML/CSS 还原：F2C 实现像素级高保真 Figma 设计到 HTML/CSS 的精准转换。
- ⚛️ 多框架支持：F2C 生成 React、CSS Modules 和 Tailwind CSS 代码，加速前端开发。
- 🧠 Figma 设计上下文：F2C 提供设计上下文，与 AI 工具兼容，确保代码一致性。
- 🔗 Figma 文件 URL 解析：F2C 通过 URL 直接转换 Figma 设计节点，简化工作流程。
- 🖼️ 远程图片本地化：F2C 自动下载 Figma 远程图片到本地，优化开发体验。

## 使用说明
1. 在支持 MCP 的 IDE（如 Cursor、Trae） 中 [配置 Server](docs/zh/GettingStarted.md)。
2. 在 IDE 中打开聊天窗口（例如：Cursor中的代理模式）。
3. 粘贴 Figma 节点链接（在Figma的Layer面板选择你想要的节点右键即可复制）。
4. 在对话框中输入需求，例如：获取节点数据、下载图片、转换为代码等。

## 配置开发
[配置&开发](docs/zh/GettingStarted.md)

## 数据隐私说明
本项目集成的日志工具仅用于基础的使用统计和错误日志上报，不会收集任何敏感信息或用户数据。所有上报的数据仅用于改进产品质量和用户体验。

## 常见问题
[FAQ](docs/zh/FAQ.md)

## 致谢

感谢：

+ [Framelink Figma MCP Server](https://github.com/GLips/Figma-Context-MCP) 通过此模型上下文协议服务器，为Cursor和其他AI编程工具提供Figma文件访问能力。  
+ [Cursor Talk to Figma MCP](https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp) 允许 Cursor 与 Figma 进行通信，以便读取设计内容并通过编程方式修改它们。这种集成使开发者能够以编程方式访问和操作 Figma 中的设计元素。
+ [Figma MCP Server](https://github.com/MatthewDailey/figma-mcp) 该服务器提供直接通过ModelContextProtocol查看、评论和分析Figma设计的工具。

