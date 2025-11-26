# F2C MCP Server 
![MCP Server](https://badge.mcpx.dev?type=server 'MCP Server')
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

> Due to [Figma REST API rate limits](https://developers.figma.com/docs/rest-api/rate-limits/), if you are affected, please switch to [@f2c/mcp-plugin](https://www.npmjs.com/package/@f2c/mcp-plugin) for normal operation.

English | [简体中文](./README-zh-CN.md)

A Model Context Protocol server for Figma Design to Code using [F2C](https://f2c.yy.com/).

<a href="https://glama.ai/mcp/servers/@f2c-ai/f2c-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@f2c-ai/f2c-mcp/badge" alt="f2c-mcp-server MCP server" />
</a>

## Features
<img alt="f2c" src="https://raw.githubusercontent.com/f2c-ai/f2c-mcp/main/docs/bannerv3.png" />

- 🎨 Pixel-Perfect HTML/CSS：F2C converts Figma designs to pixel-perfect HTML/CSS with precision.
- ⚛️ Multi-Framework Support：F2C generates React, CSS Modules, and Tailwind CSS code for fast development.
- 🧠 Figma Design Context：F2C integrates design context, ensuring compatibility with AI tools like Cursor.
- 🔗 Figma File URL Parsing：F2C converts design nodes via Figma URLs, streamlining workflows.
- 🖼️ Remote Image Localization：F2C automates downloading Figma images to local assets for efficiency.

## How it works
1. [Configure the Server](docs/en/GettingStarted.md) in an MCP-supported IDE (e.g., Cursor, Trae).
> recommended to use [Comate AI IDE](https://comate.baidu.com/zh/download/ai-ide) 
2. Open your chat in IDE (e.g. agent mode in Cursor).
3. Paste a link to a Figma Node (Right-click any node in the Figma Layer panel to copy it).
4. Enter your requirements in the chat, such as fetching node data, downloading images, converting to code, etc.

## Configuration and Development

See [Configuration and Development](docs/en/GettingStarted.md)

## Data Privacy Notice
The logging tools integrated in this project are used solely for basic usage statistics and error log reporting. No sensitive information or user data is collected. All reported data is used exclusively to improve product quality and user experience.

## FAQ
See [FAQ](docs/en/FAQ.md)

## Credits

Thanks to:

+ [Framelink Figma MCP Server](https://github.com/GLips/Figma-Context-MCP) Give Cursor and other AI-powered coding tools access to your Figma files with this Model Context Protocol server.  
+ [Cursor Talk to Figma MCP](https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp) Allowing Cursor to communicate with Figma for reading designs and modifying them programmatically.
+ [Figma MCP Server](https://github.com/MatthewDailey/figma-mcp) This server provides tools for viewing, commenting, and analyzing Figma designs directly through the ModelContextProtocol.