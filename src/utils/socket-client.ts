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

      // 处理连接建立消息
      if (message.type === 'connection_established') {
        const connMsg = message as ConnectionEstablishedMessage
        this.clientId = connMsg.clientId
        console.log(`✅ MCP客户端已获得ID: ${this.clientId}`)

        // 注册为MCP客户端
        this.registerAsMcpClient()
        return
      }

      // 处理业务响应消息
      if ('requestId' in message && message.requestId && this.pendingRequests.has(message.requestId)) {
        const responseMsg = message as SocketResponse
        const request = this.pendingRequests.get(responseMsg.requestId)!
        clearTimeout(request.timeout)
        this.pendingRequests.delete(responseMsg.requestId)

        if (responseMsg.success) {
          console.log(`📨 收到业务处理结果: ${responseMsg.requestId}`)
          request.resolve(responseMsg.data)
        } else {
          request.reject(new Error(responseMsg.error || 'Request failed'))
        }
      }

      // 处理广播消息（来自业务处理客户端的响应）
      if (message.type === 'business_response') {
        const businessMsg = message as BusinessResponseMessage
        if (businessMsg.broadcast && businessMsg.sender) {
          console.log(`📡 收到广播响应 [${businessMsg.sender}]: ${businessMsg.originalRequestId}`)

          // 匹配原始请求
          if (businessMsg.originalRequestId && this.pendingRequests.has(businessMsg.originalRequestId)) {
            const request = this.pendingRequests.get(businessMsg.originalRequestId)!
            clearTimeout(request.timeout)
            this.pendingRequests.delete(businessMsg.originalRequestId)

            if (businessMsg.success) {
              request.resolve(businessMsg.data)
            } else {
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

    const registerMessage = {
      type: 'register_client',
      clientType: this.clientType,
      capabilities: ['request_html_generation'],
      timestamp: Date.now(),
    }

    this.ws.send(JSON.stringify(registerMessage))
    console.log('📢 MCP客户端注册成功')
    console.log('🎯 客户端类型: MCP客户端 | 功能: HTML生成请求')
  }

  async request<TRequest = any, TResponse = any>(type: string, data?: TRequest): Promise<TResponse> {
    await this.connect()

    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // MCP客户端通过广播方式请求业务处理
      const broadcastMessage = {
        type: 'business_request',
        originalType: type,
        originalRequestId: requestId,
        data,
        clientId: this.clientId,
        clientType: this.clientType,
        timestamp: Date.now(),
        // 不设置target，表示广播消息
      }

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error(`Request timeout: ${type} (no business processor responded)`))
      }, this.options.timeout)

      this.pendingRequests.set(requestId, {resolve, reject, timeout})

      try {
        this.ws.send(JSON.stringify(broadcastMessage))
        console.log(`📡 广播业务请求: ${type} (${requestId})`)
      } catch (error) {
        clearTimeout(timeout)
        this.pendingRequests.delete(requestId)
        reject(error)
      }
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

// 创建并配置 MCP 客户端实例
export const socketClient = createSocketClient({
  url: process.env.HONO_WS_URL || 'ws://localhost:3001/ws',
})

// 在模块加载时显示连接信息
// console.log('🔌 正在初始化 MCP 客户端...')
// console.log(`📡 目标服务器: ${process.env.HONO_WS_URL || 'ws://localhost:3001/ws'}`)
