# 故障排除指南

## 🐛 常见问题及解决方案

### 1. 日志输出格式混乱

**问题描述：**
```
📄 响应内容预览: {"content":"
<div class="container">
  <h1>Title</h1>
</div>
```

**原因：**
JSON 内容中包含换行符、制表符等特殊字符，导致控制台输出格式混乱。

**解决方案：**
使用 `safeLogContent()` 函数对日志内容进行转义：

```typescript
function safeLogContent(content: any, maxLength = 100): string {
  try {
    return JSON.stringify(content)
      .replace(/\n/g, '\\n')    // 转义换行符
      .replace(/\r/g, '\\r')    // 转义回车符
      .replace(/\t/g, '\\t')    // 转义制表符
      .substring(0, maxLength)
  } catch {
    return String(content).substring(0, maxLength)
  }
}
```

**修复后的输出：**
```
📄 响应内容预览: {"content":"\\n<div class=\\"container\\">\\n  <h1>Title</h1>\\n</div>...
```

### 2. 端口冲突错误

**问题描述：**
```
error: Failed to start server. Is port 3001 in use?
```

**解决方案：**
1. 检查端口占用：`lsof -i :3001`
2. 终止占用进程：`kill -9 <PID>`
3. 或使用不同端口：`PORT=3002 bun run test`

### 3. WebSocket 连接失败

**问题描述：**
```
❌ WebSocket connection failed
```

**可能原因：**
- 服务器未启动
- 端口配置错误
- 防火墙阻止连接

**解决方案：**
1. 确认服务器正在运行
2. 检查 URL 配置是否正确
3. 验证网络连接

### 4. 测试超时

**问题描述：**
```
✗ this test timed out after 5000ms
```

**解决方案：**
1. 增加超时时间：`--timeout 10000`
2. 检查业务处理客户端是否正常运行
3. 验证消息是否正确广播

### 5. 业务处理器无响应

**问题描述：**
MCP 客户端发送请求但收不到响应。

**排查步骤：**
1. 检查业务处理器是否已连接
2. 查看服务器日志确认消息广播
3. 验证消息格式是否正确

**日志示例：**
```
📡 [服务器] 广播消息: MCP业务请求 [client_123]
📡 [业务处理器] 收到MCP客户端请求: get_html_content [client_123]
✅ [业务处理器] 已广播处理结果: req_123456
```

## 🔧 调试技巧

### 1. 启用详细日志
所有组件都包含详细的日志输出，可以通过日志跟踪消息流转：

```
[MCP客户端] -> [服务器] -> [业务处理器] -> [服务器] -> [MCP客户端]
```

### 2. 检查连接状态
使用 `isConnected()` 方法检查 WebSocket 连接状态：

```typescript
console.log('连接状态:', socketClient.isConnected())
```

### 3. 手动测试
分步骤手动启动各个组件进行测试：

```bash
# 终端 1: 启动服务器
bun run serve

# 终端 2: 启动业务处理器
bun run business

# 终端 3: 运行测试
bun run test:unit
```

## 📊 性能优化

### 1. 减少日志输出
在生产环境中可以减少详细日志：

```typescript
const isProduction = process.env.NODE_ENV === 'production'
if (!isProduction) {
  console.log('调试信息...')
}
```

### 2. 连接复用
MCP 客户端会自动复用 WebSocket 连接，避免频繁建立连接。

### 3. 超时设置
根据网络环境调整超时时间：

```typescript
const socketClient = createSocketClient({
  url: 'ws://localhost:3001/ws',
  timeout: 15000  // 15秒超时
})
```