# F2C-MCP 接入流程
> Figma 插件 → MCP → LLM 项目代码生成

## 概览

- 目标：通过 Figma 插件选择节点，回传到 F2C-MCP，经智能体生成面向 LLM 的 Prompt，并最终生成项目代码。
- 关键路径：`/mcp-config` → 配置 MCP 客户端 → 绑定 WebSocket → 触发 MCP 工具 → 生成 Prompt → LLM 产出代码。

## 系统角色与职责

- `Figma 插件 / Web 客户端`：建立 WS 连接，发送 `figma-selection`，在收到 `mcp-request-code` 时返回 `figma-gen-code`（包含 HTML、资源）。
- `F2C-MCP Server`：提供 MCP HTTP 端点与 WS 中继；路由消息；生成 LLM Prompt。
- `智能体 / LLM`：接收 Prompt，生成组件/样式等项目代码。

## 接入前提

- MCP 端点：`POST http://localhost:3000/mcp`（Elysia + MCP SDK）。
- WS 端点：`ws://localhost:3000/code/:uid`。
- 令牌用作路由键：`accessToken` 必须在 MCP 与 WS 侧保持一致。

## 获取 MCP 配置

- 端点：`GET /mcp-config`
- 服务端实现：`src/server/code/config.ts:17-35`
- 响应示例（你提供的配置）：

```json
{
  "mcpServers": {
    "f2c_mcp": {
      "transport": "streamableHttp",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "accessToken": "22bd86b6-b777-4919-a2fa-be81ac8ca4e2"
      }
    }
  }
}
```

## 配置并连接 MCP 客户端

- 将 `accessToken` 写入 MCP 客户端请求头，连接 `streamableHttp`：`public/index.html:104-111`
- 服务端处理请求并连接 MCP Server：`src/server/code/mcp.ts:35-55`
- 可选开启会话复用（降低初始化开销）：`src/server/code/mcp-with-session.ts:24-75`

示例（浏览器端）：

```js
const { Client, StreamableHTTPClientTransport } = await window.loadMcpSdk()
const transport = new StreamableHTTPClientTransport(new URL('/mcp', location.origin), {
  requestInit: { headers: { accessToken } }
})
const client = new Client({ name: 'web-demo', version: '1.0.0' }, { capabilities: {} })
await client.connect(transport)
```

## 建立 WebSocket 并绑定选择事件

- `uid` 规范：
  - Figma 端：`figma_${accessToken}_device_${Date.now()}`
  - MCP 端：`mcp_${accessToken}`
- 解析与路由：`src/server/code/ws.ts:11-19, 29-40, 41-54, 55-63, 67-80`

浏览器端连接与发送选择事件示例：`public/index.html:153-166, 211-221`

```js
const uid = `figma_${accessToken}_device_${Date.now()}`
const ws = new WebSocket(`ws://localhost:3000/code/${uid}`)
// 选择节点后发送
ws.send(JSON.stringify({ type: 'figma-selection', data: { id: '<node-id>' }, timestamp: Date.now() }))
```

## 智能体触发 MCP 工具并获取 Figma 选区 HTML

- 工具名：`get_code_to_component`
- 前端触发：`public/index.html:286-291`
- 工具实现：`src/tool/code-convert/tool.ts`
  - 基于请求对象中的 `accesstoken` 复用对应 MCP WS 客户端：`src/client/mcp-client.ts:113-151`
  - 发送 `mcp-request-code` 请求到 Figma 端：`tool.ts:49-61`
  - 接收 `figma-gen-code`（HTML + files）：`tool.ts:62-85`
  - 根据框架/样式生成 Prompt：`tool.ts:92-111`（Tailwind HTML 包装：`tool.ts:100-104`）

请求消息（MCP → Figma，经 WS 中继）：

```json
{
  "type": "mcp-request-code",
  "data": { "componentName": "ConvertedComponent", "framework": "react", "style": "tailwind" },
  "requestId": "mcp_<...>",
  "timestamp": 1730
}
```

Figma 回传（Figma → MCP，经 WS 中继）：`public/index.html:176-194`

```json
{
  "type": "figma-gen-code",
  "requestId": "mcp_<...>",
  "data": { "content": "<html>...</html>", "files": [] },
  "uid": "figma_<...>",
  "timestamp": 1730
}
```

## 生成面向 LLM 的 Prompt 并产出代码

- Prompt 生成：`src/tool/code-convert/prompt.ts:1-24, 164-181`
  - 覆盖 React/Vue + Tailwind/CSS，多套规则确保产出结构化组件代码。
- LLM 集成（两种方式）：
  - 服务端集成：工具返回 Prompt 后在 MCP Server 侧调用 LLM，将生成代码返回 MCP 客户端。
  - 客户端集成：前端拿到 Prompt 后由浏览器或后端服务调用 LLM，生成代码并展示/保存。

## 端到端流程（步骤）

- 1) 调用 `GET /mcp-config` 获取 MCP 配置与 `accessToken`（`src/server/code/config.ts:17-35`）
- 2) 将 `accessToken` 写入 MCP 客户端请求头，连接 MCP（`public/index.html:104-111`）
- 3) Figma 端用 `figma_${accessToken}_device_${Date.now()}` 连接 WS（`public/index.html:153-166` 或你的插件侧实现）
- 4) 在 Figma 选择节点并发送 `figma-selection`（`public/index.html:211-221`）
- 5) 智能体调用 MCP 工具 `get_code_to_component`（`public/index.html:286-291`）
- 6) 工具通过 WS 发起 `mcp-request-code`（`src/tool/code-convert/tool.ts:49-61`）
- 7) Figma 回传 `figma-gen-code`（`public/index.html:176-194`），WS 转发给 MCP 客户端（`src/server/code/ws.ts:55-63`）
- 8) 工具生成 Prompt（`src/tool/code-convert/tool.ts:92-111`），提交给 LLM 生成项目代码。

## 注意事项

- 令牌一致性：MCP 与 WS 侧需共享同一 `accessToken`，否则无法正确路由。
- 事件顺序：必须先收到 `figma-selection`，智能体的 `mcp-request-code` 才能找到目标端（`ws.ts:41-54`）。
- HTML 处理：无 `<body>` 时按全文处理（`tool.ts:69-75`）；HTML+Tailwind 需包裹（`tool.ts:100-104`）。
- 资源下载：若 `files` 包含图片，支持落盘处理（`src/utils/downloader.ts:180-229`）。

## 验证步骤

- 启动服务：`bun run serve`
- 前端演示页（可选）：打开 `public/index.html` 自动连接 MCP 与 WS（`public/index.html:267-270`）。
- 在 Figma 选择节点并发送 `figma-selection`。
- 触发工具调用，观察 Prompt 输出与“转换结果”区域的消息流转。