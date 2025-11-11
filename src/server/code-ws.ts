import {Elysia, t} from 'elysia'
import {createLogger, LogLevel} from 'src/utils/logger'

export type EventType = 'figma-gen-code' | 'figma-selection' | 'mcp-request-code'
export type MessageType = {
  type: EventType
  data: any
  requestId: string
  timestamp: number
}

export class CodeWS {
  private logger = createLogger('code-ws', LogLevel.DEBUG)
  private users = new Map<string, any>()
  private lastUpdateWebUid: string | null = null
  private mcpUid: string | null = null

  register(app: Elysia) {
    // 代码 WebSocket 处理
    app.ws('/code/:uid', {
      open: ws => {
        const uid = ws.data.params.uid
        const origin = ws.data.request.headers.get('origin')
        const from = uid.startsWith('mcp') ? 'mcp' : origin?.includes('figma.com') ? 'figma' : 'web'
        ws.data.store = {uid, from}
        this.users.set(uid, ws)
        this.logger.info('[客户端连接]', ws.data.store)
        if (from === 'mcp') {
          this.mcpUid = uid
        }
      },

      message: (ws, message: MessageType) => {
        this.logger.debug('[收到消息]', message)
        const msg = message
        if (msg.type === 'figma-selection') {
          this.lastUpdateWebUid = ws.data.params.uid
          this.logger.info('[选择节点] lastUpdateWebUid', this.lastUpdateWebUid, msg.data)
        } else if (msg.type === 'mcp-request-code' && this.lastUpdateWebUid) {
          const useWS = this.users.get(this.lastUpdateWebUid)
          if (useWS) {
            useWS.send(msg)
          }
        } else if (msg.type === 'figma-gen-code' && this.mcpUid) {
          const mcpWs = this.users.get(this.mcpUid)
          if (mcpWs) {
            mcpWs.send(msg)
          }
        }
      },

      close: ws => {
        const uid = ws.data.params.uid
        if (uid) {
          this.users.delete(uid)
          console.log(`User ${uid} disconnected`)
        }
        if (uid === this.mcpUid) {
          this.mcpUid = null
        }
        if (uid === this.lastUpdateWebUid) {
          this.lastUpdateWebUid = null
        }
      },
    })
  }
}
