import config, {ws_web_timeout_ms} from 'src/config'
import {EventType, MessageType} from 'src/server/code/ws'
import {createLogger} from 'src/utils/logger'

// 简化版 WebSocket 客户端：保留外部 API，不改变使用方式
interface SocketClientOptions {
  url: string
  timeout?: number // 0 或未设置表示不启用超时
}

type PendingRequest = {
  resolve: (value: any) => void
  reject: (error: Error) => void
  timeout?: NodeJS.Timeout
}

class SocketClient {
  private ws: WebSocket | null = null
  private options: {url: string; timeout: number}
  private pendingRequests = new Map<string, PendingRequest>()
  private logger = createLogger('mcp-client')
  private uid: string

  constructor(options: SocketClientOptions) {
    this.options = {
      url: options.url,
      timeout: options.timeout ?? ws_web_timeout_ms,
    }
    // 提取 uid（最后一个路径段）用于消息标识
    try {
      const u = new URL(this.options.url)
      const parts = u.pathname.split('/')
      this.uid = parts[parts.length - 1] || `mcp_${Date.now()}`
    } catch {
      this.uid = `mcp_${Date.now()}`
    }
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.options.url)
      this.ws = ws

      ws.onopen = () => resolve()
      ws.onerror = () => reject(new Error('WebSocket connection failed'))
      ws.onmessage = e => this.handleMessage(e.data)
      ws.onclose = () => {
        // 主动清理，避免挂起的请求泄漏
        this.disconnect()
      }
    })
  }

  private handleMessage(raw: string): void {
    let msg: any
    try {
      msg = JSON.parse(raw)
    } catch (err) {
      this.logger.error('消息解析错误:', err)
      return
    }

    const id = msg.requestId
    if (!id) return

    const req = this.pendingRequests.get(id)
    if (!req) return

    if (req.timeout) clearTimeout(req.timeout)
    this.pendingRequests.delete(id)
    req.resolve(msg)
  }

  async request(type: EventType, data: any): Promise<MessageType> {
    await this.connect()

    return new Promise((resolve, reject) => {
      const ws = this.ws
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket not connected'))
      }

      const requestId = `mcp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

      let timeout: NodeJS.Timeout | undefined
      if (this.options.timeout && this.options.timeout > 0) {
        timeout = setTimeout(() => {
          this.pendingRequests.delete(requestId)
          this.logger.warn(`请求超时: ${type}`, {requestId})
          reject(new Error(`Request timeout: ${type}`))
        }, this.options.timeout)
      }

      this.pendingRequests.set(requestId, {resolve, reject, timeout})

      ws.send(
        JSON.stringify({
          type,
          data,
          requestId,
          from: 'mcp',
          uid: this.uid,
          timestamp: Date.now(),
        }),
      )
    })
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null

    this.pendingRequests.forEach(req => {
      if (req.timeout) clearTimeout(req.timeout)
      req.reject(new Error('Connection closed'))
    })
    this.pendingRequests.clear()
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const socketClient = new SocketClient({url: config.getCodeWS(`mcp_${Date.now()}`)})
