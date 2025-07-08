import { Server, ServerWebSocket } from "bun";

const channels = new Map<string, Set<ServerWebSocket<any>>>();

// 心跳机制相关
const clientHeartbeats = new Map<ServerWebSocket<any>, number>();
const HEARTBEAT_INTERVAL = 30000; // 30秒发送一次心跳
const HEARTBEAT_TIMEOUT = 60000; // 60秒未响应则断开连接

// 开始心跳检测
function startHeartbeat(ws: ServerWebSocket<any>) {
  const heartbeatTimer = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      // 发送ping消息
      ws.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
      console.log(`Sent ping to client ${ws.remoteAddress}`);
    } else {
      clearInterval(heartbeatTimer);
      clientHeartbeats.delete(ws);
    }
  }, HEARTBEAT_INTERVAL);

  // 检查心跳超时
  const timeoutChecker = setInterval(() => {
    const lastHeartbeat = clientHeartbeats.get(ws);
    if (lastHeartbeat && Date.now() - lastHeartbeat > HEARTBEAT_TIMEOUT) {
      console.log(`Client ${ws.remoteAddress} heartbeat timeout, closing connection`);
      
      // 清理channels中的客户端记录
      for (const [channelName, clients] of channels) {
        if (clients.has(ws)) {
          clients.delete(ws);
          break; // 找到后立即停止遍历
        }
      }
      
      clearInterval(heartbeatTimer);
      clearInterval(timeoutChecker);
      ws.close();
    } else if (!clientHeartbeats.has(ws)) {
      clearInterval(timeoutChecker);
    }
  }, 10000); // 每10秒检查一次超时
}

function handleConnection(ws: ServerWebSocket<any>) {
  console.log(`New client connected from ${ws.remoteAddress}`);

  // 初始化心跳
  clientHeartbeats.set(ws, Date.now());
  
  // 开始心跳检测
  startHeartbeat(ws);

  ws.send(
    JSON.stringify({
      type: "system",
      message: "Please join a channel to start chatting",
    })
  );

  ws.close = () => {
    console.log("Client disconnected");

    // 清理心跳记录
    clientHeartbeats.delete(ws);

    // Remove client from their channel
    channels.forEach((clients, channelName) => {
      if (clients.has(ws)) {
        clients.delete(ws);

        // Notify other clients in same channel
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "system",
                message: "A user has left the channel",
                channel: channelName,
              })
            );
          }
        });
      }
    });
  };
}

const server = Bun.serve({
  port: 3055,
  fetch(req: Request, server: Server) {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }
    const success = server.upgrade(req, {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });

    if (success) {
      console.log("WebSocket upgrade successful");
      return; // Upgraded to WebSocket
    }

    // If upgrade fails, return a response
    console.error("WebSocket upgrade failed");
    return new Response("Upgrade failed :(", { status: 500 });
  },
  websocket: {
    open: handleConnection,
    message(ws: ServerWebSocket<any>, message: string | Buffer) {
      try {
        console.log("Received message from client:", message);
        const data = JSON.parse(message as string);

        // 处理心跳响应
        if (data.type === "pong") {
          clientHeartbeats.set(ws, Date.now());
          console.log(`Received pong from client ${ws.remoteAddress}`);
          return;
        }

        if (data.type === "join") {
          const channelName = data.channel;
          if (!channelName || typeof channelName !== "string") {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Channel name is required",
              })
            );
            return;
          }

          // Create channel if it doesn't exist
          if (!channels.has(channelName)) {
            channels.set(channelName, new Set());
          }

          // Add client to channel
          const channelClients = channels.get(channelName)!;
          channelClients.add(ws);

          // Notify client they joined successfully
          ws.send(
            JSON.stringify({
              type: "system",
              message: `Joined channel: ${channelName}`,
              channel: channelName,
            })
          );

          console.log("Sending message to client:", data.id);

          ws.send(
            JSON.stringify({
              type: "system",
              message: {
                id: data.id,
                result: "Connected to channel: " + channelName,
              },
              channel: channelName,
            })
          );

          // Notify other clients in channel
          channelClients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "system",
                  message: "A new user has joined the channel",
                  channel: channelName,
                })
              );
            }
          });
          return;
        }

        // Handle regular messages
        if (data.type === "message") {
          const channelName = data.channel;
          if (!channelName || typeof channelName !== "string") {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Channel name is required",
              })
            );
            return;
          }

          const channelClients = channels.get(channelName);
          if (!channelClients || !channelClients.has(ws)) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "You must join the channel first",
              })
            );
            return;
          }

          channelClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              const req = JSON.stringify({
                type: "broadcast",
                message: data.message,
                sender: client === ws ? "You" : "User",
                channel: channelName,
              });
              console.log("Broadcasting message to client:", data.message, req);
              client.send(req);
            }
          });
        }
      } catch (err) {
        console.error("Error handling message:", err);
      }
    },
    close(ws: ServerWebSocket<any>) {
      console.log(`Client ${ws.remoteAddress} disconnected`);
      
      // 清理心跳记录
      clientHeartbeats.delete(ws);
      
      // Remove client from their channel
      channels.forEach((clients) => {
        clients.delete(ws);
      });
    },
  },
});

console.log(`WebSocket server running on port ${server.port}`);
