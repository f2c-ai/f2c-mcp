# F2C MCP Server

🚀 一个基于 Model Context Protocol (MCP) 的服务器，通过 WebSocket 通信将 HTML/CSS 转换为 React/Vue 组件。

## ✨ 特性

- 🔄 HTML + TailwindCSS 转换为 React/Vue 组件
- 🎨 支持 CSS 和 Tailwind 输出样式
- 🔌 基于 WebSocket 的实时通信
- 📡 消息中继和广播架构
- 🧪 完整的自动化测试

## 🚀 快速开始

### 安装依赖
```bash
bun install
```

### 一键测试
```bash
bun run test
```

这个命令会：
1. ✅ 自动启动 MCP + WebSocket 服务器
2. ✅ 启动业务处理客户端
3. ✅ 运行所有 20 个集成测试
4. ✅ 自动清理进程

### 手动启动服务
```bash
# 启动服务器
bun run serve

# 启动业务处理客户端（新终端）
WS_URL=ws://localhost:3001/ws bun run business
```

## 🛠️ MCP 工具

### `get_code_to_component`
将 HTML 转换为 React/Vue 组件

**参数：**
- `componentName` (可选): 组件名称
- `framework`: 目标框架 (`react` | `vue`)
- `style`: 输出样式 (`css` | `tailwind`)

**示例：**
```json
{
  "componentName": "MyButton",
  "framework": "react",
  "style": "tailwind"
}
```

## 🏗️ 架构

```
MCP客户端 ←→ 消息中继服务器 ←→ 业务处理客户端
```

- **Elysia**: WebSocket 服务器框架
- **广播机制**: 客户端间消息中继
- **自动连接**: 服务器启动后自动建立连接

## 📊 测试覆盖

- ✅ MCP 服务器健康检查
- ✅ WebSocket 连接测试
- ✅ 工具输入输出测试 (React/Vue + CSS/Tailwind)
- ✅ 参数验证测试
- ✅ 性能和可靠性测试
- ✅ 错误处理测试
- ✅ 端到端集成测试

## 📝 许可证

ISC