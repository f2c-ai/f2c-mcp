import config from 'src/config'

// 简化版 WebSocket 客户端：保留外部 API，不改变使用方式
interface SocketClientOptions {
  url: string
  timeout?: number
}

type PendingRequest = {
  resolve: (value: any) => void
  reject: (error: Error) => void
  timeout: NodeJS.Timeout
}

const DEFAULT_TIMEOUT_MS = 10000

class SocketClient {
  private ws: WebSocket | null = null
  private options: {url: string; timeout: number}
  private pendingRequests = new Map<string, PendingRequest>()

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
    })
  }

  private handleMessage(raw: string): void {
    let msg: any
    try {
      msg = JSON.parse(raw)
    } catch (err) {
      console.error('消息解析错误:', err)
      return
    }

    const id = msg.requestId
    if (!id) return

    const device = msg.device
    if (device !== 'web') return

    const req = this.pendingRequests.get(id)
    if (!req) return

    clearTimeout(req.timeout)
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

      const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error(`Request timeout: ${type}`))
      }, this.options.timeout)

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
      clearTimeout(req.timeout)
      req.reject(new Error('Connection closed'))
    })
    this.pendingRequests.clear()
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const socketClient = new SocketClient({url: config.getWS('mcp')})
