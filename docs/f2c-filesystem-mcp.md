# f2c-filesystem-mcp 使用文档

## 概述
- 提供 `download_assets_from_base64` 工具，用于将代码生成阶段返回的图片资产（base64）并行保存到本地 `assets` 目录。
- 适配 `structuredContent.assets` 结构：`{ filename, base64, format }`。

## 安装与构建
- 依赖安装：`bun install` 或 `npm install`
- 构建：`bun run file-build`
- 可执行入口：`f2c-filesystem-mcp` 指向 `dist/filesystem.js`

## 在 MCP 客户端中配置
- 以 Cline/Claude Desktop 等为例，将服务器配置为通过 Node 运行可执行文件：

```
{
  "mcpServers": {
    "f2c-filesystem-mcp": {
      "command": "node",
      "args": ["/绝对路径/dist/filesystem.js"]
    }
  }
}
```

## 工具说明：download_assets_from_base64
- 功能：并行将 base64 图片写入本地；路径来源于 `filename`，其值与生成端 `f.path` 一致，以匹配代码中的 src 引用。
- 入参：
-  - `assets`: 数组，元素为 `{ filename: string, base64: string, format?: 'png'|'jpg'|'jpeg'|'svg'|'gif'|'webp' }`；保存到 `localPath/<filename>`，其中 `filename` 等于生成端返回的 `f.path`（可包含子目录，如 `assets/logo.png`）
  - `localPath`: 可选，保存根目录绝对路径；未传则使用当前工作目录
  - `imgFormat`: 可选，`'png'|'jpg'|'svg'`，默认 `'png'`
- 返回：文本消息，包含保存数量与目标路径

## 调用示例
```
tool: "download_assets_from_base64"
args: {
  "assets": [
    {
      "filename": "assets/banner.png",
      "base64": "data:image/png;base64,iVBORw0KGgo...",
      "format": "png"
    },
    {
      "filename": "images/logo.svg",
      "base64": "PHN2ZyB4bWxucz0i...",
      "format": "svg"
    }
  ],
  "localPath": "/your/project/output",
  "imgFormat": "png"
}
```

## 与代码转换工具协同
- 代码转换工具的 `structuredContent.assets` 只包含 `filename/base64/format`，MCP 工具会直接以 `filename` 保存；如需自定义路径，请在上游生成时直接更新代码引用或另行保存。

## 注意事项
- 确保 `localPath` 可写且存在；不存在时会自动创建 `assets` 目录。
- 大型批量图片写入为并行执行，若需限流可在 `downloader` 层扩展。
