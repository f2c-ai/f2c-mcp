import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
const app = express();
app.use(express.json());
export const startServer = (server:any,port=3000)=>{
app.post('/mcp', async (req, res) => {
  // In stateless mode, create a new instance of transport and server for each request
  // to ensure complete isolation. A single instance would cause request ID collisions
  // when multiple clients connect concurrently.
  
  console.log('收到 MCP POST 请求!!!!!2');
  console.log('请求头:', req.headers);
  console.log('请求体:',req.body);
  let acceptHeader = req.headers.accept as string;
  if (acceptHeader === '*/*') {
    // 如果 Accept 头为 */*，则添加必要的内容类型
    acceptHeader = '*/*,application/json, text/event-stream';
    req.headers.accept = acceptHeader;
    console.log('修改后的 Accept 头:', acceptHeader);
  }
  try {
    const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    
    console.log('创建新的 StreamableHTTPServerTransport 实例');
    
    res.on('close', () => {
      console.log('请求关闭，正在清理资源');
      transport.close();
      server.close();
    });
    
    console.log('连接到 MCP 服务器...');
    await server.connect(transport);
    console.log('MCP 服务器连接成功');
    await transport.handleRequest(req, res, req.body);
    console.log('请求处理完成');
  } catch (error:any) {
    console.error('处理 MCP 请求时出错:', error);
    console.error('错误堆栈:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
          data: {
            errorMessage: error.message,
            errorName: error.name
          }
        },
        id: req.body?.id || null,
      });
    }
  }
});

app.get('/mcp', async (req, res) => {
  console.log('收到 MCP GET 请求');
  console.log('请求头:', JSON.stringify(req.headers, null, 2));
  
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
  
  console.log('返回 405 Method Not Allowed');
});

app.delete('/mcp', async (req, res) => {
  console.log('收到 MCP DELETE 请求');
  console.log('请求头:', JSON.stringify(req.headers, null, 2));
  
  res.writeHead(405).end(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed."
    },
    id: null
  }));
  
  console.log('返回 405 Method Not Allowed');
});


  app.listen(port, () => {
    console.log(`MCP 无状态 Streamable HTTP 服务器已启动，监听端口 ${port}`);
    console.log(`服务器地址: http://localhost:${port}/mcp`);
  });
}
