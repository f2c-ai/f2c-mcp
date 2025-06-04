# Getting 快速开始

## 免安装配置MCP（stdio）

### MacOS / Linux
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

### Windows（stdio）
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

## 全局安装配置MCP（stdio）
对于mcp client不稳定导致安装报错的情况，我们可以采用全局安装再配置的方式

```bash
npm install -g @f2c/mcp
```

```json
{
  "mcpServers": {
    "f2c-mcp": {
      "command": "f2c-mcp",
      "args": [],
      "env": {
        "personalToken": ""
      }
    }
  }
}
```

## 其它类型配置

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

### 添加 SSE
```json
{
  "mcpServers": {
      "f2c_mcp": {
        "transport": "sse",
        "url": "http://localhost:3000/sse",
        "headers": {},
        "timeout": 50
      }
    }
}
```

## 开发

### 1. 在`.env`文件中设置您的Figma API密钥：
```bash
FIGMA_API_KEY=your_api_key_here
```

### 2. 安装依赖：
```bash
bun install
 ```

### 3. 启动开发服务器：
### stdio dev server
```bash
bun run dev
 ```
### streamable_http and SSE dev server
```bash
bun run http:dev
 ```

## 安装 Smithery

To install F2C MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@f2c-ai/f2c-mcp):

```bash
npx -y @smithery/cli install @f2c-ai/f2c-mcp --client claude
```