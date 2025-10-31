// 基础消息接口
interface SocketMessage<T = any> {
  type: string
  data?: T
  timestamp: number
  requestId?: string
}

interface SocketRequest<T = any> extends SocketMessage<T> {
  requestId: string
}

interface SocketResponse<T = any> extends SocketMessage<T> {
  requestId: string
  success: boolean
  error?: string
}

// 扩展消息类型以支持不同的服务器消息
interface ConnectionEstablishedMessage extends SocketMessage {
  type: 'connection_established'
  clientId: string
}

interface BusinessResponseMessage extends SocketMessage {
  type: 'business_response'
  originalRequestId: string
  success: boolean
  error?: string
  sender?: string
  broadcast?: boolean
}

// 联合类型包含所有可能的消息类型
type ServerMessage = SocketResponse | ConnectionEstablishedMessage | BusinessResponseMessage

// 客户端配置
interface SocketClientOptions {
  url: string
  timeout?: number
}

// 简化的 WebSocket 客户端
class SocketClient {
  private ws: WebSocket | null = null
  private options: Required<SocketClientOptions>
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: any) => void
      reject: (error: Error) => void
      timeout: NodeJS.Timeout
    }
  >()
  private clientId: string | null = null
  private clientType = 'mcp_client'

  constructor(options: SocketClientOptions) {
    this.options = {
      timeout: 10000,
      ...options,
    }
  }

  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.options.url)

        this.ws.onopen = () => {
          console.log('✅ MCP客户端连接成功！')
          console.log('🔗 已建立与消息中继服务器的WebSocket连接')
          return resolve()
        }

        this.ws.onerror = () => reject(new Error('WebSocket connection failed'))

        this.ws.onmessage = event => this.handleMessage(event.data)
      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(data: string): void {
    try {
      const message: ServerMessage = JSON.parse(data)

      // 连接建立 -> 注册客户端
      if (message.type === 'connection_established') {
        this.clientId = (message as ConnectionEstablishedMessage).clientId
        console.log(`✅ MCP客户端已获得ID: ${this.clientId}`)
        this.registerAsMcpClient()
        return
      }

      // 广播响应 -> 匹配原始请求
      if (message.type === 'business_response') {
        const businessMsg = message as BusinessResponseMessage
        if (businessMsg.broadcast && businessMsg.originalRequestId) {
          console.log(`📡 [MCP客户端] 收到业务处理响应: ${businessMsg.originalRequestId}`)

          console.log(`📄 响应内容预览: ${safeLogContent(businessMsg.data)}...`)

          const request = this.pendingRequests.get(businessMsg.originalRequestId)
          if (request) {
            clearTimeout(request.timeout)
            this.pendingRequests.delete(businessMsg.originalRequestId)

            if (businessMsg.success) {
              console.log(`✅ [MCP客户端] 业务处理成功: ${businessMsg.originalRequestId}`)
              request.resolve(businessMsg.data)
            } else {
              console.log(`❌ [MCP客户端] 业务处理失败: ${businessMsg.error}`)
              request.reject(new Error(businessMsg.error || 'Business processing failed'))
            }
          }
        }
      }
    } catch (error) {
      console.error('💥 消息处理错误:', error)
    }
  }

  private registerAsMcpClient(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    this.ws.send(
      JSON.stringify({
        type: 'register_client',
        clientType: this.clientType,
        capabilities: ['request_html_generation'],
        timestamp: Date.now(),
      }),
    )

    console.log('📢 MCP客户端注册成功')
  }

  async request<TRequest = any, TResponse = any>(type: string, data?: TRequest): Promise<TResponse> {
    await this.connect()

    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket not connected'))
      }

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error(`Request timeout: ${type}`))
      }, this.options.timeout)

      this.pendingRequests.set(requestId, {resolve, reject, timeout})

      // 发送广播请求
      const requestMessage = {
        type: 'business_request',
        originalType: type,
        originalRequestId: requestId,
        data,
        clientId: this.clientId,
        timestamp: Date.now(),
      }

      this.ws.send(JSON.stringify(requestMessage))

      console.log(`📡 [MCP客户端] 广播业务请求: ${type} (${requestId})`)
      console.log(`📄 请求内容: ${safeLogContent(data)}`)
    })
  }

  send<T = any>(type: string, data?: T): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }

    const message: SocketMessage<T> = {
      type,
      data,
      timestamp: Date.now(),
    }

    this.ws.send(JSON.stringify(message))
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    // 清理待处理请求
    this.pendingRequests.forEach(request => {
      clearTimeout(request.timeout)
      request.reject(new Error('Connection closed'))
    })
    this.pendingRequests.clear()
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

// 工厂函数
export const createSocketClient = (options: SocketClientOptions): SocketClient => {
  return new SocketClient(options)
}

// 日志辅助函数
function safeLogContent(content: any, maxLength = 100): string {
  try {
    return JSON.stringify(content)
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .substring(0, maxLength)
  } catch {
    return String(content).substring(0, maxLength)
  }
}

// 创建并配置 MCP 客户端实例
export const socketClient = createSocketClient({
  url: process.env.HONO_WS_URL || 'ws://localhost:3001/ws',
})
