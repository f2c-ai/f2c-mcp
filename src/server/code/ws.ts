import {Elysia} from 'elysia'
import {createLogger, LogLevel} from 'src/utils/logger'
import {mcpClients} from '@/client/mcp-client'

export type EventType = 'figma-gen-code' | 'figma-selection' | 'mcp-request-code'
export type MessageType = {
  type: EventType
  data: any
  requestId: string
  timestamp: number
}

const logger = createLogger('code-ws', LogLevel.DEBUG)
const users = new Map<string, any>()
const userLastActive = new Map<string, string>()
const getAccessToken = (uid: string) => {
  if (uid.startsWith('mcp')) {
    return uid.replace('mcp_', '')
  } else if (uid.startsWith('figma')) {
    const m = /^figma_(.+?)_device_\d+$/.exec(uid)
    return m ? m[1] : uid
  }
  return uid
}
/**
 * figma客户端链接规范、后面为区分多端链接的标识
 * figma_${accessToken}_device_${Date.now()}
 * mcp客户端链接规范
 * mcp_${accessToken}
 */
export const registerCodeWS = (app: Elysia) => {
  app.ws('/code/:uid', {
    open: ws => {
      const uid = ws.data.params.uid
      const accessToken = getAccessToken(uid)
      // const origin = ws.data.request.headers.get('origin')
      // const from = uid.startsWith('mcp') ? 'mcp' : origin?.includes('figma.com') ? 'figma' : 'web'
      const from = uid.startsWith('mcp') ? 'mcp' : 'figma'
      ws.data.store = {uid, accessToken, from}
      // 如果from 是 mcp users 已经存在 则不允许重复连接
      if (from === 'mcp' && users.has(uid)) {
        const mcpWs = users.get(uid)
        mcpWs.close()
        return
      }
      users.set(uid, ws)
      logger.info('[客户端连接]', ws.data.store)
    },

    message: (ws, message: MessageType) => {
      logger.debug('[收到消息]', message)
      const msg = message
      const uid = ws.data.params.uid
      if (!uid) {
        return
      }
      const accessToken = getAccessToken(uid)
      //
      if (msg.type === 'figma-selection') {
        userLastActive.set(accessToken, uid)
        logger.info(`${uid}:选择节点`, msg.data)
      } else if (msg.type === 'mcp-request-code') {
        const received = userLastActive.get(accessToken)
        if (!received) {
          return
        }
        const useWS = users.get(received)
        if (useWS) {
          useWS.send(msg)
        }
      } else if (msg.type === 'figma-gen-code') {
        const mcpWs = users.get(uid)
        if (mcpWs) {
          mcpWs.send(msg)
        }
      }
    },

    close: ws => {
      const uid = ws.data.params.uid
      const accessToken = getAccessToken(uid)
      if (uid) {
        users.delete(uid)
        userLastActive.delete(accessToken)
        mcpClients.get(uid).disconnect()
        console.log(`User ${uid} disconnected`)
      }
    },
  })
}
