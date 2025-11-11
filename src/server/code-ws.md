# Code WebSocket 接入指南（仅 Web 与 Figma）

本文档提供 Web 页面与 Figma 插件接入 `/code/:uid` 的说明，并明确多人同时在线时的优先级与各消息类型语义。MCP 客户端的接入说明不在本文范围内。

## 连接地址与角色识别
- 连接：`ws://<host>:<port>/code/:uid`
- `uid` 建议按角色前缀：
  - Web 页面：`web_<timestamp>`
  - Figma 插件：`figma_<timestamp>`
- 服务器角色识别（`from`）：
  - `origin` 包含 `figma.com` → 识别为 `figma`
  - 否则 → 识别为 `web`

## 消息类型与含义
- `figma-selection`
  - 作用：声明“当前活跃的选择上下文”，用于告知服务器后续请求应路由到哪个客户端。
  - 发送方：Web 或 Figma。
  - 影响：服务器记录最近一次发送该消息的客户端 `uid` 为活跃目标（优先级持有者）。

- `mcp-request-code`
  - 作用：由 MCP 发起的“生成代码”请求消息。
  - 路由：服务器会将该请求转发给“最近一次发送 `figma-selection` 的客户端”。
  - 备注：本文不涉及 MCP 客户端接入，仅说明路由行为。

- `figma-gen-code`
  - 作用：客户端返回生成的代码内容（如 HTML/CSS/JS、文件列表）。
  - 路由：服务器会将该响应转发给当前活跃的 MCP 客户端。

## 多人协作优先级（Web 与 Figma）
- 优先级核心规则：在 Web 与 Figma 的选择节点期间，“谁最后发送 `figma-selection`”，MCP 就会采用“该客户端后续发送的 `figma-gen-code`”作为最终结果。
- 切换优先级：任意客户端（Web 或 Figma）再次发送 `figma-selection`，即可成为新的优先级持有者。
- 断线行为：优先级持有者断线后，服务器清空活跃目标；新的 `figma-selection` 到达前，`mcp-request-code` 将无法转发到具体客户端。

## 接入步骤（Web 与 Figma 通用）
- 连接成功后，立即发送一次 `figma-selection`，声明当前活跃上下文。
- 收到 `mcp-request-code` 时，生成并返回 `figma-gen-code`，其中 `data` 包含：
  - `content`: 生成的 HTML 字符串或其他代码内容
  - `files`: 相关文件列表（可选）
  - 保持原样返回 `requestId`、`uid`、`timestamp` 等字段以便链路追踪。

## 示例消息
1) `figma-selection`（Web 或 Figma 声明活跃上下文）
```json
{
  "type": "figma-selection",
  "data": {"id": "10-0-1"},
  "requestId": "select-001",
  "timestamp": 1710000000000
}
```

2) `mcp-request-code`（服务器会转发给最近一次选择的客户端）
```json
{
  "type": "mcp-request-code",
  "data": {"prompt": "convert current page to HTML"},
  "requestId": "req-abc-123",
  "timestamp": 1710000000001
}
```

3) `figma-gen-code`（客户端返回生成结果，服务器转发给 MCP）
```json
{
  "type": "figma-gen-code",
  "data": {
    "content": "<html>...</html>",
    "files": []
  },
  "requestId": "req-abc-123",
  "timestamp": 1710000000002
}
```

## 提示
- 在多页面或多人（Web 与 Figma 同时在线）场景中，使用“刷新绑定”（重新发送 `figma-selection`）来明确当前优先级。
- 如发现请求未到达本客户端，检查是否被其他客户端的最新 `figma-selection` 覆盖优先级。
- 多人同时在线：明确通过手动“刷新绑定”选择当前页面，让路由目标可预期。