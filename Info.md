# F2C MCP 架构
## 目录结构 
+ 1. 工具 (Tools)：允许 LLM（在用户同意后）请求服务器执行某些动作，比如 get_weather(location) 或 run_code(script)。
+ 2. 资源 (Resources)：允许客户端读取服务器提供的数据，比如文件的内容、API 的响应结果、数据库的模式信息等。
+ 3. 提示 (Prompts)：提供预设的交互模板，帮助用户或 LLM 更方便地使用服务器的功能。

## 通信方式 (Transports)

+ 1. Stdio (标准输入/输出)：主要用于本地场景，例如 IDE 插件连接到本地运行的 MCP 服务器。通信通过进程的标准输入和输出来进行。
+ 2. SSE (Server-Sent Events)：主要用于网络/云端场景，例如连接到部署在云函数或服务器上的 MCP 服务。它基于 HTTP 长连接。
+ 3. Streamable Http：主要用于网络/云端场景，例如连接到部署在云函数或服务器上的 MCP 服务。它基于 HTTP 长连接。

## 协议 (Protocols)
1. JSON-RPC：主要用于本地场景，例如 IDE 插件连接到本地运行的 MCP 服务器。

## 本地调试 
```json
{
  "mcpServers": {
    "f2c-mcp": {
      "command": "node",
      "args": [
        "/Users/xuhongbin/Desktop/Develop/f2c/f2c-mcp/dist/index.js"
      ],
      "env": {
        "personalToken": ""
      }
    }
  }
}
```