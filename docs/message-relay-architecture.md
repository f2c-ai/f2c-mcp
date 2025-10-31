# 消息中继架构设计

## 架构概述

系统采用消息中继模式，服务端只负责消息转发和广播，不处理具体业务逻辑。业务处理通过客户端之间的通信完成。

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MCP 客户端    │    │  消息中继服务器  │    │  业务处理客户端  │
│  (请求方)       │    │   (转发中心)    │    │   (处理方)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │  1. 发送业务请求        │                       │
         ├──────────────────────→│                       │
         │                       │  2. 转发请求           │
         │                       ├──────────────────────→│
         │                       │                       │
         │                       │  3. 返回处理结果        │
         │                       │←──────────────────────┤
         │  4. 转发结果           │                       │
         │←──────────────────────┤                       │
```

## 服务端职责

### 1. 连接管理
- 为每个连接分配唯一 `clientId`
- 维护活跃连接列表
- 处理连接建立和断开

### 2. 消息转发
- **点对点转发**: 根据 `target` 字段转发到指定客户端
- **广播消息**: 转发到所有其他客户端（排除发送者）
- **错误处理**: 目标不存在时返回错误

### 3. 消息格式
```typescript
// 基础消息格式
interface RelayMessage {
  type: string
  data?: any
  timestamp: number
  requestId?: string
  target?: string      // 指定目标客户端ID (点对点)
  sender?: string      // 发送者ID (服务端添加)
  forwarded?: boolean  // 是否为转发消息
  broadcast?: boolean  // 是否为广播消息
}
```

## 客户端类型

### 1. MCP 客户端 (请求方)
- 发起业务请求
- 等待处理结果
- 通过 `socketClient.request()` 发送请求

### 2. 业务处理客户端 (处理方)
- 监听特定类型的业务请求
- 执行实际业务逻辑
- 返回处理结果给请求方

## 消息流程

### 1. 客户端注册
```typescript
// 业务处理客户端注册
{
  type: 'register_processor',
  processorType: 'html_generator',
  capabilities: ['get_html_content'],
  timestamp: Date.now()
}
```

### 2. 业务请求
```typescript
// MCP 客户端发送请求
{
  type: 'get_html_content',
  requestId: 'req_123456',
  data: {
    componentName: 'Button',
    framework: 'react',
    style: 'tailwind'
  },
  timestamp: Date.now()
}
```

### 3. 处理响应
```typescript
// 业务处理客户端响应
{
  type: 'get_html_content',
  requestId: 'req_123456',
  success: true,
  data: {
    content: '<div>...</div>'
  },
  target: 'client_original_sender',
  timestamp: Date.now()
}
```

## 优势

1. **解耦**: 服务端与业务逻辑完全分离
2. **扩展性**: 可以动态添加不同类型的业务处理客户端
3. **容错性**: 业务处理客户端故障不影响消息中继
4. **灵活性**: 支持多种消息模式（点对点、广播）
5. **可观测性**: 完整的消息流转日志

## 部署模式

### 开发环境
```bash
# 启动消息中继服务器
bun run serve

# 启动业务处理客户端
bun run src/examples/business-client.ts

# 运行 MCP 客户端测试
bun test
```

### 生产环境
- 消息中继服务器: 单独部署，高可用
- 业务处理客户端: 可以部署多个实例，负载均衡
- MCP 客户端: 按需连接

## 扩展方向

1. **消息持久化**: 添加消息队列支持
2. **负载均衡**: 智能路由到最优处理客户端
3. **监控告警**: 消息处理性能监控
4. **安全认证**: 客户端身份验证和权限控制