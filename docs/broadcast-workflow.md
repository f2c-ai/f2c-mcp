# MCP客户端广播请求工作流程

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MCP 客户端    │    │  消息中继服务器  │    │  业务处理客户端  │
│  (请求方)       │    │   (广播中心)    │    │   (处理方)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │  1. 注册为MCP客户端     │                       │
         ├──────────────────────→│                       │
         │                       │  2. 注册为业务处理器    │
         │                       │←──────────────────────┤
         │                       │                       │
         │  3. 广播业务请求        │                       │
         ├──────────────────────→│                       │
         │                       │  4. 转发请求到处理器    │
         │                       ├──────────────────────→│
         │                       │                       │
         │                       │  5. 广播处理结果        │
         │                       │←──────────────────────┤
         │  6. 接收处理结果        │                       │
         │←──────────────────────┤                       │
```

## 消息流程详解

### 1. 客户端连接和注册

#### MCP客户端注册
```typescript
// 连接建立后自动发送
{
  type: 'register_client',
  clientType: 'mcp_client',
  capabilities: ['request_html_generation'],
  timestamp: Date.now()
}
```

#### 业务处理客户端注册
```typescript
{
  type: 'register_client',
  clientType: 'business_processor',
  processorType: 'html_generator',
  capabilities: ['get_html_content'],
  timestamp: Date.now()
}
```

### 2. 业务请求广播

#### MCP客户端发起请求
```typescript
// 原始调用
socketClient.request('get_html_content', {
  componentName: 'Button',
  framework: 'react',
  style: 'tailwind'
})

// 实际发送的广播消息
{
  type: 'business_request',
  originalType: 'get_html_content',
  originalRequestId: 'req_123456',
  data: {
    componentName: 'Button',
    framework: 'react',
    style: 'tailwind'
  },
  clientId: 'client_mcp_001',
  clientType: 'mcp_client',
  timestamp: Date.now()
  // 无target字段 = 广播消息
}
```

### 3. 业务处理和响应

#### 业务处理客户端接收广播
```typescript
// 收到的消息 (服务器添加了广播标识)
{
  type: 'business_request',
  originalType: 'get_html_content',
  originalRequestId: 'req_123456',
  data: { ... },
  clientId: 'client_mcp_001',
  clientType: 'mcp_client',
  sender: 'client_mcp_001',
  broadcast: true,
  broadcastAt: Date.now(),
  timestamp: Date.now()
}
```

#### 业务处理客户端响应
```typescript
// 处理完成后广播结果
{
  type: 'business_response',
  originalRequestId: 'req_123456',
  originalType: 'get_html_content',
  success: true,
  data: {
    content: '<div class="container">...</div>'
  },
  processorId: 'client_processor_001',
  timestamp: Date.now()
  // 无target字段 = 广播响应
}
```

### 4. 结果接收

#### MCP客户端接收响应
```typescript
// 收到的广播响应
{
  type: 'business_response',
  originalRequestId: 'req_123456',
  originalType: 'get_html_content',
  success: true,
  data: { content: '...' },
  processorId: 'client_processor_001',
  sender: 'client_processor_001',
  broadcast: true,
  broadcastAt: Date.now(),
  timestamp: Date.now()
}
```

## 启动和测试

### 1. 启动消息中继服务器
```bash
bun run serve
```

### 2. 启动业务处理客户端
```bash
bun run business
```

### 3. 运行MCP客户端测试
```bash
HONO_WS_URL=ws://localhost:3001/ws bun test
```

## 日志输出示例

### 服务器日志
```
🚀 MCP Server (Hono+Bun) listening on http://localhost:3001/mcp
🔌 WebSocket Message Relay Server listening on ws://localhost:3001/ws
📡 服务模式: 消息中继和广播 (不处理业务逻辑)
📋 支持功能: 点对点转发、广播、连接管理

🔌 客户端连接: client_1234567890_abc123 (总连接数: 1)
📋 客户端注册: client_1234567890_abc123 (business_processor)
📊 当前状态: MCP客户端 0 个, 业务处理器 1 个

🔌 客户端连接: client_1234567891_def456 (总连接数: 2)
📋 客户端注册: client_1234567891_def456 (mcp_client)
📊 当前状态: MCP客户端 1 个, 业务处理器 1 个

📨 收到消息 [client_1234567891_def456]: business_request
📡 消息广播: client_1234567891_def456 -> 1 个客户端

📨 收到消息 [client_1234567890_abc123]: business_response
📡 消息广播: client_1234567890_abc123 -> 1 个客户端
```

### MCP客户端日志
```
🔌 MCP客户端已连接到消息中继服务器
✅ MCP客户端已获得ID: client_1234567891_def456
📢 已注册为MCP客户端
Socket 连接状态: true
📡 广播业务请求: get_html_content (req_123456)
📡 收到广播响应 [client_1234567890_abc123]: req_123456
```

### 业务处理客户端日志
```
🔌 业务处理客户端已连接到消息中继服务器
✅ 业务处理客户端已获得ID: client_1234567890_abc123
📢 已注册为 HTML 生成处理器
📡 收到广播业务请求: get_html_content [client_1234567891_def456]
🔨 处理 HTML 生成请求: Button
✅ 已广播处理结果: req_123456
```

## 优势特点

1. **完全解耦**: MCP客户端不需要知道业务处理器的存在
2. **动态扩展**: 可以随时添加新的业务处理器
3. **容错性**: 某个处理器离线不影响其他功能
4. **负载分担**: 多个处理器可以同时处理不同请求
5. **实时性**: 基于WebSocket的实时通信