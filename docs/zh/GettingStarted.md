# Getting 快速开始
通常，代码编辑器和其他 AI 客户端通过配置文件来管理 MCP 服务器。

可以将以下内容添加到配置文件中来设置 `f2c-mcp` 服务器。

> 注意：您需要创建 Figma 访问令牌才能使用此服务器。有关如何创建 Figma API 访问令牌的说明，请参见[此处](https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens)。

## 免安装配置MCP（stdio）

### MacOS / Linux
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=f2c-mcp&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMm5weCUyMC15JTIwJTQwZjJjJTJGbWNwJTIyJTJDJTIyZW52JTIyJTNBJTdCJTIycGVyc29uYWxUb2tlbiUyMiUzQSUyMiUyMiU3RCU3RA%3D%3D)
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
or
```json
{
  "mcpServers": {
    "f2c-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@f2c/mcp",
        "--figma-api-key=YOUR-KEY"
      ],
    }
  }
}
```

### Windows（stdio）
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=f2c-mcp&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMmNtZCUyMCUyRmMlMjBucHglMjAteSUyMCU0MGYyYyUyRm1jcCUyMiUyQyUyMmVudiUyMiUzQSU3QiUyMnBlcnNvbmFsVG9rZW4lMjIlM0ElMjIlMjIlN0QlN0Q%3D)
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
or 
```json
{
  "mcpServers": {
    "f2c-mcp": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@f2c/mcp", "--figma-api-key=YOUR-KEY"],
    }
  }
}
```

## 全局安装配置MCP（stdio）
对于mcp client不稳定导致安装报错的情况，我们可以采用全局安装再配置的方式

```bash
npm install -g @f2c/mcp
```
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=f2c-mcp&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMmYyYy1tY3AlMjAlMjIlMkMlMjJlbnYlMjIlM0ElN0IlMjJwZXJzb25hbFRva2VuJTIyJTNBJTIyJTIyJTdEJTdE)
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
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=f2c_mcp&config=JTdCJTIydHJhbnNwb3J0JTIyJTNBJTIyc3RyZWFtYWJsZV9odHRwJTIyJTJDJTIydXJsJTIyJTNBJTIyaHR0cCUzQSUyRiUyRmxvY2FsaG9zdCUzQTMwMDAlMkZtY3AlMjIlMkMlMjJoZWFkZXJzJTIyJTNBJTdCJTdEJTJDJTIydGltZW91dCUyMiUzQTUwJTdE)
```json
{
  "mcpServers": {
      "f2c_mcp": {
        "transport": "streamableHttp",
        "url": "http://localhost:3000/mcp",
        "headers": {
          "personalToken": ""
        },
        "timeout": 50
      }
    }
}
```

### 添加 SSE
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=f2c_mcp&config=JTdCJTIydHJhbnNwb3J0JTIyJTNBJTIyc3NlJTIyJTJDJTIydXJsJTIyJTNBJTIyaHR0cCUzQSUyRiUyRmxvY2FsaG9zdCUzQTMwMDAlMkZzc2UlMjIlMkMlMjJoZWFkZXJzJTIyJTNBJTdCJTdEJTJDJTIydGltZW91dCUyMiUzQTUwJTdE)
```json
{
  "mcpServers": {
      "f2c_mcp": {
        "transport": "sse",
        "url": "http://localhost:3000/sse",
        "headers": {
          "personalToken": ""
        },
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