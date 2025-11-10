import config from 'src/config'
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

const DEFAULT_TIMEOUT_MS = process.env.WS_WEB_TIMEOUT_MS ? Number(process.env.WS_WEB_TIMEOUT_MS) : 0

class SocketClient {
  private ws: WebSocket | null = null
  private options: {url: string; timeout: number}
  private pendingRequests = new Map<string, PendingRequest>()
  private logger = createLogger('socket-client')

  constructor(options: SocketClientOptions) {
    this.options = {
      url: options.url,
      timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
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
    // 只处理 web 端的请求
    const device = msg.device
    if (device !== 'web') return

    const req = this.pendingRequests.get(id)
    if (!req) return

    if (req.timeout) clearTimeout(req.timeout)
    this.pendingRequests.delete(id)
    req.resolve(msg.data ?? msg)
  }

  async request(type: string, data: any): Promise<any> {
    await this.connect()

    return new Promise((resolve, reject) => {
      const ws = this.ws
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket not connected'))
      }

      const requestId = `f2c_web_req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

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

export const socketClient = new SocketClient({url: config.getWS('mcp')})
