import {randomUUID} from 'crypto'
import config, {ws_web_timeout_ms} from 'src/config'
import {EventType, MessageType} from 'src/server/code/ws'
import {createLogger, LogLevel} from 'src/utils/logger'

const log = createLogger('mcp-client', LogLevel.DEBUG)
type PendingRequest = {
  resolve: (value: any) => void
  reject: (error: Error) => void
  timeout?: NodeJS.Timeout
}

class McpClient {
  private ws: WebSocket | null = null
  private timeout = ws_web_timeout_ms
  private pendingRequests = new Map<string, PendingRequest>()
  private uid: string

  constructor(uid: string, timeout?: number) {
    if (timeout && timeout > 0) {
      this.timeout = timeout
    }

    this.uid = uid
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${config.getCodeWS('mcp_' + this.uid)}`)
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
      log.error('消息解析错误:', err)
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
    log.debug('request', this.uid, type, data)
    await this.connect()

    return new Promise((resolve, reject) => {
      const ws = this.ws
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('WebSocket not connected'))
      }

      const requestId = `mcp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

      let timeout: NodeJS.Timeout | undefined
      if (this.timeout > 0) {
        timeout = setTimeout(() => {
          this.pendingRequests.delete(requestId)
          log.warn(`请求超时: ${type}`, {requestId})
          reject(new Error(`Request timeout: ${type}`))
        }, this.timeout)
      }

      this.pendingRequests.set(requestId, {resolve, reject, timeout})

      ws.send(
        JSON.stringify({
          type,
          data,
          requestId,
          from: 'mcp',
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

export const createMcpClient = (uid: string, timeout?: number) => new McpClient(uid, timeout)

class McpClientPoolImpl {
  private pool = new Map<string, McpClient>()
  private getUid(o: any): string {
    const token = (o?.requestInfo?.headers as any)?.accesstoken
    return typeof token === 'string' && token.length > 0 ? token : randomUUID()
  }
  get(o: any, timeout?: number): McpClient {
    const uid = typeof o === 'string' ? o : this.getUid(o)
    const c = this.pool.get(uid)
    if (c) return c
    const client = createMcpClient(uid, timeout)
    this.pool.set(uid, client)
    return client
  }
  disconnect(o: any): boolean {
    const uid = this.getUid(o)
    const c = this.pool.get(uid)
    if (!c) return false
    c.disconnect()
    this.pool.delete(uid)
    return true
  }
  disconnectAll(): void {
    for (const [id, c] of this.pool.entries()) {
      c.disconnect()
      this.pool.delete(id)
    }
  }
  isConnected(o: any): boolean {
    const uid = this.getUid(o)
    const c = this.pool.get(uid)
    return c?.isConnected ?? false
  }
}

export const mcpClients = new McpClientPoolImpl()
