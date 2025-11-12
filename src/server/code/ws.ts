import {Elysia} from 'elysia'
import {createLogger, LogLevel} from 'src/utils/logger'

export type EventType = 'figma-gen-code' | 'figma-selection' | 'mcp-request-code'
export type MessageType = {
  type: EventType
  data: any
  requestId: string
  timestamp: number
}

const logger = createLogger('code-ws', LogLevel.DEBUG)
const users = new Map<string, any>()
let lastUpdateWebUid: string | null = null
let mcpUid: string | null = null

export const registerCodeWS = (app: Elysia) => {
  app.ws('/code/:uid', {
    open: ws => {
      const uid = ws.data.params.uid
      const origin = ws.data.request.headers.get('origin')
      const from = uid.startsWith('mcp') ? 'mcp' : origin?.includes('figma.com') ? 'figma' : 'web'
      ws.data.store = {uid, from}
      users.set(uid, ws)
      logger.info('[客户端连接]', ws.data.store)
      if (from === 'mcp') {
        mcpUid = uid
      }
    },

    message: (ws, message: MessageType) => {
      logger.debug('[收到消息]', message)
      const msg = message
      if (msg.type === 'figma-selection') {
        lastUpdateWebUid = ws.data.params.uid
        logger.info(`${lastUpdateWebUid}:选择节点`, msg.data)
      } else if (msg.type === 'mcp-request-code' && lastUpdateWebUid) {
        const useWS = users.get(lastUpdateWebUid)
        if (useWS) {
          useWS.send(msg)
        }
      } else if (msg.type === 'figma-gen-code' && mcpUid) {
        const mcpWs = users.get(mcpUid)
        if (mcpWs) {
          mcpWs.send(msg)
        }
      }
    },

    close: ws => {
      const uid = ws.data.params.uid
      if (uid) {
        users.delete(uid)
        console.log(`User ${uid} disconnected`)
      }
      if (uid === mcpUid) {
        mcpUid = null
      }
      if (uid === lastUpdateWebUid) {
        lastUpdateWebUid = null
      }
    },
  })
}
