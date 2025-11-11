# Code WebSocket 接入手册（/code/:uid）

本文档说明如何接入后端的代码生成 WebSocket（`/code/:uid`），以及在多人同时在线时的消息路由优先级策略。

## 连接地址
- WebSocket 路径：`ws://<host>:<port>/code/:uid`
- `uid` 用于标识客户端实例，建议按角色使用前缀：
  - MCP 客户端：`mcp_<timestamp>`
  - Web 前端页面：`web_<timestamp>`
  - Figma 插件（可选）：`figma_<timestamp>`

## 身份识别规则
- 服务器根据以下规则识别客户端角色（`from`）：
  - 当 `uid` 以 `mcp` 开头 → 识别为 `mcp`
  - 否则，如果请求头 `origin` 包含 `figma.com` → 识别为 `figma`
  - 其他情况 → 识别为 `web`

## 消息格式（MessageType）
所有消息均为 JSON，结构：
```json
{
  "type": "figma-gen-code | figma-selection | mcp-request-code",
  "data": {},
  "requestId": "string",
  "from": "mcp | web | figma",
  "uid": "string",
  "timestamp": 1710000000000
}
```

## 典型交互流程
1) Web 端接入并绑定当前页面
   - Web 页面连接后立即发送 `figma-selection`，用于声明“当前活跃页面”。
   - 服务器将该 `uid` 记录为 `lastUpdateWebUid`。

2) MCP 请求代码
   - MCP 发送 `mcp-request-code`。
   - 服务器把该请求转发给 `lastUpdateWebUid` 对应的 Web 页面。

3) Web 返回生成结果
   - Web 收到请求后，发送 `figma-gen-code`（携带生成的内容与文件）。
   - 服务器将响应转发给当前活跃的 MCP（记录在 `mcpUid`）。

## 多人协作与优先级策略
- Web 端优先级（谁接收 MCP 请求）
  - “最后一个发送 `figma-selection` 的 Web 客户端”拥有路由优先级。
  - 即：`lastUpdateWebUid` 会被最新的选择事件覆盖，后续所有 `mcp-request-code` 都只转发给这个 `uid`。

- MCP 端优先级（谁接收生成结果）
  - “最后一个建立连接且角色为 MCP 的客户端”拥有路由优先级。
  - 即：`mcpUid` 在 MCP 连接时更新，后续所有 `figma-gen-code` 都转发给该 MCP。

- 断线与优先级重置
  - 当优先级持有者断线：
    - 若断线的是活跃 MCP → `mcpUid` 被清空，`figma-gen-code` 将无法投递，直到有新的 MCP 连接。
    - 若断线的是活跃 Web → `lastUpdateWebUid` 被清空，`mcp-request-code` 将无法被转发，直到有新的 Web 发送 `figma-selection`。

## 最佳实践建议
- Web 页面：
  - 在 `onopen` 主动发送一次 `figma-selection` 进行绑定。
  - 提供“刷新绑定”按钮，手动重发 `figma-selection`，以在多页面场景下切换当前路由目标。
  - 响应 `mcp-request-code` 时始终携带最新的页面内容。

- MCP 客户端：
  - 使用唯一 `uid` 并在连接成功后开始请求。
  - 如果长时间无响应，检查是否存在活跃 Web（是否已发送 `figma-selection`），或自身是否为当前活跃 MCP（最近连接者）。

## 示例消息
以下示例展示典型的三种消息：

1) Web 声明当前页面活跃（绑定路由目标）
```json
{
  "type": "figma-selection",
  "data": {"online": true},
  "requestId": "select-001",
  "from": "web",
  "uid": "web_1710000000000",
  "timestamp": 1710000000000
}
```

2) MCP 请求生成代码并由服务器转发到活跃 Web
```json
{
  "type": "mcp-request-code",
  "data": {"prompt": "convert current page to HTML"},
  "requestId": "req-abc-123",
  "from": "mcp",
  "uid": "mcp_1710000000001",
  "timestamp": 1710000000001
}
```

3) Web 返回生成结果并由服务器转发到活跃 MCP
```json
{
  "type": "figma-gen-code",
  "data": {
    "content": "<html>...</html>",
    "files": []
  },
  "requestId": "req-abc-123",
  "from": "web",
  "uid": "web_1710000000000",
  "timestamp": 1710000000002
}
```

## 故障排查提示
- MCP 收不到响应：检查是否有 Web 端发送了 `figma-selection`，或活跃 MCP 是否断线。
- Web 收不到请求：检查是否有 MCP 在线并发送了 `mcp-request-code`，或此前是否被其他页面覆盖了 `lastUpdateWebUid`。
- 多人同时在线：明确通过手动“刷新绑定”选择当前页面，让路由目标可预期。