# Getting 快速开始

1. 在`.env`文件中设置您的Figma API密钥：
```bash
FIGMA_API_KEY=your_api_key_here
```

2. 安装依赖：
```bash
npm install
 ```

3. 启动开发服务器：
```bash
npm run dev
 ```

 ## 添加MCP服务
```json
{
  "mcpServers": {
    "f2c-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@f2c/mcp"
      ],
      "env": {
        "personalToken": ""
      }
    }
  }
}
```

## 添加MCP服务 (Windows)
```json
{
  "mcpServers": {
    "f2c-mcp": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@f2c/mcp"],
      "env": {
        "personalToken": ""
      }
    }
  }
}
```

### 添加 Streamable HTTP
```json
{
  "mcpServers": {
      "f2c_mcp": {
        "transport": "streamable_http",
        "url": "http://localhost:3000/mcp",
        "headers": {},
        "timeout": 50
      }
    }
}
```